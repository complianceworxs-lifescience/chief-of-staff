import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, ArrowRight, Lock } from "lucide-react";
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

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [resetEmail, setResetEmail] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!formData.email || !formData.password) {
      toast({
        title: "Missing Credentials",
        description: "Please enter your email and password.",
        variant: "destructive"
      });
      setIsLoading(false);
      return;
    }

    await new Promise(resolve => setTimeout(resolve, 1000));

    toast({
      title: "Welcome Back!",
      description: "Redirecting to your Command Center...",
    });

    setTimeout(() => {
      setLocation("/dashboard");
    }, 500);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resetEmail) {
      toast({
        title: "Email Required",
        description: "Please enter your email address.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Reset Link Sent",
      description: "Check your email for password reset instructions.",
    });
    
    setShowForgotPassword(false);
    setResetEmail("");
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

      <main className="flex items-center justify-center min-h-[calc(100vh-80px)] px-6 py-16">
        <Card 
          className="w-full max-w-md border-2 shadow-xl"
          style={{ borderColor: colors.borderLight, backgroundColor: colors.cardBg }}
        >
          {!showForgotPassword ? (
            <>
              <CardHeader className="text-center">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: `${colors.accentTrust}15` }}
                >
                  <Lock className="w-6 h-6" style={{ color: colors.accentTrust }} />
                </div>
                <CardTitle style={{ color: colors.textPrimary }}>Welcome Back</CardTitle>
                <CardDescription style={{ color: colors.textSecondary }}>
                  Sign in to access your L5.5 Command Center
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <Label htmlFor="email" style={{ color: colors.textPrimary }}>Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@company.com"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="mt-1.5"
                      data-testid="input-login-email"
                      style={{ borderColor: colors.borderLight }}
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" style={{ color: colors.textPrimary }}>Password</Label>
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(true)}
                        className="text-sm hover:underline"
                        style={{ color: colors.accentTrust }}
                        data-testid="link-forgot-password"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      className="mt-1.5"
                      data-testid="input-login-password"
                      style={{ borderColor: colors.borderLight }}
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full text-white font-semibold py-6"
                    style={{ backgroundColor: colors.accentTrust }}
                    disabled={isLoading}
                    data-testid="button-login-submit"
                  >
                    {isLoading ? "Signing In..." : "Sign In"}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>

                  <p className="text-center text-sm" style={{ color: colors.textSecondary }}>
                    Don't have an account?{" "}
                    <Link href="/signup">
                      <span 
                        className="font-medium cursor-pointer hover:underline"
                        style={{ color: colors.accentWarm }}
                      >
                        Sign up free
                      </span>
                    </Link>
                  </p>
                </form>
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader className="text-center">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: `${colors.accentTeal}15` }}
                >
                  <Shield className="w-6 h-6" style={{ color: colors.accentTeal }} />
                </div>
                <CardTitle style={{ color: colors.textPrimary }}>Reset Password</CardTitle>
                <CardDescription style={{ color: colors.textSecondary }}>
                  Enter your email and we'll send you a reset link
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleForgotPassword} className="space-y-5">
                  <div>
                    <Label htmlFor="reset-email" style={{ color: colors.textPrimary }}>Email</Label>
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="you@company.com"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="mt-1.5"
                      data-testid="input-reset-email"
                      style={{ borderColor: colors.borderLight }}
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full text-white font-semibold py-6"
                    style={{ backgroundColor: colors.accentTeal }}
                    data-testid="button-reset-submit"
                  >
                    Send Reset Link
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>

                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(false)}
                    className="w-full text-center text-sm hover:underline"
                    style={{ color: colors.accentTrust }}
                    data-testid="link-back-to-login"
                  >
                    Back to login
                  </button>
                </form>
              </CardContent>
            </>
          )}
        </Card>
      </main>
    </div>
  );
}
