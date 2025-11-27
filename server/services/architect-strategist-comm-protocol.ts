/**
 * ARCHITECT_STRATEGIST_COMM_PROTOCOL v1.0
 * 
 * Defines the message, routing, and safety rules for communication between
 * Architect (ChatGPT) and Strategist (Gemini) via Replit.
 * 
 * Roles:
 * - Architect: ChatGPT (Architect Engine)
 * - Strategist: Gemini (Strategist Agent)
 * - Transport: Replit runtime
 * - Enforcer: CoS Agent
 */

import fs from 'fs';
import path from 'path';
import { architectDecisionGatekeeper } from './architect-decision-gatekeeper';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type DirectiveIntent = 'DIAGNOSTIC' | 'RECOVERY' | 'FORECAST' | 'STRATEGIC_ANALYSIS';

export type RootCauseClass = 
  | 'UDL' 
  | 'REVENUE_STABILITY' 
  | 'RPM_CONFIDENCE' 
  | 'OBJECTION_DRIFT' 
  | 'OFFER_LADDER_PREDICTABILITY';

export type L6PressureSignal = 'LOW' | 'MEDIUM' | 'HIGH';

export type GatekeeperDecision = 'APPROVE' | 'MODIFY' | 'REJECT';

export type ProtocolErrorType = 'TRANSIENT' | 'PERMANENT';

// ARCHITECT_DIRECTIVE_PACKET: Architect → Strategist
export interface ArchitectDirectivePacket {
  directive_id: string;
  context_version: string;
  intent: DirectiveIntent;
  payload: {
    odar?: Record<string, any>;
    vqs?: Record<string, any>;
    offer_ladder?: Record<string, any>;
    rpm?: Record<string, any>;
    objections?: Record<string, any>;
    custom?: Record<string, any>;
  };
  constraints: {
    vqs_locked: boolean;
    no_positioning_change: boolean;
    no_offer_ladder_mutation: boolean;
    l6_behavior_allowed: boolean;
  };
  token_budget: number;
  deadline_minutes: number;
  created_at: string;
}

// STRATEGIST_DIAGNOSTIC_BRIEF: Strategist → Architect
export interface StrategistDiagnosticBrief {
  brief_id: string;
  source_directive_id: string;
  root_cause_class: RootCauseClass;
  single_recommended_action: string;
  projected_impact: {
    rpm_confidence_delta: number;
    revenue_delta: number;
    risk_notes: string;
  };
  confidence_score: number;
  l6_pressure_signal: L6PressureSignal;
  created_at: string;
}

// CoS Summary (condensed for operational use)
export interface CosSummary {
  brief_id: string;
  root_cause: RootCauseClass;
  recommended_action: string;
  confidence: number;
  gatekeeper_decision: GatekeeperDecision;
  enforcement_instructions: string[];
}

// Protocol error structure
export interface ProtocolError {
  type: ProtocolErrorType;
  code: string;
  message: string;
  timestamp: string;
  retryable: boolean;
  attempts?: number;
}

// Protocol transaction record
export interface ProtocolTransaction {
  transaction_id: string;
  directive: ArchitectDirectivePacket;
  brief?: StrategistDiagnosticBrief;
  gatekeeper_decision?: GatekeeperDecision;
  cos_summary?: CosSummary;
  status: 'PENDING' | 'STRATEGIST_RESPONDED' | 'GATEKEEPER_DECIDED' | 'COS_ENFORCED' | 'FAILED';
  errors: ProtocolError[];
  started_at: string;
  completed_at?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const PROTOCOL_VERSION = '1.0';
const MODULE_NAME = 'ARCHITECT_STRATEGIST_COMM_PROTOCOL';

const GOVERNANCE_CONSTRAINTS = {
  vqs_protection: 'ENFORCED',
  positioning_lock: 'ENFORCED',
  offer_ladder_lock: 'ENFORCED',
  l6_lock: 'ENFORCED'
} as const;

const TRANSIENT_ERROR_CODES = [
  'API_TIMEOUT',
  'RATE_LIMIT',
  'NETWORK_ERROR',
  'SERVICE_UNAVAILABLE'
];

const PERMANENT_ERROR_CODES = [
  'INVALID_PAYLOAD_SCHEMA',
  'MISSING_ROOT_CAUSE_CLASS',
  'EMPTY_RECOMMENDED_ACTION',
  'GOVERNANCE_VIOLATION'
];

const RETRY_CONFIG = {
  backoff_ms: 1500,
  max_attempts: 2
};

// ============================================================================
// ARCHITECT STRATEGIST COMM PROTOCOL SERVICE
// ============================================================================

class ArchitectStrategistCommProtocol {
  private transactions: Map<string, ProtocolTransaction> = new Map();
  private logs: Array<{
    timestamp: string;
    event: string;
    data: Record<string, any>;
  }> = [];
  private initialized = false;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    if (this.initialized) return;

    console.log(`[${MODULE_NAME}] Initializing v${PROTOCOL_VERSION}...`);
    console.log(`   Governance Constraints:`);
    console.log(`      VQS Protection: ${GOVERNANCE_CONSTRAINTS.vqs_protection}`);
    console.log(`      Positioning Lock: ${GOVERNANCE_CONSTRAINTS.positioning_lock}`);
    console.log(`      Offer Ladder Lock: ${GOVERNANCE_CONSTRAINTS.offer_ladder_lock}`);
    console.log(`      L6 Lock: ${GOVERNANCE_CONSTRAINTS.l6_lock}`);
    
    this.initialized = true;
  }

  // --------------------------------------------------------------------------
  // DIRECTIVE CREATION (Architect → Strategist)
  // --------------------------------------------------------------------------

  createDirectivePacket(
    intent: DirectiveIntent,
    payload: ArchitectDirectivePacket['payload'],
    options: {
      context_version?: string;
      token_budget?: number;
      deadline_minutes?: number;
    } = {}
  ): ArchitectDirectivePacket {
    const directive: ArchitectDirectivePacket = {
      directive_id: `DIR-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      context_version: options.context_version || 'L5_SUITE_v1.0',
      intent,
      payload,
      constraints: {
        vqs_locked: true,
        no_positioning_change: true,
        no_offer_ladder_mutation: true,
        l6_behavior_allowed: false
      },
      token_budget: options.token_budget || 2000,
      deadline_minutes: options.deadline_minutes || 5,
      created_at: new Date().toISOString()
    };

    this.logEvent('DIRECTIVE_CREATED', {
      directive_id: directive.directive_id,
      intent: directive.intent,
      context_version: directive.context_version
    });

    return directive;
  }

  // --------------------------------------------------------------------------
  // ROUTING: Architect → Strategist
  // --------------------------------------------------------------------------

  async routeToStrategist(directive: ArchitectDirectivePacket): Promise<{
    success: boolean;
    transaction_id: string;
    error?: ProtocolError;
  }> {
    const transaction_id = `TXN-${Date.now()}`;
    
    // Create transaction record
    const transaction: ProtocolTransaction = {
      transaction_id,
      directive,
      status: 'PENDING',
      errors: [],
      started_at: new Date().toISOString()
    };
    
    this.transactions.set(transaction_id, transaction);

    this.logEvent('DIRECTIVE_ROUTED_TO_STRATEGIST', {
      transaction_id,
      directive_id: directive.directive_id,
      intent: directive.intent
    });

    // Log outbound payload
    this.writeToSystemLog('OUTBOUND', {
      type: 'ARCHITECT_DIRECTIVE_PACKET',
      directive
    });

    return {
      success: true,
      transaction_id
    };
  }

  // --------------------------------------------------------------------------
  // BRIEF PROCESSING: Strategist → Architect
  // --------------------------------------------------------------------------

  async processStrategistBrief(
    transaction_id: string,
    brief: StrategistDiagnosticBrief
  ): Promise<{
    success: boolean;
    validation_errors: string[];
    governance_violations: string[];
  }> {
    const transaction = this.transactions.get(transaction_id);
    if (!transaction) {
      return {
        success: false,
        validation_errors: [`Transaction ${transaction_id} not found`],
        governance_violations: []
      };
    }

    // Validate brief schema
    const validation = this.validateBriefSchema(brief);
    if (!validation.valid) {
      const error: ProtocolError = {
        type: 'PERMANENT',
        code: 'INVALID_PAYLOAD_SCHEMA',
        message: validation.errors.join('; '),
        timestamp: new Date().toISOString(),
        retryable: false
      };
      transaction.errors.push(error);
      transaction.status = 'FAILED';
      
      this.logEvent('BRIEF_VALIDATION_FAILED', {
        transaction_id,
        errors: validation.errors
      });

      return {
        success: false,
        validation_errors: validation.errors,
        governance_violations: []
      };
    }

    // Check governance constraints - HARD FAIL on violations
    const governance = this.checkGovernanceCompliance(brief, transaction.directive);
    if (governance.violations.length > 0) {
      const error: ProtocolError = {
        type: 'PERMANENT',
        code: 'GOVERNANCE_VIOLATION',
        message: governance.violations.join('; '),
        timestamp: new Date().toISOString(),
        retryable: false
      };
      transaction.errors.push(error);
      transaction.status = 'FAILED';
      
      this.logEvent('GOVERNANCE_VIOLATION_HARD_FAIL', {
        transaction_id,
        violations: governance.violations
      });

      // Log violation to system log
      this.writeToSystemLog('GOVERNANCE_VIOLATION', {
        transaction_id,
        brief_id: brief.brief_id,
        violations: governance.violations,
        enforcement: 'HARD_FAIL'
      });

      // Return failure - governance violations are NOT allowed to proceed
      return {
        success: false,
        validation_errors: [],
        governance_violations: governance.violations
      };
    }

    // Update transaction
    transaction.brief = brief;
    transaction.status = 'STRATEGIST_RESPONDED';

    // Log raw response
    this.writeToSystemLog('INBOUND', {
      type: 'STRATEGIST_DIAGNOSTIC_BRIEF',
      brief
    });

    this.logEvent('BRIEF_RECEIVED', {
      transaction_id,
      brief_id: brief.brief_id,
      root_cause_class: brief.root_cause_class,
      confidence: brief.confidence_score
    });

    return {
      success: true,
      validation_errors: [],
      governance_violations: [] // Empty because violations cause hard-fail above
    };
  }

  // --------------------------------------------------------------------------
  // GATEKEEPER INTEGRATION (REAL)
  // --------------------------------------------------------------------------

  async routeToGatekeeper(transaction_id: string): Promise<{
    decision: GatekeeperDecision;
    reasoning: string;
    modifications?: string[];
    gatekeeperDecisionId?: string;
  }> {
    const transaction = this.transactions.get(transaction_id);
    if (!transaction || !transaction.brief) {
      return {
        decision: 'REJECT',
        reasoning: 'No brief available for gatekeeper review'
      };
    }

    // Forward full brief to REAL Architect Decision Gatekeeper
    this.logEvent('ROUTING_TO_REAL_GATEKEEPER', {
      transaction_id,
      brief_id: transaction.brief.brief_id
    });

    const brief = transaction.brief;

    // Convert brief to StrategistProposal format for real gatekeeper
    const proposal = {
      source: 'Strategist' as const,
      root_cause_class: brief.root_cause_class,
      proposed_action: brief.single_recommended_action,
      projected_impact: brief.projected_impact
    };

    // Call the REAL Architect Decision Gatekeeper service
    const gatekeeperResult = architectDecisionGatekeeper.evaluate(proposal);

    // Map gatekeeper decision to our types
    const decision = gatekeeperResult.decision as GatekeeperDecision;
    const reasoning = gatekeeperResult.reason;
    const modifications: string[] = [];

    // Extract modifications if decision is MODIFY
    if (decision === 'MODIFY') {
      modifications.push(gatekeeperResult.notes_for_cos);
      if (gatekeeperResult.instructions_to_strategist === 'resubmit_narrower') {
        modifications.push('Strategist must resubmit with narrower scope');
      }
    }

    // Update transaction with real gatekeeper decision
    transaction.gatekeeper_decision = decision;
    transaction.status = 'GATEKEEPER_DECIDED';

    // Log decision from real gatekeeper
    this.writeToSystemLog('GATEKEEPER_DECISION', {
      transaction_id,
      brief_id: brief.brief_id,
      gatekeeper_decision_id: gatekeeperResult.decisionId,
      decision,
      reasoning,
      safety: gatekeeperResult.safety,
      instructions_to_strategist: gatekeeperResult.instructions_to_strategist
    });

    this.logEvent('REAL_GATEKEEPER_DECISION', {
      transaction_id,
      gatekeeper_decision_id: gatekeeperResult.decisionId,
      decision,
      reasoning,
      all_hard_passed: gatekeeperResult.evaluation.all_hard_passed,
      all_gate_passed: gatekeeperResult.evaluation.all_gate_passed,
      soft_violations: gatekeeperResult.evaluation.soft_violations
    });

    return { 
      decision, 
      reasoning, 
      modifications,
      gatekeeperDecisionId: gatekeeperResult.decisionId
    };
  }

  // --------------------------------------------------------------------------
  // COS ENFORCEMENT
  // --------------------------------------------------------------------------

  async routeToCoS(transaction_id: string): Promise<CosSummary | null> {
    const transaction = this.transactions.get(transaction_id);
    if (!transaction || !transaction.brief || !transaction.gatekeeper_decision) {
      return null;
    }

    const brief = transaction.brief;
    
    // Generate enforcement instructions based on decision
    const enforcement_instructions: string[] = [];
    
    switch (transaction.gatekeeper_decision) {
      case 'APPROVE':
        enforcement_instructions.push(`Execute: ${brief.single_recommended_action}`);
        enforcement_instructions.push('Monitor RPM impact post-execution');
        enforcement_instructions.push('Log execution outcome to decision lineage');
        break;
      case 'MODIFY':
        enforcement_instructions.push('Request clarification from Strategist before execution');
        enforcement_instructions.push('Verify action alignment with L5 constraints');
        enforcement_instructions.push('Proceed only after Architect confirmation');
        break;
      case 'REJECT':
        enforcement_instructions.push('Do not execute recommended action');
        enforcement_instructions.push('Request resubmission from Strategist with additional context');
        enforcement_instructions.push('Log rejection reason to decision lineage');
        break;
    }

    const cosSummary: CosSummary = {
      brief_id: brief.brief_id,
      root_cause: brief.root_cause_class,
      recommended_action: brief.single_recommended_action,
      confidence: brief.confidence_score,
      gatekeeper_decision: transaction.gatekeeper_decision,
      enforcement_instructions
    };

    // Update transaction
    transaction.cos_summary = cosSummary;
    transaction.status = 'COS_ENFORCED';
    transaction.completed_at = new Date().toISOString();

    this.logEvent('COS_ENFORCEMENT_SENT', {
      transaction_id,
      brief_id: brief.brief_id,
      decision: transaction.gatekeeper_decision,
      instructions_count: enforcement_instructions.length
    });

    return cosSummary;
  }

  // --------------------------------------------------------------------------
  // FULL DECISION FLOW
  // --------------------------------------------------------------------------

  async executeDecisionFlow(
    directive: ArchitectDirectivePacket,
    strategistResponse: StrategistDiagnosticBrief
  ): Promise<{
    success: boolean;
    transaction_id: string;
    final_decision: GatekeeperDecision | null;
    cos_summary: CosSummary | null;
    errors: ProtocolError[];
  }> {
    // Step 1: Route directive to Strategist
    const routeResult = await this.routeToStrategist(directive);
    if (!routeResult.success) {
      return {
        success: false,
        transaction_id: routeResult.transaction_id,
        final_decision: null,
        cos_summary: null,
        errors: routeResult.error ? [routeResult.error] : []
      };
    }

    // Step 2: Process Strategist brief
    const briefResult = await this.processStrategistBrief(
      routeResult.transaction_id,
      strategistResponse
    );
    
    if (!briefResult.success) {
      const transaction = this.transactions.get(routeResult.transaction_id);
      return {
        success: false,
        transaction_id: routeResult.transaction_id,
        final_decision: null,
        cos_summary: null,
        errors: transaction?.errors || []
      };
    }

    // Step 3: Route to Gatekeeper
    const gatekeeperResult = await this.routeToGatekeeper(routeResult.transaction_id);

    // Step 4: Route to CoS
    const cosSummary = await this.routeToCoS(routeResult.transaction_id);

    const transaction = this.transactions.get(routeResult.transaction_id);

    return {
      success: true,
      transaction_id: routeResult.transaction_id,
      final_decision: gatekeeperResult.decision,
      cos_summary: cosSummary,
      errors: transaction?.errors || []
    };
  }

  // --------------------------------------------------------------------------
  // ERROR HANDLING
  // --------------------------------------------------------------------------

  classifyError(error: Error | string): ProtocolError {
    const errorMessage = error instanceof Error ? error.message : error;
    
    // Check for transient errors
    for (const code of TRANSIENT_ERROR_CODES) {
      if (errorMessage.toUpperCase().includes(code.replace('_', ' ')) ||
          errorMessage.toUpperCase().includes(code)) {
        return {
          type: 'TRANSIENT',
          code,
          message: errorMessage,
          timestamp: new Date().toISOString(),
          retryable: true,
          attempts: 0
        };
      }
    }

    // Check for permanent errors
    for (const code of PERMANENT_ERROR_CODES) {
      if (errorMessage.toUpperCase().includes(code.replace('_', ' '))) {
        return {
          type: 'PERMANENT',
          code,
          message: errorMessage,
          timestamp: new Date().toISOString(),
          retryable: false
        };
      }
    }

    // Default to permanent
    return {
      type: 'PERMANENT',
      code: 'UNKNOWN_ERROR',
      message: errorMessage,
      timestamp: new Date().toISOString(),
      retryable: false
    };
  }

  async handleTransientError<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<{ success: boolean; result?: T; error?: ProtocolError }> {
    let attempts = 0;
    
    while (attempts < RETRY_CONFIG.max_attempts) {
      try {
        const result = await operation();
        return { success: true, result };
      } catch (err) {
        attempts++;
        const error = this.classifyError(err as Error);
        
        if (error.type === 'PERMANENT' || attempts >= RETRY_CONFIG.max_attempts) {
          this.logEvent('OPERATION_FAILED', {
            operation: operationName,
            error: error.code,
            attempts,
            final: true
          });
          return { success: false, error };
        }

        this.logEvent('TRANSIENT_ERROR_RETRY', {
          operation: operationName,
          error: error.code,
          attempt: attempts,
          backoff_ms: RETRY_CONFIG.backoff_ms * attempts
        });

        await new Promise(resolve => 
          setTimeout(resolve, RETRY_CONFIG.backoff_ms * attempts)
        );
      }
    }

    return {
      success: false,
      error: {
        type: 'PERMANENT',
        code: 'MAX_RETRIES_EXCEEDED',
        message: `Operation ${operationName} failed after ${RETRY_CONFIG.max_attempts} attempts`,
        timestamp: new Date().toISOString(),
        retryable: false
      }
    };
  }

  // --------------------------------------------------------------------------
  // VALIDATION
  // --------------------------------------------------------------------------

  private validateBriefSchema(brief: StrategistDiagnosticBrief): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!brief.brief_id) {
      errors.push('Missing brief_id');
    }
    if (!brief.source_directive_id) {
      errors.push('Missing source_directive_id');
    }
    if (!brief.root_cause_class) {
      errors.push('Missing root_cause_class');
    }
    if (!brief.single_recommended_action || brief.single_recommended_action.trim() === '') {
      errors.push('Empty or missing single_recommended_action');
    }
    if (typeof brief.confidence_score !== 'number' || 
        brief.confidence_score < 0 || 
        brief.confidence_score > 1) {
      errors.push('Invalid confidence_score (must be 0-1)');
    }
    if (!brief.l6_pressure_signal || 
        !['LOW', 'MEDIUM', 'HIGH'].includes(brief.l6_pressure_signal)) {
      errors.push('Invalid l6_pressure_signal');
    }
    if (!brief.projected_impact) {
      errors.push('Missing projected_impact');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  private checkGovernanceCompliance(
    brief: StrategistDiagnosticBrief,
    directive: ArchitectDirectivePacket
  ): { compliant: boolean; violations: string[] } {
    const violations: string[] = [];
    const action = brief.single_recommended_action.toLowerCase();

    // VQS Protection
    if (directive.constraints.vqs_locked) {
      if (action.includes('change vqs') || 
          action.includes('modify vqs') ||
          action.includes('update methodology')) {
        violations.push('VQS_PROTECTION: Attempted VQS/methodology change while locked');
      }
    }

    // Positioning Lock
    if (directive.constraints.no_positioning_change) {
      if (action.includes('reposition') || 
          action.includes('change positioning') ||
          action.includes('messaging rewrite')) {
        violations.push('POSITIONING_LOCK: Attempted positioning/messaging change while locked');
      }
    }

    // Offer Ladder Lock
    if (directive.constraints.no_offer_ladder_mutation) {
      if (action.includes('change tier') || 
          action.includes('restructure offer') ||
          action.includes('modify ladder')) {
        violations.push('OFFER_LADDER_LOCK: Attempted offer ladder mutation while locked');
      }
    }

    // L6 Lock
    if (!directive.constraints.l6_behavior_allowed) {
      if (action.includes('l6 activation') || 
          action.includes('enable l6') ||
          action.includes('structural l6')) {
        violations.push('L6_LOCK: Attempted L6 structural mutation while prohibited');
      }
    }

    return {
      compliant: violations.length === 0,
      violations
    };
  }

  // --------------------------------------------------------------------------
  // LOGGING
  // --------------------------------------------------------------------------

  private logEvent(event: string, data: Record<string, any>): void {
    const entry = {
      timestamp: new Date().toISOString(),
      event,
      data
    };

    this.logs.push(entry);

    // Keep only last 500 entries
    if (this.logs.length > 500) {
      this.logs = this.logs.slice(-500);
    }
  }

  private writeToSystemLog(category: string, data: Record<string, any>): void {
    const logLine = `[${new Date().toISOString()}] [${MODULE_NAME}] [${category}] ${JSON.stringify(data)}`;
    
    try {
      const logPath = path.resolve(process.cwd(), 'logs/system.log');
      fs.appendFileSync(logPath, logLine + '\n');
    } catch {
      console.log(logLine);
    }
  }

  // --------------------------------------------------------------------------
  // STATUS & QUERIES
  // --------------------------------------------------------------------------

  getProtocolStatus(): {
    module: string;
    version: string;
    governance_constraints: typeof GOVERNANCE_CONSTRAINTS;
    transactions: {
      total: number;
      pending: number;
      completed: number;
      failed: number;
    };
    retry_config: typeof RETRY_CONFIG;
  } {
    const transactions = Array.from(this.transactions.values());
    
    return {
      module: MODULE_NAME,
      version: PROTOCOL_VERSION,
      governance_constraints: GOVERNANCE_CONSTRAINTS,
      transactions: {
        total: transactions.length,
        pending: transactions.filter(t => t.status === 'PENDING').length,
        completed: transactions.filter(t => t.status === 'COS_ENFORCED').length,
        failed: transactions.filter(t => t.status === 'FAILED').length
      },
      retry_config: RETRY_CONFIG
    };
  }

  getTransaction(transaction_id: string): ProtocolTransaction | undefined {
    return this.transactions.get(transaction_id);
  }

  getRecentTransactions(limit: number = 10): ProtocolTransaction[] {
    return Array.from(this.transactions.values())
      .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())
      .slice(0, limit);
  }

  getTransactionsByStatus(status: ProtocolTransaction['status']): ProtocolTransaction[] {
    return Array.from(this.transactions.values())
      .filter(t => t.status === status);
  }

  getRecentLogs(limit: number = 50): typeof this.logs {
    return this.logs.slice(-limit);
  }

  // --------------------------------------------------------------------------
  // SIMULATION (for testing without Gemini API)
  // --------------------------------------------------------------------------

  simulateStrategistResponse(directive: ArchitectDirectivePacket): StrategistDiagnosticBrief {
    // Generate simulated response based on directive intent
    const rootCauseMap: Record<DirectiveIntent, RootCauseClass> = {
      'DIAGNOSTIC': 'RPM_CONFIDENCE',
      'RECOVERY': 'REVENUE_STABILITY',
      'FORECAST': 'OFFER_LADDER_PREDICTABILITY',
      'STRATEGIC_ANALYSIS': 'OBJECTION_DRIFT'
    };

    const actionMap: Record<DirectiveIntent, string> = {
      'DIAGNOSTIC': 'Increase stakeholder packet frequency to restore RPM confidence',
      'RECOVERY': 'Execute micro-offer backlog to stabilize revenue pipeline',
      'FORECAST': 'Analyze offer ladder conversion rates for next quarter projections',
      'STRATEGIC_ANALYSIS': 'Update objection intelligence archive with recent patterns'
    };

    return {
      brief_id: `BRIEF-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      source_directive_id: directive.directive_id,
      root_cause_class: rootCauseMap[directive.intent],
      single_recommended_action: actionMap[directive.intent],
      projected_impact: {
        rpm_confidence_delta: 0.05 + Math.random() * 0.1,
        revenue_delta: 1000 + Math.random() * 4000,
        risk_notes: 'Standard execution risk within L5 operational bounds'
      },
      confidence_score: 0.7 + Math.random() * 0.25,
      l6_pressure_signal: 'LOW',
      created_at: new Date().toISOString()
    };
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const architectStrategistCommProtocol = new ArchitectStrategistCommProtocol();
