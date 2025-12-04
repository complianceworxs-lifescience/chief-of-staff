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
    personaLock: { passed: boolean; reason?: string };
    clarity: { passed: boolean; reason?: string };
    proof: { passed: boolean; reason?: string };
    revenueAlignment: { passed: boolean; reason?: string };
  };
  overallScore: number;
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

  validateBriefGovernance(brief: ContentBrief): GovernanceValidation {
    const checks = {
      personaLock: this.checkPersonaLock(brief),
      clarity: this.checkClarity(brief),
      proof: this.checkProof(brief),
      revenueAlignment: this.checkRevenueAlignment(brief)
    };

    const passedCount = Object.values(checks).filter(c => c.passed).length;
    const overallScore = Math.round((passedCount / 4) * 100);
    const valid = passedCount === 4;

    return { valid, checks, overallScore };
  }

  private checkPersonaLock(brief: ContentBrief): { passed: boolean; reason?: string } {
    const validPersonas = [
      'VP Quality',
      'Director QA',
      'Head of Compliance',
      'Quality Manager',
      'Validation Lead',
      'Regulatory Affairs',
      'CSV Specialist',
      'Quality Engineer'
    ];

    const isValid = validPersonas.some(p => 
      brief.targetPersona.toLowerCase().includes(p.toLowerCase())
    );

    return {
      passed: isValid,
      reason: isValid ? undefined : `Persona "${brief.targetPersona}" not in approved Life Sciences personas`
    };
  }

  private checkClarity(brief: ContentBrief): { passed: boolean; reason?: string } {
    const hasTitle = brief.title && brief.title.length >= 10;
    const hasCore = brief.coreMessage && brief.coreMessage.length >= 20;
    const hasValue = brief.valueProposition && brief.valueProposition.length >= 20;

    const passed = Boolean(hasTitle && hasCore && hasValue);
    return {
      passed,
      reason: passed ? undefined : 'Brief missing clear title, core message, or value proposition'
    };
  }

  private checkProof(brief: ContentBrief): { passed: boolean; reason?: string } {
    const hasProof = brief.proofPoints && brief.proofPoints.length > 0;
    const validProof = Boolean(hasProof && brief.proofPoints.some(p => 
      p.includes('%') || p.includes('$') || /\d+/.test(p)
    ));

    return {
      passed: validProof,
      reason: validProof ? undefined : 'Brief needs quantifiable proof points (percentages, dollar values, or metrics)'
    };
  }

  private checkRevenueAlignment(brief: ContentBrief): { passed: boolean; reason?: string } {
    const minRevenueScore = 60;
    const passed = brief.revenueScore >= minRevenueScore;

    return {
      passed,
      reason: passed ? undefined : `Revenue score ${brief.revenueScore} below minimum threshold of ${minRevenueScore}`
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
