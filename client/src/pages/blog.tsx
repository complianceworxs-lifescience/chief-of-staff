import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Shield, Newspaper, Clock, ArrowRight, Bell, ChevronRight, AlertTriangle, FileText, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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

const regulatoryUpdates = [
  { id: 1, type: "FDA", severity: "critical", title: "Final Rule: 21 CFR 820 Quality System Updates", date: "Dec 20, 2025" },
  { id: 2, type: "ISO", severity: "draft", title: "Draft Guidance: ISO 13485:2016 Amendment 2", date: "Dec 18, 2025" },
  { id: 3, type: "EMA", severity: "critical", title: "GMP Annex 1 Enforcement Timeline Extended", date: "Dec 15, 2025" },
  { id: 4, type: "FDA", severity: "draft", title: "Draft: AI/ML Software as Medical Device Framework", date: "Dec 12, 2025" },
  { id: 5, type: "ISO", severity: "critical", title: "ISO 14971:2019 Risk Management Clarifications", date: "Dec 10, 2025" },
];

const blogPosts = [
  {
    id: "iso-13485-revisions",
    title: "Navigating the 2025 ISO 13485 Revisions: A Practical Guide",
    excerpt: "The 2025 amendments to ISO 13485 introduce significant changes to design control documentation and risk management integration. Here's what your QMS team needs to know.",
    category: "Regulatory Update",
    readTime: "3 min read",
    date: "December 22, 2025",
    featured: true
  },
  {
    id: "ai-gxp-compliance",
    title: "AI in GxP: Maintaining 21 CFR Part 11 Compliance in Automated Systems",
    excerpt: "As AI systems become integral to quality operations, maintaining electronic records compliance requires new validation approaches. We break down the FDA's expectations.",
    category: "Technology",
    readTime: "4 min read",
    date: "December 18, 2025",
    featured: false
  },
  {
    id: "roi-driven-compliance",
    title: "The Cost of Non-Conformance: Why ROI-Driven Compliance is the Future",
    excerpt: "Compliance is no longer just about avoiding penalties—it's a competitive advantage. Learn how leading life science companies are measuring compliance ROI.",
    category: "Strategy",
    readTime: "3 min read",
    date: "December 14, 2025",
    featured: false
  }
];

function RegulatoryTicker() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % regulatoryUpdates.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const current = regulatoryUpdates[currentIndex];

  return (
    <div 
      className="border-b py-3 px-6"
      style={{ backgroundColor: colors.cardBg, borderColor: colors.borderLight }}
    >
      <div className="max-w-7xl mx-auto flex items-center gap-4">
        <Badge 
          className="flex-shrink-0"
          style={{ 
            backgroundColor: current.severity === "critical" ? `${colors.accentWarm}20` : `${colors.accentTeal}20`,
            color: current.severity === "critical" ? colors.accentWarm : colors.accentTeal
          }}
        >
          <Zap className="w-3 h-3 mr-1" />
          {current.severity === "critical" ? "Final Rule" : "Draft Guidance"}
        </Badge>
        <div className="flex-1 flex items-center gap-3 overflow-hidden">
          <Badge 
            variant="outline"
            style={{ 
              borderColor: current.type === "FDA" ? "#1D4ED8" : current.type === "ISO" ? "#7C3AED" : "#C2410C",
              color: current.type === "FDA" ? "#1D4ED8" : current.type === "ISO" ? "#7C3AED" : "#C2410C"
            }}
          >
            {current.type}
          </Badge>
          <span className="truncate font-medium" style={{ color: colors.textPrimary }}>
            {current.title}
          </span>
          <span className="flex-shrink-0 text-sm" style={{ color: colors.textSecondary }}>
            {current.date}
          </span>
        </div>
        <div className="flex items-center gap-1 text-sm" style={{ color: colors.textSecondary }}>
          {regulatoryUpdates.map((_, idx) => (
            <span 
              key={idx}
              className={`w-2 h-2 rounded-full transition-colors ${idx === currentIndex ? '' : 'opacity-30'}`}
              style={{ backgroundColor: idx === currentIndex ? colors.accentTeal : colors.textSecondary }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function BlogCard({ post }: { post: typeof blogPosts[0] }) {
  const categoryColors: Record<string, { bg: string; text: string }> = {
    "Regulatory Update": { bg: `${colors.accentWarm}15`, text: colors.accentWarm },
    "Technology": { bg: `${colors.accentTeal}15`, text: colors.accentTeal },
    "Strategy": { bg: `${colors.accentWellness}15`, text: colors.accentWellness }
  };

  const colorConfig = categoryColors[post.category] || categoryColors["Strategy"];

  return (
    <Card 
      className="border hover:shadow-lg transition-shadow h-full flex flex-col"
      style={{ borderColor: colors.borderLight, backgroundColor: colors.cardBg }}
      data-testid={`card-blog-${post.id}`}
    >
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <Badge style={{ backgroundColor: colorConfig.bg, color: colorConfig.text }}>
            {post.category}
          </Badge>
          <span className="flex items-center gap-1 text-sm" style={{ color: colors.textSecondary }}>
            <Clock className="w-3 h-3" />
            {post.readTime}
          </span>
        </div>
        <CardTitle className="text-lg leading-tight" style={{ color: colors.textPrimary }}>
          {post.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        <CardDescription className="line-clamp-3" style={{ color: colors.textSecondary }}>
          {post.excerpt}
        </CardDescription>
      </CardContent>
      <CardFooter className="flex items-center justify-between pt-4 border-t" style={{ borderColor: colors.borderLight }}>
        <span className="text-sm" style={{ color: colors.textSecondary }}>{post.date}</span>
        <Link href={`/blog/${post.id}`}>
          <Button 
            variant="ghost" 
            size="sm"
            style={{ color: colors.accentTrust }}
            data-testid={`button-read-${post.id}`}
          >
            Read More <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}

export default function BlogPage() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({
        title: "Email Required",
        description: "Please enter your email address.",
        variant: "destructive"
      });
      return;
    }
    toast({
      title: "Subscribed!",
      description: "You'll receive regulatory alerts at " + email,
    });
    setEmail("");
  };

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
              <span style={{ color: colors.textPrimary }} className="cursor-pointer font-medium">Blog</span>
            </Link>
            <Link href="/faq">
              <span style={{ color: colors.textSecondary }} className="hover:text-gray-900 cursor-pointer">FAQ</span>
            </Link>
            <Link href="/login">
              <span style={{ color: colors.textSecondary }} className="hover:text-gray-900 cursor-pointer">Log in</span>
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

      <RegulatoryTicker />

      <section className="py-12" style={{ backgroundColor: colors.cardBg }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-3 mb-2">
            <Newspaper className="w-6 h-6" style={{ color: colors.accentTrust }} />
            <Badge style={{ backgroundColor: `${colors.accentWellness}20`, color: colors.accentWellness }}>
              Real-Time Intelligence
            </Badge>
          </div>
          <h1 
            className="text-4xl font-bold mb-4"
            style={{ color: colors.textPrimary }}
          >
            Real-Time Regulatory Intelligence Feed
          </h1>
          <p 
            className="text-lg max-w-2xl"
            style={{ color: colors.textSecondary }}
          >
            Stay ahead of regulatory changes with expert analysis, practical guides, 
            and breaking updates from FDA, EMA, and ISO.
          </p>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <h2 
              className="text-2xl font-bold mb-6"
              style={{ color: colors.textPrimary }}
            >
              Latest Articles
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {blogPosts.map(post => (
                <BlogCard key={post.id} post={post} />
              ))}
            </div>
          </div>

          <aside className="space-y-6">
            <Card style={{ backgroundColor: colors.cardBg, borderColor: colors.borderLight }}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5" style={{ color: colors.accentWarm }} />
                  <CardTitle className="text-lg" style={{ color: colors.textPrimary }}>
                    Subscribe to Regulatory Alerts
                  </CardTitle>
                </div>
                <CardDescription style={{ color: colors.textSecondary }}>
                  Get notified when new regulations impact your compliance status.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubscribe} className="space-y-3">
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ borderColor: colors.borderLight }}
                    data-testid="input-subscribe-email"
                  />
                  <Button 
                    type="submit"
                    className="w-full text-white"
                    style={{ backgroundColor: colors.accentWarm }}
                    data-testid="button-subscribe"
                  >
                    Subscribe
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card style={{ backgroundColor: colors.accentTrust }}>
              <CardHeader>
                <CardTitle className="text-lg text-white">
                  Latest Regulatory Updates
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {regulatoryUpdates.slice(0, 4).map(update => (
                  <div 
                    key={update.id}
                    className="flex items-start gap-3 pb-3 border-b last:border-0 last:pb-0"
                    style={{ borderColor: "rgba(255,255,255,0.15)" }}
                  >
                    <div 
                      className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ 
                        backgroundColor: update.severity === "critical" 
                          ? "rgba(255,107,107,0.2)" 
                          : "rgba(0,163,161,0.2)" 
                      }}
                    >
                      {update.severity === "critical" 
                        ? <AlertTriangle className="w-4 h-4" style={{ color: colors.accentWarm }} />
                        : <FileText className="w-4 h-4" style={{ color: colors.accentTeal }} />
                      }
                    </div>
                    <div>
                      <p className="text-sm text-white font-medium leading-tight">{update.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge 
                          variant="outline"
                          className="text-xs"
                          style={{ 
                            borderColor: "rgba(255,255,255,0.3)",
                            color: "rgba(255,255,255,0.8)"
                          }}
                        >
                          {update.type}
                        </Badge>
                        <span className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>
                          {update.date}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
