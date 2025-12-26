import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Download, FileText, Shield, Clock, User, Activity
} from "lucide-react";
import { auditLog, type AuditLogEntry } from "@/services/audit-log";

const colors = {
  textPrimary: "#1C1C1C",
  textSecondary: "#6B7280",
  bgMain: "#F9FAFB",
  cardBg: "#FFFFFF",
  borderLight: "#E5E7EB",
  accentWarm: "#FF6B6B",
  accentWellness: "#2D5A27",
  accentTeal: "#00A3A1",
  accentTrust: "#002D62",
};

interface AuditLogModalProps {
  open: boolean;
  onClose: () => void;
}

const actionColors: Record<string, { bg: string; text: string }> = {
  LOGIN: { bg: "#DBEAFE", text: "#1D4ED8" },
  LOGOUT: { bg: "#F3E8FF", text: "#7C3AED" },
  UPLOAD_SOP: { bg: "#DCFCE7", text: colors.accentWellness },
  APPROVE_GAP: { bg: "#DCFCE7", text: colors.accentWellness },
  REJECT_GAP: { bg: "#FEE2E2", text: colors.accentWarm },
  SIMULATE_AUDIT: { bg: "#E0F2FE", text: "#0284C7" },
  OVERRIDE_RECOMMENDATION: { bg: "#FEF3C7", text: "#D97706" },
  EXPORT_AUDIT_LOG: { bg: "#F3E8FF", text: "#7C3AED" },
  DEFAULT: { bg: colors.bgMain, text: colors.textSecondary }
};

function getActionColor(action: string) {
  return actionColors[action] || actionColors.DEFAULT;
}

export function AuditLogModal({ open, onClose }: AuditLogModalProps) {
  const [logs] = useState<AuditLogEntry[]>(auditLog.getLogs());

  const handleExport = () => {
    const content = auditLog.exportToPart11Format();
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `21-CFR-Part-11-Audit-Log-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    auditLog.log(
      "EXPORT_AUDIT_LOG",
      "user-001",
      "Demo User",
      "strategic_architect",
      "Exported 21 CFR Part 11 compliant audit log"
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh]" style={{ backgroundColor: colors.cardBg }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2" style={{ color: colors.textPrimary }}>
            <Shield className="w-5 h-5" style={{ color: colors.accentTrust }} />
            21 CFR Part 11 Audit Trail
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div 
            className="p-4 rounded-lg border flex items-center justify-between"
            style={{ backgroundColor: colors.bgMain, borderColor: colors.borderLight }}
          >
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "rgba(0, 45, 98, 0.1)" }}
              >
                <FileText className="w-5 h-5" style={{ color: colors.accentTrust }} />
              </div>
              <div>
                <p className="font-semibold text-sm" style={{ color: colors.textPrimary }}>
                  Compliant Audit Trail
                </p>
                <p className="text-xs" style={{ color: colors.textSecondary }}>
                  {logs.length} records • Tamper-evident • Time-stamped
                </p>
              </div>
            </div>
            <Button
              onClick={handleExport}
              className="text-white"
              style={{ backgroundColor: colors.accentTrust }}
              data-testid="button-export-audit-log"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Official Audit Log
            </Button>
          </div>

          <ScrollArea className="h-96 rounded-lg border" style={{ borderColor: colors.borderLight }}>
            <div className="space-y-1 p-2">
              {logs.map((log) => {
                const actionColor = getActionColor(log.action);
                return (
                  <div
                    key={log.id}
                    className="p-3 rounded-lg border transition-colors"
                    style={{ borderColor: colors.borderLight, backgroundColor: colors.cardBg }}
                    data-testid={`audit-log-entry-${log.id}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge
                            className="text-xs"
                            style={{ backgroundColor: actionColor.bg, color: actionColor.text }}
                          >
                            {log.action.replace(/_/g, " ")}
                          </Badge>
                          <span className="text-xs" style={{ color: colors.textSecondary }}>
                            {log.sessionId.slice(0, 12)}...
                          </span>
                        </div>
                        <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                          {log.details}
                        </p>
                        <div className="flex items-center gap-4 mt-2">
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" style={{ color: colors.textSecondary }} />
                            <span className="text-xs" style={{ color: colors.textSecondary }}>
                              {log.userName} ({log.userRole})
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" style={{ color: colors.textSecondary }} />
                            <span className="text-xs" style={{ color: colors.textSecondary }}>
                              {new Date(log.timestamp).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Activity className="w-4 h-4 flex-shrink-0" style={{ color: colors.textSecondary }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          <div 
            className="p-3 rounded-lg text-center text-xs"
            style={{ backgroundColor: "rgba(45, 90, 39, 0.1)", color: colors.accentWellness }}
          >
            <Shield className="w-4 h-4 inline mr-2" />
            All records are electronically signed and time-stamped per 21 CFR Part 11 requirements
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
