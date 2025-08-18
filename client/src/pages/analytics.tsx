import { useQuery } from "@tanstack/react-query";
import { PredictiveAnalytics } from "@/components/predictive-analytics";
import type { Agent, Conflict } from "@shared/schema";

export default function AnalyticsPage() {
  const { data: agents = [] } = useQuery<Agent[]>({
    queryKey: ["/api/agents"]
  });

  const { data: conflicts = [] } = useQuery<Conflict[]>({
    queryKey: ["/api/conflicts"]
  });

  return (
    <div className="space-y-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Predictive Analytics</h1>
        <p className="text-gray-600 mt-2">
          Interactive command center for conflict prediction and resolution
        </p>
      </div>
      
      <PredictiveAnalytics conflicts={conflicts} agents={agents} />
    </div>
  );
}