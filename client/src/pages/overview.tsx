import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, ArrowRight, CheckCircle, Upload, Search, FileCheck, 
  FileText, Clock, Eye, RefreshCw, ChevronDown
} from "lucide-react";
import { PublicFooter } from "@/components/public-footer";
import { useState } from "react";

const PORTAL_URL = import.meta.env.VITE_PORTAL_URL || "";

const colors = {
  bgMain: "#F9FAFB",
  cardBg: "#FFFFFF",
  textPrimary: "#1C1C1C",
  textSecondary: "#6B7280",
  accentWarm: "#FF6B6B",
  accentWellness: "#2D5A27",
  accentTrust: "#002D62",
  accentTeal: "#00A3A1",
  borderLight: "#E5E7EB",
  heroNavy: "#002147"
};

const faqs = [
  {
    question: "What is ComplianceWorxs?",
    answer: "ComplianceWorxs is an AI-powered compliance intelligence platform designed specifically for life science companies. We automate gap analysis, risk scoring, and audit preparation for FDA 21 CFR 820, ISO 13485, and other regulatory frameworks."
  },
  {
    question: "How is data isolated?",
    answer: "Each customer's data is logically isolated with dedicated encryption keys. We maintain multi-tenant architecture with strict access controls and 21 CFR Part 11 compliant audit trails."
  },
  {
    question: "Can I export reports?",
    answer: "Yes, all gap analysis reports, risk assessments, and audit documentation can be exported in PDF, Excel, and Word formats for regulatory submissions and internal review."
  },
  {
    question: "Is there a setup fee?",
    answer: "No setup fees for our Starter and Professional plans. Enterprise customers receive complimentary onboarding and configuration support."
  },
  {
    question: "How do you score regulatory impact?",
    answer: "Our proprietary Executive Impact Score (1.0-10.0) aggregates gap severity, regulatory exposure, and audit readiness metrics into a single actionable number that executives can track over time."
  }
];

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div 
      className="border-b"
      style={{ borderColor: colors.borderLight }}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-5 flex items-center justify-between text-left"
      >
        <span className="font-medium" style={{ color: colors.textPrimary }}>{question}</span>
        <ChevronDown 
          className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          style={{ color: colors.textSecondary }}
        />
      </button>
      {isOpen && (
        <div className="pb-5">
          <p style={{ color: colors.textSecondary }}>{answer}</p>
        </div>
      )}
    </div>
  );
}

export default function OverviewPage() {
  return (
    <div className="cw-light-theme min-h-screen" style={{ backgroundColor: colors.bgMain }}>
      {/* Header */}
      <header 
        className="border-b sticky top-0 z-50"
        style={{ backgroundColor: colors.cardBg, borderColor: colors.borderLight }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: colors.accentTeal }}
              >
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl" style={{ color: colors.textPrimary }}>ComplianceWorxs</span>
            </div>
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/overview">
              <span style={{ color: colors.textPrimary }} className="cursor-pointer font-medium">Overview</span>
            </Link>
            <Link href="/pricing">
              <span style={{ color: colors.textSecondary }} className="hover:text-gray-900 cursor-pointer">Pricing</span>
            </Link>
            <Link href="/blog">
              <span style={{ color: colors.textSecondary }} className="hover:text-gray-900 cursor-pointer">Blog</span>
            </Link>
            <Link href="/faq">
              <span style={{ color: colors.textSecondary }} className="hover:text-gray-900 cursor-pointer">FAQ</span>
            </Link>
            <a href={`${PORTAL_URL}/login`}>
              <span style={{ color: colors.textSecondary }} className="hover:text-gray-900 cursor-pointer">Log in</span>
            </a>
            <a href={`${PORTAL_URL}/signup`}>
              <Button 
                className="text-white font-semibold"
                style={{ backgroundColor: colors.accentTeal }}
                data-testid="button-header-signup"
              >
                Sign Up
              </Button>
            </a>
          </nav>
        </div>
      </header>

      {/* Hero Section - Split Layout */}
      <section className="py-16" style={{ backgroundColor: colors.bgMain }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left - Text Content */}
            <div>
              <h1 
                className="text-4xl md:text-5xl font-bold mb-6 leading-tight"
                style={{ color: colors.heroNavy }}
              >
                FDA & ISO Compliance<br />on Autopilot
              </h1>
              <p 
                className="text-lg mb-8"
                style={{ color: colors.textSecondary }}
              >
                Enterprise-grade regulatory intelligence for life sciences.<br />
                Audit-ready documentation, real-time gap detection, and<br />
                quantified compliance ROI.
              </p>
              <a href={`${PORTAL_URL}/signup`}>
                <Button 
                  size="lg"
                  className="text-white font-semibold px-8"
                  style={{ backgroundColor: colors.accentTeal }}
                  data-testid="button-hero-cta"
                >
                  Run Free Assessment
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </a>
            </div>

            {/* Right - Product Visualization */}
            <div className="relative">
              <Card className="shadow-xl" style={{ backgroundColor: colors.cardBg }}>
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Manual Process Column */}
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors.accentTeal }} />
                        <span className="text-sm font-medium" style={{ color: colors.textPrimary }}>MANUAL PROCESS</span>
                      </div>
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b" style={{ borderColor: colors.borderLight }}>
                            <th className="text-left py-2 font-medium" style={{ color: colors.textSecondary }}>SOP</th>
                            <th className="text-left py-2 font-medium" style={{ color: colors.textSecondary }}>Status</th>
                            <th className="text-left py-2 font-medium" style={{ color: colors.textSecondary }}>Review</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b" style={{ borderColor: colors.borderLight }}>
                            <td className="py-2" style={{ color: colors.textPrimary }}>SOP-001</td>
                            <td className="py-2" style={{ color: colors.textSecondary }}>Pending</td>
                            <td className="py-2" style={{ color: colors.textSecondary }}>Manual</td>
                          </tr>
                          <tr className="border-b" style={{ borderColor: colors.borderLight }}>
                            <td className="py-2" style={{ color: colors.textPrimary }}>SOP-002</td>
                            <td className="py-2" style={{ color: colors.textSecondary }}>Overdue</td>
                            <td className="py-2" style={{ color: colors.textSecondary }}>Manual</td>
                          </tr>
                          <tr className="border-b" style={{ borderColor: colors.borderLight }}>
                            <td className="py-2" style={{ color: colors.textPrimary }}>SOP-003</td>
                            <td className="py-2" style={{ color: colors.textSecondary }}>Draft</td>
                            <td className="py-2" style={{ color: colors.textSecondary }}>TBD</td>
                          </tr>
                          <tr>
                            <td className="py-2" style={{ color: colors.textPrimary }}>SOP-004</td>
                            <td className="py-2" style={{ color: colors.textSecondary }}>Pending</td>
                            <td className="py-2" style={{ color: colors.textSecondary }}>Manual</td>
                          </tr>
                        </tbody>
                      </table>
                      <div className="mt-4 text-center">
                        <span className="text-xs" style={{ color: colors.textSecondary }}>Manual Process</span>
                      </div>
                    </div>

                    {/* AI Engine Column */}
                    <div className="pl-4 border-l" style={{ borderColor: colors.borderLight }}>
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-sm font-medium" style={{ color: colors.textPrimary }}>AI ENGINE</span>
                      </div>
                      <div className="bg-gradient-to-br from-teal-50 to-white rounded-lg p-4 text-center">
                        <div 
                          className="w-20 h-20 rounded-full mx-auto mb-3 flex items-center justify-center"
                          style={{ 
                            background: `conic-gradient(${colors.accentTeal} 72%, ${colors.borderLight} 0)`,
                          }}
                        >
                          <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center">
                            <span className="text-2xl font-bold" style={{ color: colors.accentTeal }}>7.2</span>
                          </div>
                        </div>
                        <span className="text-xs" style={{ color: colors.textSecondary }}>Risk Score</span>
                        
                        <div className="grid grid-cols-2 gap-2 mt-4">
                          <div className="text-center">
                            <div className="text-lg font-bold" style={{ color: colors.heroNavy }}>3</div>
                            <div className="text-xs" style={{ color: colors.textSecondary }}>Major</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold" style={{ color: colors.heroNavy }}>24</div>
                            <div className="text-xs" style={{ color: colors.textSecondary }}>Compliant</div>
                          </div>
                        </div>
                        
                        <div className="mt-4 p-2 rounded" style={{ backgroundColor: colors.bgMain }}>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" style={{ color: colors.accentTeal }} />
                            <span className="text-xs font-medium" style={{ color: colors.textPrimary }}>Audit-Ready Report</span>
                          </div>
                          <span className="text-xs" style={{ color: colors.textSecondary }}>Ready for Export</span>
                        </div>
                      </div>
                      <div className="mt-4 text-center">
                        <span className="text-xs" style={{ color: colors.accentTeal }}>AI Engine</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Row */}
      <section className="py-12" style={{ backgroundColor: colors.cardBg }}>
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div 
                className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                style={{ backgroundColor: `${colors.accentTeal}15` }}
              >
                <Clock className="w-8 h-8" style={{ color: colors.accentTeal }} />
              </div>
              <div className="text-3xl font-bold mb-2" style={{ color: colors.heroNavy }}>90% Faster</div>
              <div style={{ color: colors.textSecondary }}>Regulatory Reviews</div>
            </div>
            <div>
              <div 
                className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                style={{ backgroundColor: `${colors.accentTeal}15` }}
              >
                <FileCheck className="w-8 h-8" style={{ color: colors.accentTeal }} />
              </div>
              <div className="text-3xl font-bold mb-2" style={{ color: colors.heroNavy }}>Audit-Ready</div>
              <div style={{ color: colors.textSecondary }}>In 2 Clicks</div>
            </div>
            <div>
              <div 
                className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                style={{ backgroundColor: `${colors.accentTeal}15` }}
              >
                <Eye className="w-8 h-8" style={{ color: colors.accentTeal }} />
              </div>
              <div className="text-3xl font-bold mb-2" style={{ color: colors.heroNavy }}>100% Traceable</div>
              <div style={{ color: colors.textSecondary }}>Evidence Trails</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16" style={{ backgroundColor: colors.bgMain }}>
        <div className="max-w-5xl mx-auto px-6">
          <h2 
            className="text-3xl font-bold text-center mb-12"
            style={{ color: colors.heroNavy }}
          >
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div 
                className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center"
                style={{ backgroundColor: colors.accentTeal }}
              >
                <Upload className="w-6 h-6 text-white" />
              </div>
              <div className="font-semibold mb-2" style={{ color: colors.textPrimary }}>Upload SOP</div>
              <div className="text-sm" style={{ color: colors.textSecondary }}>Import existing docs</div>
            </div>
            <div className="relative text-center">
              <div className="hidden md:block absolute top-7 -left-4 w-8 border-t-2 border-dashed" style={{ borderColor: colors.borderLight }} />
              <div 
                className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center"
                style={{ backgroundColor: colors.accentTeal }}
              >
                <Search className="w-6 h-6 text-white" />
              </div>
              <div className="font-semibold mb-2" style={{ color: colors.textPrimary }}>AI Gap Analysis</div>
              <div className="text-sm" style={{ color: colors.textSecondary }}>Automated scanning</div>
            </div>
            <div className="relative text-center">
              <div className="hidden md:block absolute top-7 -left-4 w-8 border-t-2 border-dashed" style={{ borderColor: colors.borderLight }} />
              <div 
                className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center"
                style={{ backgroundColor: colors.accentTeal }}
              >
                <RefreshCw className="w-6 h-6 text-white" />
              </div>
              <div className="font-semibold mb-2" style={{ color: colors.textPrimary }}>Resolve Actions</div>
              <div className="text-sm" style={{ color: colors.textSecondary }}>Guided remediation</div>
            </div>
            <div className="relative text-center">
              <div className="hidden md:block absolute top-7 -left-4 w-8 border-t-2 border-dashed" style={{ borderColor: colors.borderLight }} />
              <div 
                className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center"
                style={{ backgroundColor: colors.accentTeal }}
              >
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div className="font-semibold mb-2" style={{ color: colors.textPrimary }}>Generate Evidence</div>
              <div className="text-sm" style={{ color: colors.textSecondary }}>Audit-ready docs</div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Preview + Badges */}
      <section className="py-16" style={{ backgroundColor: colors.cardBg }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Product Preview */}
            <Card style={{ backgroundColor: colors.accentTeal }}>
              <CardContent className="p-8">
                <h3 className="text-xl font-bold text-white mb-6">Product Preview Visualization</h3>
                <div className="flex items-center justify-between mb-8">
                  {[1, 2, 3, 4].map((step) => (
                    <div key={step} className="flex items-center">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
                      >
                        {step}
                      </div>
                      {step < 4 && (
                        <div className="w-12 md:w-16 border-t-2 border-dashed mx-2" style={{ borderColor: "rgba(255,255,255,0.3)" }} />
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-white/80 text-sm mb-8">
                  <span>Upload</span>
                  <span>Analyze</span>
                  <span>Resolve</span>
                  <span>Export</span>
                </div>
                <a href={`${PORTAL_URL}/signup`}>
                  <Button 
                    className="font-semibold"
                    style={{ backgroundColor: colors.accentWarm, color: "white" }}
                    data-testid="button-preview-cta"
                  >
                    Run Free Assessment
                  </Button>
                </a>
              </CardContent>
            </Card>

            {/* Framework Badges */}
            <Card style={{ backgroundColor: colors.bgMain, border: `1px solid ${colors.borderLight}` }}>
              <CardContent className="p-8 flex flex-col justify-center h-full">
                <div className="flex items-center justify-center gap-6 flex-wrap">
                  <Badge className="px-4 py-2 text-base" style={{ backgroundColor: colors.heroNavy, color: "white" }}>FDA</Badge>
                  <span style={{ color: colors.textSecondary }}>•</span>
                  <Badge className="px-4 py-2 text-base" style={{ backgroundColor: colors.heroNavy, color: "white" }}>EMA</Badge>
                  <span style={{ color: colors.textSecondary }}>•</span>
                  <Badge className="px-4 py-2 text-base" style={{ backgroundColor: colors.heroNavy, color: "white" }}>ISO 13485</Badge>
                </div>
                <div className="flex items-center justify-center gap-8 mt-6" style={{ color: colors.textSecondary }}>
                  <span>Biotech</span>
                  <span>•</span>
                  <span>Pharma</span>
                  <span>•</span>
                  <span>Medical Device</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Use-case Section */}
      <section className="py-16" style={{ backgroundColor: colors.bgMain }}>
        <div className="max-w-5xl mx-auto px-6">
          <h3 className="text-lg font-semibold mb-6" style={{ color: colors.heroNavy }}>Use-case</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h4 className="font-semibold mb-4" style={{ color: colors.textPrimary }}>Product Promise</h4>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: colors.accentTeal }} />
                  <span style={{ color: colors.textSecondary }}>Eliminate manual tracking</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: colors.accentTeal }} />
                  <span style={{ color: colors.textSecondary }}>Quantify regulatory ROI</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: colors.accentTeal }} />
                  <span style={{ color: colors.textSecondary }}>Reduce prep time by 90%</span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4" style={{ color: colors.textPrimary }}>Use-case Unlock</h4>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: colors.accentTeal }} />
                  <span style={{ color: colors.textSecondary }}>FDA 483 response acceleration</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: colors.accentTeal }} />
                  <span style={{ color: colors.textSecondary }}>ISO 13485 gap closure</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: colors.accentTeal }} />
                  <span style={{ color: colors.textSecondary }}>Real-time audit scoring</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16" style={{ backgroundColor: colors.cardBg }}>
        <div className="max-w-3xl mx-auto px-6">
          <h2 
            className="text-3xl font-bold text-center mb-12"
            style={{ color: colors.heroNavy }}
          >
            Frequently Asked Questions
          </h2>
          <div className="border-t" style={{ borderColor: colors.borderLight }}>
            {faqs.map((faq, index) => (
              <FAQItem key={index} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16" style={{ backgroundColor: colors.heroNavy }}>
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Transform Your Compliance Process?
          </h2>
          <p className="text-white/80 mb-8">
            Get your free compliance assessment and see exactly where you stand.
          </p>
          <a href={`${PORTAL_URL}/signup`}>
            <Button 
              size="lg"
              className="font-semibold px-8"
              style={{ backgroundColor: colors.accentWarm, color: "white" }}
              data-testid="button-cta-bottom"
            >
              Run Free Assessment
            </Button>
          </a>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
