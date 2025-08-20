import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Clock, AlertTriangle, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export interface ResolutionStatus {
  id: string;
  predictionId: string;
  status: 'initiating' | 'analyzing' | 'executing' | 'resolved' | 'failed';
  startedAt: Date;
  resolvedAt?: Date;
  actions: Array<{
    description: string;
    completedAt?: Date;
    status: 'pending' | 'in-progress' | 'completed' | 'failed';
  }>;
  conflictDetails: {
    agents: string[];
    description: string;
  };
}

interface ResolutionTrackerProps {
  resolutions: ResolutionStatus[];
  onDismiss: (resolutionId: string) => void;
}

export function ResolutionTracker({ resolutions, onDismiss }: ResolutionTrackerProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const getStatusIcon = (status: ResolutionStatus['status']) => {
    switch (status) {
      case 'initiating':
      case 'analyzing':
      case 'executing':
        return <Clock className="h-4 w-4 animate-spin text-blue-600" />;
      case 'resolved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
    }
  };

  const getStatusColor = (status: ResolutionStatus['status']) => {
    switch (status) {
      case 'initiating':
        return 'bg-blue-100 text-blue-800';
      case 'analyzing':
        return 'bg-yellow-100 text-yellow-800';
      case 'executing':
        return 'bg-purple-100 text-purple-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
    }
  };

  const getProgressPercentage = (resolution: ResolutionStatus) => {
    const completedActions = resolution.actions.filter(a => a.status === 'completed').length;
    return (completedActions / Math.max(resolution.actions.length, 1)) * 100;
  };

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  if (resolutions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Resolution Tracking</h3>
        <Badge variant="outline" className="bg-blue-100 text-blue-800">
          {resolutions.length} Active
        </Badge>
      </div>

      <div className="space-y-3">
        {resolutions.map((resolution) => (
          <Card key={resolution.id} className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(resolution.status)}
                  <CardTitle className="text-base">
                    Conflict Resolution: {resolution.conflictDetails.agents.join(' vs ')}
                  </CardTitle>
                  <Badge className={getStatusColor(resolution.status)}>
                    {resolution.status.charAt(0).toUpperCase() + resolution.status.slice(1)}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  {resolution.status === 'resolved' || resolution.status === 'failed' ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDismiss(resolution.id)}
                      data-testid={`dismiss-resolution-${resolution.id}`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  ) : null}
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              <div className="space-y-3">
                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Progress</span>
                    <span className="text-gray-600">
                      {Math.round(getProgressPercentage(resolution))}%
                    </span>
                  </div>
                  <Progress value={getProgressPercentage(resolution)} className="h-2" />
                </div>

                {/* Timing Information */}
                <div className="flex justify-between text-sm text-gray-500">
                  <span>
                    Started {formatDistanceToNow(resolution.startedAt, { addSuffix: true })}
                  </span>
                  {resolution.resolvedAt && (
                    <span>
                      Resolved {formatDistanceToNow(resolution.resolvedAt, { addSuffix: true })}
                    </span>
                  )}
                </div>

                {/* Conflict Description */}
                <p className="text-sm text-gray-600">
                  {resolution.conflictDetails.description}
                </p>

                {/* Action Steps */}
                <div className="space-y-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleExpanded(resolution.id)}
                    className="text-blue-600 hover:text-blue-800"
                    data-testid={`expand-resolution-${resolution.id}`}
                  >
                    {expandedItems.has(resolution.id) ? 'Hide' : 'Show'} Resolution Steps
                  </Button>

                  {expandedItems.has(resolution.id) && (
                    <div className="space-y-2 pl-4 border-l-2 border-gray-200">
                      {resolution.actions.map((action, index) => (
                        <div key={index} className="flex items-center gap-2">
                          {action.status === 'completed' ? (
                            <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                          ) : action.status === 'in-progress' ? (
                            <Clock className="h-4 w-4 text-blue-600 animate-spin flex-shrink-0" />
                          ) : action.status === 'failed' ? (
                            <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
                          ) : (
                            <div className="w-4 h-4 border-2 border-gray-300 rounded-full flex-shrink-0" />
                          )}
                          <div className="flex-1">
                            <p className="text-sm text-gray-900">{action.description}</p>
                            {action.completedAt && (
                              <p className="text-xs text-gray-500">
                                Completed {formatDistanceToNow(action.completedAt, { addSuffix: true })}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}