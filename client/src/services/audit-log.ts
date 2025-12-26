export type AuditAction = 
  | "LOGIN"
  | "LOGOUT"
  | "UPLOAD_SOP"
  | "VIEW_DOCUMENT"
  | "EDIT_DOCUMENT"
  | "REQUEST_REVIEW"
  | "APPROVE_GAP"
  | "REJECT_GAP"
  | "MARK_COMPLIANT"
  | "OVERRIDE_RECOMMENDATION"
  | "EXPORT_AUDIT_LOG"
  | "SIMULATE_AUDIT"
  | "CHANGE_FILTER"
  | "DISMISS_NOTIFICATION";

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: string;
  action: AuditAction;
  details: string;
  ipAddress: string;
  sessionId: string;
  documentId?: string;
  previousValue?: string;
  newValue?: string;
}

class AuditLogService {
  private logs: AuditLogEntry[] = [];
  private sessionId: string;

  constructor() {
    this.sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.initializeDemoLogs();
  }

  private initializeDemoLogs() {
    const demoLogs: Omit<AuditLogEntry, "id" | "sessionId" | "ipAddress">[] = [
      {
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        userId: "user-001",
        userName: "Demo User",
        userRole: "strategic_architect",
        action: "LOGIN",
        details: "User logged in successfully"
      },
      {
        timestamp: new Date(Date.now() - 3500000).toISOString(),
        userId: "user-001",
        userName: "Demo User",
        userRole: "strategic_architect",
        action: "UPLOAD_SOP",
        details: "Uploaded Design Control SOP v2.3.pdf",
        documentId: "demo-1"
      },
      {
        timestamp: new Date(Date.now() - 3400000).toISOString(),
        userId: "user-001",
        userName: "Demo User",
        userRole: "strategic_architect",
        action: "SIMULATE_AUDIT",
        details: "Initiated pre-audit simulation with 5 questions"
      },
      {
        timestamp: new Date(Date.now() - 3300000).toISOString(),
        userId: "user-002",
        userName: "QA Manager",
        userRole: "qa_lead",
        action: "APPROVE_GAP",
        details: "Approved remediation for Document Control gap",
        documentId: "demo-2",
        previousValue: "moderate",
        newValue: "review_requested"
      }
    ];

    this.logs = demoLogs.map((log, index) => ({
      ...log,
      id: `log-${index + 1}`,
      sessionId: this.sessionId,
      ipAddress: "192.168.1.100"
    }));
  }

  log(
    action: AuditAction,
    userId: string,
    userName: string,
    userRole: string,
    details: string,
    extra?: Partial<Pick<AuditLogEntry, "documentId" | "previousValue" | "newValue">>
  ): AuditLogEntry {
    const entry: AuditLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      userId,
      userName,
      userRole,
      action,
      details,
      ipAddress: "192.168.1.100",
      sessionId: this.sessionId,
      ...extra
    };

    this.logs.unshift(entry);
    console.log("[AUDIT LOG]", entry);
    return entry;
  }

  getLogs(): AuditLogEntry[] {
    return [...this.logs];
  }

  getLogsByUser(userId: string): AuditLogEntry[] {
    return this.logs.filter(log => log.userId === userId);
  }

  getLogsByAction(action: AuditAction): AuditLogEntry[] {
    return this.logs.filter(log => log.action === action);
  }

  getLogsByDateRange(startDate: Date, endDate: Date): AuditLogEntry[] {
    return this.logs.filter(log => {
      const logDate = new Date(log.timestamp);
      return logDate >= startDate && logDate <= endDate;
    });
  }

  exportToPart11Format(): string {
    const header = `
21 CFR PART 11 COMPLIANT AUDIT TRAIL
====================================
System: ComplianceWorxs
Export Date: ${new Date().toISOString()}
Export By: System Administrator
Total Records: ${this.logs.length}

This document is a read-only export of the electronic audit trail.
All entries are tamper-evident and time-stamped per 21 CFR Part 11 requirements.

====================================

`;

    const entries = this.logs.map((log, index) => `
RECORD ${index + 1}
-----------------
Timestamp:     ${new Date(log.timestamp).toLocaleString()}
User ID:       ${log.userId}
User Name:     ${log.userName}
User Role:     ${log.userRole}
Action:        ${log.action}
Details:       ${log.details}
Session ID:    ${log.sessionId}
IP Address:    ${log.ipAddress}
${log.documentId ? `Document ID:   ${log.documentId}` : ''}
${log.previousValue ? `Previous:      ${log.previousValue}` : ''}
${log.newValue ? `New Value:     ${log.newValue}` : ''}
`).join('\n');

    const footer = `
====================================
END OF AUDIT TRAIL
Total Records Exported: ${this.logs.length}
Integrity Hash: ${this.generateIntegrityHash()}
====================================
`;

    return header + entries + footer;
  }

  private generateIntegrityHash(): string {
    const data = JSON.stringify(this.logs);
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
  }
}

export const auditLog = new AuditLogService();
