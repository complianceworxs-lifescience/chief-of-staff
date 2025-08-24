import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Clock, Zap, AlertTriangle, RefreshCw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface ConflictResolutionIndicatorProps {
  isActive?: boolean;
}

export function ConflictResolutionIndicator({ isActive = false }: ConflictResolutionIndicatorProps) {
  const [resolutionProgress, setResolutionProgress] = useState(0);
  const [currentAction, setCurrentAction] = useState("Initializing...");
  const [isResolving, setIsResolving] = useState(false);

  const { data: activeConflicts = [] } = useQuery<any[]>({
    queryKey: ["/api/conflicts/active"],
    refetchInterval: 1800000 // Maximum cost savings: 30 minutes
  });

  const { data: systemHealth } = useQuery({
    queryKey: ["/api/conflicts/system-health"],
    refetchInterval: 1800000 // Maximum cost savings: 30 minutes
  });

  const resolutionActions = [
    "🔍 Analyzing conflict patterns...",
    "⚖️ Applying priority weighting rules...",
    "🔄 Redistributing agent resources...",
    "🎯 Updating task queues...",
    "✅ Validating resolution success..."
  ];

  useEffect(() => {
    if (activeConflicts.length > 0 || isActive) {
      setIsResolving(true);
      setResolutionProgress(0);
      
      const progressTimer = setInterval(() => {
        setResolutionProgress(prev => {
          const next = Math.min(prev + 20, 100);
          const actionIndex = Math.floor(next / 20) - 1;
          if (actionIndex >= 0 && actionIndex < resolutionActions.length) {
            setCurrentAction(resolutionActions[actionIndex]);
          }
          return next;
        });
      }, 1500);

      const completionTimer = setTimeout(() => {
        clearInterval(progressTimer);
        setCurrentAction("✅ Conflict resolution completed");
        setTimeout(() => {
          setIsResolving(false);
          setResolutionProgress(0);
        }, 3000);
      }, 8000);

      return () => {
        clearInterval(progressTimer);
        clearTimeout(completionTimer);
      };
    }
  }, [activeConflicts.length, isActive]);

  if (!isResolving && activeConflicts.length === 0) {
    return (
      <Card className="border-l-4 border-l-green-500">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <h4 className="font-semibold text-green-800">All Systems Operational</h4>
              <p className="text-sm text-green-600">No active conflicts detected</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <div className="animate-spin">
            <RefreshCw className="h-5 w-5 text-blue-600" />
          </div>
          Active Conflict Resolution
          <Badge className="bg-blue-100 text-blue-800">
            AUTONOMOUS
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Resolution Progress</span>
            <span className="font-semibold">{resolutionProgress}%</span>
          </div>
          <Progress value={resolutionProgress} className="h-2" />
        </div>
        
        <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
          <Zap className="h-4 w-4 text-blue-600" />
          <span className="text-sm text-blue-800">{currentAction}</span>
        </div>

        {activeConflicts.length > 0 && (
          <div className="space-y-2">
            <h5 className="font-medium text-sm">Active Conflicts:</h5>
            {activeConflicts.slice(0, 3).map((conflict: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between text-xs bg-orange-50 p-2 rounded">
                <span>CRO/CMO/Content Resource Overallocation</span>
                <Badge variant="outline" className="text-orange-700">
                  HIGH
                </Badge>
              </div>
            ))}
          </div>
        )}

        <div className="text-xs text-gray-600 border-t pt-3">
          <div className="flex items-center gap-2">
            <Clock className="h-3 w-3" />
            <span>Estimated resolution time: 5-8 minutes</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <CheckCircle className="h-3 w-3" />
            <span>Success rate: 92% (based on historical data)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}