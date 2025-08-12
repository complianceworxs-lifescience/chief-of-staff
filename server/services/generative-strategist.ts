import { storage } from "../storage";
import { type StrategicPlan, type InsertStrategicPlan, type Agent, type AgentCommunication } from "@shared/schema";

interface ProblemDiagnosis {
  issue: string;
  rootCauses: string[];
  affectedAgents: string[];
  severity: 'critical' | 'high' | 'medium' | 'low';
  businessImpact: string;
}

interface GeneratedSolution {
  strategy: string;
  tactics: string[];
  timeline: {
    phase: string;
    duration: string;
    activities: string[];
    responsibleAgent: string;
  }[];
  successMetrics: string[];
  resourceRequirements: {
    type: 'human' | 'financial' | 'technical';
    description: string;
    amount?: number;
  }[];
}

export class GenerativeStrategist {

  // Multi-Agent Problem Diagnosis
  async diagnoseProblem(agentData: Agent[], communications: AgentCommunication[]): Promise<ProblemDiagnosis> {
    // Analyze agent performance patterns
    const performanceIssues = this.analyzePerformancePatterns(agentData);
    
    // Analyze communication patterns for conflicts
    const communicationIssues = this.analyzeCommunicationPatterns(communications);
    
    // Correlate cross-agent data
    const crossAgentIssues = this.correlateCrossAgentData(agentData, communications);
    
    // Synthesize into comprehensive diagnosis
    return this.synthesizeDiagnosis(performanceIssues, communicationIssues, crossAgentIssues);
  }

  private analyzePerformancePatterns(agents: Agent[]): string[] {
    const issues = [];
    
    // Check for low success rates
    const lowPerformers = agents.filter(a => a.successRate < 85);
    if (lowPerformers.length > 0) {
      issues.push(`Performance decline detected in ${lowPerformers.map(a => a.name).join(', ')}`);
    }
    
    // Check for misalignment
    const misaligned = agents.filter(a => a.strategicAlignment < 80);
    if (misaligned.length > 0) {
      issues.push(`Strategic misalignment in ${misaligned.map(a => a.name).join(', ')}`);
    }
    
    // Check for status issues
    const problemAgents = agents.filter(a => a.status !== 'healthy');
    if (problemAgents.length > 0) {
      issues.push(`Operational issues in ${problemAgents.map(a => a.name).join(', ')}`);
    }
    
    return issues;
  }

  private analyzeCommunicationPatterns(communications: AgentCommunication[]): string[] {
    const issues = [];
    
    // Check for communication gaps
    const recentComms = communications.filter(c => 
      new Date(c.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    );
    
    if (recentComms.length < 10) {
      issues.push('Insufficient inter-agent communication in last 24 hours');
    }
    
    // Check for conflict patterns
    const conflicts = communications.filter(c => c.type === 'conflict');
    if (conflicts.length > 3) {
      issues.push('High frequency of inter-agent conflicts detected');
    }
    
    return issues;
  }

  private correlateCrossAgentData(agents: Agent[], communications: AgentCommunication[]): string[] {
    const correlatedIssues = [];
    
    // Example: CMO high spend + CRO low lead quality = persona mismatch
    const cmo = agents.find(a => a.id === 'cmo');
    const cro = agents.find(a => a.id === 'cro');
    
    if (cmo && cro && cmo.successRate > 90 && cro.successRate < 80) {
      correlatedIssues.push('Potential persona-targeting mismatch: high marketing spend with low conversion quality');
    }
    
    // Example: COO operational issues + CEO strategic misalignment
    const coo = agents.find(a => a.id === 'coo');
    const ceo = agents.find(a => a.id === 'ceo');
    
    if (coo && ceo && coo.status === 'delayed' && ceo.strategicAlignment < 85) {
      correlatedIssues.push('Operational bottlenecks impacting strategic execution capability');
    }
    
    return correlatedIssues;
  }

  private synthesizeDiagnosis(performance: string[], communication: string[], crossAgent: string[]): ProblemDiagnosis {
    const allIssues = [...performance, ...communication, ...crossAgent];
    
    // Determine severity based on issue count and types
    let severity: 'critical' | 'high' | 'medium' | 'low' = 'low';
    if (allIssues.length > 5 || crossAgent.length > 2) severity = 'critical';
    else if (allIssues.length > 3 || performance.length > 2) severity = 'high';
    else if (allIssues.length > 1) severity = 'medium';
    
    return {
      issue: allIssues.length > 0 ? allIssues[0] : 'No critical issues detected',
      rootCauses: allIssues,
      affectedAgents: this.extractAffectedAgents(allIssues),
      severity,
      businessImpact: this.assessBusinessImpact(allIssues, severity)
    };
  }

  private extractAffectedAgents(issues: string[]): string[] {
    const agents = new Set<string>();
    const agentNames = ['CEO', 'CRO', 'CMO', 'COO', 'Content Manager'];
    
    issues.forEach(issue => {
      agentNames.forEach(agent => {
        if (issue.includes(agent)) {
          agents.add(agent.toLowerCase().replace(' ', '-'));
        }
      });
    });
    
    return Array.from(agents);
  }

  private assessBusinessImpact(issues: string[], severity: string): string {
    const impacts = {
      critical: 'Severe operational disruption with potential revenue loss and client impact',
      high: 'Significant efficiency reduction affecting key business objectives',
      medium: 'Moderate performance impact requiring attention within current cycle',
      low: 'Minor optimization opportunity for continuous improvement'
    };
    
    return impacts[severity as keyof typeof impacts];
  }

  // Generative Planning Module
  async createStrategicPlan(diagnosis: ProblemDiagnosis): Promise<GeneratedSolution> {
    const solution: GeneratedSolution = {
      strategy: await this.generateStrategy(diagnosis),
      tactics: await this.generateTactics(diagnosis),
      timeline: await this.createTimeline(diagnosis),
      successMetrics: await this.defineSuccessMetrics(diagnosis),
      resourceRequirements: await this.assessResourceNeeds(diagnosis)
    };
    
    return solution;
  }

  private async generateStrategy(diagnosis: ProblemDiagnosis): Promise<string> {
    // Generate strategy based on problem type and severity
    if (diagnosis.issue.includes('persona-targeting mismatch')) {
      return 'Realign marketing persona targeting with sales qualification criteria through integrated CMO-CRO collaboration framework';
    } else if (diagnosis.issue.includes('operational bottlenecks')) {
      return 'Implement streamlined operational workflows with automated handoffs between strategic planning and execution phases';
    } else if (diagnosis.issue.includes('Performance decline')) {
      return 'Deploy performance optimization initiative with targeted capability enhancement and success metric realignment';
    }
    
    return 'Implement comprehensive system optimization initiative addressing root cause inefficiencies';
  }

  private async generateTactics(diagnosis: ProblemDiagnosis): Promise<string[]> {
    const tactics = [];
    
    if (diagnosis.severity === 'critical') {
      tactics.push('Initiate emergency coordination protocol');
      tactics.push('Implement daily status sync meetings');
    }
    
    if (diagnosis.issue.includes('communication')) {
      tactics.push('Establish structured inter-agent communication protocols');
      tactics.push('Deploy automated status sharing system');
    }
    
    if (diagnosis.issue.includes('performance')) {
      tactics.push('Conduct individual agent capability assessments');
      tactics.push('Implement targeted performance improvement programs');
    }
    
    if (diagnosis.affectedAgents.length > 2) {
      tactics.push('Create cross-functional working groups');
      tactics.push('Establish shared success metrics and accountability framework');
    }
    
    return tactics.length > 0 ? tactics : ['Monitor system performance and implement incremental improvements'];
  }

  private async createTimeline(diagnosis: ProblemDiagnosis): Promise<GeneratedSolution['timeline']> {
    const timeline = [];
    
    // Phase 1: Assessment and Planning
    timeline.push({
      phase: 'Assessment & Planning',
      duration: '3-5 days',
      activities: [
        'Complete detailed problem analysis',
        'Stakeholder alignment sessions',
        'Resource allocation planning'
      ],
      responsibleAgent: 'chief-of-staff'
    });
    
    // Phase 2: Implementation
    timeline.push({
      phase: 'Implementation',
      duration: diagnosis.severity === 'critical' ? '1-2 weeks' : '2-4 weeks',
      activities: this.generateImplementationActivities(diagnosis),
      responsibleAgent: this.selectPrimaryAgent(diagnosis.affectedAgents)
    });
    
    // Phase 3: Monitoring and Optimization
    timeline.push({
      phase: 'Monitoring & Optimization',
      duration: '2-3 weeks',
      activities: [
        'Performance monitoring and adjustment',
        'Success metrics validation',
        'Process optimization and documentation'
      ],
      responsibleAgent: 'chief-of-staff'
    });
    
    return timeline;
  }

  private generateImplementationActivities(diagnosis: ProblemDiagnosis): string[] {
    const activities = [];
    
    if (diagnosis.issue.includes('performance')) {
      activities.push('Deploy agent capability enhancement modules');
      activities.push('Implement performance tracking dashboard');
    }
    
    if (diagnosis.issue.includes('communication')) {
      activities.push('Roll out communication protocol standards');
      activities.push('Configure automated reporting systems');
    }
    
    if (diagnosis.issue.includes('misalignment')) {
      activities.push('Conduct strategic realignment sessions');
      activities.push('Update agent directive frameworks');
    }
    
    return activities;
  }

  private selectPrimaryAgent(affectedAgents: string[]): string {
    // Select the most suitable agent to lead implementation
    if (affectedAgents.includes('coo')) return 'coo'; // COO handles operational issues
    if (affectedAgents.includes('cro')) return 'cro'; // CRO handles revenue issues
    if (affectedAgents.includes('cmo')) return 'cmo'; // CMO handles marketing issues
    return 'chief-of-staff'; // Default to Chief of Staff for complex issues
  }

  private async defineSuccessMetrics(diagnosis: ProblemDiagnosis): Promise<string[]> {
    const metrics = [];
    
    if (diagnosis.issue.includes('performance')) {
      metrics.push('Overall agent success rate > 90%');
      metrics.push('Strategic alignment scores > 85%');
    }
    
    if (diagnosis.issue.includes('communication')) {
      metrics.push('Inter-agent communication frequency > 15 per day');
      metrics.push('Conflict resolution time < 4 hours');
    }
    
    if (diagnosis.severity === 'critical') {
      metrics.push('System health score > 95%');
      metrics.push('Zero critical status alerts for 7 consecutive days');
    }
    
    metrics.push('Plan completion rate > 95%');
    metrics.push('Stakeholder satisfaction score > 4.0/5.0');
    
    return metrics;
  }

  private async assessResourceNeeds(diagnosis: ProblemDiagnosis): Promise<GeneratedSolution['resourceRequirements']> {
    const resources = [];
    
    if (diagnosis.severity === 'critical') {
      resources.push({
        type: 'human' as const,
        description: 'Senior strategic consultant for emergency response coordination'
      });
    }
    
    if (diagnosis.affectedAgents.length > 3) {
      resources.push({
        type: 'technical' as const,
        description: 'Enhanced monitoring and communication infrastructure'
      });
    }
    
    if (diagnosis.issue.includes('performance')) {
      resources.push({
        type: 'financial' as const,
        description: 'Agent capability enhancement and training budget',
        amount: 5000
      });
    }
    
    return resources;
  }

  // Main workflow method
  async generateStrategicResponse(): Promise<StrategicPlan> {
    try {
      // Gather current system state
      const agents = await storage.getAgents();
      const communications = await storage.getRecentAgentCommunications(50);
      
      // Diagnose problems
      const diagnosis = await this.diagnoseProblem(agents, communications);
      
      // Generate solution only if issues are found
      if (diagnosis.severity === 'low' && diagnosis.rootCauses.length === 0) {
        throw new Error('No significant issues detected that require strategic intervention');
      }
      
      const solution = await this.createStrategicPlan(diagnosis);
      
      // Create strategic plan record
      const planData: InsertStrategicPlan = {
        title: `Strategic Response: ${diagnosis.issue}`,
        description: `Comprehensive strategic plan to address ${diagnosis.severity} priority issues affecting ${diagnosis.affectedAgents.join(', ')} agents`,
        status: 'draft',
        priority: diagnosis.severity === 'critical' ? 'critical' : diagnosis.severity,
        generatedBy: 'chief-of-staff',
        problemDiagnosis: JSON.stringify(diagnosis),
        solution: solution,
        timeline: solution.timeline,
        assignedAgents: diagnosis.affectedAgents,
        subGoals: solution.tactics.map((tactic, index) => ({
          id: index + 1,
          description: tactic,
          status: 'pending',
          assignedAgent: diagnosis.affectedAgents[index % diagnosis.affectedAgents.length] || 'chief-of-staff'
        })),
        successMetrics: solution.successMetrics,
        progressScore: 0
      };
      
      const strategicPlan = await storage.createStrategicPlan(planData);
      
      // Update Chief of Staff agent status
      await storage.updateAgent('chief-of-staff', {
        status: 'healthy',
        lastActive: new Date(),
        lastReport: `Generated strategic plan: ${diagnosis.issue}`,
        successRate: 94,
        strategicAlignment: 96
      });
      
      return strategicPlan;
      
    } catch (error) {
      console.error('Strategic plan generation failed:', error);
      
      // Update agent with error status
      await storage.updateAgent('chief-of-staff', {
        status: 'error',
        lastActive: new Date(),
        lastReport: 'Failed to generate strategic response',
        successRate: 88,
        strategicAlignment: 85
      });
      
      throw error;
    }
  }

  // Helper methods for A/B Testing Framework
  async createAbTestFromStrategy(plan: StrategicPlan): Promise<void> {
    // Automatically create A/B tests for strategies involving marketing
    if (plan.assignedAgents.includes('cmo') && plan.priority === 'high') {
      const testData = {
        name: `A/B Test: ${plan.title}`,
        hypothesis: `Implementation of ${plan.title} will improve key performance metrics`,
        testType: 'marketing' as const,
        variants: [
          { name: 'Control', description: 'Current approach' },
          { name: 'Strategic Plan', description: plan.description }
        ],
        targetMetric: 'conversion_rate',
        createdBy: 'chief-of-staff',
        managedBy: 'cmo'
      };
      
      await storage.createAbTest(testData);
    }
  }
}

export const generativeStrategist = new GenerativeStrategist();