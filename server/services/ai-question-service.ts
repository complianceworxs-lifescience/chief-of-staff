import { storage } from "../storage";
import { type InsertAiQuestion, type AiQuestion } from "@shared/schema";

export class AiQuestionService {
  
  async askQuestion(question: string, context?: string): Promise<AiQuestion> {
    // Determine question category based on keywords
    const category = this.categorizeQuestion(question);
    
    // Get relevant data based on category
    const relevantData = await this.getRelevantData(category, question);
    
    // Generate intelligent response
    const response = await this.generateResponse(question, category, relevantData);
    
    // Calculate confidence based on data availability and question clarity
    const confidence = this.calculateConfidence(question, relevantData);
    
    const questionData: InsertAiQuestion = {
      question,
      context,
      response: response.answer,
      confidence,
      relatedData: response.relatedIds,
      category
    };
    
    return await storage.createAiQuestion(questionData);
  }
  
  private categorizeQuestion(question: string): string {
    const lowerQuestion = question.toLowerCase();
    
    if (lowerQuestion.includes('agent') && (lowerQuestion.includes('status') || lowerQuestion.includes('health'))) {
      return 'agent_status';
    }
    if (lowerQuestion.includes('conflict') || lowerQuestion.includes('disagree') || lowerQuestion.includes('issue')) {
      return 'conflicts';
    }
    if (lowerQuestion.includes('performance') || lowerQuestion.includes('success') || lowerQuestion.includes('rate') || lowerQuestion.includes('metric')) {
      return 'performance';
    }
    if (lowerQuestion.includes('strategy') || lowerQuestion.includes('objective') || lowerQuestion.includes('goal') || lowerQuestion.includes('target')) {
      return 'strategy';
    }
    if (lowerQuestion.includes('workload') || lowerQuestion.includes('capacity') || lowerQuestion.includes('task')) {
      return 'workload';
    }
    return 'general';
  }
  
  private async getRelevantData(category: string, question: string) {
    const data: any = {};
    
    try {
      // Always get basic system data
      data.agents = await storage.getAgents();
      data.systemMetrics = await storage.getLatestSystemMetrics();
      
      switch (category) {
        case 'agent_status':
          data.conflicts = await storage.getActiveConflicts();
          break;
          
        case 'conflicts':
          data.conflicts = await storage.getConflicts();
          data.predictions = await storage.getConflictPredictions();
          break;
          
        case 'performance':
          data.communications = await storage.getRecentAgentCommunications(50);
          break;
          
        case 'strategy':
          data.objectives = await storage.getStrategicObjectives();
          break;
          
        case 'workload':
          data.workloads = await storage.getAgentWorkloads();
          break;
          
        default:
          // Get a sample of all data for general questions
          data.conflicts = await storage.getActiveConflicts();
          data.objectives = await storage.getStrategicObjectives();
          data.reports = await storage.getWeeklyReports();
      }
    } catch (error) {
      console.error('Error fetching relevant data:', error);
    }
    
    return data;
  }
  
  private async generateResponse(question: string, category: string, data: any): Promise<{ answer: string, relatedIds: string[] }> {
    const relatedIds: string[] = [];
    
    switch (category) {
      case 'agent_status':
        return this.generateAgentStatusResponse(question, data, relatedIds);
        
      case 'conflicts':
        return this.generateConflictResponse(question, data, relatedIds);
        
      case 'performance':
        return this.generatePerformanceResponse(question, data, relatedIds);
        
      case 'strategy':
        return this.generateStrategyResponse(question, data, relatedIds);
        
      case 'workload':
        return this.generateWorkloadResponse(question, data, relatedIds);
        
      default:
        return this.generateGeneralResponse(question, data, relatedIds);
    }
  }
  
  private generateAgentStatusResponse(question: string, data: any, relatedIds: string[]): { answer: string, relatedIds: string[] } {
    const { agents, conflicts, systemMetrics } = data;
    
    if (!agents || agents.length === 0) {
      return { answer: "No agent data is currently available.", relatedIds };
    }
    
    const healthyAgents = agents.filter((a: any) => a.status === 'healthy');
    const conflictAgents = agents.filter((a: any) => a.status === 'conflict');
    const delayedAgents = agents.filter((a: any) => a.status === 'delayed');
    
    relatedIds.push(...agents.map((a: any) => a.id));
    
    let answer = `Current agent status overview:\n\n`;
    answer += `• ${healthyAgents.length} agents are healthy\n`;
    answer += `• ${conflictAgents.length} agents have conflicts\n`;
    answer += `• ${delayedAgents.length} agents are delayed\n\n`;
    
    if (systemMetrics) {
      answer += `System health: ${systemMetrics.systemHealth}%\n`;
      answer += `Overall efficiency: ${systemMetrics.averageResponseTime}ms average response time\n\n`;
    }
    
    if (conflictAgents.length > 0) {
      answer += `Agents needing attention: ${conflictAgents.map((a: any) => a.name).join(', ')}`;
    }
    
    return { answer, relatedIds };
  }
  
  private generateConflictResponse(question: string, data: any, relatedIds: string[]): { answer: string, relatedIds: string[] } {
    const { conflicts, predictions } = data;
    
    if (!conflicts || conflicts.length === 0) {
      return { answer: "No active conflicts detected in the system.", relatedIds };
    }
    
    const activeConflicts = conflicts.filter((c: any) => c.status === 'active');
    const resolvedConflicts = conflicts.filter((c: any) => c.status === 'resolved');
    
    relatedIds.push(...conflicts.map((c: any) => c.id));
    
    let answer = `Conflict analysis:\n\n`;
    answer += `• ${activeConflicts.length} active conflicts\n`;
    answer += `• ${resolvedConflicts.length} resolved conflicts\n\n`;
    
    if (activeConflicts.length > 0) {
      answer += `Current conflicts:\n`;
      activeConflicts.slice(0, 3).forEach((conflict: any) => {
        answer += `- ${conflict.description} (${conflict.severity} priority)\n`;
      });
    }
    
    if (predictions && predictions.length > 0) {
      const highRiskPredictions = predictions.filter((p: any) => p.riskScore > 70);
      if (highRiskPredictions.length > 0) {
        answer += `\nHigh-risk conflict predictions: ${highRiskPredictions.length} potential issues detected`;
      }
    }
    
    return { answer, relatedIds };
  }
  
  private generatePerformanceResponse(question: string, data: any, relatedIds: string[]): { answer: string, relatedIds: string[] } {
    const { agents, communications, systemMetrics } = data;
    
    if (!agents || agents.length === 0) {
      return { answer: "No performance data is currently available.", relatedIds };
    }
    
    const avgSuccessRate = agents.reduce((sum: number, a: any) => sum + a.successRate, 0) / agents.length;
    const avgAlignment = agents.reduce((sum: number, a: any) => sum + a.strategicAlignment, 0) / agents.length;
    
    relatedIds.push(...agents.map((a: any) => a.id));
    
    let answer = `Performance summary:\n\n`;
    answer += `• Average success rate: ${Math.round(avgSuccessRate)}%\n`;
    answer += `• Average strategic alignment: ${Math.round(avgAlignment)}%\n`;
    
    if (systemMetrics) {
      answer += `• System health: ${systemMetrics.systemHealth}%\n`;
    }
    
    const topPerformers = agents.sort((a: any, b: any) => b.successRate - a.successRate).slice(0, 2);
    const lowPerformers = agents.sort((a: any, b: any) => a.successRate - b.successRate).slice(0, 2);
    
    answer += `\nTop performers: ${topPerformers.map((a: any) => `${a.name} (${a.successRate}%)`).join(', ')}\n`;
    
    if (lowPerformers[0] && lowPerformers[0].successRate < 80) {
      answer += `Areas for improvement: ${lowPerformers.map((a: any) => `${a.name} (${a.successRate}%)`).join(', ')}`;
    }
    
    return { answer, relatedIds };
  }
  
  private generateStrategyResponse(question: string, data: any, relatedIds: string[]): { answer: string, relatedIds: string[] } {
    const { objectives } = data;
    
    if (!objectives || objectives.length === 0) {
      return { answer: "No strategic objectives are currently defined.", relatedIds };
    }
    
    relatedIds.push(...objectives.map((o: any) => o.id));
    
    const avgProgress = objectives.reduce((sum: number, o: any) => sum + o.progress, 0) / objectives.length;
    const onTrack = objectives.filter((o: any) => o.progress >= 75);
    const atRisk = objectives.filter((o: any) => o.progress < 50);
    
    let answer = `Strategic overview:\n\n`;
    answer += `• ${objectives.length} active objectives\n`;
    answer += `• ${Math.round(avgProgress)}% average progress\n`;
    answer += `• ${onTrack.length} objectives on track\n`;
    answer += `• ${atRisk.length} objectives at risk\n\n`;
    
    if (onTrack.length > 0) {
      answer += `High-performing objectives:\n`;
      onTrack.slice(0, 2).forEach((obj: any) => {
        answer += `- ${obj.title} (${obj.progress}% complete)\n`;
      });
    }
    
    if (atRisk.length > 0) {
      answer += `\nObjectives needing attention:\n`;
      atRisk.slice(0, 2).forEach((obj: any) => {
        answer += `- ${obj.title} (${obj.progress}% complete)\n`;
      });
    }
    
    return { answer, relatedIds };
  }
  
  private generateWorkloadResponse(question: string, data: any, relatedIds: string[]): { answer: string, relatedIds: string[] } {
    const { workloads } = data;
    
    if (!workloads || workloads.length === 0) {
      return { answer: "No workload data is currently available.", relatedIds };
    }
    
    const avgUtilization = workloads.reduce((sum: number, w: any) => sum + w.utilizationRate, 0) / workloads.length;
    const overloaded = workloads.filter((w: any) => w.utilizationRate > 85);
    const underutilized = workloads.filter((w: any) => w.utilizationRate < 60);
    
    relatedIds.push(...workloads.map((w: any) => w.id));
    
    let answer = `Workload analysis:\n\n`;
    answer += `• ${Math.round(avgUtilization)}% average utilization\n`;
    answer += `• ${overloaded.length} agents overloaded\n`;
    answer += `• ${underutilized.length} agents underutilized\n\n`;
    
    if (overloaded.length > 0) {
      answer += `Overloaded agents: ${overloaded.map((w: any) => `${w.agentId} (${w.utilizationRate}%)`).join(', ')}\n`;
    }
    
    if (underutilized.length > 0) {
      answer += `Available capacity: ${underutilized.map((w: any) => `${w.agentId} (${w.utilizationRate}%)`).join(', ')}`;
    }
    
    return { answer, relatedIds };
  }
  
  private generateGeneralResponse(question: string, data: any, relatedIds: string[]): { answer: string, relatedIds: string[] } {
    const { agents, conflicts, objectives, systemMetrics } = data;
    
    let answer = `System overview:\n\n`;
    
    if (agents && agents.length > 0) {
      const healthyCount = agents.filter((a: any) => a.status === 'healthy').length;
      answer += `• ${agents.length} agents (${healthyCount} healthy)\n`;
    }
    
    if (conflicts) {
      const activeConflicts = conflicts.filter((c: any) => c.status === 'active').length;
      answer += `• ${activeConflicts} active conflicts\n`;
    }
    
    if (objectives) {
      const avgProgress = objectives.reduce((sum: number, o: any) => sum + o.progress, 0) / objectives.length;
      answer += `• ${objectives.length} strategic objectives (${Math.round(avgProgress)}% avg progress)\n`;
    }
    
    if (systemMetrics) {
      answer += `• ${systemMetrics.systemHealth}% system health\n`;
    }
    
    answer += `\nFor specific information, try asking about:\n`;
    answer += `- Agent status and performance\n`;
    answer += `- Active conflicts and resolutions\n`;
    answer += `- Strategic objectives progress\n`;
    answer += `- Workload distribution`;
    
    return { answer, relatedIds };
  }
  
  private calculateConfidence(question: string, data: any): number {
    let confidence = 50; // Base confidence
    
    // Increase confidence based on data availability
    if (data.agents && data.agents.length > 0) confidence += 15;
    if (data.systemMetrics) confidence += 10;
    if (data.conflicts) confidence += 10;
    if (data.objectives) confidence += 10;
    
    // Adjust based on question clarity
    const questionWords = question.toLowerCase().split(' ');
    const keyWords = ['agent', 'conflict', 'performance', 'strategy', 'workload', 'status', 'health'];
    const matchedKeywords = questionWords.filter(word => keyWords.includes(word));
    
    confidence += matchedKeywords.length * 3;
    
    // Question length factor (not too short, not too long)
    if (questionWords.length >= 3 && questionWords.length <= 15) confidence += 5;
    
    return Math.min(100, Math.max(10, confidence));
  }
  
  async getQuestionHistory(limit: number = 20): Promise<AiQuestion[]> {
    return await storage.getRecentAiQuestions(limit);
  }
  
  async getQuestionsByCategory(category: string): Promise<AiQuestion[]> {
    return await storage.getAiQuestionsByCategory(category);
  }
}

export const aiQuestionService = new AiQuestionService();