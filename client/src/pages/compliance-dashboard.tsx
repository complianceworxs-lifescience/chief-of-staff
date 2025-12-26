import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Activity, FileText, Search, Shield, Download,
  Upload, ChevronRight, Calendar, AlertTriangle
} from "lucide-react";

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
    if (s <= 3) return "#10B981";
    if (s <= 6) return "#F59E0B";
    return "#DC2626";
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-48 h-24 overflow-hidden">
        <svg viewBox="0 0 100 50" className="w-full h-full">
          <path
            d="M5 50 A 45 45 0 0 1 95 50"
            fill="none"
            stroke="#E5E7EB"
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
          <span className="text-4xl font-bold text-[#002D62]">{score.toFixed(1)}</span>
        </div>
      </div>
      <p className="text-sm text-gray-500 mt-2">Executive Impact Score</p>
    </div>
  );
}

function StatusBadge({ status }: { status: SOPDocument["status"] }) {
  const config = {
    major: { label: "Major Gap", className: "bg-red-100 text-red-700 border-red-200" },
    moderate: { label: "Moderate", className: "bg-yellow-100 text-yellow-700 border-yellow-200" },
    compliant: { label: "Compliant", className: "bg-green-100 text-green-700 border-green-200" }
  };

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
          className={`flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
            activeItem === item.id
              ? "bg-[#00A3A1] text-white"
              : "text-gray-300 hover:bg-[#003d7a] hover:text-white"
          }`}
        >
          <item.icon className="w-5 h-5 flex-shrink-0" />
          <div>
            <p className="font-medium text-sm">{item.label}</p>
            <p className={`text-xs ${activeItem === item.id ? "text-white/70" : "text-gray-500"}`}>
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
      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
        <FileText className="w-10 h-10 text-gray-400" />
      </div>
      <h3 className="text-xl font-semibold text-[#002D62] mb-2">No SOPs Uploaded</h3>
      <p className="text-gray-500 text-center max-w-md mb-6">
        Upload your first Standard Operating Procedure to begin the automated gap analysis process.
      </p>
      <Button 
        onClick={onUpload}
        data-testid="button-upload-sop"
        className="bg-[#00A3A1] hover:bg-[#008B89] text-white px-8 py-6 text-lg"
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
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4 font-semibold text-[#002D62]">Document Name</th>
            <th className="text-left py-3 px-4 font-semibold text-[#002D62]">Regulatory Standard</th>
            <th className="text-left py-3 px-4 font-semibold text-[#002D62]">Status</th>
            <th className="text-right py-3 px-4 font-semibold text-[#002D62]">Actions</th>
          </tr>
        </thead>
        <tbody>
          {documents.map((doc) => (
            <tr key={doc.id} className="border-b border-gray-100 hover:bg-gray-50" data-testid={`row-document-${doc.id}`}>
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <span className="font-medium text-gray-800">{doc.name}</span>
                </div>
              </td>
              <td className="py-3 px-4 text-gray-600">{doc.regulatoryStandard}</td>
              <td className="py-3 px-4">
                <StatusBadge status={doc.status} />
              </td>
              <td className="py-3 px-4 text-right">
                <Button variant="ghost" size="sm" className="text-[#00A3A1]">
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
    <div className="flex h-screen bg-[#F9FAFB]">
      <aside className="w-72 bg-[#002D62] text-white flex flex-col">
        <div className="p-6 border-b border-[#003d7a]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#00A3A1] flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg">ComplianceWorxs</h1>
              <p className="text-xs text-gray-400">Command Center</p>
            </div>
          </div>
        </div>
        
        <div className="flex-1 p-4">
          <SidebarNav activeItem={activeNav} onItemClick={setActiveNav} />
        </div>

        <div className="p-4 border-t border-[#003d7a]">
          <div className="bg-[#003d7a] rounded-lg p-4">
            <p className="text-xs text-gray-400 mb-1">Regulatory Engine Status</p>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              <span className="text-sm font-medium">Active & Monitoring</span>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <header className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-[#002D62]">Executive Command Center</h2>
              <p className="text-gray-500 text-sm">Real-time compliance health and regulatory intelligence</p>
            </div>
            <Button 
              onClick={handleUpload}
              data-testid="button-header-upload"
              className="bg-[#00A3A1] hover:bg-[#008B89] text-white"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload SOP
            </Button>
          </div>
        </header>

        <div className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <Card className="lg:col-span-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-[#002D62]">Executive Impact Score</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center pt-4">
                <RiskScoreGauge score={riskScore} />
              </CardContent>
            </Card>

            <Card className="lg:col-span-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-[#002D62]">Active Gaps Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 pt-4">
                  <div className="flex-1 text-center p-4 bg-red-50 rounded-lg border border-red-100">
                    <p className="text-3xl font-bold text-red-600">{gapSummary.major}</p>
                    <p className="text-xs text-red-600 font-medium">Major</p>
                  </div>
                  <div className="flex-1 text-center p-4 bg-yellow-50 rounded-lg border border-yellow-100">
                    <p className="text-3xl font-bold text-yellow-600">{gapSummary.moderate}</p>
                    <p className="text-xs text-yellow-600 font-medium">Moderate</p>
                  </div>
                  <div className="flex-1 text-center p-4 bg-green-50 rounded-lg border border-green-100">
                    <p className="text-3xl font-bold text-green-600">{gapSummary.minor}</p>
                    <p className="text-xs text-green-600 font-medium">Minor</p>
                  </div>
                </div>
                {totalGaps === 0 && (
                  <p className="text-center text-gray-400 text-sm mt-4">No gaps detected yet</p>
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-[#002D62] flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Regulatory Runway
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 pt-2">
                  {mockRegulatoryUpdates.map((update) => (
                    <div key={update.id} className="flex items-center gap-3 p-2 rounded hover:bg-gray-50">
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
                        <p className="text-sm font-medium text-gray-800 truncate">{update.title}</p>
                        <p className="text-xs text-gray-500">{update.effectiveDate}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-[#002D62] flex items-center gap-2">
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
