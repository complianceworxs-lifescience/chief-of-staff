import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Lock, CheckCircle } from "lucide-react";
import { SiGoogle } from "react-icons/si";

const colors = {
  bgMain: "#F9FAFB",
  cardBg: "#FFFFFF",
  textPrimary: "#1C1C1C",
  textSecondary: "#6B7280",
  accentTeal: "#00A3A1",
  accentTrust: "#002D62",
  borderLight: "#E5E7EB"
};

const securityFeatures = [
  "21 CFR Part 11 compliant identity verification",
  "Enterprise-grade session management",
  "Complete audit trail logging"
];

export default function LoginPage() {
  const handleGoogleLogin = () => {
    window.location.href = "/api/login";
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
            <Link href="/signup">
              <Button 
                className="text-white font-semibold"
                style={{ backgroundColor: colors.accentTeal }}
                data-testid="button-header-signup"
              >
                Sign Up
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex items-center justify-center min-h-[calc(100vh-80px)] px-6 py-16">
        <Card 
          className="w-full max-w-md border-2 shadow-xl"
          style={{ borderColor: colors.borderLight, backgroundColor: colors.cardBg }}
        >
          <CardHeader className="text-center pb-4">
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: `${colors.accentTrust}15` }}
            >
              <Lock className="w-8 h-8" style={{ color: colors.accentTrust }} />
            </div>
            <CardTitle className="text-2xl" style={{ color: colors.textPrimary }}>
              Secure Gateway
            </CardTitle>
            <CardDescription className="text-base" style={{ color: colors.textSecondary }}>
              Access your L5.5 Command Center
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Button
              onClick={handleGoogleLogin}
              className="w-full py-6 text-base font-semibold"
              style={{ backgroundColor: colors.accentTeal, color: "white" }}
              data-testid="button-google-login"
            >
              <SiGoogle className="w-5 h-5 mr-3" />
              Continue with Google
            </Button>

            <div className="pt-4 border-t" style={{ borderColor: colors.borderLight }}>
              <p className="text-sm font-medium mb-3" style={{ color: colors.textPrimary }}>
                Enterprise Security
              </p>
              <div className="space-y-2">
                {securityFeatures.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: colors.accentTeal }} />
                    <span className="text-sm" style={{ color: colors.textSecondary }}>{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-center text-sm" style={{ color: colors.textSecondary }}>
              Don't have an account?{" "}
              <Link href="/signup">
                <span 
                  className="font-medium cursor-pointer hover:underline"
                  style={{ color: colors.accentTeal }}
                >
                  Sign up free
                </span>
              </Link>
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
