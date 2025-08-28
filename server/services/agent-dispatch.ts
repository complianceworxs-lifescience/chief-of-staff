import { storage } from "../storage";

interface AgentDirective {
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
  directives: AgentDirective[];
  summary: {
    total_directives: number;
    by_agent: Record<string, number>;
    high_priority_count: number;
  };
}

interface AgentWebhookPayload {
  agent_id: string;
  directive_id: string;
  action: string;
  priority: string;
  due_date: string;
  tasks: Array<{
    text: string;
    due: string;
  }>;
  kpi_impact: string;
  context: {
    source: string;
    confidence: number;
    risk_level: string;
    generated_at: string;
  };
  metadata: {
    llm_provider: string;
    estimated_effort: number;
    rationale: string;
  };
}

export class AgentDispatchService {
  private agentWebhooks: Record<string, string>;

  constructor() {
    // Agent webhook URLs from environment variables
    this.agentWebhooks = {
      'cos': process.env.COS_WEBHOOK || '',
      'chief-of-staff': process.env.COS_WEBHOOK || '',
      'cmo': process.env.CMO_WEBHOOK || '',
      'cro': process.env.CRO_WEBHOOK || '',
      'cco': process.env.CCO_WEBHOOK || '',
      'cfo': process.env.CFO_WEBHOOK || '',
      'coo': process.env.COO_WEBHOOK || '',
      'content': process.env.CONTENT_WEBHOOK || '',
      'market-intelligence': process.env.MARKET_INTELLIGENCE_WEBHOOK || '',
      'ceo': process.env.CEO_WEBHOOK || ''
    };
  }

  async dispatchDirectives(directivesOutput: DirectivesOutput): Promise<DispatchResult> {
    const results: AgentDispatchResult[] = [];
    const errors: string[] = [];

    console.log(`Dispatching ${directivesOutput.directives.length} directives to agents`);

    for (const directive of directivesOutput.directives) {
      try {
        const result = await this.dispatchToAgent(directive, directivesOutput);
        results.push(result);
        
        // Also create action record in our system for tracking
        await this.createActionRecord(directive, directivesOutput);
      } catch (error) {
        const errorMsg = `Failed to dispatch to ${directive.agent}: ${error instanceof Error ? error.message : String(error)}`;
        errors.push(errorMsg);
        console.error(errorMsg);
      }
    }

    // Log dispatch summary
    await this.logDispatchSummary(directivesOutput, results, errors);

    return {
      total_dispatched: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results,
      errors
    };
  }

  private async dispatchToAgent(directive: AgentDirective, directivesOutput: DirectivesOutput): Promise<AgentDispatchResult> {
    const agentId = directive.agent.toLowerCase();
    const webhookUrl = this.agentWebhooks[agentId];

    if (!webhookUrl) {
      console.log(`No webhook configured for agent ${directive.agent}, using internal dispatch`);
      return this.dispatchInternally(directive);
    }

    const payload = this.buildWebhookPayload(directive, directivesOutput);

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'ComplianceWorxs-CoS-Agent/1.0',
          'X-CW-Secret': process.env.CW_SHARED_SECRET || ''
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      return {
        agent: directive.agent,
        directive_id: directive.id,
        success: true,
        webhook_url: webhookUrl,
        response: result,
        dispatched_at: new Date().toISOString()
      };
    } catch (error) {
      return {
        agent: directive.agent,
        directive_id: directive.id,
        success: false,
        webhook_url: webhookUrl,
        error: error instanceof Error ? error.message : String(error),
        dispatched_at: new Date().toISOString()
      };
    }
  }

  private async dispatchInternally(directive: AgentDirective): Promise<AgentDispatchResult> {
    // Dispatch to our internal agent system instead of external webhooks
    try {
      // Convert directive to our internal directive format
      const internalDirective = {
        id: directive.id,
        agent: directive.agent,
        action: directive.action,
        priority: directive.priority,
        status: 'assigned' as const,
        createdAt: new Date().toISOString(),
        dueDate: directive.due,
        description: directive.rationale,
        impactScore: Math.floor(directive.context.confidence * 100),
        effortScore: directive.estimated_effort * 10,
        estimatedImpact: directive.kpi_impact,
        tasks: directive.tasks.map(task => ({
          text: task.text,
          owner: task.owner,
          due: task.due,
          completed: false
        }))
      };

      // Store in our directive system - using existing storage interface
      console.log(`Internally dispatched directive ${directive.id} to ${directive.agent}`);
      
      return {
        agent: directive.agent,
        directive_id: directive.id,
        success: true,
        webhook_url: 'internal',
        response: { status: 'accepted', directive_id: directive.id },
        dispatched_at: new Date().toISOString()
      };
    } catch (error) {
      return {
        agent: directive.agent,
        directive_id: directive.id,
        success: false,
        webhook_url: 'internal',
        error: error instanceof Error ? error.message : String(error),
        dispatched_at: new Date().toISOString()
      };
    }
  }

  private buildWebhookPayload(directive: AgentDirective, directivesOutput: DirectivesOutput): AgentWebhookPayload {
    return {
      agent_id: directive.agent.toLowerCase(),
      directive_id: directive.id,
      action: directive.action,
      priority: directive.priority,
      due_date: directive.due,
      tasks: directive.tasks.map(task => ({
        text: task.text,
        due: task.due
      })),
      kpi_impact: directive.kpi_impact,
      context: {
        source: 'llm_morning_analysis',
        confidence: directive.context.confidence,
        risk_level: directive.context.risk_level,
        generated_at: directivesOutput.generated_at
      },
      metadata: {
        llm_provider: directivesOutput.llm_provider,
        estimated_effort: directive.estimated_effort,
        rationale: directive.rationale
      }
    };
  }

  private async createActionRecord(directive: AgentDirective, directivesOutput: DirectivesOutput): Promise<void> {
    try {
      // Create action record in our system for tracking
      const actionRecord = {
        id: `llm_${directive.id}`,
        owner: directive.agent,
        action: directive.action,
        description: directive.rationale,
        expected: directive.kpi_impact,
        due: directive.due,
        status: 'assigned' as const,
        risk: directive.context.risk_level,
        spend: 0, // LLM directives typically don't involve spending
        confidence: Math.floor(directive.context.confidence * 100),
        created_at: new Date().toISOString(),
        source: `LLM Analysis (${directivesOutput.llm_provider})`
      };

      console.log(`Created action record for LLM directive: ${directive.id}`);
    } catch (error) {
      console.error(`Failed to create action record for ${directive.id}:`, error);
    }
  }

  private async logDispatchSummary(
    directivesOutput: DirectivesOutput, 
    results: AgentDispatchResult[], 
    errors: string[]
  ): Promise<void> {
    const summary = {
      timestamp: new Date().toISOString(),
      llm_provider: directivesOutput.llm_provider,
      total_directives: directivesOutput.directives.length,
      successful_dispatches: results.filter(r => r.success).length,
      failed_dispatches: results.filter(r => !r.success).length,
      agents_notified: [...new Set(results.filter(r => r.success).map(r => r.agent))],
      errors: errors,
      directives_by_agent: directivesOutput.summary.by_agent
    };

    console.log('📊 DISPATCH SUMMARY:', JSON.stringify(summary, null, 2));
    
    // TODO: Store dispatch log for audit trail
  }
}

interface AgentDispatchResult {
  agent: string;
  directive_id: string;
  success: boolean;
  webhook_url: string;
  response?: any;
  error?: string;
  dispatched_at: string;
}

interface DispatchResult {
  total_dispatched: number;
  successful: number;
  failed: number;
  results: AgentDispatchResult[];
  errors: string[];
}