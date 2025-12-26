import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Activity, FileText, Search, Shield, Download,
  Upload, ChevronRight, Calendar, Lightbulb, PlayCircle,
  ClipboardCheck, Brain, CheckCircle, Clock
} from "lucide-react";
import { SOPUploadModal } from "@/components/sop-upload-modal";
import { RemediationModal } from "@/components/remediation-modal";
import { SmartNotifications } from "@/components/smart-notifications";
import { RegulatoryFilters, type JurisdictionFilter, type ProductClassFilter } from "@/components/regulatory-filters";
import { AuditSimulationModal } from "@/components/audit-simulation-modal";
import { AuditLogModal } from "@/components/audit-log-modal";
import { UserRoleSelector } from "@/components/user-role-selector";
import { useUser } from "@/contexts/user-context";
import { auditLog } from "@/services/audit-log";
import { rsiLearning } from "@/services/rsi-learning";

// 2025 Pharma Color Palette - Architect-validated specification
const colors = {
  // Core palette
  bgMain: "#F9FAFB",           // Off-white for breathability
  cardBg: "#FFFFFF",           // High-contrast white for cards
  textPrimary: "#1C1C1C",      // Deep charcoal for audit-grade legibility
  textSecondary: "#6B7280",    // Muted gray for secondary content
  
  // Accent colors
  accentWarm: "#FF6B6B",       // 2025 Coral for energetic human-centric cues
  accentWarmHover: "#E85A5A",
  accentWellness: "#2D5A27",   // Sage green for sustainable compliance status
  accentTrust: "#002D62",      // Navy reserved for strategic branding anchors
  
  // Supporting colors
  borderLight: "#E5E7EB",
  borderMedium: "#D1D5DB",
  
  // Status colors (mapped to 2025 standards)
  statusCritical: "#DC2626",   // Clear red for critical gaps
  statusWarning: "#D97706",    // Amber for moderate concerns
  statusSuccess: "#2D5A27",    // Sage green for compliance
};

interface SOPDocument {
  id: string;
  name: string;
  regulatoryStandard: string;
  status: "major" | "moderate" | "compliant" | "review_requested";
  uploadedAt: string;
  gapDetails?: GapDetails;
}

interface GapDetails {
  id: string;
  sopSection: string;
  regulatoryClause: string;
  gapType: "major" | "moderate";
  description: string;
  originalText: string;
}

interface GapSummary {
  major: number;
  moderate: number;
  minor: number;
}

interface RegulatoryUpdate {
  id: string;
  title: string;
  effectiveDate: string;
  type: "FDA" | "ISO" | "EMA";
}

interface ExtendedSOPDocument extends SOPDocument {
  jurisdiction: "FDA" | "EMA" | "ISO";
  productClass: "I" | "II" | "III";
}

const demoDocuments: ExtendedSOPDocument[] = [
  {
    id: "demo-1",
    name: "Design Control SOP v2.3.pdf",
    regulatoryStandard: "21 CFR 820",
    status: "major",
    uploadedAt: "2025-01-15T10:30:00Z",
    jurisdiction: "FDA",
    productClass: "II",
    gapDetails: {
      id: "gap-1",
      sopSection: "Section 4.2 - Design Output Verification",
      regulatoryClause: "FDA 21 CFR 820.30(f)",
      gapType: "major",
      description: "Missing formal verification matrix linking design inputs to outputs. Current procedure lacks documented evidence requirements.",
      originalText: `4.2 Design Output

Design outputs are reviewed by the engineering team as needed. 
The team ensures outputs meet requirements before release.
Documentation is maintained per company standards.`
    }
  },
  {
    id: "demo-2", 
    name: "Document Control Procedure.docx",
    regulatoryStandard: "ISO 13485",
    status: "moderate",
    uploadedAt: "2025-01-14T14:15:00Z",
    jurisdiction: "ISO",
    productClass: "II",
    gapDetails: {
      id: "gap-2",
      sopSection: "Section 5.3 - Record Control",
      regulatoryClause: "ISO 13485:2016 Clause 4.2.5",
      gapType: "moderate",
      description: "Uses non-committal language 'as needed' for record retention. Missing specific retention periods and storage requirements.",
      originalText: `5.3 Record Retention

Quality records shall be maintained as needed.
Records are stored in appropriate locations.
Retention periods follow company policy.`
    }
  },
  {
    id: "demo-3",
    name: "Training Management SOP.pdf",
    regulatoryStandard: "ISO 13485",
    status: "compliant",
    uploadedAt: "2025-01-13T09:00:00Z",
    jurisdiction: "ISO",
    productClass: "I"
  },
  {
    id: "demo-4",
    name: "EU MDR Technical Documentation.pdf",
    regulatoryStandard: "EU MDR 2017/745",
    status: "compliant",
    uploadedAt: "2025-01-12T11:00:00Z",
    jurisdiction: "EMA",
    productClass: "III"
  }
];

const mockDocuments: SOPDocument[] = [];

const mockGapSummary: GapSummary = {
  major: 0,
  moderate: 0,
  minor: 0
};

const demoGapSummary: GapSummary = {
  major: 1,
  moderate: 1,
  minor: 0
};

const mockRegulatoryUpdates: RegulatoryUpdate[] = [
  { id: "1", title: "FDA 21 CFR Part 820 Revision", effectiveDate: "2025-02-15", type: "FDA" },
  { id: "2", title: "ISO 13485:2024 Amendment", effectiveDate: "2025-03-01", type: "ISO" },
  { id: "3", title: "EMA GMP Annex 1 Update", effectiveDate: "2025-04-10", type: "EMA" }
];

function RiskScoreGauge({ score }: { score: number }) {
  const percentage = (score / 10) * 100;
  const strokeDasharray = 251.2;
  const strokeDashoffset = strokeDasharray - (strokeDasharray * percentage) / 100;
  
  const getScoreColor = (s: number) => {
    if (s <= 3) return colors.accentWellness;
    if (s <= 6) return colors.statusWarning;
    return colors.statusCritical;
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-48 h-24 overflow-hidden">
        <svg viewBox="0 0 100 50" className="w-full h-full">
          <path
            d="M5 50 A 45 45 0 0 1 95 50"
            fill="none"
            stroke={colors.borderLight}
            strokeWidth="8"
            strokeLinecap="round"
          />
          <path
            d="M5 50 A 45 45 0 0 1 95 50"
            fill="none"
            stroke={getScoreColor(score)}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={strokeDasharray / 2}
            strokeDashoffset={(strokeDashoffset / 2) - (strokeDasharray / 4)}
            style={{ transition: "stroke-dashoffset 0.5s ease" }}
          />
        </svg>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
          <span className="text-4xl font-bold" style={{ color: colors.textPrimary }}>{score.toFixed(1)}</span>
        </div>
      </div>
      <p className="text-sm mt-2" style={{ color: colors.textSecondary }}>Executive Impact Score</p>
    </div>
  );
}

function StatusBadge({ status }: { status: SOPDocument["status"] }) {
  const config = {
    major: { 
      label: "Major Gap", 
      bg: "#FEE2E2", 
      text: colors.statusCritical,
      border: "#FECACA",
      icon: null
    },
    moderate: { 
      label: "Moderate", 
      bg: "#FEF3C7", 
      text: colors.statusWarning,
      border: "#FDE68A",
      icon: null
    },
    compliant: { 
      label: "Compliant", 
      bg: "#DCFCE7", 
      text: colors.accentWellness,
      border: "#BBF7D0",
      icon: CheckCircle
    },
    review_requested: { 
      label: "Review Requested", 
      bg: "#E0F2FE", 
      text: "#0284C7",
      border: "#BAE6FD",
      icon: Clock
    }
  };

  const { label, bg, text, border, icon: Icon } = config[status];
  return (
    <Badge 
      variant="outline" 
      className="flex items-center gap-1"
      style={{ backgroundColor: bg, color: text, borderColor: border }}
    >
      {Icon && <Icon className="w-3 h-3" />}
      {label}
    </Badge>
  );
}

function SidebarNav({ activeItem, onItemClick }: { activeItem: string; onItemClick: (item: string) => void }) {
  const navItems = [
    { id: "monitor", label: "Compliance Monitor", icon: Activity, description: "Real-time regulatory feed" },
    { id: "repository", label: "SOP Repository", icon: FileText, description: "Document storage" },
    { id: "gap-analysis", label: "Gap Analysis Engine", icon: Search, description: "Deficiency workspace" },
    { id: "audit-vault", label: "Audit Vault", icon: Download, description: "Export center" }
  ];

  return (
    <nav className="flex flex-col gap-1">
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => onItemClick(item.id)}
          data-testid={`nav-${item.id}`}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all"
          style={{
            backgroundColor: activeItem === item.id ? colors.accentWarm : "transparent",
            color: activeItem === item.id ? "white" : colors.textPrimary,
          }}
          onMouseEnter={(e) => {
            if (activeItem !== item.id) {
              e.currentTarget.style.backgroundColor = colors.borderLight;
            }
          }}
          onMouseLeave={(e) => {
            if (activeItem !== item.id) {
              e.currentTarget.style.backgroundColor = "transparent";
            }
          }}
        >
          <item.icon className="w-5 h-5 flex-shrink-0" />
          <div>
            <p className="font-medium text-sm">{item.label}</p>
            <p 
              className="text-xs"
              style={{ color: activeItem === item.id ? "rgba(255,255,255,0.8)" : colors.textSecondary }}
            >
              {item.description}
            </p>
          </div>
        </button>
      ))}
    </nav>
  );
}

function EmptyState({ onUpload }: { onUpload: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div 
        className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
        style={{ backgroundColor: colors.bgMain }}
      >
        <FileText className="w-10 h-10" style={{ color: colors.textSecondary }} />
      </div>
      <h3 className="text-xl font-semibold mb-2" style={{ color: colors.textPrimary }}>No SOPs Uploaded</h3>
      <p className="text-center max-w-md mb-6" style={{ color: colors.textSecondary }}>
        Upload your first Standard Operating Procedure to begin the automated gap analysis process.
      </p>
      <Button 
        onClick={onUpload}
        data-testid="button-upload-sop"
        className="px-8 py-6 text-lg text-white"
        style={{ backgroundColor: colors.accentWarm }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.accentWarmHover}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.accentWarm}
      >
        <Upload className="w-5 h-5 mr-2" />
        Upload First SOP to Begin Assessment
      </Button>
    </div>
  );
}

function GapAnalysisTable({ documents, onSuggestFix }: { documents: SOPDocument[]; onSuggestFix: (gap: GapDetails) => void }) {
  if (documents.length === 0) {
    return null;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full" data-testid="table-gap-analysis">
        <thead>
          <tr style={{ borderBottom: `1px solid ${colors.borderLight}` }}>
            <th className="text-left py-3 px-4 font-semibold" style={{ color: colors.textPrimary }}>Document Name</th>
            <th className="text-left py-3 px-4 font-semibold" style={{ color: colors.textPrimary }}>Regulatory Standard</th>
            <th className="text-left py-3 px-4 font-semibold" style={{ color: colors.textPrimary }}>Status</th>
            <th className="text-right py-3 px-4 font-semibold" style={{ color: colors.textPrimary }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {documents.map((doc) => (
            <tr 
              key={doc.id} 
              className="transition-colors"
              style={{ borderBottom: `1px solid ${colors.borderLight}` }}
              data-testid={`row-document-${doc.id}`}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.bgMain}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
            >
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" style={{ color: colors.textSecondary }} />
                  <span className="font-medium" style={{ color: colors.textPrimary }}>{doc.name}</span>
                </div>
              </td>
              <td className="py-3 px-4" style={{ color: colors.textSecondary }}>{doc.regulatoryStandard}</td>
              <td className="py-3 px-4">
                <StatusBadge status={doc.status} />
              </td>
              <td className="py-3 px-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  {doc.gapDetails && (doc.status === "major" || doc.status === "moderate") && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onSuggestFix(doc.gapDetails!)}
                      className="text-xs"
                      style={{ 
                        color: "#00A3A1",
                        borderColor: "#00A3A1"
                      }}
                      data-testid={`button-suggest-fix-${doc.id}`}
                    >
                      <Lightbulb className="w-3 h-3 mr-1" />
                      Suggest Fix
                    </Button>
                  )}
                  <Button 
                    variant="ghost" 
                    size="sm"
                    style={{ color: colors.accentWarm }}
                  >
                    View Details <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ComplianceDashboard() {
  const { currentUser, hasPermission } = useUser();
  const [activeNav, setActiveNav] = useState("monitor");
  const [documents, setDocuments] = useState<ExtendedSOPDocument[]>(demoDocuments);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [remediationModalOpen, setRemediationModalOpen] = useState(false);
  const [auditSimulationOpen, setAuditSimulationOpen] = useState(false);
  const [auditLogOpen, setAuditLogOpen] = useState(false);
  const [selectedGap, setSelectedGap] = useState<GapDetails | null>(null);
  
  const [jurisdictionFilter, setJurisdictionFilter] = useState<JurisdictionFilter>("all");
  const [productClassFilter, setProductClassFilter] = useState<ProductClassFilter>("all");

  const learningMetrics = rsiLearning.getLearningMetrics();

  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      const matchesJurisdiction = jurisdictionFilter === "all" || doc.jurisdiction === jurisdictionFilter;
      const matchesProductClass = productClassFilter === "all" || doc.productClass === productClassFilter;
      return matchesJurisdiction && matchesProductClass;
    });
  }, [documents, jurisdictionFilter, productClassFilter]);

  const filteredGapSummary = useMemo(() => {
    return {
      major: filteredDocuments.filter(d => d.status === "major").length,
      moderate: filteredDocuments.filter(d => d.status === "moderate").length,
      minor: 0
    };
  }, [filteredDocuments]);

  const filteredRiskScore = useMemo(() => {
    if (filteredDocuments.length === 0) return 0;
    const majorWeight = filteredGapSummary.major * 3;
    const moderateWeight = filteredGapSummary.moderate * 1.5;
    return Math.min(10, (majorWeight + moderateWeight) / filteredDocuments.length * 5);
  }, [filteredDocuments, filteredGapSummary]);

  const handleUpload = () => {
    setUploadModalOpen(true);
  };

  const handleUploadComplete = (result: { track: string; documentType: string; fileName: string }) => {
    const newDoc: ExtendedSOPDocument = {
      id: `doc-${Date.now()}`,
      name: result.fileName,
      regulatoryStandard: result.track === "FDA" ? "21 CFR 820" : result.track === "ISO" ? "ISO 13485" : "General QMS",
      status: "compliant",
      uploadedAt: new Date().toISOString(),
      jurisdiction: result.track === "FDA" ? "FDA" : result.track === "ISO" ? "ISO" : "EMA",
      productClass: "II"
    };
    setDocuments(prev => [...prev, newDoc]);
    
    auditLog.log(
      "UPLOAD_SOP",
      currentUser.id,
      currentUser.name,
      currentUser.role,
      `Uploaded ${result.fileName}`,
      { documentId: newDoc.id }
    );
  };

  const handleSuggestFix = (gap: GapDetails) => {
    setSelectedGap(gap);
    setRemediationModalOpen(true);
  };

  const totalGaps = filteredGapSummary.major + filteredGapSummary.moderate + filteredGapSummary.minor;
  const hasDocuments = filteredDocuments.length > 0;

  return (
    <div className="cw-light-theme flex h-screen" style={{ backgroundColor: colors.bgMain }}>
      {/* Sidebar - Clean white with Navy strategic anchor */}
      <aside 
        className="w-72 flex flex-col border-r"
        style={{ backgroundColor: colors.cardBg, borderColor: colors.borderLight }}
      >
        {/* Navy header - strategic trust anchor */}
        <div 
          className="p-6"
          style={{ backgroundColor: colors.accentTrust }}
        >
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
            >
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg" style={{ color: "#FFFFFF" }}>ComplianceWorxs</h1>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.8)" }}>Command Center</p>
            </div>
          </div>
        </div>
        
        <div className="flex-1 p-4">
          <SidebarNav activeItem={activeNav} onItemClick={setActiveNav} />
        </div>

        <div className="p-4 space-y-4" style={{ borderTop: `1px solid ${colors.borderLight}` }}>
          <UserRoleSelector />
          
          <div 
            className="rounded-lg p-4"
            style={{ backgroundColor: colors.bgMain }}
          >
            <p className="text-xs mb-1" style={{ color: colors.textSecondary }}>Regulatory Engine Status</p>
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4" style={{ color: "#7C3AED" }} />
              <span className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                {learningMetrics.systemStatus}
              </span>
            </div>
            <div className="mt-2 pt-2" style={{ borderTop: `1px solid ${colors.borderLight}` }}>
              <p className="text-xs" style={{ color: colors.textSecondary }}>
                Learning Cycles: {learningMetrics.learningCycles}
              </p>
              <p className="text-xs" style={{ color: colors.textSecondary }}>
                Total Overrides: {learningMetrics.totalOverrides}
              </p>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <SmartNotifications jurisdictionFilter={jurisdictionFilter === "all" ? "all" : jurisdictionFilter} />
        
        <header 
          className="border-b px-8 py-4"
          style={{ backgroundColor: colors.cardBg, borderColor: colors.borderLight }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold" style={{ color: colors.textPrimary }}>Executive Command Center</h2>
              <p className="text-sm" style={{ color: colors.textSecondary }}>Real-time compliance health and regulatory intelligence</p>
            </div>
            <div className="flex items-center gap-3">
              {hasPermission("export_audit_log") && (
                <Button 
                  variant="outline"
                  onClick={() => setAuditLogOpen(true)}
                  data-testid="button-audit-log"
                  style={{ borderColor: colors.accentTrust, color: colors.accentTrust }}
                >
                  <ClipboardCheck className="w-4 h-4 mr-2" />
                  Audit Log
                </Button>
              )}
              <Button 
                variant="outline"
                onClick={() => setAuditSimulationOpen(true)}
                data-testid="button-simulate-audit"
                style={{ borderColor: "#00A3A1", color: "#00A3A1" }}
              >
                <PlayCircle className="w-4 h-4 mr-2" />
                Simulate Audit
              </Button>
              {hasPermission("upload_sop") && (
                <Button 
                  onClick={handleUpload}
                  data-testid="button-header-upload"
                  className="text-white"
                  style={{ backgroundColor: colors.accentWarm }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.accentWarmHover}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.accentWarm}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload SOP
                </Button>
              )}
            </div>
          </div>
        </header>

        <RegulatoryFilters
          jurisdiction={jurisdictionFilter}
          productClass={productClassFilter}
          onJurisdictionChange={setJurisdictionFilter}
          onProductClassChange={setProductClassFilter}
        />

        <div className="flex-1 overflow-y-auto p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <Card 
              className="lg:col-span-1 border shadow-sm" 
              style={{ borderColor: colors.borderLight, backgroundColor: colors.cardBg }}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-lg" style={{ color: colors.textPrimary }}>Executive Impact Score</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center pt-4">
                <RiskScoreGauge score={filteredRiskScore} />
              </CardContent>
            </Card>

            <Card 
              className="lg:col-span-1 border shadow-sm" 
              style={{ borderColor: colors.borderLight, backgroundColor: colors.cardBg }}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-lg" style={{ color: colors.textPrimary }}>Active Gaps Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 pt-4">
                  <div 
                    className="flex-1 text-center p-4 rounded-lg border"
                    style={{ backgroundColor: "#FEE2E2", borderColor: "#FECACA" }}
                  >
                    <p className="text-3xl font-bold" style={{ color: colors.statusCritical }}>{filteredGapSummary.major}</p>
                    <p className="text-xs font-medium" style={{ color: colors.statusCritical }}>Major</p>
                  </div>
                  <div 
                    className="flex-1 text-center p-4 rounded-lg border"
                    style={{ backgroundColor: "#FEF3C7", borderColor: "#FDE68A" }}
                  >
                    <p className="text-3xl font-bold" style={{ color: colors.statusWarning }}>{filteredGapSummary.moderate}</p>
                    <p className="text-xs font-medium" style={{ color: colors.statusWarning }}>Moderate</p>
                  </div>
                  <div 
                    className="flex-1 text-center p-4 rounded-lg border"
                    style={{ backgroundColor: "#DCFCE7", borderColor: "#BBF7D0" }}
                  >
                    <p className="text-3xl font-bold" style={{ color: colors.accentWellness }}>{filteredGapSummary.minor}</p>
                    <p className="text-xs font-medium" style={{ color: colors.accentWellness }}>Minor</p>
                  </div>
                </div>
                {totalGaps === 0 && (
                  <p className="text-center text-sm mt-4" style={{ color: colors.textSecondary }}>No gaps detected yet</p>
                )}
              </CardContent>
            </Card>

            <Card 
              className="lg:col-span-1 border shadow-sm" 
              style={{ borderColor: colors.borderLight, backgroundColor: colors.cardBg }}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2" style={{ color: colors.textPrimary }}>
                  <Calendar className="w-4 h-4" />
                  Regulatory Runway
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 pt-2">
                  {mockRegulatoryUpdates.map((update) => (
                    <div 
                      key={update.id} 
                      className="flex items-center gap-3 p-2 rounded transition-colors cursor-pointer"
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.bgMain}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                    >
                      <Badge 
                        variant="outline" 
                        style={{
                          backgroundColor: update.type === "FDA" ? "#DBEAFE" : 
                                          update.type === "ISO" ? "#F3E8FF" : "#FFEDD5",
                          color: update.type === "FDA" ? "#1D4ED8" : 
                                update.type === "ISO" ? "#7C3AED" : "#C2410C",
                          borderColor: update.type === "FDA" ? "#BFDBFE" : 
                                      update.type === "ISO" ? "#E9D5FF" : "#FED7AA"
                        }}
                      >
                        {update.type}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: colors.textPrimary }}>{update.title}</p>
                        <p className="text-xs" style={{ color: colors.textSecondary }}>{update.effectiveDate}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card 
            className="border shadow-sm" 
            style={{ borderColor: colors.borderLight, backgroundColor: colors.cardBg }}
          >
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2" style={{ color: colors.textPrimary }}>
                <Search className="w-5 h-5" />
                Gap Analysis Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              {hasDocuments ? (
                <GapAnalysisTable documents={filteredDocuments} onSuggestFix={handleSuggestFix} />
              ) : (
                <EmptyState onUpload={handleUpload} />
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <SOPUploadModal
        open={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onUploadComplete={handleUploadComplete}
      />

      <RemediationModal
        open={remediationModalOpen}
        onClose={() => setRemediationModalOpen(false)}
        gap={selectedGap}
      />

      <AuditSimulationModal
        open={auditSimulationOpen}
        onClose={() => setAuditSimulationOpen(false)}
        documents={filteredDocuments}
      />

      <AuditLogModal
        open={auditLogOpen}
        onClose={() => setAuditLogOpen(false)}
      />
    </div>
  );
}
