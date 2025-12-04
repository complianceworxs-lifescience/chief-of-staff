/**
 * ====================================================
 * BLOG PUBLISH PIPELINE (RUN_BLOG_PUBLISH_PIPELINE)
 * ====================================================
 * 
 * Chief of Staff Scheduling Directive – Blog Cadence
 * 
 * Publishing Cadence: 2 posts per week
 * Days: Monday and Thursday
 * Time: 15:00 UTC
 * 
 * Workflow:
 * 1. Request 1 approved brief from CMO → CMA (highest revenue/authority score not yet used)
 * 2. Validate brief against governance rules (persona-lock, clarity, proof, revenue alignment)
 * 3. If valid, call CPA-L7 to generate final HTML content
 * 4. Publish via wordpress.publishPost() (status=publish)
 * 5. Log result to governance_logs.json and decision_lineage.json
 */

import { nanoid } from 'nanoid';
import { storage } from '../storage.js';
import { wordpressPublisher, WordPressPublishResult } from './wordpress-publisher.js';
import * as fs from 'fs';
import * as path from 'path';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface ContentBrief {
  id: string;
  title: string;
  targetPersona: string;
  painPoints: string[];
  coreMessage: string;
  valueProposition: string;
  proofPoints: string[];
  channel: string;
  revenueScore: number;
  authorityScore: number;
  used: boolean;
  approvedBy: string;
  approvedAt: string;
}

export interface GovernanceValidation {
  valid: boolean;
  checks: {
    audienceLock: { passed: boolean; reason?: string; anchorsFound?: string[] };
    prohibitedDomainFilter: { passed: boolean; reason?: string; violations?: string[] };
    personaLock: { passed: boolean; reason?: string; persona?: string; topicAlignment?: boolean };
    editorialStyle: { passed: boolean; reason?: string; violations?: string[] };
    revenueAlignment: { passed: boolean; reason?: string; pillar?: string };
    clarity: { passed: boolean; reason?: string };
    proof: { passed: boolean; reason?: string };
    cosGoNoGo: { passed: boolean; reason?: string; failedChecks?: string[] };
  };
  overallScore: number;
  firewallVersion: string;
}

export interface BlogPublishResult {
  success: boolean;
  pipelineId: string;
  brief?: ContentBrief;
  validation?: GovernanceValidation;
  generatedContent?: {
    title: string;
    html: string;
    excerpt: string;
  };
  wordpress?: WordPressPublishResult;
  error?: string;
  timestamp: string;
}

interface GovernanceLog {
  id: string;
  action: string;
  agent: string;
  brief_id: string;
  validation_result: GovernanceValidation;
  outcome: 'approved' | 'rejected';
  reason?: string;
  timestamp: string;
}

interface DecisionLineage {
  id: string;
  decision_type: string;
  agent: string;
  input_brief_id: string;
  input_brief_title: string;
  decision: string;
  rationale: string;
  outcome: {
    success: boolean;
    wordpress_post_id?: number;
    wordpress_url?: string;
    error?: string;
  };
  timestamp: string;
}

class BlogPublishPipelineService {
  private governanceLogsPath = 'state/governance_logs.json';
  private decisionLineagePath = 'state/decision_lineage.json';
  private briefsStorePath = 'state/content_briefs.json';

  constructor() {
    this.ensureStateFiles();
  }

  private ensureStateFiles(): void {
    const stateDir = 'state';
    if (!fs.existsSync(stateDir)) {
      fs.mkdirSync(stateDir, { recursive: true });
    }

    if (!fs.existsSync(this.governanceLogsPath)) {
      fs.writeFileSync(this.governanceLogsPath, JSON.stringify({ logs: [] }, null, 2));
    }
    if (!fs.existsSync(this.decisionLineagePath)) {
      fs.writeFileSync(this.decisionLineagePath, JSON.stringify({ decisions: [] }, null, 2));
    }
    if (!fs.existsSync(this.briefsStorePath)) {
      fs.writeFileSync(this.briefsStorePath, JSON.stringify({ briefs: [] }, null, 2));
    }
  }

  async runBlogPublishPipeline(): Promise<BlogPublishResult> {
    const pipelineId = `blog_pipeline_${nanoid(8)}`;
    const timestamp = new Date().toISOString();

    console.log(`\n╔══════════════════════════════════════════════════════════════════╗`);
    console.log(`║       RUN_BLOG_PUBLISH_PIPELINE - ${pipelineId}       ║`);
    console.log(`╚══════════════════════════════════════════════════════════════════╝`);

    try {
      // Step 1: Request approved brief from CMO (highest revenue/authority score)
      console.log('📋 Step 1: Requesting approved brief from CMO...');
      const brief = await this.getHighestScoringBrief();
      
      if (!brief) {
        console.log('⚠️ No approved briefs available for publishing');
        return {
          success: false,
          pipelineId,
          error: 'No approved briefs available. CMO must approve content briefs first.',
          timestamp
        };
      }
      console.log(`   ✅ Selected brief: "${brief.title}" (Revenue: ${brief.revenueScore}, Authority: ${brief.authorityScore})`);

      // Step 2: Validate brief against governance rules
      console.log('🔍 Step 2: Validating brief against governance rules...');
      const validation = this.validateBriefGovernance(brief);
      
      await this.logGovernance({
        id: nanoid(),
        action: 'BLOG_PUBLISH_VALIDATION',
        agent: 'CoS',
        brief_id: brief.id,
        validation_result: validation,
        outcome: validation.valid ? 'approved' : 'rejected',
        reason: validation.valid ? undefined : 'Failed governance validation',
        timestamp
      });

      if (!validation.valid) {
        console.log('❌ Brief failed governance validation');
        return {
          success: false,
          pipelineId,
          brief,
          validation,
          error: 'Brief failed governance validation. See validation details.',
          timestamp
        };
      }
      console.log(`   ✅ Validation passed (Score: ${validation.overallScore}/100)`);

      // Step 3: Call CPA-L7 to generate final HTML content
      console.log('🤖 Step 3: Generating final HTML content via CPA-L7...');
      const generatedContent = await this.generateBlogContent(brief);
      console.log(`   ✅ Content generated: ${generatedContent.title}`);

      // Step 4: Publish via WordPress
      console.log('📤 Step 4: Publishing to WordPress...');
      const wordpressResult = await wordpressPublisher.publishPost({
        title: generatedContent.title,
        content: generatedContent.html,
        excerpt: generatedContent.excerpt,
        status: 'publish'
      });

      // Step 5: Log result to governance_logs.json and decision_lineage.json
      console.log('📝 Step 5: Logging results...');
      await this.logDecisionLineage({
        id: nanoid(),
        decision_type: 'BLOG_PUBLISH',
        agent: 'CoS',
        input_brief_id: brief.id,
        input_brief_title: brief.title,
        decision: wordpressResult.success ? 'PUBLISH_EXECUTED' : 'PUBLISH_FAILED',
        rationale: wordpressResult.success 
          ? `Brief "${brief.title}" passed all governance checks and was published successfully.`
          : `Brief "${brief.title}" passed governance but WordPress publishing failed: ${wordpressResult.error}`,
        outcome: {
          success: wordpressResult.success,
          wordpress_post_id: wordpressResult.postId,
          wordpress_url: wordpressResult.postUrl,
          error: wordpressResult.error
        },
        timestamp
      });

      // Mark brief as used
      await this.markBriefAsUsed(brief.id);

      if (wordpressResult.success) {
        console.log(`\n✅ PIPELINE COMPLETE: Post published at ${wordpressResult.postUrl}`);
      } else {
        console.log(`\n⚠️ PIPELINE PARTIAL: Content ready but WordPress publishing failed`);
      }

      return {
        success: wordpressResult.success,
        pipelineId,
        brief,
        validation,
        generatedContent,
        wordpress: wordpressResult,
        timestamp
      };

    } catch (error: any) {
      console.error('❌ Pipeline error:', error.message);
      return {
        success: false,
        pipelineId,
        error: error.message,
        timestamp
      };
    }
  }

  async getHighestScoringBrief(): Promise<ContentBrief | null> {
    try {
      const data = JSON.parse(fs.readFileSync(this.briefsStorePath, 'utf-8'));
      const briefs: ContentBrief[] = data.briefs || [];

      // Filter to only approved, unused briefs
      const available = briefs.filter(b => !b.used && b.approvedBy);

      if (available.length === 0) return null;

      // Sort by combined revenue + authority score (weighted)
      available.sort((a, b) => {
        const scoreA = (a.revenueScore * 0.6) + (a.authorityScore * 0.4);
        const scoreB = (b.revenueScore * 0.6) + (b.authorityScore * 0.4);
        return scoreB - scoreA;
      });

      return available[0];
    } catch {
      return null;
    }
  }

  /**
   * ================================================================
   * COMPLIANCEWORXS EDITORIAL & PERSONA GOVERNANCE FIREWALL
   * (For CoS + CMA — Unified Directive)
   * ================================================================
   */

  private readonly REQUIRED_DOMAIN_ANCHORS = [
    'FDA', 'GxP', 'CSV', 'Computer System Validation', 'Validation',
    'QMS', 'Quality Management System', 'SOPs', 'Annex 11',
    '21 CFR Part 820', 'QSR', '21 CFR Part 11', 'ICH Q7', 'ICH Q8',
    'ICH Q9', 'ICH Q10', 'PQ', 'PPQ', 'Quality Assurance',
    'Regulatory Affairs', 'Audit Readiness', 'Deviation', 'CAPA',
    'Batch records', 'Manufacturing Quality', 'EU MDR', 'IVDR'
  ];

  private readonly PROHIBITED_DOMAINS = [
    'SOX', 'DOJ ECCP', 'Sarbanes-Oxley', 'FCA SYSC', 'AML', 'KYC',
    'SEC enforcement', 'GDPR fines', 'Corporate governance',
    'Bribery', 'corruption frameworks', 'PCAOB', 'SMCR', 'OFAC',
    'sanctions', 'GRC general', 'model risk', 'DEI', 'ESG',
    'HR compliance', 'finance compliance'
  ];

  private readonly VALID_PERSONAS = {
    'Rising Leader': [
      'understanding validation', 'QA career growth', 'audit basics',
      'foundational clarity', 'learning validation', 'quality fundamentals'
    ],
    'Validation Strategist': [
      'risk-based validation', 'audit readiness', 'CSV', 'Annex 11',
      'efficiency', 'remediation cycles', 'validation optimization',
      'compliance efficiency', 'validation strategy'
    ],
    'Compliance Architect': [
      'system-level strategy', 'Quality System design', 'control environment',
      'EU MDR', 'IVDR', 'PQ', 'PPQ', 'ICH Q-series', 'end-to-end',
      'quality architecture', 'regulatory strategy'
    ]
  };

  private readonly REVENUE_PILLARS = {
    'Time Reclaimed': [
      'faster validation', 'reduced documentation', 'reduced deviation cycle',
      'faster audit prep', 'time savings', 'efficiency', 'automation',
      'accelerate', 'speed', 'streamline'
    ],
    'Proof of ROI': [
      'quantifiable impact', 'validation cycle efficiency', 'audit readiness delta',
      'CAPA closure', 'measurable', 'ROI', 'cost reduction', 'savings',
      'performance improvement', 'metrics'
    ],
    'Professional Equity': [
      'quality career growth', 'recognition', 'inspection outcomes',
      'professional development', 'career advancement', 'leadership',
      'expertise', 'credibility', 'authority'
    ]
  };

  validateBriefGovernance(brief: ContentBrief): GovernanceValidation {
    console.log('\n🔒 EDITORIAL & PERSONA GOVERNANCE FIREWALL v1.0');
    console.log('   Running 8-point validation...\n');

    // CoS Final GO/NO-GO Rule (Section 6)
    const audienceLock = this.checkAudienceLock(brief);
    const prohibitedDomainFilter = this.checkProhibitedDomains(brief);
    const personaLock = this.checkPersonaLock(brief);
    const editorialStyle = this.checkEditorialStyle(brief);
    const revenueAlignment = this.checkRevenueAlignment(brief);
    const clarity = this.checkClarity(brief);
    const proof = this.checkProof(brief);

    const failedChecks: string[] = [];
    if (!audienceLock.passed) failedChecks.push('AUDIENCE_LOCK');
    if (!prohibitedDomainFilter.passed) failedChecks.push('PROHIBITED_DOMAIN');
    if (!personaLock.passed) failedChecks.push('PERSONA_LOCK');
    if (!editorialStyle.passed) failedChecks.push('EDITORIAL_STYLE');
    if (!revenueAlignment.passed) failedChecks.push('REVENUE_ALIGNMENT');
    if (!clarity.passed) failedChecks.push('CLARITY');
    if (!proof.passed) failedChecks.push('PROOF');

    const cosGoNoGo = {
      passed: failedChecks.length === 0,
      reason: failedChecks.length === 0 
        ? undefined 
        : `CoS VETO: Failed ${failedChecks.length} governance checks`,
      failedChecks
    };

    const checks = {
      audienceLock,
      prohibitedDomainFilter,
      personaLock,
      editorialStyle,
      revenueAlignment,
      clarity,
      proof,
      cosGoNoGo
    };

    const passedCount = Object.values(checks).filter(c => c.passed).length;
    const overallScore = Math.round((passedCount / 8) * 100);
    const valid = checks.cosGoNoGo.passed;

    // Log results
    console.log('   📋 Validation Results:');
    console.log(`      ${audienceLock.passed ? '✅' : '❌'} Audience Lock (Life Sciences anchors)`);
    console.log(`      ${prohibitedDomainFilter.passed ? '✅' : '❌'} Prohibited Domain Filter`);
    console.log(`      ${personaLock.passed ? '✅' : '❌'} Persona Lock + Topic Alignment`);
    console.log(`      ${editorialStyle.passed ? '✅' : '❌'} Editorial Style Enforcement`);
    console.log(`      ${revenueAlignment.passed ? '✅' : '❌'} Revenue Alignment (3 Pillars)`);
    console.log(`      ${clarity.passed ? '✅' : '❌'} Clarity Check`);
    console.log(`      ${proof.passed ? '✅' : '❌'} Proof Points`);
    console.log(`      ${cosGoNoGo.passed ? '✅' : '❌'} CoS GO/NO-GO Final Audit`);
    console.log(`   📊 Overall Score: ${overallScore}%`);
    console.log(`   🚦 Final Decision: ${valid ? 'APPROVED' : 'REJECTED'}\n`);

    return { valid, checks, overallScore, firewallVersion: '1.0' };
  }

  /**
   * SECTION 1: AUDIENCE LOCK (MANDATORY)
   * Any topic that does not explicitly reference LIFE SCIENCES must be rejected.
   * Requires at least 2 domain anchors.
   */
  private checkAudienceLock(brief: ContentBrief): { passed: boolean; reason?: string; anchorsFound?: string[] } {
    const content = `${brief.title} ${brief.coreMessage} ${brief.valueProposition} ${brief.painPoints.join(' ')} ${brief.proofPoints.join(' ')}`.toLowerCase();
    
    const anchorsFound: string[] = [];
    for (const anchor of this.REQUIRED_DOMAIN_ANCHORS) {
      if (content.includes(anchor.toLowerCase())) {
        anchorsFound.push(anchor);
      }
    }

    const passed = anchorsFound.length >= 2;
    return {
      passed,
      reason: passed 
        ? undefined 
        : `AUDIENCE LOCK FAILED: Only ${anchorsFound.length} life sciences anchor(s) found (need 2+). Add FDA, GxP, CSV, QMS, Annex 11, or other life sciences terms.`,
      anchorsFound
    };
  }

  /**
   * SECTION 2: PROHIBITED DOMAIN FILTER (MANDATORY)
   * Zero tolerance. One keyword is enough to force a veto.
   */
  private checkProhibitedDomains(brief: ContentBrief): { passed: boolean; reason?: string; violations?: string[] } {
    const content = `${brief.title} ${brief.coreMessage} ${brief.valueProposition} ${brief.painPoints.join(' ')} ${brief.proofPoints.join(' ')}`.toLowerCase();
    
    const violations: string[] = [];
    for (const prohibited of this.PROHIBITED_DOMAINS) {
      if (content.includes(prohibited.toLowerCase())) {
        violations.push(prohibited);
      }
    }

    const passed = violations.length === 0;
    return {
      passed,
      reason: passed 
        ? undefined 
        : `PROHIBITED DOMAIN FILTER FAILED: Contains "${violations.join(', ')}" - corporate compliance terms not allowed.`,
      violations
    };
  }

  /**
   * SECTION 3: PERSONA-LOCK (MANDATORY)
   * Every brief must be mapped to: Rising Leader, Validation Strategist, or Compliance Architect
   * Topic must align with persona's required angles.
   */
  private checkPersonaLock(brief: ContentBrief): { passed: boolean; reason?: string; persona?: string; topicAlignment?: boolean } {
    const personaInput = brief.targetPersona.toLowerCase();
    const content = `${brief.title} ${brief.coreMessage} ${brief.valueProposition}`.toLowerCase();
    
    let matchedPersona: string | null = null;
    let topicAlignment = false;

    // Match persona
    if (personaInput.includes('rising') || personaInput.includes('leader') || personaInput.includes('junior') || personaInput.includes('new')) {
      matchedPersona = 'Rising Leader';
    } else if (personaInput.includes('strategist') || personaInput.includes('validation') || personaInput.includes('csv') || personaInput.includes('lead')) {
      matchedPersona = 'Validation Strategist';
    } else if (personaInput.includes('architect') || personaInput.includes('director') || personaInput.includes('vp') || personaInput.includes('head') || personaInput.includes('senior')) {
      matchedPersona = 'Compliance Architect';
    }

    // Check topic alignment
    if (matchedPersona) {
      const requiredAngles = this.VALID_PERSONAS[matchedPersona as keyof typeof this.VALID_PERSONAS];
      topicAlignment = requiredAngles.some(angle => content.includes(angle.toLowerCase()));
    }

    const passed = matchedPersona !== null && topicAlignment;
    return {
      passed,
      reason: passed 
        ? undefined 
        : matchedPersona 
          ? `PERSONA-LOCK FAILED: Topic does not align with ${matchedPersona} required angles. Add relevant topics for this persona.`
          : `PERSONA-LOCK FAILED: "${brief.targetPersona}" must map to Rising Leader, Validation Strategist, or Compliance Architect.`,
      persona: matchedPersona || undefined,
      topicAlignment
    };
  }

  /**
   * SECTION 4: EDITORIAL STYLE ENFORCEMENT
   * Must be: GxP-specific, data-driven, clear, direct, concise
   * No: jargon outside life sciences, enterprise compliance language, consultant speak, generalist content
   */
  private checkEditorialStyle(brief: ContentBrief): { passed: boolean; reason?: string; violations?: string[] } {
    const content = `${brief.title} ${brief.coreMessage} ${brief.valueProposition}`.toLowerCase();
    const violations: string[] = [];

    // Check for banned generalist/consultant language
    const bannedPatterns = [
      'best practices', 'synergy', 'paradigm shift', 'holistic approach',
      'leverage our', 'streamline your journey', 'unlock potential',
      'thought leadership', 'innovative solutions', 'game-changer',
      'next-generation', 'cutting-edge', 'world-class', 'industry-leading'
    ];

    for (const pattern of bannedPatterns) {
      if (content.includes(pattern)) {
        violations.push(`Consultant speak: "${pattern}"`);
      }
    }

    // Check for prohibited corporate compliance language
    const corporatePatterns = [
      'corporate governance', 'board oversight', 'enterprise risk',
      'financial compliance', 'internal audit committee', 'shareholder'
    ];

    for (const pattern of corporatePatterns) {
      if (content.includes(pattern)) {
        violations.push(`Corporate compliance: "${pattern}"`);
      }
    }

    // Check if content is too generic (no GxP specifics)
    const gxpTerms = ['fda', 'gxp', 'validation', 'qms', 'quality', 'compliance', 'audit', 'regulatory'];
    const hasGxpContext = gxpTerms.some(term => content.includes(term));
    if (!hasGxpContext) {
      violations.push('Content too generic - missing GxP/regulatory context');
    }

    const passed = violations.length === 0;
    return {
      passed,
      reason: passed 
        ? undefined 
        : `EDITORIAL STYLE FAILED: ${violations.join('; ')}`,
      violations
    };
  }

  /**
   * SECTION 5: REVENUE ALIGNMENT (MANDATORY)
   * Content must reinforce one of: Time Reclaimed, Proof of ROI, or Professional Equity
   */
  private checkRevenueAlignment(brief: ContentBrief): { passed: boolean; reason?: string; pillar?: string } {
    const content = `${brief.title} ${brief.coreMessage} ${brief.valueProposition} ${brief.proofPoints.join(' ')}`.toLowerCase();
    
    let matchedPillar: string | null = null;

    for (const [pillar, keywords] of Object.entries(this.REVENUE_PILLARS)) {
      const hasMatch = keywords.some(keyword => content.includes(keyword.toLowerCase()));
      if (hasMatch) {
        matchedPillar = pillar;
        break;
      }
    }

    // Also check minimum revenue score
    const meetsScoreThreshold = brief.revenueScore >= 60;

    const passed = matchedPillar !== null && meetsScoreThreshold;
    return {
      passed,
      reason: passed 
        ? undefined 
        : !matchedPillar 
          ? 'REVENUE ALIGNMENT FAILED: Content must reinforce Time Reclaimed, Proof of ROI, or Professional Equity.'
          : `REVENUE ALIGNMENT FAILED: Revenue score ${brief.revenueScore} below minimum threshold of 60.`,
      pillar: matchedPillar || undefined
    };
  }

  private checkClarity(brief: ContentBrief): { passed: boolean; reason?: string } {
    const hasTitle = brief.title && brief.title.length >= 10;
    const hasCore = brief.coreMessage && brief.coreMessage.length >= 20;
    const hasValue = brief.valueProposition && brief.valueProposition.length >= 20;

    const passed = Boolean(hasTitle && hasCore && hasValue);
    return {
      passed,
      reason: passed ? undefined : 'CLARITY FAILED: Brief missing clear title, core message, or value proposition'
    };
  }

  private checkProof(brief: ContentBrief): { passed: boolean; reason?: string } {
    const hasProof = brief.proofPoints && brief.proofPoints.length > 0;
    const validProof = Boolean(hasProof && brief.proofPoints.some(p => 
      p.includes('%') || p.includes('$') || /\d+/.test(p)
    ));

    return {
      passed: validProof,
      reason: validProof ? undefined : 'PROOF FAILED: Brief needs quantifiable proof points (percentages, dollar values, or metrics)'
    };
  }

  async generateBlogContent(brief: ContentBrief): Promise<{ title: string; html: string; excerpt: string }> {
    const prompt = `You are CPA-L7 (Content Production Agent - L7), an expert blog content generator for ComplianceWorxs, a Life Sciences compliance automation company.

Generate a professional blog post based on this brief:

TITLE: ${brief.title}
TARGET PERSONA: ${brief.targetPersona}
PAIN POINTS: ${brief.painPoints.join(', ')}
CORE MESSAGE: ${brief.coreMessage}
VALUE PROPOSITION: ${brief.valueProposition}
PROOF POINTS: ${brief.proofPoints.join(', ')}

REQUIREMENTS:
1. Write in a professional, authoritative tone appropriate for Life Sciences executives
2. Core narrative must reinforce: "Compliance is no longer overhead. Compliance is a measurable business asset."
3. Include specific, quantifiable benefits
4. Address the persona's pain points directly
5. Include a clear call-to-action
6. Format as clean HTML suitable for WordPress
7. Length: 800-1200 words

Return JSON with this exact structure:
{
  "title": "SEO-optimized title",
  "excerpt": "150-character meta description for SEO",
  "html": "<article>Full HTML content here</article>"
}`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: 3000
      });

      const content = response.choices[0].message.content;
      if (!content) throw new Error('No content generated');

      return JSON.parse(content);
    } catch (error: any) {
      console.error('❌ CPA-L7 generation error:', error.message);
      
      // Fallback content
      return {
        title: brief.title,
        excerpt: brief.coreMessage.substring(0, 150),
        html: `<article>
          <h1>${brief.title}</h1>
          <p><strong>For ${brief.targetPersona}s facing ${brief.painPoints[0]}</strong></p>
          <p>${brief.coreMessage}</p>
          <h2>The Challenge</h2>
          <p>${brief.painPoints.map(p => `<li>${p}</li>`).join('')}</p>
          <h2>The Solution</h2>
          <p>${brief.valueProposition}</p>
          <h2>Proven Results</h2>
          <ul>${brief.proofPoints.map(p => `<li>${p}</li>`).join('')}</ul>
          <p><strong>Ready to transform compliance from overhead to asset?</strong> <a href="/contact">Contact us today</a>.</p>
        </article>`
      };
    }
  }

  async markBriefAsUsed(briefId: string): Promise<void> {
    try {
      const data = JSON.parse(fs.readFileSync(this.briefsStorePath, 'utf-8'));
      data.briefs = data.briefs.map((b: ContentBrief) => 
        b.id === briefId ? { ...b, used: true } : b
      );
      fs.writeFileSync(this.briefsStorePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Failed to mark brief as used:', error);
    }
  }

  async logGovernance(log: GovernanceLog): Promise<void> {
    try {
      const data = JSON.parse(fs.readFileSync(this.governanceLogsPath, 'utf-8'));
      data.logs.push(log);
      
      // Keep last 500 logs
      if (data.logs.length > 500) {
        data.logs = data.logs.slice(-500);
      }
      
      fs.writeFileSync(this.governanceLogsPath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Failed to log governance:', error);
    }
  }

  async logDecisionLineage(decision: DecisionLineage): Promise<void> {
    try {
      const data = JSON.parse(fs.readFileSync(this.decisionLineagePath, 'utf-8'));
      data.decisions.push(decision);
      
      // Keep last 500 decisions
      if (data.decisions.length > 500) {
        data.decisions = data.decisions.slice(-500);
      }
      
      fs.writeFileSync(this.decisionLineagePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Failed to log decision lineage:', error);
    }
  }

  async addContentBrief(brief: Omit<ContentBrief, 'id' | 'used'>): Promise<ContentBrief> {
    const newBrief: ContentBrief = {
      ...brief,
      id: `brief_${nanoid(8)}`,
      used: false
    };

    try {
      const data = JSON.parse(fs.readFileSync(this.briefsStorePath, 'utf-8'));
      data.briefs.push(newBrief);
      fs.writeFileSync(this.briefsStorePath, JSON.stringify(data, null, 2));
      console.log(`📋 Content brief added: "${newBrief.title}" (ID: ${newBrief.id})`);
    } catch (error) {
      console.error('Failed to add content brief:', error);
    }

    return newBrief;
  }

  async getContentBriefs(): Promise<ContentBrief[]> {
    try {
      const data = JSON.parse(fs.readFileSync(this.briefsStorePath, 'utf-8'));
      return data.briefs || [];
    } catch {
      return [];
    }
  }

  async approveBrief(briefId: string, approver: string): Promise<ContentBrief | null> {
    try {
      const data = JSON.parse(fs.readFileSync(this.briefsStorePath, 'utf-8'));
      const briefIndex = data.briefs.findIndex((b: ContentBrief) => b.id === briefId);
      
      if (briefIndex === -1) return null;

      data.briefs[briefIndex].approvedBy = approver;
      data.briefs[briefIndex].approvedAt = new Date().toISOString();
      
      fs.writeFileSync(this.briefsStorePath, JSON.stringify(data, null, 2));
      console.log(`✅ Brief "${data.briefs[briefIndex].title}" approved by ${approver}`);
      
      return data.briefs[briefIndex];
    } catch {
      return null;
    }
  }

  getGovernanceLogs(): GovernanceLog[] {
    try {
      const data = JSON.parse(fs.readFileSync(this.governanceLogsPath, 'utf-8'));
      return data.logs || [];
    } catch {
      return [];
    }
  }

  getDecisionLineage(): DecisionLineage[] {
    try {
      const data = JSON.parse(fs.readFileSync(this.decisionLineagePath, 'utf-8'));
      return data.decisions || [];
    } catch {
      return [];
    }
  }

  getSchedulerConfig(): any {
    try {
      const directive = JSON.parse(fs.readFileSync('state/L7_MASTER_DIRECTIVE.json', 'utf-8'));
      return directive.SCHEDULER || null;
    } catch {
      return null;
    }
  }
}

export const blogPublishPipeline = new BlogPublishPipelineService();
