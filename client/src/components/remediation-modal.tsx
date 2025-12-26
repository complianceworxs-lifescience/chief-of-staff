import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, Lightbulb, FileText, ArrowRight } from "lucide-react";

interface GapDetails {
  id: string;
  sopSection: string;
  regulatoryClause: string;
  gapType: "major" | "moderate";
  description: string;
  originalText: string;
}

interface RemediationModalProps {
  open: boolean;
  onClose: () => void;
  gap: GapDetails | null;
}

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

function generateRemediation(gap: GapDetails): { condition: string; action: string; suggestedText: string } {
  const remediations: Record<string, { condition: string; action: string; suggestedText: string }> = {
    "design-control": {
      condition: "FDA 21 CFR 820.30 requires formal design input and output verification procedures.",
      action: "Incorporate a formal Design Output verification matrix that traces each design input to its corresponding output with documented evidence of verification.",
      suggestedText: `4.2 Design Output Verification

4.2.1 Purpose
This section establishes the formal verification procedure to ensure all design outputs meet their corresponding design input requirements per FDA 21 CFR 820.30(f).

4.2.2 Procedure
a) The Design Engineer shall create a Design Verification Matrix (DVM) documenting each design input requirement.
b) For each design input, the corresponding design output shall be identified and linked in the DVM.
c) Verification testing shall be performed and documented using approved test protocols.
d) The Quality Assurance Manager shall review and approve all verification records prior to design transfer.

4.2.3 Documentation
All design verification records shall be maintained in the Design History File (DHF) for the lifetime of the product plus five (5) years.`
    },
    "record-control": {
      condition: "ISO 13485:2016 Clause 4.2.5 requires specific controls for quality records including retention periods.",
      action: "Replace vague terms like 'as needed' with specific triggers for documentation and define the retention period and storage location.",
      suggestedText: `5.3 Quality Record Control

5.3.1 Record Generation Triggers
Quality records shall be created and maintained when:
a) Any batch/lot is manufactured or processed
b) A nonconformance is identified
c) A CAPA is initiated or closed
d) Design changes are approved
e) Customer complaints are received

5.3.2 Retention Requirements
All quality records shall be retained for a minimum of:
- Product-related records: Lifetime of the product plus five (5) years
- Training records: Duration of employment plus three (3) years
- Audit records: Seven (7) years from audit completion date

5.3.3 Storage Location
Records shall be stored in the Quality Management System (QMS) electronic repository with daily backup to secure off-site storage.`
    },
    "capa": {
      condition: "FDA 21 CFR 820.100 requires documented procedures for implementing corrective and preventive action.",
      action: "Define specific root cause analysis methods, effectiveness verification criteria, and timeline requirements.",
      suggestedText: `6.1 CAPA Procedure

6.1.1 Initiation
A CAPA shall be initiated within five (5) business days when:
a) A recurring nonconformance is identified (≥3 occurrences)
b) A customer complaint indicates a systemic issue
c) An audit finding requires corrective action
d) A product recall or field action is required

6.1.2 Root Cause Analysis
The assigned investigator shall conduct root cause analysis using one or more of the following methods:
a) 5-Why Analysis
b) Fishbone (Ishikawa) Diagram
c) Fault Tree Analysis

6.1.3 Effectiveness Verification
Effectiveness shall be verified no earlier than ninety (90) days after implementation by reviewing:
a) Recurrence data
b) Process performance metrics
c) Related complaint trends`
    },
    "complaint-handling": {
      condition: "ISO 13485:2016 Clause 8.2.2 requires timely complaint evaluation and reporting.",
      action: "Establish specific timelines for complaint intake, evaluation, and regulatory reporting decisions.",
      suggestedText: `7.2 Complaint Handling Procedure

7.2.1 Intake Timeline
All customer complaints shall be logged in the complaint database within one (1) business day of receipt.

7.2.2 Initial Evaluation
Quality Assurance shall complete an initial evaluation within five (5) business days to determine:
a) Whether the complaint involves a potential reportable event
b) The risk classification (Critical, Major, Minor)
c) Whether investigation is required

7.2.3 Regulatory Reporting Assessment
For events potentially meeting MDR/MedWatch criteria, the Regulatory Affairs Manager shall complete a reportability assessment within three (3) business days of initial evaluation.

7.2.4 Documentation
All complaint records, investigation findings, and regulatory decisions shall be documented in the Complaint Management System with full audit trail.`
    }
  };

  const sectionLower = gap.sopSection.toLowerCase();
  if (sectionLower.includes("design")) return remediations["design-control"];
  if (sectionLower.includes("record") || sectionLower.includes("document")) return remediations["record-control"];
  if (sectionLower.includes("capa") || sectionLower.includes("corrective")) return remediations["capa"];
  if (sectionLower.includes("complaint")) return remediations["complaint-handling"];
  
  return remediations["design-control"];
}

export function RemediationModal({ open, onClose, gap }: RemediationModalProps) {
  const [copied, setCopied] = useState(false);

  if (!gap) return null;

  const remediation = generateRemediation(gap);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(remediation.suggestedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" style={{ backgroundColor: colors.cardBg }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2" style={{ color: colors.textPrimary }}>
            <Lightbulb className="w-5 h-5" style={{ color: colors.accentTeal }} />
            Remediation Guidance
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="p-4 rounded-lg" style={{ backgroundColor: colors.bgMain }}>
            <div className="flex items-center gap-2 mb-2">
              <Badge 
                style={{ 
                  backgroundColor: gap.gapType === "major" ? "rgba(255, 107, 107, 0.15)" : "rgba(217, 119, 6, 0.15)",
                  color: gap.gapType === "major" ? colors.accentWarm : "#D97706"
                }}
              >
                {gap.gapType === "major" ? "Major Gap" : "Moderate Gap"}
              </Badge>
              <span className="text-sm font-medium" style={{ color: colors.textPrimary }}>{gap.sopSection}</span>
            </div>
            <p className="text-sm" style={{ color: colors.textSecondary }}>{gap.description}</p>
          </div>

          <div className="p-4 rounded-lg border" style={{ borderColor: colors.borderLight }}>
            <h4 className="font-semibold mb-2 flex items-center gap-2" style={{ color: colors.textPrimary }}>
              <FileText className="w-4 h-4" />
              Regulatory Requirement
            </h4>
            <p className="text-sm mb-4 p-3 rounded" style={{ backgroundColor: "#DBEAFE", color: "#1E40AF" }}>
              {remediation.condition}
            </p>
            
            <h4 className="font-semibold mb-2" style={{ color: colors.textPrimary }}>Required Action</h4>
            <p className="text-sm" style={{ color: colors.textSecondary }}>
              {remediation.action}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="font-semibold text-sm" style={{ color: colors.textPrimary }}>Original (Non-Compliant)</span>
              </div>
              <div 
                className="p-4 rounded-lg border text-sm font-mono whitespace-pre-wrap"
                style={{ 
                  backgroundColor: "rgba(255, 107, 107, 0.1)",
                  borderColor: "rgba(255, 107, 107, 0.3)",
                  color: colors.textPrimary
                }}
              >
                {gap.originalText}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-sm" style={{ color: colors.textPrimary }}>Suggested (Compliant)</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="h-7 text-xs"
                  data-testid="button-copy-remediation"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 mr-1" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 mr-1" />
                      Copy to Clipboard
                    </>
                  )}
                </Button>
              </div>
              <div 
                className="p-4 rounded-lg border text-sm font-mono whitespace-pre-wrap max-h-80 overflow-y-auto"
                style={{ 
                  backgroundColor: "rgba(45, 90, 39, 0.1)",
                  borderColor: "rgba(45, 90, 39, 0.3)",
                  color: colors.textPrimary
                }}
              >
                {remediation.suggestedText}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4" style={{ borderTop: `1px solid ${colors.borderLight}` }}>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button
              className="text-white"
              style={{ backgroundColor: colors.accentTeal }}
              onClick={handleCopy}
              data-testid="button-apply-fix"
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              Copy & Apply Fix
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
