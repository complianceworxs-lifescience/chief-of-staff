export interface OverrideRecord {
  id: string;
  timestamp: string;
  userId: string;
  documentId: string;
  originalRecommendation: string;
  overrideDecision: string;
  reason: string;
  category: string;
}

export interface ConfidenceAdjustment {
  category: string;
  originalConfidence: number;
  adjustedConfidence: number;
  adjustmentReason: string;
  timestamp: string;
}

export interface LearningMetrics {
  totalOverrides: number;
  overridesByCategory: Record<string, number>;
  confidenceAdjustments: ConfidenceAdjustment[];
  learningCycles: number;
  lastLearningCycle: string;
  systemStatus: "L5.5 Active & Learning" | "L5 Active" | "L4 Monitoring";
}

class RSILearningService {
  private overrides: OverrideRecord[] = [];
  private confidenceScores: Record<string, number> = {
    "design-control": 85,
    "document-control": 90,
    "capa": 88,
    "training": 92,
    "risk-management": 87,
    "complaint-handling": 89
  };
  private adjustments: ConfidenceAdjustment[] = [];
  private learningCycles = 0;
  private lastLearningCycle: string = new Date().toISOString();

  constructor() {
    this.initializeDemoData();
  }

  private initializeDemoData() {
    this.adjustments = [
      {
        category: "design-control",
        originalConfidence: 90,
        adjustedConfidence: 85,
        adjustmentReason: "Multiple user overrides indicated stricter verification requirements in FDA track",
        timestamp: new Date(Date.now() - 86400000).toISOString()
      },
      {
        category: "document-control",
        originalConfidence: 88,
        adjustedConfidence: 90,
        adjustmentReason: "User approvals aligned with AI recommendations, increasing confidence",
        timestamp: new Date(Date.now() - 172800000).toISOString()
      }
    ];
    this.learningCycles = 3;
  }

  recordOverride(
    userId: string,
    documentId: string,
    originalRecommendation: string,
    overrideDecision: string,
    reason: string,
    category: string
  ): OverrideRecord {
    const record: OverrideRecord = {
      id: `override-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId,
      documentId,
      originalRecommendation,
      overrideDecision,
      reason,
      category
    };

    this.overrides.push(record);
    console.log("[RSI] Override recorded:", record);

    this.triggerLearningCycle(category);

    return record;
  }

  private triggerLearningCycle(category: string) {
    const categoryOverrides = this.overrides.filter(o => o.category === category);
    
    if (categoryOverrides.length >= 3) {
      const currentConfidence = this.confidenceScores[category] || 85;
      const adjustment = categoryOverrides.length > 5 ? -5 : -2;
      const newConfidence = Math.max(50, Math.min(99, currentConfidence + adjustment));

      const confidenceAdjustment: ConfidenceAdjustment = {
        category,
        originalConfidence: currentConfidence,
        adjustedConfidence: newConfidence,
        adjustmentReason: `User override pattern detected: ${categoryOverrides.length} overrides in ${category}`,
        timestamp: new Date().toISOString()
      };

      this.confidenceScores[category] = newConfidence;
      this.adjustments.push(confidenceAdjustment);
      this.learningCycles++;
      this.lastLearningCycle = new Date().toISOString();

      console.log("[RSI] Learning cycle triggered:", confidenceAdjustment);
    }
  }

  getConfidenceScore(category: string): number {
    return this.confidenceScores[category] || 85;
  }

  getLearningMetrics(): LearningMetrics {
    const overridesByCategory: Record<string, number> = {};
    this.overrides.forEach(o => {
      overridesByCategory[o.category] = (overridesByCategory[o.category] || 0) + 1;
    });

    return {
      totalOverrides: this.overrides.length,
      overridesByCategory,
      confidenceAdjustments: [...this.adjustments],
      learningCycles: this.learningCycles,
      lastLearningCycle: this.lastLearningCycle,
      systemStatus: this.learningCycles > 0 ? "L5.5 Active & Learning" : "L5 Active"
    };
  }

  getOverrideHistory(): OverrideRecord[] {
    return [...this.overrides];
  }

  getRecommendationWithConfidence(category: string, baseRecommendation: string): {
    recommendation: string;
    confidence: number;
    adjustedByLearning: boolean;
  } {
    const confidence = this.getConfidenceScore(category);
    const wasAdjusted = this.adjustments.some(a => a.category === category);

    return {
      recommendation: baseRecommendation,
      confidence,
      adjustedByLearning: wasAdjusted
    };
  }
}

export const rsiLearning = new RSILearningService();
