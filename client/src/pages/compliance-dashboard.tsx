import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Activity, FileText, Search, Shield, Download,
  Upload, ChevronRight, Calendar
} from "lucide-react";

// 2025 Pharma Color Palette
const colors = {
  // Primary palette - balanced and human-centric
  coral: "#E07A5F",         // Primary CTA - energetic, human-centric
  coralHover: "#C96A52",
  teal: "#2A6B6B",          // Structural elements - health/reliability
  tealLight: "#3D8B8B",
  sage: "#6B9080",          // Positive states - natural wellness
  sageLight: "#8FB5A3",
  
  // Neutrals with warmth
  slate: "#374151",         // Primary text
  slateLight: "#6B7280",    // Secondary text
  warmWhite: "#FAFAF8",     // Background
  cream: "#F5F4F0",         // Card backgrounds
  sand: "#E8E4DC",          // Borders
  
  // Status colors
  alertRed: "#C44536",
  warningAmber: "#D4A03B",
  successGreen: "#5A8F7B"
};

interface SOPDocument {
  id: string;
  name: string;
  regulatoryStandard: string;
  status: "major" | "moderate" | "compliant";
  uploadedAt: string;
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

const mockDocuments: SOPDocument[] = [];

const mockGapSummary: GapSummary = {
  major: 0,
  moderate: 0,
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
    if (s <= 3) return colors.sage;
    if (s <= 6) return colors.warningAmber;
    return colors.alertRed;
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-48 h-24 overflow-hidden">
        <svg viewBox="0 0 100 50" className="w-full h-full">
          <path
            d="M5 50 A 45 45 0 0 1 95 50"
            fill="none"
            stroke={colors.sand}
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
          <span className="text-4xl font-bold" style={{ color: colors.slate }}>{score.toFixed(1)}</span>
        </div>
      </div>
      <p className="text-sm mt-2" style={{ color: colors.slateLight }}>Executive Impact Score</p>
    </div>
  );
}

function StatusBadge({ status }: { status: SOPDocument["status"] }) {
  const config = {
    major: { label: "Major Gap", className: "bg-red-50 text-red-700 border-red-200" },
    moderate: { label: "Moderate", className: "bg-amber-50 text-amber-700 border-amber-200" },
    compliant: { label: "Compliant", bg: colors.sage, text: "white" }
  };

  if (status === "compliant") {
    return (
      <Badge 
        variant="outline" 
        className="border-0"
        style={{ backgroundColor: `${colors.sage}20`, color: colors.sage }}
      >
        Compliant
      </Badge>
    );
  }

  const { label, className } = config[status];
  return <Badge variant="outline" className={className}>{label}</Badge>;
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
            backgroundColor: activeItem === item.id ? colors.coral : "transparent",
            color: activeItem === item.id ? "white" : colors.slate,
          }}
          onMouseEnter={(e) => {
            if (activeItem !== item.id) {
              e.currentTarget.style.backgroundColor = colors.sand;
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
              style={{ color: activeItem === item.id ? "rgba(255,255,255,0.7)" : colors.slateLight }}
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
        style={{ backgroundColor: colors.cream }}
      >
        <FileText className="w-10 h-10" style={{ color: colors.slateLight }} />
      </div>
      <h3 className="text-xl font-semibold mb-2" style={{ color: colors.slate }}>No SOPs Uploaded</h3>
      <p className="text-center max-w-md mb-6" style={{ color: colors.slateLight }}>
        Upload your first Standard Operating Procedure to begin the automated gap analysis process.
      </p>
      <Button 
        onClick={onUpload}
        data-testid="button-upload-sop"
        className="px-8 py-6 text-lg text-white"
        style={{ backgroundColor: colors.coral }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.coralHover}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.coral}
      >
        <Upload className="w-5 h-5 mr-2" />
        Upload First SOP to Begin Assessment
      </Button>
    </div>
  );
}

function GapAnalysisTable({ documents }: { documents: SOPDocument[] }) {
  if (documents.length === 0) {
    return null;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full" data-testid="table-gap-analysis">
        <thead>
          <tr style={{ borderBottom: `1px solid ${colors.sand}` }}>
            <th className="text-left py-3 px-4 font-semibold" style={{ color: colors.slate }}>Document Name</th>
            <th className="text-left py-3 px-4 font-semibold" style={{ color: colors.slate }}>Regulatory Standard</th>
            <th className="text-left py-3 px-4 font-semibold" style={{ color: colors.slate }}>Status</th>
            <th className="text-right py-3 px-4 font-semibold" style={{ color: colors.slate }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {documents.map((doc) => (
            <tr 
              key={doc.id} 
              className="hover:bg-gray-50" 
              style={{ borderBottom: `1px solid ${colors.cream}` }}
              data-testid={`row-document-${doc.id}`}
            >
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" style={{ color: colors.slateLight }} />
                  <span className="font-medium" style={{ color: colors.slate }}>{doc.name}</span>
                </div>
              </td>
              <td className="py-3 px-4" style={{ color: colors.slateLight }}>{doc.regulatoryStandard}</td>
              <td className="py-3 px-4">
                <StatusBadge status={doc.status} />
              </td>
              <td className="py-3 px-4 text-right">
                <Button 
                  variant="ghost" 
                  size="sm"
                  style={{ color: colors.teal }}
                >
                  View Details <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ComplianceDashboard() {
  const [activeNav, setActiveNav] = useState("monitor");
  const [documents] = useState<SOPDocument[]>(mockDocuments);
  const [gapSummary] = useState<GapSummary>(mockGapSummary);
  const [riskScore] = useState(0.0);

  const handleUpload = () => {
    console.log("Upload SOP clicked - Phase 3 will implement file upload");
  };

  const totalGaps = gapSummary.major + gapSummary.moderate + gapSummary.minor;
  const hasDocuments = documents.length > 0;

  return (
    <div className="flex h-screen" style={{ backgroundColor: colors.warmWhite }}>
      {/* Sidebar - Light warm palette with teal accent strip */}
      <aside 
        className="w-72 flex flex-col border-r"
        style={{ backgroundColor: colors.cream, borderColor: colors.sand }}
      >
        {/* Teal accent header */}
        <div 
          className="p-6"
          style={{ 
            background: `linear-gradient(135deg, ${colors.teal} 0%, ${colors.tealLight} 100%)`,
          }}
        >
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
            >
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-white">ComplianceWorxs</h1>
              <p className="text-xs text-white/70">Command Center</p>
            </div>
          </div>
        </div>
        
        <div className="flex-1 p-4">
          <SidebarNav activeItem={activeNav} onItemClick={setActiveNav} />
        </div>

        <div className="p-4" style={{ borderTop: `1px solid ${colors.sand}` }}>
          <div 
            className="rounded-lg p-4"
            style={{ backgroundColor: colors.warmWhite }}
          >
            <p className="text-xs mb-1" style={{ color: colors.slateLight }}>Regulatory Engine Status</p>
            <div className="flex items-center gap-2">
              <span 
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ backgroundColor: colors.sage }}
              ></span>
              <span className="text-sm font-medium" style={{ color: colors.slate }}>Active & Monitoring</span>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <header 
          className="bg-white border-b px-8 py-4"
          style={{ borderColor: colors.sand }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold" style={{ color: colors.slate }}>Executive Command Center</h2>
              <p className="text-sm" style={{ color: colors.slateLight }}>Real-time compliance health and regulatory intelligence</p>
            </div>
            <Button 
              onClick={handleUpload}
              data-testid="button-header-upload"
              className="text-white"
              style={{ backgroundColor: colors.coral }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.coralHover}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.coral}
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload SOP
            </Button>
          </div>
        </header>

        <div className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <Card className="lg:col-span-1 border" style={{ borderColor: colors.sand, backgroundColor: "white" }}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg" style={{ color: colors.slate }}>Executive Impact Score</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center pt-4">
                <RiskScoreGauge score={riskScore} />
              </CardContent>
            </Card>

            <Card className="lg:col-span-1 border" style={{ borderColor: colors.sand, backgroundColor: "white" }}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg" style={{ color: colors.slate }}>Active Gaps Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 pt-4">
                  <div 
                    className="flex-1 text-center p-4 rounded-lg border"
                    style={{ backgroundColor: "#FEF2F2", borderColor: "#FECACA" }}
                  >
                    <p className="text-3xl font-bold" style={{ color: colors.alertRed }}>{gapSummary.major}</p>
                    <p className="text-xs font-medium" style={{ color: colors.alertRed }}>Major</p>
                  </div>
                  <div 
                    className="flex-1 text-center p-4 rounded-lg border"
                    style={{ backgroundColor: "#FFFBEB", borderColor: "#FDE68A" }}
                  >
                    <p className="text-3xl font-bold" style={{ color: colors.warningAmber }}>{gapSummary.moderate}</p>
                    <p className="text-xs font-medium" style={{ color: colors.warningAmber }}>Moderate</p>
                  </div>
                  <div 
                    className="flex-1 text-center p-4 rounded-lg border"
                    style={{ backgroundColor: `${colors.sage}15`, borderColor: `${colors.sage}40` }}
                  >
                    <p className="text-3xl font-bold" style={{ color: colors.sage }}>{gapSummary.minor}</p>
                    <p className="text-xs font-medium" style={{ color: colors.sage }}>Minor</p>
                  </div>
                </div>
                {totalGaps === 0 && (
                  <p className="text-center text-sm mt-4" style={{ color: colors.slateLight }}>No gaps detected yet</p>
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-1 border" style={{ borderColor: colors.sand, backgroundColor: "white" }}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2" style={{ color: colors.slate }}>
                  <Calendar className="w-4 h-4" />
                  Regulatory Runway
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 pt-2">
                  {mockRegulatoryUpdates.map((update) => (
                    <div 
                      key={update.id} 
                      className="flex items-center gap-3 p-2 rounded transition-colors"
                      style={{ cursor: "pointer" }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.cream}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                    >
                      <Badge 
                        variant="outline" 
                        className={
                          update.type === "FDA" ? "bg-blue-50 text-blue-700 border-blue-200" :
                          update.type === "ISO" ? "bg-purple-50 text-purple-700 border-purple-200" :
                          "bg-orange-50 text-orange-700 border-orange-200"
                        }
                      >
                        {update.type}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: colors.slate }}>{update.title}</p>
                        <p className="text-xs" style={{ color: colors.slateLight }}>{update.effectiveDate}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border" style={{ borderColor: colors.sand, backgroundColor: "white" }}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2" style={{ color: colors.slate }}>
                <Search className="w-5 h-5" />
                Gap Analysis Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              {hasDocuments ? (
                <GapAnalysisTable documents={documents} />
              ) : (
                <EmptyState onUpload={handleUpload} />
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
