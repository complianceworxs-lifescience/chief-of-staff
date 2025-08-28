import OpenAI from "openai";
import fs from "fs/promises";
import path from "path";

// LLM Configuration
const LLM_PROVIDER = process.env.LLM_PROVIDER || "openai"; // "openai" or "gemini"
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

interface DirectiveData {
  scoreboard: any;
  initiatives: any[];
  decisions: any[];
  actions: any[];
  meetings: any[];
  insights?: any[];
}

interface GeneratedDirective {
  id: string;
  agent: string;
  action: string;
  rationale: string;
  priority: "p1" | "p2" | "p3";
  due: string;
  kpi_impact: string;
  estimated_effort: number;
  tasks: Array<{
    text: string;
    owner: string;
    due: string;
  }>;
  context: {
    source_data: string[];
    confidence: number;
    risk_level: "low" | "medium" | "high";
  };
}

interface DirectivesOutput {
  generated_at: string;
  llm_provider: string;
  data_sources: string[];
  directives: GeneratedDirective[];
  summary: {
    total_directives: number;
    by_agent: Record<string, number>;
    high_priority_count: number;
  };
}

export class LLMDirectiveEngine {
  private openai?: OpenAI;

  constructor() {
    if (LLM_PROVIDER === "openai" && OPENAI_API_KEY) {
      this.openai = new OpenAI({ apiKey: OPENAI_API_KEY });
    }
  }

  async loadDataSources(): Promise<DirectiveData> {
    const dataPath = path.join(process.cwd(), "server", "data");
    
    try {
      const [scoreboard, initiatives, decisions, actions, meetings] = await Promise.all([
        this.loadJsonFile(path.join(dataPath, "scoreboard.json")),
        this.loadJsonFile(path.join(dataPath, "initiatives.json")),
        this.loadJsonFile(path.join(dataPath, "decisions.json")),
        this.loadJsonFile(path.join(dataPath, "actions.json")),
        this.loadJsonFile(path.join(dataPath, "meetings.json")),
      ]);

      // Optional insights file
      let insights;
      try {
        insights = await this.loadJsonFile(path.join(dataPath, "insights.json"));
      } catch {
        insights = [];
      }

      return { scoreboard, initiatives, decisions, actions, meetings, insights };
    } catch (error) {
      throw new Error(`Failed to load data sources: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async loadJsonFile(filePath: string): Promise<any> {
    const content = await fs.readFile(filePath, "utf-8");
    return JSON.parse(content);
  }

  async generateDirectives(): Promise<DirectivesOutput> {
    const data = await this.loadDataSources();
    
    // Validate data quality
    this.validateDataSources(data);

    if (LLM_PROVIDER === "openai") {
      return this.generateWithOpenAI(data);
    } else if (LLM_PROVIDER === "gemini") {
      return this.generateWithGemini(data);
    } else {
      throw new Error(`Unsupported LLM provider: ${LLM_PROVIDER}`);
    }
  }

  private validateDataSources(data: DirectiveData): void {
    const errors: string[] = [];

    // Validate scoreboard
    if (!data.scoreboard?.date) errors.push("scoreboard.date missing");
    if (!data.scoreboard?.revenue) errors.push("scoreboard.revenue missing");

    // Validate initiatives
    if (!Array.isArray(data.initiatives)) errors.push("initiatives must be array");

    if (errors.length > 0) {
      throw new Error(`DATA GAPS: ${errors.join(", ")}`);
    }
  }

  private async generateWithOpenAI(data: DirectiveData): Promise<DirectivesOutput> {
    if (!this.openai) {
      throw new Error("OpenAI client not initialized - check OPENAI_API_KEY");
    }

    const systemPrompt = this.buildSystemPrompt();
    const userPrompt = this.buildDataAnalysisPrompt(data);

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o", // Use latest model available
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 4000
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error("Empty response from OpenAI");
      }

      const result = JSON.parse(content);
      return this.formatDirectivesOutput(result, "openai", data);
    } catch (error) {
      throw new Error(`OpenAI generation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async generateWithGemini(data: DirectiveData): Promise<DirectivesOutput> {
    // TODO: Implement Gemini API integration
    // For now, return mock response
    console.log("Gemini integration not yet implemented, using mock response");
    
    return {
      generated_at: new Date().toISOString(),
      llm_provider: "gemini",
      data_sources: ["scoreboard", "initiatives", "decisions", "actions", "meetings"],
      directives: [],
      summary: {
        total_directives: 0,
        by_agent: {},
        high_priority_count: 0
      }
    };
  }

  private buildSystemPrompt(): string {
    return `You are the Chief of Staff AI for ComplianceWorxs, a Life Sciences consulting company. Your role is to analyze morning dashboards and email summaries, then generate strategic directives for autonomous agents.

AGENT SPECIALIZATIONS:
- ChatGPT (you): Strategic & Regulatory (CoS, CMO, CRO, CCO)
- Gemini AI: Financial & Operational (CFO, COO, Market Intelligence)

AVAILABLE AGENTS:
- CoS (Chief of Staff): Strategic coordination and alignment
- CMO: Marketing campaigns, content strategy, lead generation
- CRO: Revenue optimization, sales processes, conversion
- CCO: Customer retention, satisfaction, support optimization
- CFO: Financial analysis, budget optimization, cost management
- COO: Operations efficiency, workflow optimization
- Market Intelligence: Competitive analysis, regulatory monitoring

DIRECTIVE RULES:
1. Focus only on Life Sciences industry (pharma, biotech, medical devices, CROs, CMOs)
2. Each directive must be autonomous (no HITL required)
3. Include specific KPI impact projections
4. Set realistic deadlines (24h-7d typically)
5. Assign to appropriate agent based on specialization
6. Priority: p1=urgent/revenue-critical, p2=important, p3=optimization

RESPONSE FORMAT: Return valid JSON with directives array containing: id, agent, action, rationale, priority, due, kpi_impact, estimated_effort, tasks, context.`;
  }

  private buildDataAnalysisPrompt(data: DirectiveData): string {
    return `Analyze this ComplianceWorxs data and generate strategic directives for autonomous execution:

SCOREBOARD (${data.scoreboard.date}):
${JSON.stringify(data.scoreboard, null, 2)}

INITIATIVES STATUS:
${JSON.stringify(data.initiatives, null, 2)}

PENDING DECISIONS:
${JSON.stringify(data.decisions, null, 2)}

CANDIDATE ACTIONS:
${JSON.stringify(data.actions, null, 2)}

RECENT MEETINGS:
${JSON.stringify(data.meetings, null, 2)}

${data.insights?.length ? `INSIGHTS:\n${JSON.stringify(data.insights, null, 2)}` : ''}

ANALYSIS FOCUS:
1. Revenue pace vs target (current: ${data.scoreboard.revenue?.realized_week}/${data.scoreboard.revenue?.target_week})
2. Initiative health (amber/red items need immediate action)
3. Urgent decisions requiring agent execution
4. Strategic alignment opportunities

Generate 3-8 high-impact directives that agents can execute autonomously to improve KPIs. Focus on Life Sciences market opportunities and compliance requirements.

Return JSON format with directives array and summary.`;
  }

  private formatDirectivesOutput(rawResult: any, provider: string, data: DirectiveData): DirectivesOutput {
    const directives = rawResult.directives || [];
    
    // Add IDs and ensure format compliance
    const formattedDirectives = directives.map((directive: any, index: number) => ({
      id: `dir_${Date.now()}_${index}`,
      agent: directive.agent || "CoS",
      action: directive.action || "Review and prioritize",
      rationale: directive.rationale || "Strategic alignment required",
      priority: directive.priority || "p2",
      due: directive.due || new Date(Date.now() + 24*60*60*1000).toISOString().split('T')[0],
      kpi_impact: directive.kpi_impact || "Strategic alignment improvement",
      estimated_effort: directive.estimated_effort || 2,
      tasks: directive.tasks || [],
      context: {
        source_data: ["scoreboard", "initiatives", "decisions", "actions", "meetings"],
        confidence: directive.context?.confidence || 0.8,
        risk_level: directive.context?.risk_level || "medium"
      }
    }));

    // Generate summary
    const agentCounts: Record<string, number> = {};
    let highPriorityCount = 0;

    formattedDirectives.forEach((dir: GeneratedDirective) => {
      agentCounts[dir.agent] = (agentCounts[dir.agent] || 0) + 1;
      if (dir.priority === "p1") highPriorityCount++;
    });

    return {
      generated_at: new Date().toISOString(),
      llm_provider: provider,
      data_sources: ["scoreboard", "initiatives", "decisions", "actions", "meetings"],
      directives: formattedDirectives,
      summary: {
        total_directives: formattedDirectives.length,
        by_agent: agentCounts,
        high_priority_count: highPriorityCount
      }
    };
  }

  async saveDirectives(directives: DirectivesOutput): Promise<string> {
    const outputPath = path.join(process.cwd(), "server", "data", "directives.json");
    await fs.writeFile(outputPath, JSON.stringify(directives, null, 2));
    
    // Also save to lineage for audit trail
    const lineagePath = path.join(process.cwd(), "server", "lineage");
    await fs.mkdir(lineagePath, { recursive: true });
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const lineageFile = path.join(lineagePath, `directives_${timestamp}.json`);
    await fs.writeFile(lineageFile, JSON.stringify(directives, null, 2));

    return outputPath;
  }
}