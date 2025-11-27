/**
 * VQS REVENUE ACCELERATION PROTOCOL (L5-SAFE)
 * 
 * OPERATIONAL UPDATE: Revenue Acceleration within L5 constraints
 * MODE: VQS Weighted Prioritization
 * CONSTRAINT: Must operate within existing Safety Locks (no L6 autonomy, no override of VQS Integrity)
 * 
 * This is the default L5 operating mode that re-calibrates VQS weights to prioritize
 * revenue-generating activities. Revenue Prime (scoped L6) can be activated for
 * more aggressive action when needed.
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// VQS WEIGHT CONFIGURATION
// ============================================================================

export interface VQSWeights {
  value: number;      // 50% - Monetizable Value
  quality: number;    // 30% - Conversion Readiness
  speed: number;      // 20% - Time-to-Invoice
}

export const REVENUE_ACCELERATION_WEIGHTS: VQSWeights = {
  value: 0.50,    // Monetizable Value
  quality: 0.30,  // Conversion Readiness (ready to ship and invoice)
  speed: 0.20     // Time-to-Invoice (48h completion target)
};

// ============================================================================
// VALUE SCORING (50% Weight)
// ============================================================================

interface ValueScore {
  score: number;           // 0-100
  category: 'HIGH_VALUE' | 'MEDIUM_VALUE' | 'LOW_VALUE';
  monetizable: boolean;
  reasoning: string;
}

const HIGH_VALUE_KEYWORDS = [
  'paid', 'audit', 'strategy session', 'membership', 'upgrade',
  'evidence pack', 'validation report', 'premium', 'template',
  'contract', 'invoice', 'deal', 'sale', 'revenue', 'pricing',
  'proposal', 'quote', 'billable', 'client', 'enterprise',
  'pharmaceutical', 'biotech', 'medical device', 'cro', 'cmo'
];

const LOW_VALUE_KEYWORDS = [
  'free', 'support', 'exploratory', 'research', 'non-billable',
  'admin', 'internal', 'documentation', 'meeting notes', 'cleanup',
  'refactor', 'organize', 'brainstorm', 'planning'
];

function scoreValue(taskDescription: string): ValueScore {
  const desc = taskDescription.toLowerCase();
  
  let highValueMatches = 0;
  let lowValueMatches = 0;
  
  for (const keyword of HIGH_VALUE_KEYWORDS) {
    if (desc.includes(keyword)) highValueMatches++;
  }
  
  for (const keyword of LOW_VALUE_KEYWORDS) {
    if (desc.includes(keyword)) lowValueMatches++;
  }
  
  // Calculate base score
  let score = 50; // Neutral starting point
  
  // Adjust based on keyword matches
  score += highValueMatches * 10;
  score -= lowValueMatches * 15;
  
  // Clamp to 0-100
  score = Math.max(0, Math.min(100, score));
  
  let category: 'HIGH_VALUE' | 'MEDIUM_VALUE' | 'LOW_VALUE';
  let monetizable: boolean;
  let reasoning: string;
  
  if (score >= 70) {
    category = 'HIGH_VALUE';
    monetizable = true;
    reasoning = 'Task creates deliverable that can be sold or supports paid contract';
  } else if (score >= 40) {
    category = 'MEDIUM_VALUE';
    monetizable = score >= 50;
    reasoning = 'Task has moderate revenue potential';
  } else {
    category = 'LOW_VALUE';
    monetizable = false;
    reasoning = 'Non-billable or internal work - consider deprioritizing, automating, or batching';
  }
  
  return { score, category, monetizable, reasoning };
}

// ============================================================================
// QUALITY SCORING (30% Weight) - Conversion Readiness
// ============================================================================

interface QualityScore {
  score: number;           // 0-100
  readyToShip: boolean;
  readyToInvoice: boolean;
  reasoning: string;
}

const READY_TO_SHIP_KEYWORDS = [
  'complete', 'final', 'ready', 'finished', 'polished', 'reviewed',
  'approved', 'validated', 'signed off', 'client-ready', 'publish'
];

const NOT_READY_KEYWORDS = [
  'draft', 'wip', 'in progress', 'partial', 'incomplete', 'needs review',
  'pending', 'blocked', 'waiting', 'unclear', 'tbd'
];

function scoreQuality(taskDescription: string, completionPercentage?: number): QualityScore {
  const desc = taskDescription.toLowerCase();
  
  let readyMatches = 0;
  let notReadyMatches = 0;
  
  for (const keyword of READY_TO_SHIP_KEYWORDS) {
    if (desc.includes(keyword)) readyMatches++;
  }
  
  for (const keyword of NOT_READY_KEYWORDS) {
    if (desc.includes(keyword)) notReadyMatches++;
  }
  
  // Calculate score
  let score = completionPercentage ?? 50;
  score += readyMatches * 10;
  score -= notReadyMatches * 15;
  
  // Clamp to 0-100
  score = Math.max(0, Math.min(100, score));
  
  const readyToShip = score >= 70;
  const readyToInvoice = score >= 80;
  
  let reasoning: string;
  if (readyToInvoice) {
    reasoning = 'Ready to ship and invoice - prioritize completion';
  } else if (readyToShip) {
    reasoning = 'Close to completion - allocate resources to finish';
  } else {
    reasoning = 'Needs more work before it can be invoiced';
  }
  
  return { score, readyToShip, readyToInvoice, reasoning };
}

// ============================================================================
// SPEED SCORING (20% Weight) - Time-to-Invoice
// ============================================================================

interface SpeedScore {
  score: number;           // 0-100
  canCompleteIn48h: boolean;
  estimatedHours: number;
  reasoning: string;
}

const QUICK_TASK_KEYWORDS = [
  'quick', 'fast', 'rapid', 'immediate', 'urgent', 'today',
  'session', 'diagnostic', 'polish', 'tweak', 'update', 'fix'
];

const LONG_TASK_KEYWORDS = [
  'comprehensive', 'full', 'complete overhaul', 'from scratch',
  'major', 'rebuild', 'redesign', 'long-term', 'multi-phase'
];

function scoreSpeed(taskDescription: string, estimatedHours?: number): SpeedScore {
  const desc = taskDescription.toLowerCase();
  
  let quickMatches = 0;
  let longMatches = 0;
  
  for (const keyword of QUICK_TASK_KEYWORDS) {
    if (desc.includes(keyword)) quickMatches++;
  }
  
  for (const keyword of LONG_TASK_KEYWORDS) {
    if (desc.includes(keyword)) longMatches++;
  }
  
  // Estimate hours if not provided
  let hours = estimatedHours ?? 8; // Default to 8 hours
  
  if (quickMatches > 0 && !estimatedHours) {
    hours = Math.max(1, hours - quickMatches * 2);
  }
  if (longMatches > 0 && !estimatedHours) {
    hours = hours + longMatches * 8;
  }
  
  // 48 hours = 100 score, more hours = lower score
  let score = Math.max(0, 100 - (hours / 48) * 50);
  
  // Boost for quick tasks
  score += quickMatches * 5;
  score -= longMatches * 10;
  
  // Clamp to 0-100
  score = Math.max(0, Math.min(100, score));
  
  const canCompleteIn48h = hours <= 48;
  
  let reasoning: string;
  if (canCompleteIn48h && score >= 70) {
    reasoning = 'Short-cycle deliverable - can be completed and invoiced quickly';
  } else if (canCompleteIn48h) {
    reasoning = 'Can complete within 48h window';
  } else {
    reasoning = 'Speed is a tiebreaker, not a blocker - proceed if Value and Quality are high';
  }
  
  return { score, canCompleteIn48h, estimatedHours: hours, reasoning };
}

// ============================================================================
// BUYING INTENT SCORING (Pipeline Triage)
// ============================================================================

interface BuyingIntentScore {
  score: number;           // 0-100
  intent: 'HIGH' | 'MEDIUM' | 'LOW';
  signals: string[];
  recommendation: 'PRIORITIZE' | 'ENGAGE' | 'AUTOMATE';
}

const BUYING_INTENT_SIGNALS = {
  high: [
    'pricing', 'cost', 'budget', 'quote', 'proposal', 'contract',
    'implementation', 'timeline', 'when can we start', 'ready to',
    'purchase', 'buy', 'subscribe', 'upgrade', 'enterprise'
  ],
  medium: [
    'interested', 'demo', 'trial', 'features', 'capabilities',
    'compare', 'options', 'how does', 'tell me more', 'help with'
  ],
  low: [
    'just curious', 'browsing', 'learning', 'exploring', 'maybe later',
    'not sure', 'thinking about', 'free', 'no budget'
  ]
};

function scoreBuyingIntent(interaction: string): BuyingIntentScore {
  const text = interaction.toLowerCase();
  const signals: string[] = [];
  
  let highSignals = 0;
  let mediumSignals = 0;
  let lowSignals = 0;
  
  for (const signal of BUYING_INTENT_SIGNALS.high) {
    if (text.includes(signal)) {
      highSignals++;
      signals.push(`HIGH: "${signal}"`);
    }
  }
  
  for (const signal of BUYING_INTENT_SIGNALS.medium) {
    if (text.includes(signal)) {
      mediumSignals++;
      signals.push(`MEDIUM: "${signal}"`);
    }
  }
  
  for (const signal of BUYING_INTENT_SIGNALS.low) {
    if (text.includes(signal)) {
      lowSignals++;
      signals.push(`LOW: "${signal}"`);
    }
  }
  
  // Calculate score
  let score = 50;
  score += highSignals * 15;
  score += mediumSignals * 5;
  score -= lowSignals * 20;
  
  // Clamp to 0-100
  score = Math.max(0, Math.min(100, score));
  
  let intent: 'HIGH' | 'MEDIUM' | 'LOW';
  let recommendation: 'PRIORITIZE' | 'ENGAGE' | 'AUTOMATE';
  
  if (score >= 60) {
    intent = 'HIGH';
    recommendation = 'PRIORITIZE';
  } else if (score >= 40) {
    intent = 'MEDIUM';
    recommendation = 'ENGAGE';
  } else {
    intent = 'LOW';
    recommendation = 'AUTOMATE';
  }
  
  return { score, intent, signals, recommendation };
}

// ============================================================================
// COMPREHENSIVE VQS EVALUATION
// ============================================================================

export interface VQSEvaluation {
  taskId: string;
  taskDescription: string;
  timestamp: string;
  
  // Individual scores
  valueScore: ValueScore;
  qualityScore: QualityScore;
  speedScore: SpeedScore;
  
  // Weighted composite score
  compositeScore: number;
  
  // Decision
  priority: 'EXECUTE_NOW' | 'EXECUTE_SOON' | 'BATCH_OR_DEFER' | 'DEPRIORITIZE';
  recommendation: string;
  monetizedPath: string | null;
  
  // VQS compliance
  vqsCompliant: boolean;
}

export interface AssetPrioritization {
  assetId: string;
  name: string;
  completionPercentage: number;
  monetizationType: string;
  vqsScore: number;
  priority: number;
  recommendation: string;
}

// ============================================================================
// VQS REVENUE ACCELERATION SERVICE
// ============================================================================

class VQSRevenueAccelerationService {
  private weights: VQSWeights = REVENUE_ACCELERATION_WEIGHTS;
  private evaluations: VQSEvaluation[] = [];
  private assetPool: Map<string, AssetPrioritization> = new Map();
  private activated: boolean = true; // L5 protocol is always active by default
  
  constructor() {
    this.loadState();
  }
  
  /**
   * Evaluate a task using the VQS Revenue Acceleration weights
   */
  evaluateTask(
    taskId: string,
    taskDescription: string,
    options?: {
      completionPercentage?: number;
      estimatedHours?: number;
    }
  ): VQSEvaluation {
    const valueScore = scoreValue(taskDescription);
    const qualityScore = scoreQuality(taskDescription, options?.completionPercentage);
    const speedScore = scoreSpeed(taskDescription, options?.estimatedHours);
    
    // Calculate weighted composite score
    const compositeScore = 
      (valueScore.score * this.weights.value) +
      (qualityScore.score * this.weights.quality) +
      (speedScore.score * this.weights.speed);
    
    // Determine priority
    let priority: VQSEvaluation['priority'];
    let recommendation: string;
    let monetizedPath: string | null = null;
    
    if (compositeScore >= 75) {
      priority = 'EXECUTE_NOW';
      recommendation = 'High-value, ready-to-ship task - execute immediately';
      monetizedPath = this.generateMonetizedPath(taskDescription, valueScore);
    } else if (compositeScore >= 55) {
      priority = 'EXECUTE_SOON';
      recommendation = 'Good revenue potential - prioritize for quick completion';
      monetizedPath = this.generateMonetizedPath(taskDescription, valueScore);
    } else if (compositeScore >= 35) {
      priority = 'BATCH_OR_DEFER';
      recommendation = 'Moderate value - batch with similar tasks or defer';
      monetizedPath = null;
    } else {
      priority = 'DEPRIORITIZE';
      recommendation = 'Low revenue impact - automate, delegate, or skip';
      monetizedPath = null;
    }
    
    // Check VQS value threshold (50%)
    const vqsCompliant = valueScore.score >= 50 || priority === 'EXECUTE_NOW';
    
    const evaluation: VQSEvaluation = {
      taskId,
      taskDescription,
      timestamp: new Date().toISOString(),
      valueScore,
      qualityScore,
      speedScore,
      compositeScore,
      priority,
      recommendation,
      monetizedPath,
      vqsCompliant
    };
    
    this.evaluations.push(evaluation);
    
    // Keep only last 200 evaluations
    if (this.evaluations.length > 200) {
      this.evaluations = this.evaluations.slice(-100);
    }
    
    return evaluation;
  }
  
  /**
   * Generate a monetized path recommendation
   */
  private generateMonetizedPath(taskDescription: string, valueScore: ValueScore): string {
    const desc = taskDescription.toLowerCase();
    
    if (desc.includes('audit') || desc.includes('compliance')) {
      return 'Deploy this audit package for $X or book a paid compliance review session';
    }
    if (desc.includes('template') || desc.includes('blueprint')) {
      return 'Offer as premium template or include in membership upgrade';
    }
    if (desc.includes('report') || desc.includes('evidence')) {
      return 'Package as validation report or evidence pack for enterprise licensing';
    }
    if (desc.includes('session') || desc.includes('consultation')) {
      return 'Book a paid strategy session to implement recommendations';
    }
    if (desc.includes('agent') || desc.includes('automation')) {
      return 'Deploy this AI agent for $X/month or include in enterprise tier';
    }
    
    // Default monetization paths
    if (valueScore.category === 'HIGH_VALUE') {
      return 'Upgrade to unlock full capabilities or book a paid implementation session';
    }
    
    return 'Continue with VQS-compliant delivery and present upgrade options';
  }
  
  /**
   * Score buying intent for pipeline triage
   */
  scorePipelineIntent(interaction: string): BuyingIntentScore {
    return scoreBuyingIntent(interaction);
  }
  
  /**
   * Register an asset in the work-in-progress pool
   */
  registerAsset(
    assetId: string,
    name: string,
    completionPercentage: number,
    monetizationType: string
  ): AssetPrioritization {
    const vqsScore = this.evaluateTask(assetId, `${name} - ${monetizationType}`, {
      completionPercentage
    }).compositeScore;
    
    const asset: AssetPrioritization = {
      assetId,
      name,
      completionPercentage,
      monetizationType,
      vqsScore,
      priority: 0, // Will be calculated
      recommendation: ''
    };
    
    this.assetPool.set(assetId, asset);
    this.recalculateAssetPriorities();
    
    return this.assetPool.get(assetId)!;
  }
  
  /**
   * Get top 3 monetizable assets for 80% compute allocation
   */
  getTop3MonetizableAssets(): AssetPrioritization[] {
    this.recalculateAssetPriorities();
    
    const assets = Array.from(this.assetPool.values())
      .filter(a => a.completionPercentage >= 50) // At least 50% complete
      .sort((a, b) => {
        // Sort by VQS score first, then completion percentage
        const scoreDiff = b.vqsScore - a.vqsScore;
        if (Math.abs(scoreDiff) > 5) return scoreDiff;
        return b.completionPercentage - a.completionPercentage;
      })
      .slice(0, 3);
    
    // Mark recommendations
    assets.forEach((asset, index) => {
      asset.priority = index + 1;
      asset.recommendation = index === 0 
        ? 'TOP PRIORITY: Allocate primary compute resources (40%)'
        : index === 1
          ? 'SECONDARY: Allocate supporting resources (25%)'
          : 'TERTIARY: Allocate remaining resources (15%)';
    });
    
    return assets;
  }
  
  /**
   * Recalculate asset priorities
   */
  private recalculateAssetPriorities(): void {
    const assets = Array.from(this.assetPool.values())
      .sort((a, b) => b.vqsScore - a.vqsScore);
    
    assets.forEach((asset, index) => {
      asset.priority = index + 1;
    });
  }
  
  /**
   * Get conversion focus guidance
   */
  getConversionGuidance(context: string): {
    vqsInsight: string;
    monetizedNextStep: string;
    closingCTA: string;
  } {
    const intent = this.scorePipelineIntent(context);
    
    let vqsInsight: string;
    let monetizedNextStep: string;
    let closingCTA: string;
    
    if (intent.intent === 'HIGH') {
      vqsInsight = 'High buying intent detected - fast-track to revenue conversion';
      monetizedNextStep = 'Present premium options and pricing immediately';
      closingCTA = 'Ready to proceed? Deploy this solution now for [PRICE] or book a paid implementation session.';
    } else if (intent.intent === 'MEDIUM') {
      vqsInsight = 'Moderate interest - nurture toward conversion';
      monetizedNextStep = 'Demonstrate value, then present upgrade path';
      closingCTA = 'Unlock the full diagnostic pack with a membership upgrade, or schedule a strategy session.';
    } else {
      vqsInsight = 'Low intent - route to automation or educational content';
      monetizedNextStep = 'Provide value, plant seeds for future conversion';
      closingCTA = 'Explore our resources or join the community for ongoing insights.';
    }
    
    return { vqsInsight, monetizedNextStep, closingCTA };
  }
  
  /**
   * Get current protocol status
   */
  getStatus(): {
    activated: boolean;
    mode: string;
    weights: VQSWeights;
    evaluationCount: number;
    assetPoolSize: number;
    top3Assets: AssetPrioritization[];
    constraintCompliance: {
      vqsIntegrity: boolean;
      l6Prohibited: boolean;
      safetyLocksActive: boolean;
    };
  } {
    return {
      activated: this.activated,
      mode: 'VQS_WEIGHTED_PRIORITIZATION',
      weights: this.weights,
      evaluationCount: this.evaluations.length,
      assetPoolSize: this.assetPool.size,
      top3Assets: this.getTop3MonetizableAssets(),
      constraintCompliance: {
        vqsIntegrity: true,
        l6Prohibited: true,
        safetyLocksActive: true
      }
    };
  }
  
  /**
   * Get recent evaluations
   */
  getRecentEvaluations(limit: number = 20): VQSEvaluation[] {
    return this.evaluations.slice(-limit);
  }
  
  /**
   * Load state from file
   */
  private loadState(): void {
    try {
      const stateFile = path.join(process.cwd(), 'state', 'VQS_REVENUE_ACCELERATION.json');
      if (fs.existsSync(stateFile)) {
        const state = JSON.parse(fs.readFileSync(stateFile, 'utf-8'));
        this.activated = state.activated ?? true;
        
        if (state.assetPool) {
          this.assetPool = new Map(Object.entries(state.assetPool));
        }
      }
    } catch (e) {
      // Start fresh if state file doesn't exist
    }
  }
  
  /**
   * Save state to file
   */
  saveState(): void {
    try {
      const stateDir = path.join(process.cwd(), 'state');
      if (!fs.existsSync(stateDir)) {
        fs.mkdirSync(stateDir, { recursive: true });
      }
      
      const state = {
        activated: this.activated,
        mode: 'VQS_WEIGHTED_PRIORITIZATION',
        weights: this.weights,
        assetPool: Object.fromEntries(this.assetPool),
        lastUpdated: new Date().toISOString()
      };
      
      fs.writeFileSync(
        path.join(stateDir, 'VQS_REVENUE_ACCELERATION.json'),
        JSON.stringify(state, null, 2)
      );
    } catch (e) {
      console.error('Failed to save VQS Revenue Acceleration state:', e);
    }
  }
}

// Export singleton instance
export const vqsRevenueAcceleration = new VQSRevenueAccelerationService();
