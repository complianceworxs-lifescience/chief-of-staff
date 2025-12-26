import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Shield, Zap, Users, FileText, Brain, Lock, ArrowRight } from "lucide-react";
import { PublicFooter } from "@/components/public-footer";

const PORTAL_URL = import.meta.env.VITE_PORTAL_URL || "";

const colors = {
  bgMain: "#F9FAFB",
  cardBg: "#FFFFFF",
  textPrimary: "#1C1C1C",
  textSecondary: "#6B7280",
  accentWarm: "#FF6B6B",
  accentWarmHover: "#E55A5A",
  accentWellness: "#2D5A27",
  accentTrust: "#002D62",
  accentTeal: "#00A3A1",
  borderLight: "#E5E7EB"
};

const pricingTiers = [
  {
    name: "Rising Leader",
    price: "$299",
    period: "/mo",
    description: "For emerging life science companies building their compliance foundation.",
    features: [
      "5 SOP Assessments/month",
      "Basic Gap Analysis",
      "PDF Export Reports",
      "Email Support",
      "Single User Access"
    ],
    cta: "Start Free Trial",
    highlighted: false,
    color: colors.accentTeal
  },
  {
    name: "Validation Strategist",
    price: "$899",
    period: "/mo",
    description: "Best Value — For companies ready to accelerate audit readiness.",
    features: [
      "25 SOP Assessments/month",
      "Advanced Gap Analysis",
      "AI Remediation Prompts",
      "Virtual Auditor Simulation",
      "ISO 13485 + FDA Mapping",
      "Priority Support",
      "Up to 5 Users"
    ],
    cta: "Get Started",
    highlighted: true,
    color: colors.accentWellness
  },
  {
    name: "Compliance Architect",
    price: "Custom",
    period: "",
    description: "Enterprise-grade compliance for regulated organizations.",
    features: [
      "Unlimited Assessments",
      "Multi-User Enterprise Access",
      "RSI Self-Correction Learning",
      "21 CFR Part 11 Audit Logs",
      "Custom Integrations",
      "Dedicated Success Manager",
      "SLA Guarantees"
    ],
    cta: "Contact Sales",
    highlighted: false,
    color: colors.accentWarm
  }
];

const featureComparison = [
  { feature: "SOP Assessments", rising: "5/month", strategist: "25/month", architect: "Unlimited" },
  { feature: "Audit-Ready Evidence", rising: "Basic PDF", strategist: "Full Export Suite", architect: "Enterprise Archive" },
  { feature: "ISO 13485 Mapping", rising: "—", strategist: "✓", architect: "✓" },
  { feature: "FDA 21 CFR Track", rising: "View Only", strategist: "Full Analysis", architect: "Full + Custom" },
  { feature: "AI Remediation", rising: "—", strategist: "✓", architect: "✓ + RSI Learning" },
  { feature: "Virtual Auditor", rising: "—", strategist: "5 Simulations/mo", architect: "Unlimited" },
  { feature: "Team Governance", rising: "1 User", strategist: "5 Users", architect: "Unlimited + Roles" },
  { feature: "Audit Log (21 CFR Part 11)", rising: "—", strategist: "—", architect: "✓" },
  { feature: "Support", rising: "Email", strategist: "Priority", architect: "Dedicated Manager" }
];

export default function PricingPage() {
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
              <span className="text-white/80 hover:text-white cursor-pointer">Overview</span>
            </Link>
            <Link href="/pricing">
              <span className="text-white cursor-pointer font-medium">Pricing</span>
            </Link>
            <Link href="/blog">
              <span className="text-white/80 hover:text-white cursor-pointer">Blog</span>
            </Link>
            <Link href="/faq">
              <span className="text-white/80 hover:text-white cursor-pointer">FAQ</span>
            </Link>
            <a href={`${PORTAL_URL}/login`}>
              <span className="text-white/80 hover:text-white cursor-pointer">Login</span>
            </a>
            <a href={`${PORTAL_URL}/signup`}>
              <Button 
                className="text-white font-semibold"
                style={{ backgroundColor: colors.accentWarm }}
                data-testid="button-header-signup"
              >
                Sign Up Free
              </Button>
            </a>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <Badge 
            className="mb-4"
            style={{ backgroundColor: `${colors.accentWellness}20`, color: colors.accentWellness }}
          >
            <Zap className="w-3 h-3 mr-1" />
            Trusted by 50+ Life Science Companies
          </Badge>
          <h1 
            className="text-4xl md:text-5xl font-bold mb-4"
            style={{ color: colors.textPrimary }}
          >
            Compliance Intelligence,<br />Priced for Growth
          </h1>
          <p 
            className="text-xl max-w-2xl mx-auto"
            style={{ color: colors.textSecondary }}
          >
            Choose the plan that matches your regulatory ambitions. All plans include our AI-powered gap analysis engine.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {pricingTiers.map((tier, index) => (
            <Card 
              key={tier.name}
              className={`relative border-2 transition-all duration-300 hover:shadow-xl ${
                tier.highlighted ? "md:scale-105 shadow-lg" : ""
              }`}
              style={{ 
                borderColor: tier.highlighted ? tier.color : colors.borderLight,
                backgroundColor: colors.cardBg
              }}
              data-testid={`card-pricing-${tier.name.toLowerCase().replace(/\s+/g, '-')}`}
            >
              {tier.highlighted && (
                <div 
                  className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-white text-sm font-semibold flex items-center gap-1"
                  style={{ backgroundColor: tier.color }}
                >
                  <Star className="w-3 h-3" />
                  Most Popular
                </div>
              )}
              <CardHeader className="text-center pb-2">
                <CardTitle 
                  className="text-xl"
                  style={{ color: tier.highlighted ? tier.color : colors.textPrimary }}
                >
                  {tier.name}
                </CardTitle>
                <div className="mt-4">
                  <span 
                    className="text-5xl font-bold"
                    style={{ color: colors.textPrimary }}
                  >
                    {tier.price}
                  </span>
                  <span style={{ color: colors.textSecondary }}>{tier.period}</span>
                </div>
                <CardDescription className="mt-3" style={{ color: colors.textSecondary }}>
                  {tier.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <ul className="space-y-3">
                  {tier.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <Check 
                        className="w-5 h-5 flex-shrink-0 mt-0.5"
                        style={{ color: tier.color }}
                      />
                      <span style={{ color: colors.textPrimary }}>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <a href={`${PORTAL_URL}/signup`} className="w-full">
                  <Button 
                    className="w-full text-white font-semibold py-6"
                    style={{ 
                      backgroundColor: tier.highlighted ? tier.color : 
                                      tier.name === "Compliance Architect" ? colors.accentWarm : 
                                      colors.accentTeal 
                    }}
                    data-testid={`button-cta-${tier.name.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {tier.cta}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </a>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="mb-16">
          <h2 
            className="text-3xl font-bold text-center mb-8"
            style={{ color: colors.textPrimary }}
          >
            Detailed Feature Comparison
          </h2>
          <Card style={{ backgroundColor: colors.cardBg, borderColor: colors.borderLight }}>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ backgroundColor: colors.bgMain }}>
                      <th 
                        className="text-left p-4 font-semibold"
                        style={{ color: colors.textPrimary }}
                      >
                        Feature
                      </th>
                      <th 
                        className="text-center p-4 font-semibold"
                        style={{ color: colors.accentTeal }}
                      >
                        Rising Leader
                      </th>
                      <th 
                        className="text-center p-4 font-semibold"
                        style={{ color: colors.accentWellness }}
                      >
                        Strategist
                      </th>
                      <th 
                        className="text-center p-4 font-semibold"
                        style={{ color: colors.accentWarm }}
                      >
                        Architect
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {featureComparison.map((row, idx) => (
                      <tr 
                        key={row.feature}
                        style={{ borderTop: `1px solid ${colors.borderLight}` }}
                        className={idx % 2 === 0 ? "" : ""}
                      >
                        <td 
                          className="p-4 font-medium"
                          style={{ color: colors.textPrimary }}
                        >
                          {row.feature}
                        </td>
                        <td 
                          className="p-4 text-center"
                          style={{ color: row.rising === "—" ? colors.textSecondary : colors.textPrimary }}
                        >
                          {row.rising}
                        </td>
                        <td 
                          className="p-4 text-center font-medium"
                          style={{ 
                            color: row.strategist === "—" ? colors.textSecondary : colors.accentWellness,
                            backgroundColor: `${colors.accentWellness}08`
                          }}
                        >
                          {row.strategist}
                        </td>
                        <td 
                          className="p-4 text-center"
                          style={{ color: row.architect === "—" ? colors.textSecondary : colors.textPrimary }}
                        >
                          {row.architect}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div 
          className="rounded-2xl p-12 text-center"
          style={{ backgroundColor: colors.accentTrust }}
        >
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Transform Your Compliance?
          </h2>
          <p className="text-white/80 text-lg mb-8 max-w-2xl mx-auto">
            Join 50+ life science companies who have reduced audit preparation time by 60% with ComplianceWorxs.
          </p>
          <a href={`${PORTAL_URL}/signup`}>
            <Button 
              size="lg"
              className="text-white font-semibold px-8 py-6 text-lg"
              style={{ backgroundColor: colors.accentWarm }}
              data-testid="button-cta-bottom"
            >
              Start Your Free Trial
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </a>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
