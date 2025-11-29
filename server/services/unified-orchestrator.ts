import { revenueScoreboard } from './revenue-scoreboard';
import { narrativeEnforcer } from './narrative-enforcer';
import { researchMandate } from './research-mandate';

const CORE_CYCLE_INTERVAL = 2 * 60 * 60 * 1000; // 2 hours - core cycle
const RESEARCH_CYCLE_INTERVAL = 7 * 24 * 60 * 60 * 1000; // Weekly - research refresh

interface OrchestrationState {
  lastCoreCycle: Date | null;
  lastResearchCycle: Date | null;
  cycleCount: number;
  healthScore: number;
  agentStatus: Record<string, 'active' | 'idle' | 'error'>;
}

class UnifiedOrchestrator {
  private state: OrchestrationState = {
    lastCoreCycle: null,
    lastResearchCycle: null,
    cycleCount: 0,
    healthScore: 0,
    agentStatus: {
      cos: 'active',
      strategist: 'active',
      cmo: 'active',
      cro: 'active',
      contentManager: 'active'
    }
  };

  private coreCycleTimer: NodeJS.Timeout | null = null;
  private researchCycleTimer: NodeJS.Timeout | null = null;

  async runCoreCycle(): Promise<{
    cycleId: string;
    actions: string[];
    scoreboardHealth: number;
    narrativeCompliance: number;
  }> {
    const cycleId = `CYCLE-${Date.now()}`;
    const actions: string[] = [];

    console.log(`\n🔄 UNIFIED ORCHESTRATOR: Starting Core Cycle ${cycleId}`);
    console.log(`   📢 Narrative: "${narrativeEnforcer.getNarrative().core}"`);

    // Step 1: Sync Revenue Scoreboard
    try {
      await revenueScoreboard.syncResearchInsights();
      actions.push('Revenue scoreboard synced');
    } catch (error) {
      console.error('   ❌ Scoreboard sync failed:', error);
    }

    // Step 2: Calculate Health Score
    const health = await revenueScoreboard.calculateHealthScore();
    this.state.healthScore = health.score;
    actions.push(`Health score: ${health.score}%`);

    // Step 3: Check Narrative Compliance
    const scoreboard = await revenueScoreboard.getScoreboard();
    const narrativeCheck = narrativeEnforcer.checkNarrativeCompliance(
      JSON.stringify(scoreboard.researchInsights)
    );
    actions.push(`Narrative compliance: ${narrativeCheck.score}%`);

    // Step 4: Log cycle completion
    this.state.lastCoreCycle = new Date();
    this.state.cycleCount++;

    console.log(`✅ UNIFIED ORCHESTRATOR: Cycle ${cycleId} complete`);
    console.log(`   📊 Health: ${health.score}% | Narrative: ${narrativeCheck.score}%`);
    console.log(`   🔁 Total cycles: ${this.state.cycleCount}`);

    return {
      cycleId,
      actions,
      scoreboardHealth: health.score,
      narrativeCompliance: narrativeCheck.score
    };
  }

  async runResearchCycle(): Promise<{
    status: string;
    questionsCompleted: number;
    insights: any;
  }> {
    console.log('\n🔬 UNIFIED ORCHESTRATOR: Starting Research Cycle');
    console.log(`   📢 Reinforcing: "${narrativeEnforcer.getNarrative().hook}"`);

    try {
      const result = await researchMandate.executeAllQuestions();
      this.state.lastResearchCycle = new Date();

      const completed = result.questions.filter(q => q.status === 'completed').length;

      console.log(`✅ UNIFIED ORCHESTRATOR: Research Cycle complete`);
      console.log(`   📊 Questions: ${completed}/${result.questions.length}`);

      return {
        status: result.overallStatus,
        questionsCompleted: completed,
        insights: result.synthesizedInsights
      };
    } catch (error) {
      console.error('❌ UNIFIED ORCHESTRATOR: Research Cycle failed:', error);
      return {
        status: 'error',
        questionsCompleted: 0,
        insights: null
      };
    }
  }

  start(): void {
    console.log('\n╔══════════════════════════════════════════════════════════════════╗');
    console.log('║          UNIFIED ORCHESTRATOR v1.0 STARTING                      ║');
    console.log('╚══════════════════════════════════════════════════════════════════╝');
    console.log(`   📢 Core Narrative: "${narrativeEnforcer.getNarrative().core}"`);
    console.log(`   🔁 Core Cycle: Every ${CORE_CYCLE_INTERVAL / (60 * 60 * 1000)} hours`);
    console.log(`   🔬 Research Cycle: Weekly`);
    console.log('   📊 Single Source of Truth: Revenue Scoreboard');
    console.log('   ✅ Fewer systems. More cycles. One narrative.');

    // Run initial core cycle
    this.runCoreCycle();

    // Set up recurring core cycle
    this.coreCycleTimer = setInterval(() => {
      this.runCoreCycle();
    }, CORE_CYCLE_INTERVAL);

    // Check if research needs to run (weekly)
    const shouldRunResearch = !this.state.lastResearchCycle || 
      (Date.now() - this.state.lastResearchCycle.getTime() > RESEARCH_CYCLE_INTERVAL);

    if (shouldRunResearch) {
      this.runResearchCycle();
    }

    // Set up weekly research cycle
    this.researchCycleTimer = setInterval(() => {
      this.runResearchCycle();
    }, RESEARCH_CYCLE_INTERVAL);
  }

  stop(): void {
    if (this.coreCycleTimer) {
      clearInterval(this.coreCycleTimer);
      this.coreCycleTimer = null;
    }
    if (this.researchCycleTimer) {
      clearInterval(this.researchCycleTimer);
      this.researchCycleTimer = null;
    }
    console.log('🛑 UNIFIED ORCHESTRATOR: Stopped');
  }

  getStatus(): OrchestrationState & { narrative: any } {
    return {
      ...this.state,
      narrative: narrativeEnforcer.getNarrative()
    };
  }

  async getAgentBrief(agent: string): Promise<{
    narrative: string;
    scoreboard: any;
    confidence: any;
  }> {
    const narrativeBrief = narrativeEnforcer.getAgentNarrativeBrief(agent);
    const scoreboard = await revenueScoreboard.getAgentBrief(agent);
    const confidence = narrativeEnforcer.calculateConfidenceScore(
      scoreboard.insights,
      ['Revenue Scoreboard', 'Research Mandate'],
      new Date().toISOString()
    );

    return {
      narrative: narrativeBrief,
      scoreboard,
      confidence
    };
  }
}

export const unifiedOrchestrator = new UnifiedOrchestrator();
