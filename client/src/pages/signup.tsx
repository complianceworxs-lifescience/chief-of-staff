import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, ArrowRight, Check, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

const firmTypes = [
  { value: "biotech", label: "Biotechnology" },
  { value: "pharma", label: "Pharmaceutical" },
  { value: "medtech", label: "Medical Device / MedTech" },
  { value: "consultant", label: "Compliance Consultant" },
  { value: "cro", label: "CRO / CMO" },
  { value: "diagnostics", label: "Diagnostics" }
];

const benefits = [
  "AI-powered gap analysis in minutes",
  "Virtual auditor simulation",
  "21 CFR + ISO 13485 mapping",
  "No credit card required"
];

export default function SignUpPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    fullName: "",
    company: "",
    firmType: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!formData.email || !formData.fullName || !formData.company || !formData.firmType) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields to continue.",
        variant: "destructive"
      });
      setIsLoading(false);
      return;
    }

    await new Promise(resolve => setTimeout(resolve, 1000));

    localStorage.setItem("cw_user", JSON.stringify({
      email: formData.email,
      fullName: formData.fullName,
      company: formData.company,
      firmType: formData.firmType,
      loggedIn: true
    }));

    toast({
      title: "Welcome to ComplianceWorxs!",
      description: "Redirecting you to your Command Center...",
    });

    setTimeout(() => {
      setLocation("/compliance");
    }, 500);
  };

  return (
    <div className="cw-light-theme min-h-screen" style={{ backgroundColor: colors.bgMain }}>
      <header 
        className="border-b"
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
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h1 
              className="text-4xl font-bold mb-6"
              style={{ color: colors.textPrimary }}
            >
              Start Your Compliance<br />Transformation Today
            </h1>
            <p 
              className="text-lg mb-8"
              style={{ color: colors.textSecondary }}
            >
              Join 50+ life science companies using AI-powered compliance intelligence to reduce audit prep time by 60%.
            </p>
            
            <div className="space-y-4">
              {benefits.map((benefit, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div 
                    className="w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${colors.accentWellness}20` }}
                  >
                    <Check className="w-4 h-4" style={{ color: colors.accentWellness }} />
                  </div>
                  <span style={{ color: colors.textPrimary }}>{benefit}</span>
                </div>
              ))}
            </div>

            <div 
              className="mt-12 p-6 rounded-lg"
              style={{ backgroundColor: `${colors.accentTrust}08`, borderLeft: `4px solid ${colors.accentTrust}` }}
            >
              <p className="italic" style={{ color: colors.textPrimary }}>
                "ComplianceWorxs helped us identify critical gaps we missed in our manual review. 
                The virtual auditor is a game-changer."
              </p>
              <p className="mt-3 text-sm font-medium" style={{ color: colors.accentTrust }}>
                — QA Director, Series B Biotech
              </p>
            </div>
          </div>

          <Card 
            className="border-2 shadow-xl"
            style={{ borderColor: colors.borderLight, backgroundColor: colors.cardBg }}
          >
            <CardHeader className="text-center">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: `${colors.accentWellness}15` }}
              >
                <Zap className="w-6 h-6" style={{ color: colors.accentWellness }} />
              </div>
              <CardTitle style={{ color: colors.textPrimary }}>Create Your Account</CardTitle>
              <CardDescription style={{ color: colors.textSecondary }}>
                Get instant access to your L5.5 Command Center
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <Label htmlFor="email" style={{ color: colors.textPrimary }}>Work Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="mt-1.5"
                    data-testid="input-email"
                    style={{ borderColor: colors.borderLight }}
                  />
                </div>

                <div>
                  <Label htmlFor="fullName" style={{ color: colors.textPrimary }}>Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Jane Smith"
                    value={formData.fullName}
                    onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                    className="mt-1.5"
                    data-testid="input-fullname"
                    style={{ borderColor: colors.borderLight }}
                  />
                </div>

                <div>
                  <Label htmlFor="company" style={{ color: colors.textPrimary }}>Company Name</Label>
                  <Input
                    id="company"
                    type="text"
                    placeholder="Acme Biotech"
                    value={formData.company}
                    onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                    className="mt-1.5"
                    data-testid="input-company"
                    style={{ borderColor: colors.borderLight }}
                  />
                </div>

                <div>
                  <Label htmlFor="firmType" style={{ color: colors.textPrimary }}>Firm Type</Label>
                  <Select
                    value={formData.firmType}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, firmType: value }))}
                  >
                    <SelectTrigger 
                      className="mt-1.5" 
                      data-testid="select-firmtype"
                      style={{ borderColor: colors.borderLight }}
                    >
                      <SelectValue placeholder="Select your industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {firmTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  type="submit"
                  className="w-full text-white font-semibold py-6 mt-4"
                  style={{ backgroundColor: colors.accentWarm }}
                  disabled={isLoading}
                  data-testid="button-signup-submit"
                >
                  {isLoading ? "Creating Account..." : "Create Free Account"}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>

                <p className="text-center text-sm" style={{ color: colors.textSecondary }}>
                  Already have an account?{" "}
                  <Link href="/login">
                    <span 
                      className="font-medium cursor-pointer hover:underline"
                      style={{ color: colors.accentTrust }}
                    >
                      Log in
                    </span>
                  </Link>
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
