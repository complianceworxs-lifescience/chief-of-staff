import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatDistanceToNow } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import type { StrategicObjective, Agent } from "@shared/schema";

export function StrategicAlignment() {
  const { data: objectives = [] } = useQuery<StrategicObjective[]>({
    queryKey: ["/api/objectives"]
  });

  const { data: agentsData } = useQuery({
    queryKey: ["/api/agents"]
  });
  
  const agents = agentsData?.items || [];

  const getContributingAgentNames = (agentIds: string[]) => {
    return agentIds
      .map(id => agents.find(a => a.id === id)?.displayName || agents.find(a => a.id === id)?.name)
      .filter(Boolean)
      .join(", ");
  };

  const getProgressColor = (progress: number, lastUpdate: string) => {
    const daysSinceUpdate = Math.floor((Date.now() - new Date(lastUpdate).getTime()) / (1000 * 60 * 60 * 24));
    
    // If data is stale (>7 days), show as warning regardless of progress
    if (daysSinceUpdate > 7) return "bg-orange-500";
    
    // Normal progress-based coloring for fresh data
    if (progress >= 70) return "bg-green-500";
    if (progress >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getProgressLabel = (progress: number, lastUpdate: string) => {
    const daysSinceUpdate = Math.floor((Date.now() - new Date(lastUpdate).getTime()) / (1000 * 60 * 60 * 24));
    
    // If data is stale, show stale status regardless of progress
    if (daysSinceUpdate > 7) return "text-orange-600";
    
    // Normal progress-based labeling for fresh data
    if (progress >= 70) return "text-green-600";
    if (progress >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  const getStatusText = (progress: number, lastUpdate: string) => {
    const daysSinceUpdate = Math.floor((Date.now() - new Date(lastUpdate).getTime()) / (1000 * 60 * 60 * 24));
    
    // If data is stale, show stale status regardless of progress
    if (daysSinceUpdate > 7) return "stale";
    
    // Normal progress-based status for fresh data
    if (progress >= 70) return "aligned";
    if (progress >= 50) return "at risk";
    return "behind";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium text-gray-900">
          Q3 2025 Objectives Progress
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {objectives.map((objective) => (
            <div key={objective.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900">
                  {objective.title}
                </span>
                <span className={`text-sm font-semibold ${getProgressLabel(objective.progress, objective.lastUpdate)}`}>
                  {objective.progress}% {getStatusText(objective.progress, objective.lastUpdate)}
                </span>
              </div>
              
              <Progress 
                value={objective.progress} 
                className="w-full h-2 mb-3"
              />
              
              <div className="flex items-center space-x-4 text-xs text-gray-600">
                <span>
                  Contributing Agents: 
                  <strong className="ml-1">
                    {getContributingAgentNames(objective.contributingAgents)}
                  </strong>
                </span>
                <span>•</span>
                <span>
                  Last Update: 
                  <span className="ml-1">
                    {formatDistanceToNow(new Date(objective.lastUpdate), { addSuffix: true })}
                  </span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
