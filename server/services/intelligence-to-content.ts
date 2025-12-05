import { gatherAutomatedIntelligence, IntelligenceItem } from './directive-enhancements';
import OpenAI from 'openai';
import { nanoid } from 'nanoid';
import fs from 'fs/promises';

interface BlogBrief {
  id: string;
  title: string;
  hook: string;
  targetPersona: string;
  spearTipAngle: string;
  keyPoints: string[];
  cta: string;
  sourceIntelligence: string;
  generatedAt: string;
  status: 'pending' | 'approved' | 'published' | 'rejected';
  priority: number;
}

const SPEAR_TIP_ANGLES = {
  audit_readiness: {
    label: 'Audit Readiness',
    keywords: ['audit', 'FDA', '483', 'inspection', 'compliance', 'preparation', 'ready'],
    priority: 1
  },
  economic_impact: {
    label: 'Economic Impact',
    keywords: ['cost', 'savings', 'ROI', 'budget', 'efficiency', 'time', 'value'],
    priority: 2
  },
  risk_mitigation: {
    label: 'Risk Mitigation',
    keywords: ['risk', 'warning', 'observation', 'deviation', 'issue', 'problem'],
    priority: 3
  },
  competitive_advantage: {
    label: 'Competitive Advantage',
    keywords: ['competitor', 'market', 'industry', 'trend', 'leader', 'innovation'],
    priority: 4
  }
};

const PERSONA_MAPPING = {
  regulatory: 'compliance_architect',
  pain_point: 'validation_strategist',
  product_launch: 'validation_strategist',
  funding: 'compliance_architect',
  competitor_news: 'rising_leader',
  industry_trend: 'rising_leader'
};

class IntelligenceToContentService {
  private openai: OpenAI | null = null;
  private briefBuffer: BlogBrief[] = [];
  private processedIntelligence: Set<string> = new Set();
  private autoGenerationInterval: NodeJS.Timer | null = null;
  
  constructor() {
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
    this.loadState();
  }

  private async loadState() {
    try {
      const data = await fs.readFile('./state/intelligence_content.json', 'utf-8');
      const state = JSON.parse(data);
      this.briefBuffer = state.briefBuffer || [];
      this.processedIntelligence = new Set(state.processedIntelligence || []);
    } catch {
      this.briefBuffer = [];
      this.processedIntelligence = new Set();
    }
  }

  private async saveState() {
    try {
      await fs.mkdir('./state', { recursive: true });
      await fs.writeFile('./state/intelligence_content.json', JSON.stringify({
        briefBuffer: this.briefBuffer,
        processedIntelligence: Array.from(this.processedIntelligence),
        lastUpdated: new Date().toISOString()
      }, null, 2));
    } catch (error) {
      console.error('Error saving intelligence-to-content state:', error);
    }
  }

  async initialize() {
    console.log('🧠 Intelligence-to-Content Automation initialized');
    await this.loadState();
    this.startAutoGeneration();
  }

  private startAutoGeneration() {
    this.autoGenerationInterval = setInterval(async () => {
      await this.checkAndGenerateBriefs();
    }, 60 * 60 * 1000);
    
    setTimeout(() => this.checkAndGenerateBriefs(), 5000);
    
    console.log('🔄 Auto-generation loop started - checking every hour');
  }

  private async checkAndGenerateBriefs() {
    const bufferThreshold = 3;
    const pendingBriefs = this.briefBuffer.filter(b => b.status === 'pending').length;
    
    if (pendingBriefs < bufferThreshold) {
      console.log(`📝 Brief buffer low (${pendingBriefs}/${bufferThreshold}) - generating new briefs from intelligence`);
      await this.generateBriefsFromIntelligence();
    }
  }

  private determineSpearTipAngle(item: IntelligenceItem): string {
    const content = `${item.title} ${item.summary}`.toLowerCase();
    
    for (const [angle, config] of Object.entries(SPEAR_TIP_ANGLES)) {
      for (const keyword of config.keywords) {
        if (content.includes(keyword.toLowerCase())) {
          return angle;
        }
      }
    }
    
    return 'audit_readiness';
  }

  private determinePersona(item: IntelligenceItem): string {
    return PERSONA_MAPPING[item.type as keyof typeof PERSONA_MAPPING] || 'rising_leader';
  }

  async generateBriefsFromIntelligence(): Promise<BlogBrief[]> {
    const intelligenceItems = await gatherAutomatedIntelligence();
    const feed = intelligenceItems.slice(0, 20);
    
    const actionable = feed.filter(item => 
      item.actionable && 
      item.impact === 'high' && 
      !this.processedIntelligence.has(item.id)
    );

    if (actionable.length === 0) {
      console.log('📋 No new actionable intelligence to process');
      return [];
    }

    const newBriefs: BlogBrief[] = [];
    
    for (const item of actionable.slice(0, 3)) {
      try {
        const brief = await this.generateBriefFromItem(item);
        if (brief) {
          newBriefs.push(brief);
          this.processedIntelligence.add(item.id);
        }
      } catch (error) {
        console.error(`Error generating brief from ${item.id}:`, error);
      }
    }

    if (newBriefs.length > 0) {
      this.briefBuffer.push(...newBriefs);
      await this.saveState();
      console.log(`✅ Generated ${newBriefs.length} new blog briefs from intelligence`);
    }

    return newBriefs;
  }

  private async generateBriefFromItem(item: IntelligenceItem): Promise<BlogBrief | null> {
    const spearTipAngle = this.determineSpearTipAngle(item);
    const persona = this.determinePersona(item);
    
    if (!this.openai) {
      return this.generateFallbackBrief(item, spearTipAngle, persona);
    }

    try {
      const prompt = `You are a content strategist for ComplianceWorxs, a Life Sciences compliance platform. 
      
Generate a blog post brief based on this intelligence:
Title: ${item.title}
Summary: ${item.summary}
Type: ${item.type}
Impact: ${item.impact}

REQUIREMENTS:
- Target persona: ${persona.replace(/_/g, ' ')}
- Spear-tip angle: ${SPEAR_TIP_ANGLES[spearTipAngle as keyof typeof SPEAR_TIP_ANGLES]?.label || 'Audit Readiness'}
- Core narrative: "Compliance is no longer overhead. Compliance is a measurable business asset."
- Include specific numbers and economic impact where possible
- Focus on audit readiness and ROI

Return a JSON object with:
{
  "title": "Compelling headline (60 chars max)",
  "hook": "Opening hook that creates urgency (100 chars max)",
  "keyPoints": ["3-4 bullet points for the post"],
  "cta": "Call to action tied to ComplianceWorxs value"
}`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        max_tokens: 500
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        return this.generateFallbackBrief(item, spearTipAngle, persona);
      }

      const parsed = JSON.parse(content);
      
      return {
        id: `brief_${nanoid(8)}`,
        title: parsed.title || item.title,
        hook: parsed.hook || item.summary.substring(0, 100),
        targetPersona: persona,
        spearTipAngle,
        keyPoints: parsed.keyPoints || [item.summary],
        cta: parsed.cta || 'Calculate your compliance ROI today',
        sourceIntelligence: item.id,
        generatedAt: new Date().toISOString(),
        status: 'pending',
        priority: SPEAR_TIP_ANGLES[spearTipAngle as keyof typeof SPEAR_TIP_ANGLES]?.priority || 5
      };
    } catch (error) {
      console.error('Error with OpenAI brief generation:', error);
      return this.generateFallbackBrief(item, spearTipAngle, persona);
    }
  }

  private generateFallbackBrief(item: IntelligenceItem, spearTipAngle: string, persona: string): BlogBrief {
    const titleMap: Record<string, string> = {
      regulatory: `What ${item.title.split(' ').slice(0, 4).join(' ')} Means for Your Audit Readiness`,
      pain_point: `How to Address ${item.title.split(' ').slice(0, 4).join(' ')} in Your Organization`,
      product_launch: `Competitive Analysis: ${item.title.split(' ').slice(0, 4).join(' ')}`,
      funding: `Market Shift: ${item.title.split(' ').slice(0, 4).join(' ')}`,
      competitor_news: `What ${item.title.split(' ').slice(0, 4).join(' ')} Signals for Compliance`,
      industry_trend: `${item.title.split(' ').slice(0, 4).join(' ')}: Impact on Compliance Strategy`
    };

    return {
      id: `brief_${nanoid(8)}`,
      title: titleMap[item.type] || `Understanding ${item.title.substring(0, 40)}`,
      hook: item.summary.substring(0, 100),
      targetPersona: persona,
      spearTipAngle,
      keyPoints: [
        item.summary,
        'Impact on audit readiness and compliance operations',
        'Actionable steps to prepare your organization',
        'How to measure and demonstrate ROI'
      ],
      cta: 'See how ComplianceWorxs can help you stay ahead',
      sourceIntelligence: item.id,
      generatedAt: new Date().toISOString(),
      status: 'pending',
      priority: SPEAR_TIP_ANGLES[spearTipAngle as keyof typeof SPEAR_TIP_ANGLES]?.priority || 5
    };
  }

  getBriefBuffer(): BlogBrief[] {
    return this.briefBuffer.sort((a, b) => a.priority - b.priority);
  }

  getPendingBriefs(): BlogBrief[] {
    return this.briefBuffer
      .filter(b => b.status === 'pending')
      .sort((a, b) => a.priority - b.priority);
  }

  async approveBrief(briefId: string): Promise<boolean> {
    const brief = this.briefBuffer.find(b => b.id === briefId);
    if (brief) {
      brief.status = 'approved';
      await this.saveState();
      console.log(`✅ Brief ${briefId} approved for publishing`);
      return true;
    }
    return false;
  }

  async rejectBrief(briefId: string): Promise<boolean> {
    const brief = this.briefBuffer.find(b => b.id === briefId);
    if (brief) {
      brief.status = 'rejected';
      await this.saveState();
      console.log(`❌ Brief ${briefId} rejected`);
      return true;
    }
    return false;
  }

  getNextApprovedBrief(): BlogBrief | null {
    const approved = this.briefBuffer
      .filter(b => b.status === 'approved')
      .sort((a, b) => a.priority - b.priority);
    return approved[0] || null;
  }

  async markAsPublished(briefId: string): Promise<boolean> {
    const brief = this.briefBuffer.find(b => b.id === briefId);
    if (brief) {
      brief.status = 'published';
      await this.saveState();
      console.log(`📰 Brief ${briefId} marked as published`);
      return true;
    }
    return false;
  }

  getStats() {
    return {
      totalBriefs: this.briefBuffer.length,
      pending: this.briefBuffer.filter(b => b.status === 'pending').length,
      approved: this.briefBuffer.filter(b => b.status === 'approved').length,
      published: this.briefBuffer.filter(b => b.status === 'published').length,
      rejected: this.briefBuffer.filter(b => b.status === 'rejected').length,
      processedIntelligence: this.processedIntelligence.size,
      bufferHealth: this.briefBuffer.filter(b => b.status === 'pending').length >= 3 ? 'healthy' : 'low'
    };
  }
}

export const intelligenceToContent = new IntelligenceToContentService();
