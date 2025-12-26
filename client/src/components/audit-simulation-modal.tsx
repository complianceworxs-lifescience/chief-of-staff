import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  PlayCircle, FileText, CheckCircle, XCircle, 
  AlertTriangle, Download, Loader2, ClipboardCheck
} from "lucide-react";

const colors = {
  textPrimary: "#1C1C1C",
  textSecondary: "#6B7280",
  bgMain: "#F9FAFB",
  cardBg: "#FFFFFF",
  borderLight: "#E5E7EB",
  accentWarm: "#FF6B6B",
  accentWellness: "#2D5A27",
  accentTeal: "#00A3A1",
};

interface AuditQuestion {
  id: string;
  category: string;
  question: string;
  expectedEvidence: string;
  status: "pass" | "fail" | "pending";
  findings?: string;
  remediationLink?: string;
}

const auditQuestionPool: Omit<AuditQuestion, "status" | "findings">[] = [
  {
    id: "q1",
    category: "Design Control",
    question: "Provide the objective evidence linking your Design Inputs to your Design Outputs. Is there a documented Verification Matrix?",
    expectedEvidence: "Design verification matrix per 21 CFR 820.30 / ISO 13485:7.3 with traceable linkage between inputs and outputs.",
  },
  {
    id: "q2",
    category: "Risk Management",
    question: "Show how your identified hazards are linked to specific risk mitigations in your SOP. Have these mitigations been verified for effectiveness?",
    expectedEvidence: "Risk management file per ISO 14971 with hazard-mitigation linkage and verification records.",
  },
  {
    id: "q3",
    category: "CAPA",
    question: "Explain the statistical method used to determine if a non-conformance requires a formal CAPA. Where is the 'Definition of Significant' documented?",
    expectedEvidence: "CAPA procedure with documented significance threshold and statistical methodology.",
  },
  {
    id: "q4",
    category: "Document Control",
    question: "Demonstrate the 'Chain of Approval' for the current version of this SOP. Were all required stakeholders present for the signature cycle?",
    expectedEvidence: "Document control procedure with complete approval chain and stakeholder signatures.",
  },
  {
    id: "q5",
    category: "Training & Competence",
    question: "Provide the training record for the specific individual who performed the last 'Verification' task. Is their training up to date against the latest SOP revision?",
    expectedEvidence: "Training records with competency assessments linked to current SOP revision.",
  },
];

interface SOPDocument {
  id: string;
  name: string;
  regulatoryStandard: string;
  status: "major" | "moderate" | "compliant" | "review_requested";
}

interface AuditSimulationModalProps {
  open: boolean;
  onClose: () => void;
  documents: SOPDocument[];
  onRemediationClick?: (gapId: string) => void;
}

export function AuditSimulationModal({ 
  open, 
  onClose, 
  documents,
  onRemediationClick 
}: AuditSimulationModalProps) {
  const [isSimulating, setIsSimulating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [questions, setQuestions] = useState<AuditQuestion[]>([]);
  const [simulationComplete, setSimulationComplete] = useState(false);

  const startSimulation = () => {
    setIsSimulating(true);
    setProgress(0);
    setSimulationComplete(false);

    const shuffled = [...auditQuestionPool].sort(() => Math.random() - 0.5);
    const selectedQuestions = shuffled.slice(0, 5).map(q => ({
      ...q,
      status: "pending" as const,
    }));
    setQuestions(selectedQuestions);

    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex < 5) {
        setProgress((currentIndex + 1) * 20);
        
        setQuestions(prev => prev.map((q, idx) => {
          if (idx === currentIndex) {
            const hasRelatedDoc = documents.some(d => 
              (q.category === "Design Control" && d.regulatoryStandard.includes("820")) ||
              (q.category === "Document Control" && d.status === "compliant") ||
              (q.category === "CAPA" && d.status === "compliant") ||
              (q.category === "Training" && d.status === "compliant") ||
              (q.category === "Complaint Handling" && d.status !== "major")
            );
            
            const hasMajorGap = documents.some(d => d.status === "major");
            const hasModerateGap = documents.some(d => d.status === "moderate");
            
            let status: "pass" | "fail";
            let findings: string | undefined;
            
            if (q.category === "Design Control" && hasMajorGap) {
              status = "fail";
              findings = "Missing formal design verification matrix. Gap identified in Design Control SOP.";
            } else if (q.category === "Document Control" && hasModerateGap) {
              status = "fail";
              findings = "Non-specific language in record retention requirements.";
            } else if (hasRelatedDoc && documents.length > 0) {
              status = Math.random() > 0.3 ? "pass" : "fail";
              if (status === "fail") {
                findings = "Insufficient objective evidence provided during simulation.";
              }
            } else {
              status = documents.length === 0 ? "fail" : (Math.random() > 0.5 ? "pass" : "fail");
              if (status === "fail") {
                findings = "No documented procedure available for this requirement.";
              }
            }
            
            return { ...q, status, findings };
          }
          return q;
        }));
        
        currentIndex++;
      } else {
        clearInterval(interval);
        setIsSimulating(false);
        setSimulationComplete(true);
      }
    }, 800);
  };

  const passCount = questions.filter(q => q.status === "pass").length;
  const failCount = questions.filter(q => q.status === "fail").length;
  const overallGrade = simulationComplete 
    ? (passCount >= 4 ? "PASS" : passCount >= 3 ? "CONDITIONAL" : "FAIL")
    : null;

  const handleExportPDF = () => {
    const reportContent = `
SIMULATED AUDIT REPORT
=====================
Generated: ${new Date().toLocaleString()}
Overall Result: ${overallGrade}
Score: ${passCount}/5 Questions Passed

AUDIT QUESTIONS & FINDINGS
--------------------------
${questions.map((q, i) => `
${i + 1}. ${q.category}
   Question: ${q.question}
   Status: ${q.status.toUpperCase()}
   ${q.findings ? `Findings: ${q.findings}` : ''}
`).join('\n')}

RECOMMENDATIONS
---------------
${failCount > 0 ? `
- Review and update SOPs for failed categories
- Ensure objective evidence is readily available
- Schedule follow-up assessment after remediation
` : `
- Continue maintaining current quality system
- Schedule periodic internal audits
`}
    `.trim();

    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-simulation-report-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const resetSimulation = () => {
    setQuestions([]);
    setProgress(0);
    setSimulationComplete(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto" style={{ backgroundColor: colors.cardBg }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2" style={{ color: colors.textPrimary }}>
            <ClipboardCheck className="w-5 h-5" style={{ color: colors.accentTeal }} />
            Pre-Audit Simulation Engine
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {!isSimulating && !simulationComplete && (
            <div className="text-center py-8">
              <div 
                className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: colors.bgMain }}
              >
                <PlayCircle className="w-10 h-10" style={{ color: colors.accentTeal }} />
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: colors.textPrimary }}>
                Virtual Auditor Ready
              </h3>
              <p className="text-sm mb-6 max-w-md mx-auto" style={{ color: colors.textSecondary }}>
                The AI auditor will stress-test your SOPs against 5 randomized high-frequency audit questions 
                to evaluate your audit readiness.
              </p>
              <Button
                onClick={startSimulation}
                className="px-8 text-white"
                style={{ backgroundColor: colors.accentTeal }}
                data-testid="button-start-simulation"
              >
                <PlayCircle className="w-4 h-4 mr-2" />
                Start Simulation
              </Button>
            </div>
          )}

          {isSimulating && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                  Simulating Audit...
                </span>
                <span className="text-sm" style={{ color: colors.textSecondary }}>
                  {Math.round(progress)}%
                </span>
              </div>
              <Progress value={progress} className="h-2" />
              
              <div className="flex items-center justify-center gap-2 py-4">
                <Loader2 className="w-5 h-5 animate-spin" style={{ color: colors.accentTeal }} />
                <span className="text-sm" style={{ color: colors.textSecondary }}>
                  Evaluating compliance evidence...
                </span>
              </div>
            </div>
          )}

          {questions.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-sm" style={{ color: colors.textPrimary }}>
                Audit Questions
              </h4>
              {questions.map((question, index) => (
                <div
                  key={question.id}
                  className="p-4 rounded-lg border"
                  style={{ 
                    borderColor: question.status === "pass" ? colors.accentWellness : 
                                question.status === "fail" ? colors.accentWarm : colors.borderLight,
                    backgroundColor: question.status === "pending" ? colors.bgMain : colors.cardBg
                  }}
                  data-testid={`audit-question-${question.id}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge 
                          variant="outline"
                          className="text-xs"
                          style={{ borderColor: colors.borderLight }}
                        >
                          {question.category}
                        </Badge>
                        <span className="text-xs" style={{ color: colors.textSecondary }}>
                          Question {index + 1}
                        </span>
                      </div>
                      <p className="text-sm font-medium mb-1" style={{ color: colors.textPrimary }}>
                        {question.question}
                      </p>
                      <p className="text-xs" style={{ color: colors.textSecondary }}>
                        Expected: {question.expectedEvidence}
                      </p>
                      {question.findings && (
                        <p className="text-xs mt-2 p-2 rounded" style={{ 
                          backgroundColor: "rgba(255, 107, 107, 0.1)",
                          color: colors.accentWarm
                        }}>
                          <AlertTriangle className="w-3 h-3 inline mr-1" />
                          {question.findings}
                        </p>
                      )}
                    </div>
                    <div className="flex-shrink-0">
                      {question.status === "pending" && (
                        <Loader2 className="w-5 h-5 animate-spin" style={{ color: colors.textSecondary }} />
                      )}
                      {question.status === "pass" && (
                        <CheckCircle className="w-5 h-5" style={{ color: colors.accentWellness }} />
                      )}
                      {question.status === "fail" && (
                        <XCircle className="w-5 h-5" style={{ color: colors.accentWarm }} />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {simulationComplete && (
            <div className="space-y-4">
              <div 
                className="p-6 rounded-lg text-center"
                style={{ 
                  backgroundColor: overallGrade === "PASS" ? "rgba(45, 90, 39, 0.1)" : 
                                  overallGrade === "CONDITIONAL" ? "rgba(217, 119, 6, 0.1)" : 
                                  "rgba(255, 107, 107, 0.1)"
                }}
              >
                <h3 
                  className="text-2xl font-bold mb-2"
                  style={{ 
                    color: overallGrade === "PASS" ? colors.accentWellness : 
                          overallGrade === "CONDITIONAL" ? "#D97706" : colors.accentWarm 
                  }}
                >
                  {overallGrade}
                </h3>
                <p className="text-sm" style={{ color: colors.textSecondary }}>
                  {passCount}/5 audit questions passed
                </p>
              </div>

              <div className="flex justify-center gap-3">
                <Button
                  variant="outline"
                  onClick={resetSimulation}
                  data-testid="button-reset-simulation"
                >
                  Run Again
                </Button>
                <Button
                  onClick={handleExportPDF}
                  className="text-white"
                  style={{ backgroundColor: colors.accentTeal }}
                  data-testid="button-export-report"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Report
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
