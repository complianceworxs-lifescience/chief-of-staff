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
    // Check strategy first to prioritize strategic questions over performance ones
    if (lowerQuestion.includes('strategy') || lowerQuestion.includes('objective') || lowerQuestion.includes('goal') || 
        lowerQuestion.includes('target') || lowerQuestion.includes('strategic') || lowerQuestion.includes('progress') ||
        lowerQuestion.includes('milestone') || lowerQuestion.includes('achievement')) {
      return 'strategy';
    }
    if (lowerQuestion.includes('conflict') || lowerQuestion.includes('disagree') || lowerQuestion.includes('issue')) {
      return 'conflicts';
    }
    if (lowerQuestion.includes('performance') || lowerQuestion.includes('success') || lowerQuestion.includes('rate') || lowerQuestion.includes('metric')) {
      return 'performance';
    }
    if (lowerQuestion.includes('workload') || lowerQuestion.includes('capacity') || lowerQuestion.includes('task') || 
        lowerQuestion.includes('overloaded') || lowerQuestion.includes('overload') || lowerQuestion.includes('utilization') ||
        lowerQuestion.includes('load') || lowerQuestion.includes('busy')) {
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
    const activeAgents = agents.filter((a: any) => {
      const lastActive = new Date(a.lastActive);
      const now = new Date();
      const timeDiff = now.getTime() - lastActive.getTime();
      return timeDiff < 5 * 60 * 1000; // Active in last 5 minutes
    });
    
    relatedIds.push(...agents.map((a: any) => a.id));
    
    let answer = `🤖 **REAL-TIME AGENT STATUS ANALYSIS**\n\n`;
    
    // Current operational status
    answer += `**OPERATIONAL STATUS:**\n`;
    answer += `✅ Healthy: ${healthyAgents.length} agents (${Math.round((healthyAgents.length/agents.length)*100)}%)\n`;
    answer += `⚠️  In Conflict: ${conflictAgents.length} agents\n`;
    answer += `🕒 Delayed: ${delayedAgents.length} agents\n`;
    answer += `🔥 Recently Active: ${activeAgents.length}/${agents.length} agents (last 5min)\n\n`;
    
    // Individual agent breakdown with actionable insights
    answer += `**INDIVIDUAL AGENT ANALYSIS:**\n`;
    agents.forEach((agent: any) => {
      const efficiency = agent.successRate || 0;
      const alignment = agent.strategicAlignment || 0;
      const lastActiveTime = new Date(agent.lastActive);
      const timeSinceActive = Math.floor((new Date().getTime() - lastActiveTime.getTime()) / (1000 * 60));
      
      answer += `\n• **${agent.name}**\n`;
      answer += `  Status: ${agent.status === 'healthy' ? '✅ Healthy' : agent.status === 'conflict' ? '⚠️ Conflict' : '🕒 Delayed'}\n`;
      answer += `  Performance: ${efficiency}% success rate, ${alignment}% strategic alignment\n`;
      answer += `  Last Active: ${timeSinceActive < 60 ? `${timeSinceActive}min ago` : `${Math.floor(timeSinceActive/60)}h ago`}\n`;
      answer += `  Last Report: ${agent.lastReport || 'No recent activity'}\n`;
      
      // Actionable recommendations
      if (efficiency < 70) {
        answer += `  🚨 ACTION NEEDED: Low performance - consider workload rebalancing\n`;
      }
      if (alignment < 60) {
        answer += `  🎯 ACTION NEEDED: Poor strategic alignment - review objectives\n`;
      }
      if (timeSinceActive > 30) {
        answer += `  ⏰ ACTION NEEDED: Agent inactive - check for blockers\n`;
      }
    });
    
    // System-level insights
    if (systemMetrics) {
      answer += `\n\n**SYSTEM PERFORMANCE:**\n`;
      answer += `🏥 Overall Health: ${systemMetrics.systemHealth}%\n`;
      if (systemMetrics.averageResponseTime) {
        answer += `⚡ Response Time: ${systemMetrics.averageResponseTime}ms\n`;
      }
      answer += `📊 Active Tasks: ${systemMetrics.activeTasks || 0}\n`;
      answer += `🔄 Completed Today: ${systemMetrics.completedTasks || 0}\n\n`;
    }
    
    // Critical actionable recommendations
    answer += `**IMMEDIATE ACTION RECOMMENDATIONS:**\n`;
    if (conflictAgents.length > 0) {
      answer += `🔴 CRITICAL: Resolve ${conflictAgents.length} active conflicts: ${conflictAgents.map((a: any) => a.name).join(', ')}\n`;
    }
    if (delayedAgents.length > 0) {
      answer += `🟡 PRIORITY: Investigate delays in: ${delayedAgents.map((a: any) => a.name).join(', ')}\n`;
    }
    if (activeAgents.length < agents.length * 0.7) {
      answer += `🟠 ATTENTION: Low agent activity (${activeAgents.length}/${agents.length}) - system may be underutilized\n`;
    }
    if (systemMetrics && systemMetrics.systemHealth < 80) {
      answer += `🚨 URGENT: System health at ${systemMetrics.systemHealth}% - immediate intervention required\n`;
    }
    
    return { answer, relatedIds };
  }
  
  private generateConflictResponse(question: string, data: any, relatedIds: string[]): { answer: string, relatedIds: string[] } {
    const { conflicts, predictions } = data;
    
    const activeConflicts = conflicts ? conflicts.filter((c: any) => c.status === 'active') : [];
    const resolvedConflicts = conflicts ? conflicts.filter((c: any) => c.status === 'resolved') : [];
    const highRiskPredictions = predictions ? predictions.filter((p: any) => p.riskScore > 70) : [];
    
    if (conflicts) relatedIds.push(...conflicts.map((c: any) => c.id));
    
    let answer = `🚨 **REAL-TIME CONFLICT ANALYSIS**\n\n`;
    
    // Current conflict status
    answer += `**CONFLICT STATUS:**\n`;
    answer += `🔴 Active Conflicts: ${activeConflicts.length}\n`;
    answer += `✅ Resolved Today: ${resolvedConflicts.length}\n`;
    answer += `⚠️  High-Risk Predictions: ${highRiskPredictions.length}\n\n`;
    
    if (activeConflicts.length === 0) {
      answer += `🎉 **EXCELLENT NEWS!** No active conflicts detected.\n`;
      answer += `Your autonomous conflict resolution is working perfectly.\n\n`;
      
      // Show recent resolution successes
      if (resolvedConflicts.length > 0) {
        answer += `**RECENT AUTONOMOUS RESOLUTIONS:**\n`;
        resolvedConflicts.slice(0, 3).forEach((conflict: any, idx: number) => {
          const resolvedTime = new Date(conflict.resolvedAt || conflict.createdAt);
          const timeAgo = Math.floor((new Date().getTime() - resolvedTime.getTime()) / (1000 * 60));
          answer += `✅ ${conflict.description || `Conflict ${idx + 1}`} - Auto-resolved ${timeAgo}min ago\n`;
        });
        answer += `\n`;
      }
    } else {
      answer += `**ACTIVE CONFLICTS REQUIRING ATTENTION:**\n`;
      activeConflicts.slice(0, 5).forEach((conflict: any, idx: number) => {
        const priority = conflict.severity || conflict.priority || 'medium';
        const priorityIcon = priority === 'high' ? '🔴' : priority === 'medium' ? '🟡' : '🟢';
        const ageMinutes = conflict.createdAt ? Math.floor((new Date().getTime() - new Date(conflict.createdAt).getTime()) / (1000 * 60)) : 0;
        
        answer += `\n${priorityIcon} **Conflict ${idx + 1}** (${priority} priority)\n`;
        answer += `   Issue: ${conflict.description}\n`;
        answer += `   Agents: ${conflict.involvedAgents?.join(', ') || 'Multiple agents'}\n`;
        answer += `   Duration: ${ageMinutes < 60 ? `${ageMinutes}min` : `${Math.floor(ageMinutes/60)}h ${ageMinutes%60}min`}\n`;
        answer += `   Auto-resolution: ${conflict.autoResolutionAttempted ? '⚠️ Failed - needs manual intervention' : '🔄 In progress'}\n`;
      });
      answer += `\n`;
    }
    
    // Predictive analysis
    if (highRiskPredictions.length > 0) {
      answer += `**CONFLICT PREDICTIONS (High Risk):**\n`;
      highRiskPredictions.slice(0, 3).forEach((prediction: any, idx: number) => {
        answer += `⚠️  **Prediction ${idx + 1}**: ${prediction.title || 'Potential conflict'}\n`;
        answer += `   Risk Score: ${prediction.riskScore}%\n`;
        answer += `   Affected: ${prediction.involvedAgents?.join(', ') || 'Multiple agents'}\n`;
        answer += `   Timeline: ${prediction.predictedTimeframe || 'Next 24-48 hours'}\n`;
      });
      answer += `\n`;
    }
    
    // Actionable recommendations
    answer += `**IMMEDIATE ACTIONS:**\n`;
    if (activeConflicts.length > 0) {
      answer += `🚨 CRITICAL: ${activeConflicts.length} conflicts need resolution\n`;
      answer += `📋 Go to Active Intervention page to view detailed resolution options\n`;
      answer += `⚡ Enable auto-resolution for lower priority conflicts\n`;
    }
    if (highRiskPredictions.length > 0) {
      answer += `🎯 PREVENTIVE: ${highRiskPredictions.length} potential conflicts can be prevented\n`;
      answer += `📊 Review Predictive Analytics dashboard for prevention strategies\n`;
    }
    if (activeConflicts.length === 0 && highRiskPredictions.length === 0) {
      answer += `✅ MONITORING: System operating smoothly - continue current strategy\n`;
      answer += `📈 Review resolved conflicts for pattern analysis and improvement\n`;
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
    const { objectives, agents, systemMetrics } = data;
    
    if (!objectives || objectives.length === 0) {
      return { 
        answer: "🎯 **STRATEGIC OBJECTIVES STATUS**\n\n❌ **NO OBJECTIVES DEFINED**\n\nNo strategic objectives are currently active in the system. This indicates:\n\n**IMMEDIATE ACTIONS NEEDED:**\n🚨 CRITICAL: Define strategic objectives to guide agent activities\n📋 Set measurable goals with target completion dates\n🎯 Align agent activities with strategic priorities\n📊 Establish KPIs and success metrics\n\n**RECOMMENDED NEXT STEPS:**\n1. Access the Strategic Command Center to create objectives\n2. Define 3-5 core strategic priorities for the next quarter\n3. Assign responsibility to specific agents\n4. Set up progress tracking and milestone reviews", 
        relatedIds 
      };
    }
    
    relatedIds.push(...objectives.map((o: any) => o.id));
    
    const avgProgress = objectives.reduce((sum: number, o: any) => sum + o.progress, 0) / objectives.length;
    const onTrack = objectives.filter((o: any) => o.progress >= 75);
    const atRisk = objectives.filter((o: any) => o.progress < 50);
    const stalled = objectives.filter((o: any) => {
      const lastUpdate = new Date(o.lastUpdated || o.createdAt);
      const daysSinceUpdate = (new Date().getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceUpdate > 7 && o.progress < 90;
    });
    
    let answer = `🎯 **STRATEGIC OBJECTIVES PROGRESS ANALYSIS**\n\n`;
    
    // Executive Summary
    answer += `**EXECUTIVE SUMMARY:**\n`;
    answer += `📊 Total Objectives: ${objectives.length}\n`;
    answer += `📈 Average Progress: ${Math.round(avgProgress)}%\n`;
    answer += `✅ On Track (≥75%): ${onTrack.length} objectives\n`;
    answer += `⚠️ At Risk (<50%): ${atRisk.length} objectives\n`;
    answer += `🚨 Stalled: ${stalled.length} objectives\n\n`;
    
    // Individual objective breakdown
    answer += `**DETAILED OBJECTIVE ANALYSIS:**\n`;
    objectives.forEach((obj: any, index: number) => {
      const progressIcon = obj.progress >= 90 ? '🎉' : 
                           obj.progress >= 75 ? '✅' : 
                           obj.progress >= 50 ? '🟡' : '🔴';
      const statusText = obj.progress >= 90 ? 'NEARLY COMPLETE' :
                        obj.progress >= 75 ? 'ON TRACK' :
                        obj.progress >= 50 ? 'IN PROGRESS' : 'AT RISK';
      
      const daysActive = obj.createdAt ? Math.floor((new Date().getTime() - new Date(obj.createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 0;
      const lastUpdate = obj.lastUpdated ? new Date(obj.lastUpdated) : new Date(obj.createdAt || Date.now());
      const daysSinceUpdate = Math.floor((new Date().getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24));
      
      answer += `\n${progressIcon} **${obj.title}** (${statusText})\n`;
      answer += `   Progress: ${obj.progress}% complete\n`;
      answer += `   Priority: ${obj.priority === 'high' ? '🔥 HIGH' : obj.priority === 'medium' ? '📊 MEDIUM' : '📝 LOW'}\n`;
      answer += `   Owner: ${obj.assignedTo || 'Unassigned'}\n`;
      answer += `   Active: ${daysActive} days, Last Updated: ${daysSinceUpdate} days ago\n`;
      
      if (obj.description) {
        answer += `   Description: ${obj.description.substring(0, 100)}${obj.description.length > 100 ? '...' : ''}\n`;
      }
      
      // Status-specific insights
      if (obj.progress < 25 && daysActive > 30) {
        answer += `   🚨 ALERT: Low progress after ${daysActive} days - needs immediate attention\n`;
      } else if (daysSinceUpdate > 7) {
        answer += `   ⚠️ WARNING: No updates in ${daysSinceUpdate} days - may be stalled\n`;
      } else if (obj.progress >= 75) {
        answer += `   🎯 OPPORTUNITY: Near completion - push for final delivery\n`;
      }
    });
    
    // Strategic alignment insights
    if (agents && agents.length > 0) {
      const avgAgentAlignment = agents.reduce((sum: number, a: any) => sum + (a.strategicAlignment || 0), 0) / agents.length;
      answer += `\n\n**STRATEGIC ALIGNMENT:**\n`;
      answer += `📊 Average Agent Alignment: ${Math.round(avgAgentAlignment)}%\n`;
      
      const poorAlignment = agents.filter((a: any) => (a.strategicAlignment || 0) < 60);
      if (poorAlignment.length > 0) {
        answer += `⚠️ Agents with poor alignment: ${poorAlignment.map((a: any) => a.name).join(', ')}\n`;
      }
    }
    
    // Actionable recommendations
    answer += `\n**IMMEDIATE RECOMMENDATIONS:**\n`;
    if (atRisk.length > 0) {
      answer += `🚨 CRITICAL: ${atRisk.length} objectives at risk - conduct urgent review sessions\n`;
    }
    if (stalled.length > 0) {
      answer += `🔄 PRIORITY: ${stalled.length} stalled objectives - identify and remove blockers\n`;
    }
    if (onTrack.length > 0) {
      answer += `🎯 OPPORTUNITY: ${onTrack.length} objectives near completion - allocate resources for final push\n`;
    }
    if (avgProgress < 60) {
      answer += `📈 STRATEGIC: Overall progress at ${Math.round(avgProgress)}% - consider strategy revision or resource reallocation\n`;
    }
    
    answer += `\n**NEXT STEPS:**\n`;
    answer += `📋 Schedule weekly progress reviews for at-risk objectives\n`;
    answer += `🎯 Realign agent activities with strategic priorities\n`;
    answer += `📊 Update objective timelines and resource allocation\n`;
    answer += `💡 Consider adding new objectives if current ones are progressing well\n`;
    
    return { answer, relatedIds };
  }
  
  private generateWorkloadResponse(question: string, data: any, relatedIds: string[]): { answer: string, relatedIds: string[] } {
    const { workloads, agents } = data;
    
    if (!workloads || workloads.length === 0) {
      return { answer: "📊 **WORKLOAD DATA UNAVAILABLE**\n\nNo workload monitoring data is currently available. This may indicate:\n• Workload monitoring needs to be initialized\n• Agents are not reporting capacity metrics\n• System startup is still in progress\n\n**RECOMMENDED ACTIONS:**\n🔧 Visit the Workloads dashboard to initialize capacity monitoring\n⚙️ Check agent configuration for workload reporting\n🔄 Restart workload monitoring services if needed", relatedIds };
    }
    
    const totalCapacity = workloads.reduce((sum: number, w: any) => sum + w.capacity, 0);
    const totalCurrentTasks = workloads.reduce((sum: number, w: any) => sum + w.currentTasks, 0);
    const avgUtilization = workloads.reduce((sum: number, w: any) => sum + w.utilizationRate, 0) / workloads.length;
    const overloaded = workloads.filter((w: any) => w.utilizationRate > 85);
    const critical = workloads.filter((w: any) => w.utilizationRate > 100);
    const underutilized = workloads.filter((w: any) => w.utilizationRate < 50);
    const systemUtilization = Math.round((totalCurrentTasks/totalCapacity)*100);
    
    relatedIds.push(...workloads.map((w: any) => w.id));
    
    let answer = `📊 **REAL-TIME WORKLOAD ANALYSIS**\n\n`;
    
    // System overview
    answer += `**SYSTEM CAPACITY:**\n`;
    answer += `🏭 Total Capacity: ${totalCapacity} tasks\n`;
    answer += `⚙️ Current Load: ${totalCurrentTasks} tasks\n`;
    answer += `📈 System Utilization: ${systemUtilization}%\n`;
    answer += `📊 Average Agent Utilization: ${Math.round(avgUtilization)}%\n\n`;
    
    // Critical alerts
    if (critical.length > 0) {
      answer += `🚨 **CRITICAL OVERLOAD ALERT:**\n`;
      critical.forEach((agent: any) => {
        answer += `❗ **${agent.agentId}**: ${agent.currentTasks}/${agent.capacity} tasks (${agent.utilizationRate}%)\n`;
        answer += `   Status: EXCEEDING CAPACITY - immediate rebalancing required\n`;
      });
      answer += `\n`;
    }
    
    // Overloaded agents
    if (overloaded.length > 0) {
      answer += `⚠️ **OVERLOADED AGENTS:**\n`;
      overloaded.forEach((agent: any) => {
        const priority = agent.priority === 'high' ? '🔥 HIGH' : agent.priority === 'medium' ? '📊 MED' : '📝 LOW';
        answer += `• **${agent.agentId}** (${priority}): ${agent.currentTasks}/${agent.capacity} tasks (${agent.utilizationRate}%)\n`;
      });
      answer += `\n`;
    }
    
    // Available capacity
    if (underutilized.length > 0) {
      const availableCapacity = underutilized.reduce((sum: number, a: any) => sum + (a.capacity - a.currentTasks), 0);
      answer += `✅ **AVAILABLE CAPACITY:**\n`;
      answer += `💡 ${availableCapacity} tasks can be redistributed to:\n`;
      underutilized.forEach((agent: any) => {
        const available = agent.capacity - agent.currentTasks;
        answer += `• **${agent.agentId}**: ${available} additional tasks available (${agent.utilizationRate}% used)\n`;
      });
      answer += `\n`;
    }
    
    // Optimization recommendations
    answer += `**IMMEDIATE RECOMMENDATIONS:**\n`;
    if (critical.length > 0) {
      const excessTasks = critical.reduce((sum: number, a: any) => sum + (a.currentTasks - a.capacity), 0);
      answer += `🚨 CRITICAL: Redistribute ${excessTasks} excess tasks immediately\n`;
    }
    if (overloaded.length > 0 && underutilized.length > 0) {
      answer += `⚖️ REBALANCE: Move tasks from ${overloaded.length} overloaded to ${underutilized.length} available agents\n`;
    }
    if (systemUtilization > 90) {
      answer += `📈 SCALE UP: System at ${systemUtilization}% - consider expanding agent capacity\n`;
    } else if (systemUtilization < 60) {
      answer += `💡 OPTIMIZE: System underutilized at ${systemUtilization}% - opportunity for more work\n`;
    }
    
    answer += `\n**NEXT STEPS:**\n`;
    answer += `📋 Visit Workloads dashboard for detailed capacity management\n`;
    answer += `⚡ Use "Apply Rebalancing" buttons for immediate task redistribution\n`;
    answer += `🔄 Enable automatic workload balancing to prevent future overloads\n`;
    
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