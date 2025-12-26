import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Brain, Lock, Database, FileCheck, ArrowRight, CheckCircle, Server, Layers, Scale } from "lucide-react";

const colors = {
  bgMain: "#F9FAFB",
  cardBg: "#FFFFFF",
  textPrimary: "#1C1C1C",
  textSecondary: "#6B7280",
  accentWarm: "#FF6B6B",
  accentWellness: "#2D5A27",
  accentTrust: "#002D62",
  accentTeal: "#00A3A1",
  borderLight: "#E5E7EB"
};

export default function OverviewPage() {
  return (
    <div className="cw-light-theme min-h-screen" style={{ backgroundColor: colors.bgMain }}>
      <header 
        className="border-b sticky top-0 z-50"
        style={{ backgroundColor: colors.accentTrust, borderColor: colors.borderLight }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
              >
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl" style={{ color: "#FFFFFF" }}>ComplianceWorxs</span>
            </div>
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/overview">
              <span className="text-white cursor-pointer font-medium">Overview</span>
            </Link>
            <Link href="/pricing">
              <span className="text-white/80 hover:text-white cursor-pointer">Pricing</span>
            </Link>
            <Link href="/blog">
              <span className="text-white/80 hover:text-white cursor-pointer">Blog</span>
            </Link>
            <Link href="/faq">
              <span className="text-white/80 hover:text-white cursor-pointer">FAQ</span>
            </Link>
            <Link href="/login">
              <span className="text-white/80 hover:text-white cursor-pointer">Login</span>
            </Link>
            <Link href="/signup">
              <Button 
                className="text-white font-semibold"
                style={{ backgroundColor: colors.accentWarm }}
                data-testid="button-header-signup"
              >
                Sign Up Free
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      <section 
        className="py-20"
        style={{ backgroundColor: colors.accentTrust }}
      >
        <div className="max-w-4xl mx-auto px-6 text-center">
          <Badge 
            className="mb-6"
            style={{ backgroundColor: "rgba(255,255,255,0.15)", color: "#FFFFFF" }}
          >
            <Brain className="w-3 h-3 mr-1" />
            Technical Architecture
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Enterprise Regulatory Intelligence:<br />
            Objective, Evidence-Based, Audit-Ready
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto mb-8">
            A purpose-built compliance intelligence platform designed for life science organizations 
            seeking measurable audit readiness and regulatory clarity.
          </p>
          <Link href="/signup">
            <Button 
              size="lg"
              className="text-white font-semibold px-8"
              style={{ backgroundColor: colors.accentWarm }}
              data-testid="button-hero-cta"
            >
              Start Your Assessment
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-6 py-16">
        <section className="mb-20">
          <div className="text-center mb-12">
            <Badge 
              className="mb-4"
              style={{ backgroundColor: `${colors.accentWellness}20`, color: colors.accentWellness }}
            >
              <Brain className="w-3 h-3 mr-1" />
              Core Technology
            </Badge>
            <h2 
              className="text-3xl font-bold mb-4"
              style={{ color: colors.textPrimary }}
            >
              The AI Engine
            </h2>
            <p 
              className="text-lg max-w-2xl mx-auto"
              style={{ color: colors.textSecondary }}
            >
              Our regulatory intelligence engine combines document analysis with 
              structured compliance frameworks to deliver actionable insights.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card style={{ backgroundColor: colors.cardBg, borderColor: colors.borderLight }}>
              <CardHeader>
                <div 
                  className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
                  style={{ backgroundColor: `${colors.accentWellness}15` }}
                >
                  <Scale className="w-6 h-6" style={{ color: colors.accentWellness }} />
                </div>
                <CardTitle style={{ color: colors.textPrimary }}>Gap Analysis Logic</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4" style={{ color: colors.textSecondary }}>
                  Our AI engine performs clause-by-clause comparison of your SOPs against 
                  regulatory requirements, identifying specific gaps with remediation guidance.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: colors.accentWellness }} />
                    <span style={{ color: colors.textPrimary }}>Automated SOP parsing and classification</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: colors.accentWellness }} />
                    <span style={{ color: colors.textPrimary }}>Clause-level requirement matching</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: colors.accentWellness }} />
                    <span style={{ color: colors.textPrimary }}>Major, Moderate, and Minor gap classification</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card style={{ backgroundColor: colors.cardBg, borderColor: colors.borderLight }}>
              <CardHeader>
                <div 
                  className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
                  style={{ backgroundColor: `${colors.accentWarm}15` }}
                >
                  <Layers className="w-6 h-6" style={{ color: colors.accentWarm }} />
                </div>
                <CardTitle style={{ color: colors.textPrimary }}>Risk Scoring (1.0–10.0)</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4" style={{ color: colors.textSecondary }}>
                  Our proprietary Executive Impact Score aggregates gap severity, regulatory 
                  exposure, and audit readiness into a single actionable metric.
                </p>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: "#DCFCE7" }}>
                    <span className="font-medium" style={{ color: colors.accentWellness }}>1.0 – 3.9</span>
                    <span style={{ color: colors.textPrimary }}>Low Risk / Audit Ready</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: "#FEF3C7" }}>
                    <span className="font-medium" style={{ color: "#D97706" }}>4.0 – 6.9</span>
                    <span style={{ color: colors.textPrimary }}>Moderate Risk / Action Needed</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: "#FEE2E2" }}>
                    <span className="font-medium" style={{ color: "#DC2626" }}>7.0 – 10.0</span>
                    <span style={{ color: colors.textPrimary }}>High Risk / Critical Gaps</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-8" style={{ backgroundColor: colors.cardBg, borderColor: colors.borderLight }}>
            <CardHeader>
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
                style={{ backgroundColor: `${colors.accentTeal}15` }}
              >
                <FileCheck className="w-6 h-6" style={{ color: colors.accentTeal }} />
              </div>
              <CardTitle style={{ color: colors.textPrimary }}>Regulatory Framework Mapping</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-6" style={{ color: colors.textSecondary }}>
                ComplianceWorxs maps your documentation against industry-standard regulatory frameworks, 
                providing clear visibility into compliance status across jurisdictions.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 rounded-lg" style={{ backgroundColor: colors.bgMain }}>
                  <h4 className="font-semibold mb-2" style={{ color: colors.accentTrust }}>FDA 21 CFR 820</h4>
                  <p className="text-sm mb-3" style={{ color: colors.textSecondary }}>
                    Quality System Regulation for medical devices sold in the United States.
                  </p>
                  <ul className="text-sm space-y-1" style={{ color: colors.textPrimary }}>
                    <li>• Design Controls (§820.30)</li>
                    <li>• Document Controls (§820.40)</li>
                    <li>• CAPA Requirements (§820.100)</li>
                    <li>• Production Controls (§820.70)</li>
                  </ul>
                </div>
                <div className="p-4 rounded-lg" style={{ backgroundColor: colors.bgMain }}>
                  <h4 className="font-semibold mb-2" style={{ color: colors.accentWellness }}>ISO 13485:2016</h4>
                  <p className="text-sm mb-3" style={{ color: colors.textSecondary }}>
                    International standard for medical device quality management systems.
                  </p>
                  <ul className="text-sm space-y-1" style={{ color: colors.textPrimary }}>
                    <li>• Context of the Organization (§4)</li>
                    <li>• Planning (§6)</li>
                    <li>• Operation (§7)</li>
                    <li>• Performance Evaluation (§8)</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="mb-20">
          <div className="text-center mb-12">
            <Badge 
              className="mb-4"
              style={{ backgroundColor: `${colors.accentTrust}20`, color: colors.accentTrust }}
            >
              <Lock className="w-3 h-3 mr-1" />
              Security & Compliance
            </Badge>
            <h2 
              className="text-3xl font-bold mb-4"
              style={{ color: colors.textPrimary }}
            >
              Data Sovereignty
            </h2>
            <p 
              className="text-lg max-w-2xl mx-auto"
              style={{ color: colors.textSecondary }}
            >
              Enterprise-grade security architecture designed for regulated industries 
              with GxP and 21 CFR Part 11 requirements.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card style={{ backgroundColor: colors.cardBg, borderColor: colors.borderLight }}>
              <CardHeader className="text-center">
                <div 
                  className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: `${colors.accentTrust}15` }}
                >
                  <FileCheck className="w-7 h-7" style={{ color: colors.accentTrust }} />
                </div>
                <CardTitle style={{ color: colors.textPrimary }}>21 CFR Part 11</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p style={{ color: colors.textSecondary }}>
                  Full compliance with FDA electronic records and signatures requirements, 
                  including tamper-evident audit trails and time-stamped logging.
                </p>
              </CardContent>
            </Card>

            <Card style={{ backgroundColor: colors.cardBg, borderColor: colors.borderLight }}>
              <CardHeader className="text-center">
                <div 
                  className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: `${colors.accentWellness}15` }}
                >
                  <Lock className="w-7 h-7" style={{ color: colors.accentWellness }} />
                </div>
                <CardTitle style={{ color: colors.textPrimary }}>End-to-End Encryption</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p style={{ color: colors.textSecondary }}>
                  AES-256 encryption at rest and TLS 1.3 in transit. Your regulatory 
                  documents are protected with enterprise-grade cryptography.
                </p>
              </CardContent>
            </Card>

            <Card style={{ backgroundColor: colors.cardBg, borderColor: colors.borderLight }}>
              <CardHeader className="text-center">
                <div 
                  className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: `${colors.accentWarm}15` }}
                >
                  <Database className="w-7 h-7" style={{ color: colors.accentWarm }} />
                </div>
                <CardTitle style={{ color: colors.textPrimary }}>Multi-Tenant Isolation</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p style={{ color: colors.textSecondary }}>
                  Logical data isolation with dedicated encryption keys per tenant. 
                  Your data is never commingled with other organizations.
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-8" style={{ backgroundColor: colors.accentTrust }}>
            <CardContent className="p-8">
              <div className="flex items-start gap-6">
                <div 
                  className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
                >
                  <Server className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-3">Infrastructure Security</h3>
                  <p className="text-white/80 mb-4">
                    ComplianceWorxs operates on SOC 2 Type II certified infrastructure with 
                    continuous monitoring, automated threat detection, and regular penetration testing.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Badge style={{ backgroundColor: "rgba(255,255,255,0.15)", color: "#FFFFFF" }}>SOC 2 Type II</Badge>
                    <Badge style={{ backgroundColor: "rgba(255,255,255,0.15)", color: "#FFFFFF" }}>HIPAA Ready</Badge>
                    <Badge style={{ backgroundColor: "rgba(255,255,255,0.15)", color: "#FFFFFF" }}>GDPR Compliant</Badge>
                    <Badge style={{ backgroundColor: "rgba(255,255,255,0.15)", color: "#FFFFFF" }}>99.9% Uptime SLA</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section 
          className="rounded-2xl p-12 text-center"
          style={{ backgroundColor: `${colors.accentWellness}10`, border: `2px solid ${colors.accentWellness}30` }}
        >
          <h2 
            className="text-3xl font-bold mb-4"
            style={{ color: colors.textPrimary }}
          >
            Ready to See Your Compliance Score?
          </h2>
          <p 
            className="text-lg mb-8 max-w-2xl mx-auto"
            style={{ color: colors.textSecondary }}
          >
            Upload your first SOP and get an instant gap analysis with actionable remediation guidance.
          </p>
          <Link href="/signup">
            <Button 
              size="lg"
              className="text-white font-semibold px-8"
              style={{ backgroundColor: colors.accentWellness }}
              data-testid="button-cta-bottom"
            >
              Start Free Assessment
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </section>
      </main>

      <footer 
        className="border-t py-8 mt-16"
        style={{ backgroundColor: colors.cardBg, borderColor: colors.borderLight }}
      >
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p style={{ color: colors.textSecondary }}>
            © 2025 ComplianceWorxs. All rights reserved. | Life Science Compliance Intelligence
          </p>
        </div>
      </footer>
    </div>
  );
}
