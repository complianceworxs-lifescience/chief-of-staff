import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, CheckCircle, AlertTriangle, Clock, DollarSign } from "lucide-react";
import { Link } from "wouter";

interface GovernanceStatus {
  notify_mode: string;
  allow_auto_risk: string;
  budget_cap_cents: number;
  canary_min: number;
  outcome_sla_hours: number;
  escalate_owner: string;
  dry_run: boolean;
}

interface ActionEvent {
  type: string;
  action_id: string;
  ts: string;
  agent: string;
  action: string;
  status: string;
  policy?: {
    auto_execute: boolean;
    requires_approval: boolean;
    violation: boolean;
    reasons: string[];
    notify_mode: string;
  };
}

export default function GovernanceDashboard() {
  const { data: governanceStatus, isLoading: statusLoading } = useQuery<GovernanceStatus>({
    queryKey: ["/api/governance/status"]
  });

  const { data: recentActions, isLoading: actionsLoading } = useQuery<ActionEvent[]>({
    queryKey: ["/api/actions/recent"]
  });

  const isExceptionsOnly = governanceStatus?.notify_mode === "exceptions_only";
  const budgetDollars = (governanceStatus?.budget_cap_cents || 0) / 100;

  const autoExecutedActions = recentActions?.filter(action => 
    action.policy?.auto_execute && action.status === "executing"
  ) || [];

  const queuedActions = recentActions?.filter(action => 
    action.status === "queued"
  ) || [];

  const escalatedActions = recentActions?.filter(action => 
    action.type === "escalation"
  ) || [];

  if (statusLoading || actionsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading governance status...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href="/governance">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Governance
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Exceptions-Only Governance</h1>
          <p className="text-gray-600">Autonomous execution with policy enforcement</p>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Shield className={`h-8 w-8 ${isExceptionsOnly ? 'text-green-600' : 'text-yellow-600'}`} />
              <div>
                <div className="text-sm text-gray-600">Notification Mode</div>
                <div className="font-semibold">
                  <Badge variant={isExceptionsOnly ? "default" : "secondary"}>
                    {governanceStatus?.notify_mode || "Unknown"}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-blue-600" />
              <div>
                <div className="text-sm text-gray-600">Monthly Budget Cap</div>
                <div className="font-semibold text-lg">${budgetDollars}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-orange-600" />
              <div>
                <div className="text-sm text-gray-600">Auto Risk Level</div>
                <div className="font-semibold">
                  <Badge variant="outline">
                    {governanceStatus?.allow_auto_risk || "low"}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-purple-600" />
              <div>
                <div className="text-sm text-gray-600">Outcome SLA</div>
                <div className="font-semibold">{governanceStatus?.outcome_sla_hours || 24}h</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Auto-Executed Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 mb-2">
              {autoExecutedActions.length}
            </div>
            <p className="text-sm text-gray-600">
              Actions executed autonomously without escalation
            </p>
            {autoExecutedActions.length > 0 && (
              <div className="mt-3 space-y-1">
                {autoExecutedActions.slice(0, 3).map((action) => (
                  <div key={action.action_id} className="text-xs text-gray-500">
                    {action.agent}: {action.action}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              Queued Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600 mb-2">
              {queuedActions.length}
            </div>
            <p className="text-sm text-gray-600">
              Actions requiring approval due to policy violations
            </p>
            {queuedActions.length > 0 && (
              <div className="mt-3 space-y-1">
                {queuedActions.slice(0, 3).map((action) => (
                  <div key={action.action_id} className="text-xs text-gray-500">
                    {action.agent}: {action.action}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Escalations to Chief of Staff
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 mb-2">
              {escalatedActions.length}
            </div>
            <p className="text-sm text-gray-600">
              Policy breaches escalated for review
            </p>
            {escalatedActions.length > 0 && (
              <div className="mt-3 space-y-1">
                {escalatedActions.slice(0, 3).map((action) => (
                  <div key={action.action_id} className="text-xs text-gray-500">
                    {action.agent}: Policy violation
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Configuration Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Governance Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Execution Rules</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Auto-execute low-risk, zero-spend recommendations</li>
                <li>• DRY_RUN mode: {governanceStatus?.dry_run ? "Enabled (safe)" : "Disabled"}</li>
                <li>• Minimum canary size: {governanceStatus?.canary_min || 10}</li>
                <li>• Escalation target: {governanceStatus?.escalate_owner || "ChiefOfStaff"}</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Escalation Triggers</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Risk level &gt; {governanceStatus?.allow_auto_risk || "low"}</li>
                <li>• Any spend &gt; $0</li>
                <li>• Canary failures</li>
                <li>• Missing outcomes &gt; {governanceStatus?.outcome_sla_hours || 24}h</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Success Notice */}
      {isExceptionsOnly && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <h4 className="font-medium text-green-900">Exceptions-Only Mode Active</h4>
                <p className="text-sm text-green-700 mt-1">
                  Your system is operating autonomously. You'll only be notified for policy breaches, 
                  spend &gt; $0, or performance threshold violations. All low-risk, zero-spend 
                  recommendations are auto-executing with DRY_RUN canaries.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}