const SYSTEM_NARRATIVE = {
  core: "Compliance is no longer overhead. Compliance is a measurable business asset.",
  hook: "Why Validation Teams Are Abandoning Traditional CSV",
  positioning: "We sell clarity in compliance, not just dashboards.",
  outcomes: ["Time Reclaimed", "Proof of ROI", "Professional Equity"],
  customerJourney: {
    step1: "Get a free tool (Compliance Velocity Scorecard)",
    step2: "Join the paid platform (Core Intelligence Platform)",
    step3: "Let agents run core compliance + revenue insights"
  },
  forbiddenTerms: [
    "cheap", "discount", "basic", "simple", "easy",
    "guarantee", "promise", "100%", "never fail"
  ],
  requiredReinforcement: [
    "compliance as asset",
    "measurable ROI",
    "validation teams",
    "clarity",
    "velocity"
  ]
};

export interface ConfidenceScore {
  overall: number;
  breakdown: {
    dataQuality: number;
    sourceReliability: number;
    recency: number;
    consistency: number;
  };
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  citations: string[];
}

export interface NarrativeCompliance {
  compliant: boolean;
  score: number;
  violations: string[];
  reinforcements: string[];
  suggestions: string[];
}

class NarrativeEnforcer {
  getNarrative() {
    return SYSTEM_NARRATIVE;
  }

  calculateConfidenceScore(
    data: any,
    sources: string[] = [],
    lastUpdated?: string
  ): ConfidenceScore {
    let dataQuality = 0;
    let sourceReliability = 0;
    let recency = 0;
    let consistency = 0;

    if (data && Object.keys(data).length > 0) {
      dataQuality = 70;
      if (typeof data === 'object') {
        const fields = Object.keys(data).length;
        dataQuality = Math.min(100, 50 + fields * 5);
      }
    }

    if (sources.length > 0) {
      sourceReliability = Math.min(100, 40 + sources.length * 20);
      const reliableSources = sources.filter(s => 
        s.includes('FDA') || s.includes('EMA') || s.includes('official') || 
        s.includes('industry') || s.includes('research')
      );
      if (reliableSources.length > 0) {
        sourceReliability = Math.min(100, sourceReliability + 20);
      }
    } else {
      sourceReliability = 50;
    }

    if (lastUpdated) {
      const lastUpdate = new Date(lastUpdated);
      const now = new Date();
      const daysSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysSinceUpdate < 1) recency = 100;
      else if (daysSinceUpdate < 7) recency = 90;
      else if (daysSinceUpdate < 30) recency = 70;
      else if (daysSinceUpdate < 90) recency = 50;
      else recency = 30;
    } else {
      recency = 60;
    }

    consistency = 75;

    const overall = Math.round(
      (dataQuality * 0.3) + 
      (sourceReliability * 0.25) + 
      (recency * 0.25) + 
      (consistency * 0.2)
    );

    let grade: 'A' | 'B' | 'C' | 'D' | 'F';
    if (overall >= 90) grade = 'A';
    else if (overall >= 80) grade = 'B';
    else if (overall >= 70) grade = 'C';
    else if (overall >= 60) grade = 'D';
    else grade = 'F';

    return {
      overall,
      breakdown: { dataQuality, sourceReliability, recency, consistency },
      grade,
      citations: sources.length > 0 ? sources : ['LLM knowledge base', 'Industry analysis']
    };
  }

  checkNarrativeCompliance(content: string): NarrativeCompliance {
    const violations: string[] = [];
    const reinforcements: string[] = [];
    const suggestions: string[] = [];
    
    const lowerContent = content.toLowerCase();

    for (const term of SYSTEM_NARRATIVE.forbiddenTerms) {
      if (lowerContent.includes(term.toLowerCase())) {
        violations.push(`Contains forbidden term: "${term}"`);
      }
    }

    for (const phrase of SYSTEM_NARRATIVE.requiredReinforcement) {
      if (lowerContent.includes(phrase.toLowerCase())) {
        reinforcements.push(`Reinforces: "${phrase}"`);
      }
    }

    if (!lowerContent.includes('compliance')) {
      suggestions.push('Consider mentioning "compliance" to reinforce core positioning');
    }
    if (!lowerContent.includes('asset') && !lowerContent.includes('value')) {
      suggestions.push('Consider framing compliance as an "asset" or "value driver"');
    }
    if (!lowerContent.includes('validation') && !lowerContent.includes('csv')) {
      suggestions.push('Consider referencing "validation teams" or "CSV" to stay on narrative');
    }

    const baseScore = 100;
    const violationPenalty = violations.length * 15;
    const reinforcementBonus = reinforcements.length * 10;
    const score = Math.max(0, Math.min(100, baseScore - violationPenalty + reinforcementBonus));

    return {
      compliant: violations.length === 0 && score >= 70,
      score,
      violations,
      reinforcements,
      suggestions
    };
  }

  enforceNarrative(agentOutput: string): string {
    let enforcedOutput = agentOutput;

    for (const term of SYSTEM_NARRATIVE.forbiddenTerms) {
      const regex = new RegExp(term, 'gi');
      if (term === 'cheap') enforcedOutput = enforcedOutput.replace(regex, 'cost-effective');
      if (term === 'discount') enforcedOutput = enforcedOutput.replace(regex, 'value offer');
      if (term === 'basic') enforcedOutput = enforcedOutput.replace(regex, 'foundational');
      if (term === 'simple') enforcedOutput = enforcedOutput.replace(regex, 'streamlined');
      if (term === 'guarantee') enforcedOutput = enforcedOutput.replace(regex, 'commitment');
    }

    return enforcedOutput;
  }

  generateNarrativeWrapper(): string {
    return `
CORE NARRATIVE (ENFORCE IN ALL OUTPUTS):
"${SYSTEM_NARRATIVE.core}"

HOOK: "${SYSTEM_NARRATIVE.hook}"

THREE OUTCOMES WE SELL:
1. ${SYSTEM_NARRATIVE.outcomes[0]} - Less friction, faster completion
2. ${SYSTEM_NARRATIVE.outcomes[1]} - Compliance impact tied to financial value
3. ${SYSTEM_NARRATIVE.outcomes[2]} - Users gain credibility and influence

CUSTOMER JOURNEY:
Step 1: ${SYSTEM_NARRATIVE.customerJourney.step1}
Step 2: ${SYSTEM_NARRATIVE.customerJourney.step2}
Step 3: ${SYSTEM_NARRATIVE.customerJourney.step3}

FORBIDDEN TERMS: ${SYSTEM_NARRATIVE.forbiddenTerms.join(', ')}
`;
  }

  getAgentNarrativeBrief(agent: string): string {
    const roleNarratives: Record<string, string> = {
      cos: `Chief of Staff: Ensure all agent outputs reinforce "${SYSTEM_NARRATIVE.core}". You are the meta-orchestrator ensuring narrative consistency.`,
      strategist: `Strategist: All strategic recommendations must tie back to the three outcomes: ${SYSTEM_NARRATIVE.outcomes.join(', ')}. Focus on $5M valuation path.`,
      cmo: `CMO: All marketing content must use the hook "${SYSTEM_NARRATIVE.hook}" and position compliance as a measurable business asset, not overhead.`,
      cro: `CRO: Revenue conversations must emphasize ROI and Professional Equity. Never discount - frame as value tiers (Clarity/Velocity/Asset).`,
      contentManager: `Content Manager: Every piece of content must reinforce the core narrative. No content goes out without narrative compliance check.`
    };

    return roleNarratives[agent] || `Agent: Reinforce the core narrative: "${SYSTEM_NARRATIVE.core}"`;
  }
}

export const narrativeEnforcer = new NarrativeEnforcer();
