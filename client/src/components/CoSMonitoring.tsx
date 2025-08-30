import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertTriangle, Clock } from "lucide-react";

interface CoSStatus {
  report: string;
}

export function CoSMonitoring() {
  const { data: status, isLoading } = useQuery<CoSStatus>({
    queryKey: ['/api/cos/status-report'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2" data-testid="cos-loading">
        <Clock className="h-4 w-4 animate-spin" />
        <span className="text-sm">Checking status...</span>
      </div>
    );
  }

  if (!status?.report) {
    return (
      <div className="flex items-center gap-2" data-testid="cos-error">
        <AlertTriangle className="h-4 w-4 text-red-500" />
        <span className="text-sm text-red-600">Status unavailable</span>
      </div>
    );
  }

  // Parse the CoS report for key metrics
  const report = status.report;
  const deliveryMatch = report.match(/Delivery: (\d+)\/(\d+) on-time \((\d+)%\)/);
  const commentaryMatch = report.match(/Commentary present: (\d+)\/(\d+) \((\d+)%\)/);
  const escalationsMatch = report.match(/Escalations: (\d+)/);
  
  const deliveryRate = deliveryMatch ? parseInt(deliveryMatch[3]) : 0;
  const commentaryRate = commentaryMatch ? parseInt(commentaryMatch[3]) : 100;
  const escalationCount = escalationsMatch ? parseInt(escalationsMatch[1]) : 0;

  const getStatusColor = (rate: number) => {
    if (rate >= 95) return "text-green-600";
    if (rate >= 80) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-3" data-testid="cos-monitoring">
      {/* Agent Delivery Status */}
      <div className="flex justify-between items-center">
        <span className="text-sm">Agent Delivery</span>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${getStatusColor(deliveryRate)}`}>
            {deliveryRate}%
          </span>
          {deliveryRate >= 95 ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-red-500" />
          )}
        </div>
      </div>

      {/* Commentary Verification */}
      <div className="flex justify-between items-center">
        <span className="text-sm">Commentary Check</span>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${getStatusColor(commentaryRate)}`}>
            {commentaryRate}%
          </span>
          <CheckCircle className="h-4 w-4 text-green-600" />
        </div>
      </div>

      {/* Escalation Count */}
      <div className="flex justify-between items-center">
        <span className="text-sm">Escalations Today</span>
        <Badge 
          variant={escalationCount === 0 ? "default" : "destructive"}
          className="text-xs"
          data-testid="escalation-count"
        >
          {escalationCount}
        </Badge>
      </div>

      {/* System Status Indicator */}
      <div className="pt-2 border-t">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-gray-600">CoS monitoring active</span>
        </div>
      </div>
    </div>
  );
}