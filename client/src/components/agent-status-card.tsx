import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import type { Agent } from "@shared/schema";

interface AgentStatusCardProps {
  agent: Agent;
}

export function AgentStatusCard({ agent }: AgentStatusCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "bg-green-100 text-green-800";
      case "conflict":
        return "bg-yellow-100 text-yellow-800";
      case "delayed":
        return "bg-orange-100 text-orange-800";
      case "error":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "healthy":
        return "Healthy";
      case "conflict":
        return "Conflict";
      case "delayed":
        return "Delayed";
      case "error":
        return "Error";
      default:
        return "Unknown";
    }
  };

  const getIconColor = (color: string) => {
    const colorMap: Record<string, string> = {
      "bg-primary": "text-primary",
      "bg-success-green": "text-green-600",
      "bg-purple-600": "text-purple-600",
      "bg-indigo-600": "text-indigo-600",
      "bg-teal-600": "text-teal-600",
      "bg-pink-600": "text-pink-600"
    };
    return colorMap[color] || "text-gray-600";
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 ${agent.color} rounded-lg flex items-center justify-center`}>
              <i className={`${agent.icon} text-white`}></i>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">{agent.name}</h4>
              <p className="text-sm text-gray-600">
                Active {formatDistanceToNow(new Date(agent.lastActive), { addSuffix: true })}
              </p>
            </div>
          </div>
          <Badge className={getStatusColor(agent.status)}>
            <div className="w-2 h-2 bg-current rounded-full mr-2"></div>
            {getStatusLabel(agent.status)}
          </Badge>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Last Report:</span>
            <span className="text-gray-900">{agent.lastReport}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Success Rate:</span>
            <span className="text-gray-900">{agent.successRate}%</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Strategic Alignment:</span>
            <span className="text-green-600 font-medium">{agent.strategicAlignment}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
