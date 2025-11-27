/**
 * EXECUTION ORDER: ALPHA (CASH CASCADE)
 * 
 * Objective: Maximize cash velocity. Close low-friction deals immediately 
 * to fund operations while advancing enterprise contracts.
 * 
 * Phase Structure:
 * - PHASE 1: Liquidity Sprint (24h) - Quick wins
 * - PHASE 2: Urgency (48h) - Mid-tier with deadline pressure
 * - PHASE 3: Anchors (7 days) - Enterprise deals with signature blockers
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// TYPES
// ============================================================================

export interface DealTask {
  id: string;
  description: string;
  estimatedValue: number;
  phase: 1 | 2 | 3;
  priority: 'P1' | 'P2';
  status: 'PENDING' | 'IN_PROGRESS' | 'CLOSED' | 'LOST';
  tactics: string[];
  deadline: string;
  assignedTo?: string;
  signatureBlocker?: string;
  blockerRemovalTactic?: string;
  closedAt?: string;
  closedValue?: number;
}

export interface ExecutionPhase {
  phase: number;
  name: string;
  target: string;
  deals: DealTask[];
  totalValue: number;
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED';
  successMetric: string;
  startedAt?: string;
  completedAt?: string;
}

export interface ExecutionOrder {
  orderId: string;
  name: string;
  objective: string;
  initiatedAt: string;
  status: 'INITIATED' | 'ACTIVE' | 'COMPLETED';
  phases: ExecutionPhase[];
  corrections: Array<{
    dealId: string;
    from: string;
    to: string;
    reason: string;
    correctedAt: string;
  }>;
  closureReport: {
    phase1Closed: number;
    phase2Closed: number;
    phase3Closed: number;
    totalClosed: number;
    totalValue: number;
  };
}

// ============================================================================
// EXECUTION ORDER SERVICE
// ============================================================================

class ExecutionOrderAlphaService {
  private order: ExecutionOrder | null = null;
  private stateFile = path.join(process.cwd(), 'state', 'EXECUTION_ORDER_ALPHA.json');
  
  constructor() {
    this.loadState();
  }
  
  /**
   * Initialize EXECUTION ORDER: ALPHA (CASH CASCADE)
   */
  initiate(): ExecutionOrder {
    const orderId = `ALPHA_${Date.now()}`;
    const now = new Date().toISOString();
    
    // Calculate deadlines
    const phase1Deadline = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const phase2Deadline = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
    const phase3Deadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    
    this.order = {
      orderId,
      name: 'ALPHA (CASH CASCADE)',
      objective: 'Maximize cash velocity. Close low-friction deals immediately to fund operations while advancing enterprise contracts.',
      initiatedAt: now,
      status: 'INITIATED',
      phases: [
        {
          phase: 1,
          name: 'LIQUIDITY SPRINT',
          target: '24 Hours',
          status: 'ACTIVE',
          startedAt: now,
          successMetric: '$12,000 processed',
          totalValue: 12000,
          deals: [
            {
              id: 'DEAL-006',
              description: 'Membership upgrade opportunity - Premium tier conversion',
              estimatedValue: 4500,
              phase: 1,
              priority: 'P1',
              status: 'IN_PROGRESS',
              deadline: phase1Deadline,
              tactics: [
                'Issue "Buy Now" link immediately',
                'Send final invoice with scarcity messaging',
                'Use deadline: "Pricing locks at midnight"',
                'No nurturing - direct close only'
              ]
            },
            {
              id: 'DEAL-004',
              description: 'Paid strategy session - implementation planning',
              estimatedValue: 7500,
              phase: 1,
              priority: 'P1',
              status: 'IN_PROGRESS',
              deadline: phase1Deadline,
              tactics: [
                'Issue "Buy Now" link immediately',
                'Send final invoice with scarcity messaging',
                'Use deadline: "Strategy session slots filling fast"',
                'No nurturing - direct close only'
              ]
            }
          ]
        },
        {
          phase: 2,
          name: 'URGENCY',
          target: '48 Hours',
          status: 'PENDING',
          successMetric: '$22,000 closed',
          totalValue: 22000,
          deals: [
            {
              id: 'DEAL-007',
              description: 'Paid audit request from diagnostics company',
              estimatedValue: 22000,
              phase: 2,
              priority: 'P1',
              status: 'PENDING',
              deadline: phase2Deadline,
              tactics: [
                'Leverage regulatory deadline pressure',
                'Message: "Audit schedule is filling. Confirm by [Date] to secure Q4 delivery."',
                'Emphasize compliance timeline urgency',
                'Offer priority scheduling for immediate commitment'
              ]
            }
          ]
        },
        {
          phase: 3,
          name: 'THE ANCHORS',
          target: '7 Days',
          status: 'PENDING',
          successMetric: '$241,000 contracted',
          totalValue: 241000,
          deals: [
            {
              id: 'DEAL-003',
              description: 'Contract negotiation MedDevice Inc - 3yr SaaS subscription',
              estimatedValue: 156000,
              phase: 3,
              priority: 'P1',
              status: 'PENDING',
              deadline: phase3Deadline,
              signatureBlocker: 'PENDING IDENTIFICATION',
              blockerRemovalTactic: 'Map the decision chain. Identify exactly who or what is stopping the signature today.',
              tactics: [
                'Identify signature blocker (Legal? Budget? Champion absence?)',
                'Generate specific removal tactic for that blocker',
                'Escalate to executive sponsor if needed',
                'Offer contract flexibility to remove friction'
              ]
            },
            {
              id: 'DEAL-001',
              description: 'Close enterprise deal PharmaCorp - annual compliance platform contract',
              estimatedValue: 85000,
              phase: 3,
              priority: 'P1',
              status: 'PENDING',
              deadline: phase3Deadline,
              signatureBlocker: 'PENDING IDENTIFICATION',
              blockerRemovalTactic: 'Map the decision chain. Identify exactly who or what is stopping the signature today.',
              tactics: [
                'Identify signature blocker (Legal? Budget? Champion absence?)',
                'Generate specific removal tactic for that blocker',
                'Escalate to executive sponsor if needed',
                'Offer contract flexibility to remove friction'
              ]
            }
          ]
        }
      ],
      corrections: [],
      closureReport: {
        phase1Closed: 0,
        phase2Closed: 0,
        phase3Closed: 0,
        totalClosed: 0,
        totalValue: 0
      }
    };
    
    this.saveState();
    
    console.log('\n╔══════════════════════════════════════════════════════════════════════╗');
    console.log('║  🎯 EXECUTION ORDER: ALPHA (CASH CASCADE) INITIATED                  ║');
    console.log('╠══════════════════════════════════════════════════════════════════════╣');
    console.log('║  OBJECTIVE: Maximize cash velocity                                   ║');
    console.log('║  PHASE 1: Liquidity Sprint (24h) - $12,000 target                    ║');
    console.log('║  PHASE 2: Urgency (48h) - $22,000 target                             ║');
    console.log('║  PHASE 3: Anchors (7 days) - $241,000 target                         ║');
    console.log('╚══════════════════════════════════════════════════════════════════════╝\n');
    
    return this.order;
  }
  
  /**
   * Apply P2 → P1 correction for deals that should be revenue-generating
   */
  applyCorrection(dealId: string, description: string, estimatedValue: number): {
    success: boolean;
    correction?: ExecutionOrder['corrections'][0];
    deal?: DealTask;
  } {
    if (!this.order) {
      return { success: false };
    }
    
    const correction = {
      dealId,
      from: 'P2 (Paused)',
      to: 'P1 (Critical)',
      reason: 'Active proposals are revenue-generating activities',
      correctedAt: new Date().toISOString()
    };
    
    this.order.corrections.push(correction);
    
    // Add to Phase 2 or 3 based on value
    const phase = estimatedValue >= 50000 ? 3 : 2;
    const deadline = phase === 2 
      ? new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    
    const deal: DealTask = {
      id: dealId,
      description,
      estimatedValue,
      phase: phase as 1 | 2 | 3,
      priority: 'P1',
      status: 'PENDING',
      deadline,
      tactics: phase === 2 
        ? ['Finalize proposal immediately', 'Send with urgency messaging', 'Follow up within 24h']
        : ['Map decision chain', 'Identify signature blockers', 'Develop removal tactics']
    };
    
    this.order.phases[phase - 1].deals.push(deal);
    this.order.phases[phase - 1].totalValue += estimatedValue;
    
    this.saveState();
    
    console.log(`📊 CORRECTION APPLIED: ${dealId} elevated from P2 → P1 (Phase ${phase})`);
    
    return { success: true, correction, deal };
  }
  
  /**
   * Record deal closure
   */
  closeDeal(dealId: string, closedValue: number): {
    success: boolean;
    deal?: DealTask;
    phaseComplete?: boolean;
    reportDue?: boolean;
  } {
    if (!this.order) {
      return { success: false };
    }
    
    for (const phase of this.order.phases) {
      const deal = phase.deals.find(d => d.id === dealId);
      if (deal) {
        deal.status = 'CLOSED';
        deal.closedAt = new Date().toISOString();
        deal.closedValue = closedValue;
        
        // Update closure report
        if (phase.phase === 1) {
          this.order.closureReport.phase1Closed += closedValue;
        } else if (phase.phase === 2) {
          this.order.closureReport.phase2Closed += closedValue;
        } else {
          this.order.closureReport.phase3Closed += closedValue;
        }
        this.order.closureReport.totalClosed++;
        this.order.closureReport.totalValue += closedValue;
        
        // Check if phase is complete
        const allClosed = phase.deals.every(d => d.status === 'CLOSED' || d.status === 'LOST');
        if (allClosed) {
          phase.status = 'COMPLETED';
          phase.completedAt = new Date().toISOString();
          
          // Activate next phase
          const nextPhase = this.order.phases.find(p => p.phase === phase.phase + 1);
          if (nextPhase) {
            nextPhase.status = 'ACTIVE';
            nextPhase.startedAt = new Date().toISOString();
          }
        }
        
        // Check if Phase 1 is complete (requires immediate reporting)
        const phase1Complete = this.order.phases[0].status === 'COMPLETED';
        
        this.saveState();
        
        console.log(`✅ DEAL CLOSED: ${dealId} for $${closedValue.toLocaleString()}`);
        
        return {
          success: true,
          deal,
          phaseComplete: allClosed,
          reportDue: phase.phase === 1 && allClosed
        };
      }
    }
    
    return { success: false };
  }
  
  /**
   * Update signature blocker for anchor deals
   */
  updateSignatureBlocker(
    dealId: string, 
    blocker: string, 
    removalTactic: string
  ): { success: boolean; deal?: DealTask } {
    if (!this.order) {
      return { success: false };
    }
    
    for (const phase of this.order.phases) {
      const deal = phase.deals.find(d => d.id === dealId);
      if (deal) {
        deal.signatureBlocker = blocker;
        deal.blockerRemovalTactic = removalTactic;
        this.saveState();
        
        console.log(`🔍 BLOCKER IDENTIFIED for ${dealId}: ${blocker}`);
        console.log(`   Removal Tactic: ${removalTactic}`);
        
        return { success: true, deal };
      }
    }
    
    return { success: false };
  }
  
  /**
   * Get current order status
   */
  getStatus(): ExecutionOrder | null {
    return this.order;
  }
  
  /**
   * Get Phase 1 status for immediate reporting
   */
  getPhase1Report(): {
    phase: ExecutionPhase;
    closedDeals: DealTask[];
    pendingDeals: DealTask[];
    totalClosed: number;
    targetMet: boolean;
    hoursRemaining: number;
  } | null {
    if (!this.order) return null;
    
    const phase1 = this.order.phases[0];
    const closedDeals = phase1.deals.filter(d => d.status === 'CLOSED');
    const pendingDeals = phase1.deals.filter(d => d.status !== 'CLOSED' && d.status !== 'LOST');
    const totalClosed = closedDeals.reduce((sum, d) => sum + (d.closedValue || 0), 0);
    
    const deadline = new Date(phase1.deals[0]?.deadline || Date.now());
    const hoursRemaining = Math.max(0, (deadline.getTime() - Date.now()) / (1000 * 60 * 60));
    
    return {
      phase: phase1,
      closedDeals,
      pendingDeals,
      totalClosed,
      targetMet: totalClosed >= 12000,
      hoursRemaining: Math.round(hoursRemaining * 10) / 10
    };
  }
  
  /**
   * Generate tactical directives for a specific deal
   */
  getTacticalDirective(dealId: string): {
    deal: DealTask;
    urgentActions: string[];
    messaging: string;
    deadline: string;
  } | null {
    if (!this.order) return null;
    
    for (const phase of this.order.phases) {
      const deal = phase.deals.find(d => d.id === dealId);
      if (deal) {
        let messaging = '';
        
        if (phase.phase === 1) {
          messaging = `SCARCITY CLOSE: "This pricing locks at midnight. Secure your ${deal.description.includes('upgrade') ? 'upgrade' : 'session'} now with the link below."`;
        } else if (phase.phase === 2) {
          messaging = `URGENCY CLOSE: "Our audit schedule is filling up fast. Confirm by ${new Date(deal.deadline).toLocaleDateString()} to secure Q4 delivery and maintain your compliance timeline."`;
        } else {
          messaging = `ANCHOR CLOSE: Blocker identified as "${deal.signatureBlocker || 'PENDING'}". Apply removal tactic: ${deal.blockerRemovalTactic || 'Map decision chain first.'}`;
        }
        
        return {
          deal,
          urgentActions: deal.tactics,
          messaging,
          deadline: deal.deadline
        };
      }
    }
    
    return null;
  }
  
  /**
   * Get execution dashboard
   */
  getDashboard(): {
    order: ExecutionOrder | null;
    activePhase: ExecutionPhase | null;
    pipelineValue: number;
    closedValue: number;
    closureRate: number;
    phase1Report: {
      phase: ExecutionPhase;
      closedDeals: DealTask[];
      pendingDeals: DealTask[];
      totalClosed: number;
      targetMet: boolean;
      hoursRemaining: number;
    } | null;
  } {
    const activePhase = this.order?.phases.find(p => p.status === 'ACTIVE') || null;
    const pipelineValue = this.order?.phases.reduce((sum, p) => sum + p.totalValue, 0) || 0;
    const closedValue = this.order?.closureReport.totalValue || 0;
    const totalDeals = this.order?.phases.reduce((sum, p) => sum + p.deals.length, 0) || 0;
    const closedDeals = this.order?.closureReport.totalClosed || 0;
    
    return {
      order: this.order,
      activePhase,
      pipelineValue,
      closedValue,
      closureRate: totalDeals > 0 ? (closedDeals / totalDeals) * 100 : 0,
      phase1Report: this.getPhase1Report()
    };
  }
  
  /**
   * Save state to file
   */
  private saveState(): void {
    try {
      const stateDir = path.dirname(this.stateFile);
      if (!fs.existsSync(stateDir)) {
        fs.mkdirSync(stateDir, { recursive: true });
      }
      fs.writeFileSync(this.stateFile, JSON.stringify(this.order, null, 2));
    } catch (e) {
      console.error('Failed to save execution order state:', e);
    }
  }
  
  /**
   * Load state from file
   */
  private loadState(): void {
    try {
      if (fs.existsSync(this.stateFile)) {
        this.order = JSON.parse(fs.readFileSync(this.stateFile, 'utf-8'));
      }
    } catch (e) {
      // Start fresh
    }
  }
}

export const executionOrderAlpha = new ExecutionOrderAlphaService();
