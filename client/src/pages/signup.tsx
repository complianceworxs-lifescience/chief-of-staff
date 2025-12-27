import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Zap, Check, Lock, FileCheck, Clock, Loader2 } from "lucide-react";
import { SiGoogle } from "react-icons/si";
import { useAuth } from "@/hooks/use-auth";

const colors = {
  bgMain: "#F9FAFB",
  cardBg: "#FFFFFF",
  textPrimary: "#1C1C1C",
  textSecondary: "#6B7280",
  accentTeal: "#00A3A1",
  accentTrust: "#002D62",
  accentWellness: "#2D5A27",
  borderLight: "#E5E7EB"
};

const benefits = [
  { icon: Clock, text: "AI-powered gap analysis in minutes" },
  { icon: FileCheck, text: "Virtual auditor simulation" },
  { icon: Shield, text: "21 CFR + ISO 13485 mapping" },
  { icon: Lock, text: "Enterprise-grade security" }
];

export default function SignUpPage() {
  const { login, isLoggingIn } = useAuth();
  const [, setLocation] = useLocation();
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignup = async () => {
    setError(null);
    try {
      await login();
      setLocation("/app/dashboard");
    } catch (err: any) {
      console.error("Signup error:", err);
      setError("Sign up failed. Please try again.");
    }
  };

  return (
    <div className="cw-light-theme min-h-screen" style={{ backgroundColor: colors.bgMain }}>
      <header 
        className="border-b"
        style={{ backgroundColor: colors.cardBg, borderColor: colors.borderLight }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/overview">
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
            <Link href="/login">
              <span style={{ color: colors.textSecondary }} className="hover:text-gray-900 cursor-pointer">Log in</span>
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h1 
              className="text-4xl font-bold mb-6 leading-tight"
              style={{ color: colors.accentTrust }}
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
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${colors.accentTeal}15` }}
                  >
                    <benefit.icon className="w-5 h-5" style={{ color: colors.accentTeal }} />
                  </div>
                  <span style={{ color: colors.textPrimary }}>{benefit.text}</span>
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
            <CardHeader className="text-center pb-4">
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: `${colors.accentWellness}15` }}
              >
                <Zap className="w-8 h-8" style={{ color: colors.accentWellness }} />
              </div>
              <CardTitle className="text-2xl" style={{ color: colors.textPrimary }}>
                Create Your Account
              </CardTitle>
              <CardDescription className="text-base" style={{ color: colors.textSecondary }}>
                Get instant access to your AI-Powered Audit Readiness Portal
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {error && (
                <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm text-center">
                  {error}
                </div>
              )}
              
              <Button
                onClick={handleGoogleSignup}
                disabled={isLoggingIn}
                className="w-full py-6 text-base font-semibold"
                style={{ backgroundColor: colors.accentTeal, color: "white" }}
                data-testid="button-google-signup"
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    <SiGoogle className="w-5 h-5 mr-3" />
                    Sign up with Google
                  </>
                )}
              </Button>

              <div className="flex items-center gap-3 p-4 rounded-lg" style={{ backgroundColor: colors.bgMain }}>
                <Check className="w-5 h-5" style={{ color: colors.accentWellness }} />
                <span className="text-sm" style={{ color: colors.textSecondary }}>
                  Immediate Audit Gap Analysis • No credit card required
                </span>
              </div>

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

              <p className="text-center text-xs" style={{ color: colors.textSecondary }}>
                By signing up, you agree to our Terms of Service and Privacy Policy
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
