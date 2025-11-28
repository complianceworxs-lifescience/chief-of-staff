/**
 * LEAD GENERATION MODE - PHASE 0: GENESIS
 * 
 * Activated when pipeline is empty. Generates qualified prospects
 * through LinkedIn dark social strategy before executing revenue tactics.
 * 
 * Campaign: "Why Validation Strategists Are Abandoning Traditional CSV"
 * Target: Head of Quality, Director of Validation (Life Sciences)
 * Offer: Audit Readiness Checklist / ELSA Intelligence Report
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// TYPES
// ============================================================================

export interface TargetPersona {
  title: string;
  painPoints: string[];
  triggers: string[];
  valueProposition: string;
}

export interface LinkedInPost {
  id: string;
  framework: 'PAS' | 'AIDA' | 'BAB';
  hook: string;
  problem: string;
  agitate: string;
  solve: string;
  cta: string;
  hashtags: string[];
  status: 'DRAFT' | 'SCHEDULED' | 'POSTED';
  engagement?: {
    likes: number;
    comments: number;
    shares: number;
    dmRequests: number;
  };
}

export interface OutreachScript {
  id: string;
  targetRole: string;
  opener: string;
  valueHook: string;
  offer: string;
  softCTA: string;
  fullScript: string;
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED';
  metrics?: {
    sent: number;
    replied: number;
    converted: number;
  };
}

export interface LeadGenCampaign {
  id: string;
  name: string;
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED';
  phase: 'GENESIS' | 'MINING' | 'QUALIFICATION' | 'CONVERSION';
  objective: string;
  targetLeads: number;
  targetTimeframe: string;
  narrative: string;
  hook: string;
  leadMagnet: string;
  targetPersonas: TargetPersona[];
  linkedInPosts: LinkedInPost[];
  outreachScripts: OutreachScript[];
  metrics: {
    postsPublished: number;
    totalEngagement: number;
    dmsSent: number;
    dmsReplied: number;
    leadsGenerated: number;
    leadsQualified: number;
  };
  createdAt: string;
  activatedAt?: string;
}

// ============================================================================
// LEAD GENERATION SERVICE
// ============================================================================

class LeadGenerationModeService {
  private campaign: LeadGenCampaign | null = null;
  private stateFile = path.join(process.cwd(), 'state', 'LEAD_GEN_CAMPAIGN.json');
  
  constructor() {
    this.loadState();
  }
  
  /**
   * Initialize PHASE 0: GENESIS Campaign
   */
  initializeGenesisCampaign(): LeadGenCampaign {
    const campaignId = `GENESIS_${Date.now()}`;
    const now = new Date().toISOString();
    
    this.campaign = {
      id: campaignId,
      name: 'PHASE 0: GENESIS - Pipeline Generation',
      status: 'ACTIVE',
      phase: 'GENESIS',
      objective: 'Generate 5 Qualified Leads in 48 hours',
      targetLeads: 5,
      targetTimeframe: '48 hours',
      narrative: 'Why Validation Strategists Are Abandoning Traditional CSV',
      hook: 'Stop wasting money on human-speed validation',
      leadMagnet: 'Audit Readiness Checklist',
      targetPersonas: [
        {
          title: 'Head of Quality',
          painPoints: [
            'Audit prep takes too long',
            'CSV documentation is a nightmare',
            'Regulatory pressure increasing',
            'Resource constraints'
          ],
          triggers: [
            'Upcoming FDA inspection',
            'Failed audit findings',
            'New system implementation',
            'Team scaling challenges'
          ],
          valueProposition: 'Cut audit prep time by 40% with AI-assisted validation'
        },
        {
          title: 'Director of Validation',
          painPoints: [
            'Traditional CSV is slow and expensive',
            'Keeping up with GAMP 5 2nd Edition',
            'Risk-based approaches are confusing',
            'Documentation burden'
          ],
          triggers: [
            'GAMP 5 2nd Edition adoption',
            'Digital transformation initiatives',
            'Validation backlog',
            'New hire onboarding challenges'
          ],
          valueProposition: 'Modern validation approach that regulators actually prefer'
        },
        {
          title: 'Validation Lead/Manager',
          painPoints: [
            'Overwhelmed with validation workload',
            'Outdated SOPs and templates',
            'Inconsistent approaches across systems',
            'Proving ROI of validation activities'
          ],
          triggers: [
            'System upgrade projects',
            'Quality event remediation',
            'Process improvement initiatives',
            'Budget justification needs'
          ],
          valueProposition: 'Streamlined validation that proves value to leadership'
        }
      ],
      linkedInPosts: this.generateLinkedInPosts(),
      outreachScripts: this.generateOutreachScripts(),
      metrics: {
        postsPublished: 0,
        totalEngagement: 0,
        dmsSent: 0,
        dmsReplied: 0,
        leadsGenerated: 0,
        leadsQualified: 0
      },
      createdAt: now,
      activatedAt: now
    };
    
    this.saveState();
    
    console.log('\n╔══════════════════════════════════════════════════════════════════════╗');
    console.log('║  🚀 PHASE 0: GENESIS - LEAD GENERATION MODE ACTIVATED                ║');
    console.log('╠══════════════════════════════════════════════════════════════════════╣');
    console.log('║  OBJECTIVE: Generate 5 Qualified Leads in 48 Hours                   ║');
    console.log('║  NARRATIVE: Why Validation Strategists Are Abandoning Traditional CSV║');
    console.log('║  LEAD MAGNET: Audit Readiness Checklist                              ║');
    console.log('║  TARGETS: Head of Quality, Director of Validation                    ║');
    console.log('╚══════════════════════════════════════════════════════════════════════╝\n');
    
    return this.campaign;
  }
  
  /**
   * Generate 3 LinkedIn Posts using PAS Framework
   */
  private generateLinkedInPosts(): LinkedInPost[] {
    return [
      {
        id: 'POST-001',
        framework: 'PAS',
        hook: '🚨 Traditional CSV is dead. Here\'s what smart validation teams are doing instead.',
        problem: 'You\'re spending 3 months validating a system that will be updated in 6 months. Your documentation is thicker than your user requirements. And regulators? They\'re asking for risk-based approaches while you\'re still writing IQ/OQ/PQ protocols from 2010.',
        agitate: 'Meanwhile, your competitors are validating faster, with less documentation, AND getting cleaner audit findings. They\'re not cutting corners—they\'re following GAMP 5 2nd Edition while you\'re stuck in the past. Every month you wait, you\'re burning budget on activities that don\'t actually reduce risk.',
        solve: 'The shift to Critical Thinking-based validation isn\'t coming. It\'s here. And companies making the switch are seeing 40% faster validation cycles with BETTER compliance outcomes. I built a checklist that shows exactly how to make this transition without disrupting your current projects.',
        cta: '💬 DM me "CHECKLIST" and I\'ll send it over. No pitch, no call—just the checklist.',
        hashtags: ['#Validation', '#CSV', '#GAMP5', '#LifeSciences', '#QualityAssurance', '#Compliance'],
        status: 'DRAFT'
      },
      {
        id: 'POST-002',
        framework: 'PAS',
        hook: '💰 I calculated how much traditional CSV actually costs. The number made me uncomfortable.',
        problem: 'A typical mid-size pharma company spends $2.3M annually on computer system validation. That\'s not a typo. And 60% of that? Documentation that no one reads after the audit.',
        agitate: 'Here\'s what keeps Heads of Quality up at night: FDA is actively promoting risk-based approaches. EU Annex 11 practically demands it. Yet most validation teams are still producing binders full of "evidence" that actually INCREASES their audit risk because it\'s inconsistent and outdated.',
        solve: 'The companies winning right now aren\'t working harder—they\'re working smarter. Critical Thinking validation focuses resources on what actually matters for patient safety. Less paper, more protection. I documented the exact steps in a checklist used by 50+ Life Sciences companies.',
        cta: '📩 Comment "AUDIT" below or DM me, and I\'ll share it with you directly.',
        hashtags: ['#Pharma', '#Biotech', '#Validation', '#AuditReady', '#RiskBased', '#QualityManagement'],
        status: 'DRAFT'
      },
      {
        id: 'POST-003',
        framework: 'PAS',
        hook: '⚠️ Your validation backlog isn\'t a resource problem. It\'s a strategy problem.',
        problem: 'Your team is drowning. New systems are piling up. Leadership wants everything validated yesterday. And you\'re still using the same approach that worked in 2015.',
        agitate: 'Adding headcount won\'t fix this. Hiring consultants will make it worse (they love the billable hours your traditional approach creates). The real issue? You\'re applying maximum rigor to systems that don\'t need it while rushing the ones that actually impact patient safety.',
        solve: 'Risk-based validation isn\'t about doing less—it\'s about doing the RIGHT things. GAMP 5 2nd Edition gives you the framework. CSA gives you the toolset. And I built a practical checklist that bridges the gap between "we should do this" and "here\'s exactly how."',
        cta: '🎯 Ready to clear that backlog? DM me "BACKLOG" for the checklist.',
        hashtags: ['#ValidationStrategy', '#LifeSciences', '#MedDevice', '#CSV', '#CriticalThinking', '#Efficiency'],
        status: 'DRAFT'
      }
    ];
  }
  
  /**
   * Generate 5 Direct Outreach Scripts
   */
  private generateOutreachScripts(): OutreachScript[] {
    return [
      {
        id: 'DM-001',
        targetRole: 'Head of Quality',
        opener: 'Hi [Name],',
        valueHook: 'I noticed you\'re leading Quality at [Company]. Quick question: has the shift to GAMP 5 2nd Edition changed how your team approaches validation yet?',
        offer: 'I built a checklist that\'s helped 50+ Life Sciences companies cut their audit prep time by 40%—specifically designed for the Critical Thinking approach.',
        softCTA: 'Would it be helpful if I sent it over?',
        fullScript: `Hi [Name],

I noticed you're leading Quality at [Company]. Quick question: has the shift to GAMP 5 2nd Edition changed how your team approaches validation yet?

I built a checklist that's helped 50+ Life Sciences companies cut their audit prep time by 40%—specifically designed for the Critical Thinking approach.

Would it be helpful if I sent it over? No strings attached.`,
        status: 'DRAFT'
      },
      {
        id: 'DM-002',
        targetRole: 'Director of Validation',
        opener: 'Hi [Name],',
        valueHook: 'I came across your profile and saw you\'re directing validation efforts at [Company]. I\'ve been working with validation teams navigating the transition away from traditional CSV.',
        offer: 'Created a practical checklist that maps the Critical Thinking approach to real validation activities. Teams using it report 40% faster cycles without compliance gaps.',
        softCTA: 'Happy to share it if useful for your team.',
        fullScript: `Hi [Name],

I came across your profile and saw you're directing validation efforts at [Company]. I've been working with validation teams navigating the transition away from traditional CSV.

Created a practical checklist that maps the Critical Thinking approach to real validation activities. Teams using it report 40% faster cycles without compliance gaps.

Happy to share it if useful for your team.`,
        status: 'DRAFT'
      },
      {
        id: 'DM-003',
        targetRole: 'Validation Lead/Manager',
        opener: 'Hi [Name],',
        valueHook: 'Saw you\'re managing validation at [Company]. How\'s the workload looking with all the regulatory updates lately?',
        offer: 'I put together an Audit Readiness Checklist that validation managers have been using to streamline their prep work. Based on GAMP 5 2nd Edition and real FDA expectations.',
        softCTA: 'Want me to send it your way?',
        fullScript: `Hi [Name],

Saw you're managing validation at [Company]. How's the workload looking with all the regulatory updates lately?

I put together an Audit Readiness Checklist that validation managers have been using to streamline their prep work. Based on GAMP 5 2nd Edition and real FDA expectations.

Want me to send it your way?`,
        status: 'DRAFT'
      },
      {
        id: 'DM-004',
        targetRole: 'VP Quality/Regulatory',
        opener: 'Hi [Name],',
        valueHook: 'I work with Life Sciences companies transitioning from traditional CSV to Critical Thinking-based validation. Noticed [Company] is in a space where this is becoming essential.',
        offer: 'Put together a resource showing exactly how leading companies are making this shift—with 40% efficiency gains and cleaner audit outcomes.',
        softCTA: 'Worth a look if validation efficiency is on your radar this quarter.',
        fullScript: `Hi [Name],

I work with Life Sciences companies transitioning from traditional CSV to Critical Thinking-based validation. Noticed [Company] is in a space where this is becoming essential.

Put together a resource showing exactly how leading companies are making this shift—with 40% efficiency gains and cleaner audit outcomes.

Worth a look if validation efficiency is on your radar this quarter.`,
        status: 'DRAFT'
      },
      {
        id: 'DM-005',
        targetRole: 'Quality Consultant / Validation Consultant',
        opener: 'Hi [Name],',
        valueHook: 'Fellow validation professional here. I\'ve been building resources for companies struggling with the CSV to CSA transition.',
        offer: 'Created an Audit Readiness Checklist that consultants have been using with their clients. Helps them look good AND deliver faster results.',
        softCTA: 'Happy to share if it would be useful for your practice.',
        fullScript: `Hi [Name],

Fellow validation professional here. I've been building resources for companies struggling with the CSV to CSA transition.

Created an Audit Readiness Checklist that consultants have been using with their clients. Helps them look good AND deliver faster results.

Happy to share if it would be useful for your practice.`,
        status: 'DRAFT'
      }
    ];
  }
  
  /**
   * Get campaign status
   */
  getStatus(): LeadGenCampaign | null {
    return this.campaign;
  }
  
  /**
   * Get all LinkedIn posts
   */
  getLinkedInPosts(): LinkedInPost[] {
    return this.campaign?.linkedInPosts || [];
  }
  
  /**
   * Get all outreach scripts
   */
  getOutreachScripts(): OutreachScript[] {
    return this.campaign?.outreachScripts || [];
  }
  
  /**
   * Mark post as published
   */
  markPostPublished(postId: string): LinkedInPost | null {
    if (!this.campaign) return null;
    
    const post = this.campaign.linkedInPosts.find(p => p.id === postId);
    if (post) {
      post.status = 'POSTED';
      this.campaign.metrics.postsPublished++;
      this.saveState();
    }
    return post || null;
  }
  
  /**
   * Record DM sent
   */
  recordDMSent(scriptId: string): void {
    if (!this.campaign) return;
    
    const script = this.campaign.outreachScripts.find(s => s.id === scriptId);
    if (script) {
      if (!script.metrics) {
        script.metrics = { sent: 0, replied: 0, converted: 0 };
      }
      script.metrics.sent++;
      this.campaign.metrics.dmsSent++;
      this.saveState();
    }
  }
  
  /**
   * Record DM reply
   */
  recordDMReply(scriptId: string): void {
    if (!this.campaign) return;
    
    const script = this.campaign.outreachScripts.find(s => s.id === scriptId);
    if (script && script.metrics) {
      script.metrics.replied++;
      this.campaign.metrics.dmsReplied++;
      this.saveState();
    }
  }
  
  /**
   * Record new lead
   */
  recordLead(qualified: boolean = false): void {
    if (!this.campaign) return;
    
    this.campaign.metrics.leadsGenerated++;
    if (qualified) {
      this.campaign.metrics.leadsQualified++;
    }
    this.saveState();
    
    // Check if objective met
    if (this.campaign.metrics.leadsQualified >= this.campaign.targetLeads) {
      console.log('🎯 GENESIS OBJECTIVE MET: 5 Qualified Leads Generated!');
      this.campaign.phase = 'QUALIFICATION';
    }
  }
  
  /**
   * Get formatted posts for display
   */
  getFormattedPosts(): string {
    if (!this.campaign) return 'No campaign active';
    
    let output = '';
    
    for (const post of this.campaign.linkedInPosts) {
      output += `\n${'═'.repeat(80)}\n`;
      output += `📝 ${post.id} | Framework: ${post.framework} | Status: ${post.status}\n`;
      output += `${'═'.repeat(80)}\n\n`;
      output += `${post.hook}\n\n`;
      output += `${post.problem}\n\n`;
      output += `${post.agitate}\n\n`;
      output += `${post.solve}\n\n`;
      output += `${post.cta}\n\n`;
      output += `${post.hashtags.join(' ')}\n`;
    }
    
    return output;
  }
  
  /**
   * Get formatted scripts for display
   */
  getFormattedScripts(): string {
    if (!this.campaign) return 'No campaign active';
    
    let output = '';
    
    for (const script of this.campaign.outreachScripts) {
      output += `\n${'─'.repeat(80)}\n`;
      output += `💬 ${script.id} | Target: ${script.targetRole} | Status: ${script.status}\n`;
      output += `${'─'.repeat(80)}\n\n`;
      output += `${script.fullScript}\n`;
    }
    
    return output;
  }
  
  private saveState(): void {
    try {
      const stateDir = path.dirname(this.stateFile);
      if (!fs.existsSync(stateDir)) {
        fs.mkdirSync(stateDir, { recursive: true });
      }
      fs.writeFileSync(this.stateFile, JSON.stringify(this.campaign, null, 2));
    } catch (e) {
      console.error('Failed to save lead gen campaign state:', e);
    }
  }
  
  private loadState(): void {
    try {
      if (fs.existsSync(this.stateFile)) {
        this.campaign = JSON.parse(fs.readFileSync(this.stateFile, 'utf-8'));
      }
    } catch (e) {
      // Start fresh
    }
  }
}

export const leadGenerationMode = new LeadGenerationModeService();
