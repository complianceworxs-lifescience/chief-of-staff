import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Shield, HelpCircle, ArrowRight, Scale, Lock, FileText, Users, Brain, Clock, CheckCircle } from "lucide-react";
import { PublicFooter } from "@/components/public-footer";

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
  borderLight: "#E5E7EB"
};

const faqItems = [
  {
    id: "legal-advice",
    question: "Is this legal advice?",
    answer: "No. This tool provides technical gap analysis and regulatory intelligence based on official standards. It does not constitute legal counsel. ComplianceWorxs analyzes your documentation against regulatory frameworks (FDA 21 CFR 820, ISO 13485:2016) to identify compliance gaps, but all remediation decisions should be reviewed by qualified regulatory affairs professionals within your organization.",
    icon: Scale
  },
  {
    id: "data-isolation",
    question: "How is data isolated?",
    answer: "ComplianceWorxs utilizes encrypted, siloed data architectures to ensure GxP-grade privacy. Each customer's data is stored in logically isolated environments with dedicated encryption keys. We implement strict access controls, audit logging, and multi-tenant isolation protocols that meet 21 CFR Part 11 requirements for electronic records in regulated industries.",
    icon: Lock
  },
  {
    id: "export-reports",
    question: "Can I export reports?",
    answer: "Yes. All assessments generate timestamped, read-only PDF evidence for auditor inspection. Exports include complete gap analysis summaries, risk scores, remediation recommendations, and compliance status indicators. Each report is cryptographically signed with generation timestamps to maintain audit trail integrity.",
    icon: FileText
  },
  {
    id: "regulatory-standards",
    question: "Which regulatory standards does ComplianceWorxs support?",
    answer: "ComplianceWorxs currently supports FDA 21 CFR 820 (Quality System Regulation), ISO 13485:2016 (Medical Device QMS), and provides mapping across both frameworks. We continuously update our regulatory database to reflect the latest guidance documents, final rules, and enforcement trends from FDA, EMA, and ISO.",
    icon: CheckCircle
  },
  {
    id: "multi-user",
    question: "Does ComplianceWorxs support multi-user teams?",
    answer: "Yes. Our Compliance Architect tier includes enterprise multi-user access with role-based permissions. You can assign Strategic Architect (full access), QA Lead (upload and approve), or Operator (view-only) roles. All user actions are logged in our 21 CFR Part 11 compliant audit trail.",
    icon: Users
  },
  {
    id: "ai-learning",
    question: "How does the AI learning system work?",
    answer: "Our Recursive Self-Improvement (RSI) system tracks when users override AI recommendations. After multiple consistent overrides in the same category, the system adjusts confidence scores and recommendations to better align with your organization's regulatory interpretation. This learning is isolated to your organization and does not affect other customers.",
    icon: Brain
  },
  {
    id: "onboarding-time",
    question: "How long does onboarding take?",
    answer: "Most customers complete their first gap analysis within 15 minutes of signing up. Simply upload an SOP, select the regulatory track (FDA or ISO), and our AI engine immediately begins analysis. For enterprise deployments with existing document libraries, we offer guided migration support.",
    icon: Clock
  },
  {
    id: "audit-preparation",
    question: "How does ComplianceWorxs help with audit preparation?",
    answer: "Our Virtual Auditor simulation feature tests your documentation against high-risk audit questions covering Design Control, Risk Management, CAPA, Document Control, and Training. You receive pass/fail grading and specific remediation guidance before your actual audit, helping you identify and address gaps proactively.",
    icon: Shield
  }
];

export default function FAQPage() {
  return (
    <div className="cw-light-theme min-h-screen" style={{ backgroundColor: colors.bgMain }}>
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
              <span style={{ color: colors.textSecondary }} className="hover:text-gray-900 cursor-pointer">Overview</span>
            </Link>
            <Link href="/pricing">
              <span style={{ color: colors.textSecondary }} className="hover:text-gray-900 cursor-pointer">Pricing</span>
            </Link>
            <Link href="/blog">
              <span style={{ color: colors.textSecondary }} className="hover:text-gray-900 cursor-pointer">Blog</span>
            </Link>
            <Link href="/faq">
              <span style={{ color: colors.textPrimary }} className="cursor-pointer font-medium">FAQ</span>
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

      <section className="py-16" style={{ backgroundColor: colors.cardBg }}>
        <div className="max-w-4xl mx-auto px-6 text-center">
          <Badge 
            className="mb-6"
            style={{ backgroundColor: `${colors.accentWellness}20`, color: colors.accentWellness }}
          >
            <HelpCircle className="w-3 h-3 mr-1" />
            Self-Service Protocol
          </Badge>
          <h1 
            className="text-4xl md:text-5xl font-bold mb-6"
            style={{ color: colors.textPrimary }}
          >
            Frequently Asked Questions
          </h1>
          <p 
            className="text-xl max-w-2xl mx-auto"
            style={{ color: colors.textSecondary }}
          >
            Everything you need to know about ComplianceWorxs regulatory intelligence platform.
          </p>
        </div>
      </section>

      <main className="max-w-4xl mx-auto px-6 py-16">
        <Accordion type="single" collapsible className="space-y-4">
          {faqItems.map((item) => (
            <AccordionItem 
              key={item.id} 
              value={item.id}
              className="border-2 rounded-lg overflow-hidden"
              style={{ borderColor: colors.borderLight, backgroundColor: colors.cardBg }}
            >
              <AccordionTrigger 
                className="px-6 py-5 hover:no-underline [&[data-state=open]]:rounded-b-none hover:bg-gray-50"
                style={{ backgroundColor: colors.cardBg }}
                data-testid={`accordion-trigger-${item.id}`}
              >
                <div className="flex items-center gap-4 text-left">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${colors.accentWellness}15` }}
                  >
                    <item.icon className="w-5 h-5" style={{ color: colors.accentWellness }} />
                  </div>
                  <span className="text-lg font-semibold" style={{ color: colors.accentTrust }}>{item.question}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent 
                className="px-6 py-5"
                style={{ backgroundColor: colors.bgMain, borderTop: `1px solid ${colors.borderLight}` }}
                data-testid={`accordion-content-${item.id}`}
              >
                <p 
                  className="text-base leading-relaxed pl-14"
                  style={{ color: colors.textPrimary }}
                >
                  {item.answer}
                </p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <section 
          className="mt-16 rounded-2xl p-12 text-center"
          style={{ backgroundColor: colors.accentTrust }}
        >
          <h2 className="text-3xl font-bold mb-4" style={{ color: "#FFFFFF" }}>
            Still Have Questions?
          </h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto" style={{ color: "rgba(255,255,255,0.9)" }}>
            Our team is here to help you understand how ComplianceWorxs can transform your regulatory operations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href={`${PORTAL_URL}/signup`}>
              <Button 
                size="lg"
                className="font-semibold px-8"
                style={{ backgroundColor: colors.accentWarm, color: "#FFFFFF" }}
                data-testid="button-cta-signup"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </a>
            <Button 
              size="lg"
              variant="outline"
              className="font-semibold px-8"
              style={{ backgroundColor: "#FFFFFF", borderColor: "#FFFFFF", color: colors.accentTrust }}
              data-testid="button-cta-contact"
            >
              Contact Sales
            </Button>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
