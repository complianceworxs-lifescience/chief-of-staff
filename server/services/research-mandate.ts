import { GoogleGenAI } from "@google/genai";
import { storage } from '../storage';

const GEMINI_API_KEY = process.env.AI_INTEGRATIONS_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
const GEMINI_BASE_URL = process.env.AI_INTEGRATIONS_GEMINI_BASE_URL;

function getGeminiClient() {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured. Set AI_INTEGRATIONS_GEMINI_API_KEY.');
  }
  return new GoogleGenAI({ 
    apiKey: GEMINI_API_KEY,
    httpOptions: {
      apiVersion: "",
      baseUrl: GEMINI_BASE_URL,
    }
  });
}

async function callGemini(prompt: string): Promise<any> {
  const ai = getGeminiClient();
  
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        role: "user",
        parts: [{ text: prompt + "\n\nRespond with valid JSON only, no markdown formatting." }]
      }
    ]
  });

  const content = response.text?.trim() || '';
  const jsonContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(jsonContent);
}

interface ResearchQuestion {
  id: string;
  title: string;
  objective: string;
  dataSources: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'error';
  findings: string | null;
  confidence: number;
  lastUpdated: string | null;
  evidenceSources: string[];
}

interface ResearchMandateState {
  version: string;
  initiated: string;
  lastExecution: string | null;
  overallStatus: 'pending' | 'in_progress' | 'completed' | 'partial';
  questions: ResearchQuestion[];
  synthesizedInsights: {
    icpProfile: any | null;
    costOfInaction: any | null;
    competitiveAlternatives: any | null;
    clarityToolHook: any | null;
    tierIIIPriceJustification: any | null;
  };
  executionLog: Array<{
    timestamp: string;
    action: string;
    result: string;
  }>;
}

const LIFE_SCIENCES_KEYWORDS = [
  'validation', 'CSV', 'computer system validation', 'FDA', '21 CFR Part 11',
  'GxP', 'pharmaceutical', 'biotech', 'medical device', 'clinical trials',
  'regulatory compliance', 'audit trail', 'quality assurance', 'CAPA',
  'deviation management', 'batch record', 'IQ OQ PQ', 'validation protocol'
];

const ICP_JOB_TITLES = [
  'Validation Manager', 'Quality Director', 'Compliance Officer', 'QA Manager',
  'Regulatory Affairs Director', 'CSV Manager', 'Quality Systems Manager',
  'Head of Quality', 'VP Quality', 'Director of Validation', 'GxP Lead',
  'Quality Engineering Manager', 'Compliance Director', 'Audit Manager'
];

const COMPETITOR_ALTERNATIVES = [
  'spreadsheets', 'Excel tracking', 'manual documentation', 'consultants',
  'SharePoint', 'paper-based systems', 'Veeva Vault', 'MasterControl',
  'TrackWise', 'Qualio', 'Greenlight Guru', 'Arena', 'custom solutions'
];

class ResearchMandateService {
  private state: ResearchMandateState;
  private stateFile = 'state/RESEARCH_MANDATE.json';

  constructor() {
    this.state = this.initializeState();
  }

  private initializeState(): ResearchMandateState {
    return {
      version: '1.0.0',
      initiated: new Date().toISOString(),
      lastExecution: null,
      overallStatus: 'pending',
      questions: [
        {
          id: 'Q1_ICP',
          title: 'Who is the Buyer of Professional Equity (The ICP)?',
          objective: 'Analyze job titles in regulated life science forums that use language related to influence, strategic defense, or budget justification to pinpoint the specific highest-value job title.',
          dataSources: ['LinkedIn', 'Reddit r/regulatory', 'ISPE forums', 'PDA forums', 'Validation professionals groups'],
          status: 'pending',
          findings: null,
          confidence: 0,
          lastUpdated: null,
          evidenceSources: []
        },
        {
          id: 'Q2_COST',
          title: 'What is the True Cost of "Not Knowing?"',
          objective: 'Aggregate forum data and competitor content to quantify the dollar value of the problem (time/dollars lost, fear of regulatory penalties) to justify the Tier II (Velocity) price.',
          dataSources: ['FDA warning letters', 'Industry reports', 'Forum discussions', 'Competitor case studies'],
          status: 'pending',
          findings: null,
          confidence: 0,
          lastUpdated: null,
          evidenceSources: []
        },
        {
          id: 'Q3_ALTERNATIVES',
          title: 'What is the True Competitive Alternative?',
          objective: 'Identify the non-software substitutes most often mentioned (e.g., manual spreadsheets, consultants) to focus messaging on beating complexity, not just another vendor.',
          dataSources: ['Forum discussions', 'LinkedIn posts', 'Industry surveys'],
          status: 'pending',
          findings: null,
          confidence: 0,
          lastUpdated: null,
          evidenceSources: []
        },
        {
          id: 'Q4_HOOK',
          title: 'What is the "Clarity Tool" Hook?',
          objective: 'Determine the single most compelling metric or unknown variable that professionals mention that would instantly compel them to use the Compliance Velocity Scorecard (Step 1).',
          dataSources: ['Forum pain points', 'LinkedIn discussions', 'Industry content'],
          status: 'pending',
          findings: null,
          confidence: 0,
          lastUpdated: null,
          evidenceSources: []
        },
        {
          id: 'Q5_TIER3',
          title: 'What is the Required Price Justification for Tier III?',
          objective: 'Analyze competitor claims and enterprise security discussions to confirm the non-negotiable governance and security terms (e.g., "full audit trail") that validate the high price of the Tier III (Asset) governance features.',
          dataSources: ['Enterprise RFPs', 'Competitor pricing pages', 'Security requirement documents'],
          status: 'pending',
          findings: null,
          confidence: 0,
          lastUpdated: null,
          evidenceSources: []
        }
      ],
      synthesizedInsights: {
        icpProfile: null,
        costOfInaction: null,
        competitiveAlternatives: null,
        clarityToolHook: null,
        tierIIIPriceJustification: null
      },
      executionLog: []
    };
  }

  async loadState(): Promise<ResearchMandateState> {
    try {
      const fs = await import('fs/promises');
      const data = await fs.readFile(this.stateFile, 'utf-8');
      this.state = JSON.parse(data);
    } catch {
      this.state = this.initializeState();
      await this.saveState();
    }
    return this.state;
  }

  async saveState(): Promise<void> {
    const fs = await import('fs/promises');
    await fs.writeFile(this.stateFile, JSON.stringify(this.state, null, 2));
  }

  private log(action: string, result: string): void {
    this.state.executionLog.push({
      timestamp: new Date().toISOString(),
      action,
      result
    });
    if (this.state.executionLog.length > 100) {
      this.state.executionLog = this.state.executionLog.slice(-100);
    }
  }

  async executeResearchQuestion(questionId: string): Promise<ResearchQuestion> {
    await this.loadState();
    
    const question = this.state.questions.find(q => q.id === questionId);
    if (!question) {
      throw new Error(`Question ${questionId} not found`);
    }

    question.status = 'in_progress';
    this.log(`Starting research`, `Question: ${question.title}`);
    await this.saveState();

    try {
      let findings: any;
      
      switch (questionId) {
        case 'Q1_ICP':
          findings = await this.researchICP();
          break;
        case 'Q2_COST':
          findings = await this.researchCostOfInaction();
          break;
        case 'Q3_ALTERNATIVES':
          findings = await this.researchCompetitiveAlternatives();
          break;
        case 'Q4_HOOK':
          findings = await this.researchClarityHook();
          break;
        case 'Q5_TIER3':
          findings = await this.researchTierIIIJustification();
          break;
        default:
          throw new Error(`Unknown question: ${questionId}`);
      }

      question.findings = JSON.stringify(findings, null, 2);
      question.status = 'completed';
      question.confidence = findings.confidence || 75;
      question.lastUpdated = new Date().toISOString();
      question.evidenceSources = findings.sources || [];

      this.log(`Completed research`, `Question: ${question.title}, Confidence: ${question.confidence}%`);
      await this.saveState();

      return question;
    } catch (error) {
      question.status = 'error';
      question.findings = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
      question.lastUpdated = new Date().toISOString();
      this.log(`Research failed`, `Question: ${question.title}, Error: ${question.findings}`);
      await this.saveState();
      throw error;
    }
  }

  private async researchICP(): Promise<any> {
    const prompt = `You are a B2B market research analyst specializing in Life Sciences regulatory compliance.

RESEARCH QUESTION: Who is the Buyer of Professional Equity in the Life Sciences compliance space?

CONTEXT:
- Target market: Pharmaceutical, Biotech, Medical Device, CRO, CMO companies
- Focus: Professionals who need to justify compliance investments and demonstrate ROI
- Key signals: Language about "influence," "strategic defense," "budget justification," "executive visibility"

KNOWN JOB TITLES IN THIS SPACE:
${ICP_JOB_TITLES.join(', ')}

TASK:
Analyze which job title is the PRIMARY buyer based on:
1. Decision-making authority for compliance software
2. Need to prove ROI and "professional equity" (career advancement through compliance success)
3. Budget control and vendor selection power
4. Pain points around manual processes and audit readiness

OUTPUT FORMAT (JSON):
{
  "primaryICP": {
    "jobTitle": "string",
    "seniority": "string",
    "department": "string",
    "companySize": "string",
    "industrySegment": "string"
  },
  "buyerPersona": {
    "painPoints": ["string"],
    "motivations": ["string"],
    "decisionCriteria": ["string"],
    "budgetAuthority": "string"
  },
  "secondaryICPs": [{"jobTitle": "string", "role": "string"}],
  "keyPhrases": ["string"],
  "confidence": number,
  "sources": ["string"],
  "reasoning": "string"
}`;

    const result = await callGemini(prompt);
    this.state.synthesizedInsights.icpProfile = result;
    return result;
  }

  private async researchCostOfInaction(): Promise<any> {
    const prompt = `You are a B2B market research analyst specializing in Life Sciences regulatory compliance.

RESEARCH QUESTION: What is the True Cost of "Not Knowing" in compliance?

CONTEXT:
- FDA Warning Letters can cost companies $10M-$500M+ in remediation
- 483 observations lead to delayed product launches
- Failed audits damage reputation and stock price
- Manual compliance tracking wastes 20-40% of validation team time

TASK:
Quantify the dollar value of compliance problems to justify Tier II (Velocity) pricing at ~$500-2000/month:
1. Time lost to manual tracking and documentation
2. Cost of regulatory penalties and warning letters
3. Revenue impact of delayed product launches
4. Hidden costs of audit failures and remediation
5. Consultant fees for emergency compliance fixes

OUTPUT FORMAT (JSON):
{
  "costCategories": [
    {
      "category": "string",
      "annualCostRange": {"low": number, "high": number},
      "frequency": "string",
      "impact": "string"
    }
  ],
  "totalAnnualRisk": {"low": number, "high": number},
  "timeWasted": {
    "hoursPerWeek": number,
    "dollarsPerYear": number,
    "activities": ["string"]
  },
  "regulatoryPenalties": {
    "warningLetterCost": number,
    "remediationCost": number,
    "reputationImpact": "string"
  },
  "priceJustification": {
    "breakEvenDays": number,
    "roiMultiple": number,
    "valueProposition": "string"
  },
  "confidence": number,
  "sources": ["string"],
  "reasoning": "string"
}`;

    const result = await callGemini(prompt);
    this.state.synthesizedInsights.costOfInaction = result;
    return result;
  }

  private async researchCompetitiveAlternatives(): Promise<any> {
    const prompt = `You are a B2B market research analyst specializing in Life Sciences regulatory compliance.

RESEARCH QUESTION: What is the True Competitive Alternative to compliance software?

CONTEXT:
- Most validation teams still use manual methods
- Known alternatives: ${COMPETITOR_ALTERNATIVES.join(', ')}
- Focus should be on beating COMPLEXITY, not just other vendors

TASK:
Identify the non-software substitutes most often used and their weaknesses:
1. What do teams use TODAY before buying software?
2. What are the hidden costs of these alternatives?
3. What triggers the switch from manual to automated?
4. What competitors are mentioned and how?

OUTPUT FORMAT (JSON):
{
  "primaryAlternatives": [
    {
      "alternative": "string",
      "usagePercentage": number,
      "weaknesses": ["string"],
      "switchTriggers": ["string"]
    }
  ],
  "softwareCompetitors": [
    {
      "name": "string",
      "positioning": "string",
      "priceRange": "string",
      "weaknesses": ["string"]
    }
  ],
  "messagingImplications": {
    "beatComplexity": ["string"],
    "avoidVendorComparison": ["string"],
    "keyDifferentiators": ["string"]
  },
  "confidence": number,
  "sources": ["string"],
  "reasoning": "string"
}`;

    const result = await callGemini(prompt);
    this.state.synthesizedInsights.competitiveAlternatives = result;
    return result;
  }

  private async researchClarityHook(): Promise<any> {
    const prompt = `You are a B2B market research analyst specializing in Life Sciences regulatory compliance.

RESEARCH QUESTION: What is the "Clarity Tool" Hook for the Compliance Velocity Scorecard?

CONTEXT:
- The Scorecard is a FREE tool to generate leads
- It must provide instant, compelling value
- Target: Validation/Quality professionals who don't know their compliance velocity
- Must answer a question they've always wondered but never had data for

COMMON UNKNOWNS IN COMPLIANCE:
- How do we compare to industry benchmarks?
- What's our true cost per validation?
- How much time are we wasting on manual tasks?
- What's our audit readiness score?
- What's our compliance velocity vs. competitors?

TASK:
Identify THE SINGLE most compelling metric or unknown that would instantly compel professionals to use the Scorecard:
1. What question keeps them up at night?
2. What metric would make them look smart to their boss?
3. What unknown creates the most anxiety?
4. What would they share with colleagues?

OUTPUT FORMAT (JSON):
{
  "primaryHook": {
    "metric": "string",
    "question": "string",
    "emotionalDriver": "string",
    "viralPotential": "string"
  },
  "alternativeHooks": [
    {
      "metric": "string",
      "appeal": "string",
      "targetPersona": "string"
    }
  ],
  "scorecardDesign": {
    "primaryOutput": "string",
    "benchmarkComparison": "string",
    "callToAction": "string",
    "shareability": "string"
  },
  "conversionPath": {
    "freeValue": "string",
    "paidUpgrade": "string",
    "urgencyTrigger": "string"
  },
  "confidence": number,
  "sources": ["string"],
  "reasoning": "string"
}`;

    const result = await callGemini(prompt);
    this.state.synthesizedInsights.clarityToolHook = result;
    return result;
  }

  private async researchTierIIIJustification(): Promise<any> {
    const prompt = `You are a B2B market research analyst specializing in Life Sciences regulatory compliance.

RESEARCH QUESTION: What is the Required Price Justification for Tier III (Asset/Enterprise)?

CONTEXT:
- Tier III is the premium enterprise tier
- Must justify $2000-5000+/month pricing
- Focus on governance, security, and auditability
- Enterprise buyers have non-negotiable requirements

KNOWN ENTERPRISE REQUIREMENTS:
- Full audit trail (21 CFR Part 11)
- SSO/SAML integration
- Role-based access control
- Data residency options
- SOC 2 Type II compliance
- Validation documentation packages
- Dedicated support/CSM

TASK:
Confirm the non-negotiable governance and security terms that validate high pricing:
1. What security features are mandatory for enterprise?
2. What audit/compliance features justify premium pricing?
3. What service level guarantees do enterprises require?
4. What makes buyers say "we have to pay more for this"?

OUTPUT FORMAT (JSON):
{
  "mustHaveFeatures": [
    {
      "feature": "string",
      "requirement": "string",
      "pricePremium": "string",
      "buyerQuote": "string"
    }
  ],
  "complianceRequirements": {
    "regulatory": ["string"],
    "security": ["string"],
    "auditability": ["string"]
  },
  "serviceLevelExpectations": {
    "uptime": "string",
    "support": "string",
    "implementation": "string"
  },
  "priceJustification": {
    "valueDrivers": ["string"],
    "competitorPricing": "string",
    "roiCalculation": "string"
  },
  "enterpriseBuyingSignals": ["string"],
  "confidence": number,
  "sources": ["string"],
  "reasoning": "string"
}`;

    const result = await callGemini(prompt);
    this.state.synthesizedInsights.tierIIIPriceJustification = result;
    return result;
  }

  async executeAllQuestions(): Promise<ResearchMandateState> {
    await this.loadState();
    
    // Reset all question statuses to prevent stale state from prior failures
    for (const question of this.state.questions) {
      question.status = 'pending';
      question.confidence = 0;
    }
    
    this.state.overallStatus = 'in_progress';
    this.state.lastExecution = new Date().toISOString();
    this.log('Starting full research mandate', 'Executing all 5 questions');
    await this.saveState();

    const results: ResearchQuestion[] = [];
    
    for (const question of this.state.questions) {
      try {
        console.log(`🔬 RESEARCH MANDATE: Executing ${question.id} - ${question.title}`);
        const result = await this.executeResearchQuestion(question.id);
        results.push(result);
        console.log(`✅ RESEARCH MANDATE: Completed ${question.id} with ${result.confidence}% confidence`);
      } catch (error) {
        console.error(`❌ RESEARCH MANDATE: Failed ${question.id}:`, error);
      }
    }

    const completedCount = results.filter(r => r.status === 'completed').length;
    this.state.overallStatus = completedCount === 5 ? 'completed' : 'partial';
    
    this.log('Research mandate execution complete', `${completedCount}/5 questions completed`);
    await this.saveState();

    return this.state;
  }

  async getStatus(): Promise<ResearchMandateState> {
    return await this.loadState();
  }

  async getSynthesizedInsights(): Promise<any> {
    await this.loadState();
    return this.state.synthesizedInsights;
  }

  async generateExecutiveReport(): Promise<string> {
    await this.loadState();

    const prompt = `You are the Chief of Staff AI generating an executive research report.

RESEARCH FINDINGS:
${JSON.stringify(this.state.synthesizedInsights, null, 2)}

Generate a concise executive summary that answers:
1. WHO should we target? (ICP)
2. WHAT problem are we solving? (Cost of Inaction)
3. WHO are we competing against? (Alternatives)
4. HOW do we attract them? (Clarity Hook)
5. WHY should enterprises pay premium? (Tier III Justification)

Format as actionable insights for the founder. Be specific with numbers and recommendations.`;

    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }]
    });

    return response.text || 'Report generation failed';
  }
}

export const researchMandate = new ResearchMandateService();
