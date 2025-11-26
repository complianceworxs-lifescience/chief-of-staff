export type MethodologyType = 
  | 'dunford_positioning'
  | 'walker_narrative'
  | 'kern_category_creation'
  | 'vqs_framework'
  | 'offer_ladder'
  | 'content_archetypes';

export interface MethodologyChange {
  changeId: string;
  methodologyType: MethodologyType;
  changeType: 'enhancement' | 'modification' | 'extension' | 'replacement';
  proposedBy: string;
  experimentId: string | null;
  description: string;
  currentState: any;
  proposedState: any;
  impactAssessment: MethodologyImpactAssessment;
  status: 'proposed' | 'under_review' | 'approved' | 'rejected' | 'applied';
  createdAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  reviewNotes: string | null;
}

export interface MethodologyImpactAssessment {
  vqsRisk: 'none' | 'low' | 'medium' | 'high' | 'critical';
  trustImpact: 'positive' | 'neutral' | 'negative' | 'unknown';
  revenueImpact: 'positive' | 'neutral' | 'negative' | 'unknown';
  auditRisk: 'none' | 'low' | 'medium' | 'high';
  conservativenessScore: number;
  saferThanCurrent: boolean;
  regulatoryCompliance: boolean;
  validatedWithData: boolean;
}

export interface MethodologyLock {
  methodologyType: MethodologyType;
  isLocked: boolean;
  lockedAt: string;
  lockedBy: string;
  lockReason: string;
  currentVersion: string;
  changeHistory: MethodologyChange[];
  protectionLevel: 'standard' | 'elevated' | 'maximum';
}

interface MethodologyLockConfig {
  requireStrategistSimulation: boolean;
  requireRegulatoryValidation: boolean;
  requireConservativenessProof: boolean;
  minConservativenessScore: number;
  maxVqsRisk: MethodologyImpactAssessment['vqsRisk'];
  allowedChangeTypes: MethodologyChange['changeType'][];
}

class L6MethodologyLockService {
  private config: MethodologyLockConfig = {
    requireStrategistSimulation: true,
    requireRegulatoryValidation: true,
    requireConservativenessProof: true,
    minConservativenessScore: 70,
    maxVqsRisk: 'low',
    allowedChangeTypes: ['enhancement', 'extension']
  };

  private locks: Map<MethodologyType, MethodologyLock> = new Map();
  private pendingChanges: MethodologyChange[] = [];
  private changeHistory: MethodologyChange[] = [];

  constructor() {
    this.initializeLocks();
  }

  private initializeLocks(): void {
    const methodologies: MethodologyType[] = [
      'dunford_positioning',
      'walker_narrative',
      'kern_category_creation',
      'vqs_framework',
      'offer_ladder',
      'content_archetypes'
    ];

    const now = new Date().toISOString();

    for (const methodology of methodologies) {
      this.locks.set(methodology, {
        methodologyType: methodology,
        isLocked: true,
        lockedAt: now,
        lockedBy: 'L6 Transition Package',
        lockReason: 'VQS Protection - L5 methodology preservation',
        currentVersion: '1.0',
        changeHistory: [],
        protectionLevel: methodology === 'vqs_framework' ? 'maximum' : 'elevated'
      });
    }
  }

  public activate(): { success: boolean; message: string } {
    console.log('🔒 METHODOLOGY LOCK ACTIVATED');
    console.log('   VQS Framework: MAXIMUM protection');
    console.log('   Dunford/Walker/Kern: ELEVATED protection');
    console.log('   Offer Ladder: ELEVATED protection');
    console.log('   Content Archetypes: ELEVATED protection');
    console.log('   Changes require: Simulation + Regulatory validation + Conservativeness proof');

    return {
      success: true,
      message: 'Methodology Lock activated. All core methodologies protected.'
    };
  }

  public proposeChange(params: {
    methodologyType: MethodologyType;
    changeType: MethodologyChange['changeType'];
    proposedBy: string;
    experimentId?: string;
    description: string;
    currentState: any;
    proposedState: any;
    impactAssessment: MethodologyImpactAssessment;
  }): { success: boolean; change?: MethodologyChange; message: string } {
    const lock = this.locks.get(params.methodologyType);
    
    if (!lock) {
      return { success: false, message: 'Unknown methodology type' };
    }

    if (!this.config.allowedChangeTypes.includes(params.changeType)) {
      return { 
        success: false, 
        message: `Change type '${params.changeType}' not allowed. Only ${this.config.allowedChangeTypes.join(', ')} permitted.` 
      };
    }

    const impact = params.impactAssessment;

    if (!this.isVqsRiskAcceptable(impact.vqsRisk)) {
      return { 
        success: false, 
        message: `VQS risk '${impact.vqsRisk}' exceeds maximum allowed '${this.config.maxVqsRisk}'` 
      };
    }

    if (impact.conservativenessScore < this.config.minConservativenessScore) {
      return { 
        success: false, 
        message: `Conservativeness score ${impact.conservativenessScore} below minimum ${this.config.minConservativenessScore}` 
      };
    }

    if (!impact.saferThanCurrent) {
      return { 
        success: false, 
        message: 'Proposed change must be safer or more conservative than current state' 
      };
    }

    if (this.config.requireRegulatoryValidation && !impact.regulatoryCompliance) {
      return { 
        success: false, 
        message: 'Regulatory compliance validation required but not provided' 
      };
    }

    if (this.config.requireStrategistSimulation && !impact.validatedWithData) {
      return { 
        success: false, 
        message: 'Strategist simulation validation required but not provided' 
      };
    }

    const change: MethodologyChange = {
      changeId: `meth_change_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      methodologyType: params.methodologyType,
      changeType: params.changeType,
      proposedBy: params.proposedBy,
      experimentId: params.experimentId || null,
      description: params.description,
      currentState: params.currentState,
      proposedState: params.proposedState,
      impactAssessment: impact,
      status: 'proposed',
      createdAt: new Date().toISOString(),
      reviewedAt: null,
      reviewedBy: null,
      reviewNotes: null
    };

    this.pendingChanges.push(change);

    console.log(`📋 METHODOLOGY CHANGE PROPOSED: ${params.methodologyType}`);
    console.log(`   Type: ${params.changeType}`);
    console.log(`   Proposed by: ${params.proposedBy}`);
    console.log(`   VQS Risk: ${impact.vqsRisk}`);
    console.log(`   Conservativeness: ${impact.conservativenessScore}%`);

    return { 
      success: true, 
      change, 
      message: 'Methodology change proposed. Awaiting Strategist review.' 
    };
  }

  private isVqsRiskAcceptable(risk: MethodologyImpactAssessment['vqsRisk']): boolean {
    const riskLevels: MethodologyImpactAssessment['vqsRisk'][] = ['none', 'low', 'medium', 'high', 'critical'];
    const proposedIndex = riskLevels.indexOf(risk);
    const maxIndex = riskLevels.indexOf(this.config.maxVqsRisk);
    return proposedIndex <= maxIndex;
  }

  public reviewChange(
    changeId: string,
    reviewedBy: string,
    approved: boolean,
    notes: string
  ): { success: boolean; message: string } {
    const change = this.pendingChanges.find(c => c.changeId === changeId);
    
    if (!change) {
      return { success: false, message: 'Change not found' };
    }

    if (change.status !== 'proposed') {
      return { success: false, message: `Cannot review: change is ${change.status}` };
    }

    change.status = approved ? 'approved' : 'rejected';
    change.reviewedAt = new Date().toISOString();
    change.reviewedBy = reviewedBy;
    change.reviewNotes = notes;

    if (approved) {
      console.log(`✅ METHODOLOGY CHANGE APPROVED: ${change.methodologyType}`);
      console.log(`   Reviewed by: ${reviewedBy}`);
      console.log(`   Notes: ${notes}`);
    } else {
      console.log(`❌ METHODOLOGY CHANGE REJECTED: ${change.methodologyType}`);
      console.log(`   Reviewed by: ${reviewedBy}`);
      console.log(`   Reason: ${notes}`);
    }

    return { 
      success: true, 
      message: approved ? 'Change approved. Ready for application.' : 'Change rejected.' 
    };
  }

  public applyChange(changeId: string, appliedBy: string): { success: boolean; message: string } {
    const change = this.pendingChanges.find(c => c.changeId === changeId);
    
    if (!change) {
      return { success: false, message: 'Change not found' };
    }

    if (change.status !== 'approved') {
      return { success: false, message: 'Change must be approved before application' };
    }

    change.status = 'applied';

    const pendingIndex = this.pendingChanges.findIndex(c => c.changeId === changeId);
    if (pendingIndex >= 0) {
      this.pendingChanges.splice(pendingIndex, 1);
    }

    this.changeHistory.push(change);

    const lock = this.locks.get(change.methodologyType);
    if (lock) {
      lock.changeHistory.push(change);
      const versionParts = lock.currentVersion.split('.').map(Number);
      versionParts[1] = (versionParts[1] || 0) + 1;
      lock.currentVersion = versionParts.join('.');
    }

    console.log(`🔄 METHODOLOGY CHANGE APPLIED: ${change.methodologyType}`);
    console.log(`   Applied by: ${appliedBy}`);
    console.log(`   New version: ${lock?.currentVersion}`);

    return { success: true, message: 'Methodology change applied successfully' };
  }

  public getLock(methodologyType: MethodologyType): MethodologyLock | null {
    return this.locks.get(methodologyType) || null;
  }

  public getAllLocks(): MethodologyLock[] {
    return Array.from(this.locks.values());
  }

  public getPendingChanges(): MethodologyChange[] {
    return [...this.pendingChanges];
  }

  public getChangeHistory(methodologyType?: MethodologyType): MethodologyChange[] {
    if (methodologyType) {
      return this.changeHistory.filter(c => c.methodologyType === methodologyType);
    }
    return [...this.changeHistory];
  }

  public setProtectionLevel(
    methodologyType: MethodologyType,
    level: MethodologyLock['protectionLevel'],
    setBy: string
  ): { success: boolean; message: string } {
    const lock = this.locks.get(methodologyType);
    
    if (!lock) {
      return { success: false, message: 'Methodology not found' };
    }

    if (methodologyType === 'vqs_framework' && level !== 'maximum') {
      return { 
        success: false, 
        message: 'VQS Framework must maintain maximum protection level' 
      };
    }

    lock.protectionLevel = level;

    console.log(`🔐 PROTECTION LEVEL CHANGED: ${methodologyType}`);
    console.log(`   New level: ${level}`);
    console.log(`   Set by: ${setBy}`);

    return { success: true, message: `Protection level set to ${level}` };
  }

  public getStatus(): {
    lockedMethodologies: number;
    totalMethodologies: number;
    pendingChanges: number;
    appliedChanges: number;
    protectionLevels: Record<MethodologyType, MethodologyLock['protectionLevel']>;
    config: MethodologyLockConfig;
  } {
    const protectionLevels: Record<string, MethodologyLock['protectionLevel']> = {};
    
    Array.from(this.locks.entries()).forEach(([type, lock]) => {
      protectionLevels[type] = lock.protectionLevel;
    });

    return {
      lockedMethodologies: this.locks.size,
      totalMethodologies: this.locks.size,
      pendingChanges: this.pendingChanges.length,
      appliedChanges: this.changeHistory.length,
      protectionLevels: protectionLevels as Record<MethodologyType, MethodologyLock['protectionLevel']>,
      config: this.config
    };
  }

  public validateMethodologyIntegrity(): {
    valid: boolean;
    issues: string[];
    methodologies: Array<{ type: MethodologyType; version: string; protected: boolean }>;
  } {
    const issues: string[] = [];
    const methodologies: Array<{ type: MethodologyType; version: string; protected: boolean }> = [];

    Array.from(this.locks.entries()).forEach(([type, lock]) => {
      methodologies.push({
        type,
        version: lock.currentVersion,
        protected: lock.isLocked
      });

      if (!lock.isLocked) {
        issues.push(`${type} is not locked`);
      }

      if (type === 'vqs_framework' && lock.protectionLevel !== 'maximum') {
        issues.push('VQS Framework not at maximum protection');
      }
    });

    return {
      valid: issues.length === 0,
      issues,
      methodologies
    };
  }
}

export const l6MethodologyLock = new L6MethodologyLockService();
