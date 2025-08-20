import { Button } from "@/components/ui/button";
import { Brain, Loader2 } from "lucide-react";
import { useAgent } from "@/hooks/useAgent";
import type { AgentId } from "../../../../server/models/AgentState";

interface AutoResolveButtonProps {
  agentId: AgentId;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  disabled?: boolean;
}

export function AutoResolveButton({ 
  agentId, 
  variant = "destructive", 
  size = "sm",
  className = "",
  disabled = false
}: AutoResolveButtonProps) {
  const { resolve, update } = useAgent(agentId);

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      disabled={disabled || update.isPending}
      onClick={() => resolve()}
      data-testid={`button-auto-resolve-${agentId}`}
    >
      {update.isPending ? (
        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
      ) : (
        <Brain className="h-4 w-4 mr-1" />
      )}
      {update.isPending ? "Resolving..." : "Auto-Resolve"}
    </Button>
  );
}