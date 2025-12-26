import { Link } from "wouter";
import { Shield } from "lucide-react";

const PORTAL_URL = import.meta.env.VITE_PORTAL_URL || "";

const colors = {
  bgMain: "#F9FAFB",
  cardBg: "#FFFFFF",
  textPrimary: "#1C1C1C",
  textSecondary: "#6B7280",
  accentWellness: "#2D5A27",
  accentTrust: "#002D62",
  borderLight: "#E5E7EB"
};

export function PublicFooter() {
  return (
    <footer 
      className="border-t py-12"
      style={{ backgroundColor: colors.cardBg, borderColor: colors.borderLight }}
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: colors.accentTrust }}
              >
                <Shield className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold" style={{ color: colors.textPrimary }}>ComplianceWorxs</span>
            </div>
            <p className="text-sm" style={{ color: colors.textSecondary }}>
              AI-powered compliance intelligence for life science companies.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4" style={{ color: colors.textPrimary }}>Product</h4>
            <nav className="space-y-2">
              <Link href="/overview">
                <span className="block text-sm cursor-pointer hover:underline" style={{ color: colors.textSecondary }}>Overview</span>
              </Link>
              <Link href="/pricing">
                <span className="block text-sm cursor-pointer hover:underline" style={{ color: colors.textSecondary }}>Pricing</span>
              </Link>
              <Link href="/faq">
                <span className="block text-sm cursor-pointer hover:underline" style={{ color: colors.textSecondary }}>FAQ</span>
              </Link>
            </nav>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4" style={{ color: colors.textPrimary }}>Resources</h4>
            <nav className="space-y-2">
              <Link href="/blog">
                <span className="block text-sm cursor-pointer hover:underline" style={{ color: colors.textSecondary }}>Blog</span>
              </Link>
              <span className="block text-sm" style={{ color: colors.textSecondary }}>Documentation</span>
              <span className="block text-sm" style={{ color: colors.textSecondary }}>API Reference</span>
            </nav>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4" style={{ color: colors.textPrimary }}>Account</h4>
            <nav className="space-y-2">
              <a href={`${PORTAL_URL}/login`}>
                <span className="block text-sm cursor-pointer hover:underline" style={{ color: colors.textSecondary }}>Login</span>
              </a>
              <a href={`${PORTAL_URL}/signup`}>
                <span className="block text-sm cursor-pointer hover:underline" style={{ color: colors.accentWellness }}>Sign Up Free</span>
              </a>
            </nav>
          </div>
        </div>
        
        <div 
          className="mt-8 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ borderTop: `1px solid ${colors.borderLight}` }}
        >
          <p className="text-sm" style={{ color: colors.textSecondary }}>
            &copy; {new Date().getFullYear()} ComplianceWorxs. All rights reserved.
          </p>
          <div className="flex gap-6">
            <span className="text-sm cursor-pointer hover:underline" style={{ color: colors.textSecondary }}>Privacy Policy</span>
            <span className="text-sm cursor-pointer hover:underline" style={{ color: colors.textSecondary }}>Terms of Service</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
