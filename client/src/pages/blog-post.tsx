import { useState } from "react";
import { Link, useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Shield, Clock, ArrowLeft, ArrowRight, Bell, Share2, Linkedin, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SiLinkedin } from "react-icons/si";

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

const blogPostsContent: Record<string, {
  title: string;
  category: string;
  readTime: string;
  date: string;
  author: string;
  content: string[];
}> = {
  "iso-13485-revisions": {
    title: "Navigating the 2025 ISO 13485 Revisions: A Practical Guide",
    category: "Regulatory Update",
    readTime: "3 min read",
    date: "December 22, 2025",
    author: "Dr. Sarah Chen, Regulatory Affairs",
    content: [
      "The 2025 amendments to ISO 13485 represent the most significant update to the medical device quality management standard since its 2016 revision. For quality assurance teams and regulatory professionals, understanding these changes is critical to maintaining certification and market access.",
      "## Key Changes in the 2025 Amendment",
      "The amendment introduces enhanced requirements in three primary areas: design control documentation, risk management integration, and supplier quality agreements. These changes reflect the evolving regulatory landscape and increased expectations from notified bodies.",
      "### 1. Design Control Documentation",
      "The revised standard now requires explicit traceability between design inputs, design outputs, and verification activities. Organizations must demonstrate that each design requirement has been validated through documented evidence, creating a clear audit trail from user needs to final product specifications.",
      "### 2. Risk Management Integration",
      "ISO 13485:2025 strengthens the integration with ISO 14971 by requiring risk management activities to be embedded throughout the product lifecycle—not just during design and development. This includes post-market surveillance data feeding back into risk assessments.",
      "### 3. Supplier Quality Agreements",
      "New provisions require formal quality agreements with all critical suppliers, including specific requirements for change notification, audit rights, and quality data sharing. This addresses a common audit finding and supply chain vulnerability.",
      "## Implementation Timeline",
      "Organizations have an 18-month transition period from the publication date. We recommend beginning gap assessments immediately and prioritizing documentation updates for your next scheduled audit.",
      "## How ComplianceWorxs Helps",
      "Our AI-powered gap analysis automatically maps your existing QMS documentation against the new requirements, identifying specific clauses that need updating. Upload your current SOPs to receive a detailed remediation roadmap."
    ]
  },
  "ai-gxp-compliance": {
    title: "AI in GxP: Maintaining 21 CFR Part 11 Compliance in Automated Systems",
    category: "Technology",
    readTime: "4 min read",
    date: "December 18, 2025",
    author: "Michael Torres, Computer Systems Validation Lead",
    content: [
      "Artificial intelligence is transforming quality operations across the life sciences industry. From automated deviation detection to predictive maintenance, AI systems are becoming integral to GxP environments. However, these implementations raise critical questions about 21 CFR Part 11 compliance.",
      "## The Regulatory Framework",
      "21 CFR Part 11 establishes requirements for electronic records and signatures used in FDA-regulated activities. When AI systems generate, modify, or analyze GxP records, they become subject to these requirements—including audit trails, access controls, and system validation.",
      "### Electronic Records Requirements",
      "AI-generated outputs that serve as GxP records must meet the same standards as any other electronic record. This includes maintaining complete audit trails that capture who accessed the system, what inputs were provided, and what outputs were generated.",
      "### Signature Considerations",
      "When AI systems make decisions that would traditionally require human approval, organizations must carefully consider how electronic signature requirements apply. Many implementations use a 'human in the loop' model where AI recommendations require human authorization.",
      "## Validation Challenges",
      "Traditional computer system validation approaches struggle with AI systems that learn and adapt over time. The FDA has signaled openness to lifecycle-based validation approaches that accommodate model updates while maintaining control.",
      "### Key Validation Elements",
      "- **Model Governance**: Documented procedures for training, testing, and deploying AI models\n- **Performance Monitoring**: Ongoing verification that model outputs remain within validated parameters\n- **Change Control**: Procedures for managing model updates and retraining\n- **Audit Trail**: Complete record of model versions, training data, and performance metrics",
      "## Practical Recommendations",
      "1. Conduct a thorough assessment of how AI systems interact with GxP records\n2. Establish clear model governance procedures before deployment\n3. Implement robust performance monitoring with defined thresholds\n4. Maintain documentation suitable for regulatory inspection",
      "## ComplianceWorxs Approach",
      "Our platform is designed with 21 CFR Part 11 compliance built in. Every analysis, recommendation, and user interaction is captured in a tamper-evident audit log with timestamps and user attribution."
    ]
  },
  "roi-driven-compliance": {
    title: "The Cost of Non-Conformance: Why ROI-Driven Compliance is the Future",
    category: "Strategy",
    readTime: "3 min read",
    date: "December 14, 2025",
    author: "Jennifer Walsh, Chief Strategy Officer",
    content: [
      "For decades, compliance has been viewed as a cost center—a necessary burden to maintain market access. But leading life science organizations are discovering that strategic compliance investment delivers measurable returns that extend far beyond avoiding penalties.",
      "## The True Cost of Non-Conformance",
      "When calculating compliance ROI, organizations often underestimate the full cost of non-conformance. Beyond direct regulatory penalties, non-conformance creates cascading effects across the organization.",
      "### Direct Costs",
      "- Warning letter remediation: $500K - $2M average\n- Consent decree compliance: $5M - $50M+\n- Product recalls: Variable, often millions\n- Import bans: Lost revenue during restriction period",
      "### Indirect Costs",
      "- Extended audit cycles and increased scrutiny\n- Customer confidence and contract renewal risk\n- Employee morale and turnover in quality functions\n- Opportunity cost of leadership attention diverted to remediation",
      "## The ROI-Driven Approach",
      "Forward-thinking organizations are reframing compliance as a competitive advantage. By investing in proactive compliance intelligence, they reduce the probability of major findings while simultaneously improving operational efficiency.",
      "### Case Study: Mid-Size Medical Device Manufacturer",
      "A 200-person medical device company implemented AI-powered compliance monitoring and achieved:\n- 60% reduction in audit preparation time\n- Zero major findings in subsequent FDA inspection\n- 40% reduction in CAPA cycle time\n- Estimated $1.2M annual savings in quality operations",
      "## Measuring Compliance ROI",
      "Effective compliance ROI measurement requires tracking both risk reduction and operational efficiency. Key metrics include:\n\n- **Audit Finding Rate**: Major and minor findings per audit\n- **CAPA Cycle Time**: Days from identification to closure\n- **Document Review Efficiency**: Hours spent on SOP updates\n- **Training Completion**: Time to competency for new procedures",
      "## ComplianceWorxs Value Proposition",
      "Our ROI Calculator helps you quantify the value of proactive compliance investment. Input your current metrics to see projected savings and risk reduction from implementing intelligent compliance automation."
    ]
  }
};

export default function BlogPostPage() {
  const { toast } = useToast();
  const params = useParams();
  const postId = params.id as string;
  const [email, setEmail] = useState("");

  const post = blogPostsContent[postId];

  if (!post) {
    return (
      <div className="cw-light-theme min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.bgMain }}>
        <Card style={{ backgroundColor: colors.cardBg }}>
          <CardContent className="p-8 text-center">
            <h1 className="text-2xl font-bold mb-4" style={{ color: colors.textPrimary }}>Post Not Found</h1>
            <Link href="/blog">
              <Button style={{ backgroundColor: colors.accentTrust }} className="text-white">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Blog
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const categoryColors: Record<string, { bg: string; text: string }> = {
    "Regulatory Update": { bg: `${colors.accentWarm}15`, text: colors.accentWarm },
    "Technology": { bg: `${colors.accentTeal}15`, text: colors.accentTeal },
    "Strategy": { bg: `${colors.accentWellness}15`, text: colors.accentWellness }
  };

  const colorConfig = categoryColors[post.category] || categoryColors["Strategy"];

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

  const handleShareLinkedIn = () => {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(post.title);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}&title=${title}`, '_blank', 'width=600,height=400');
  };

  const renderContent = (content: string[]) => {
    return content.map((paragraph, idx) => {
      if (paragraph.startsWith("## ")) {
        return (
          <h2 key={idx} className="text-2xl font-bold mt-8 mb-4" style={{ color: colors.textPrimary }}>
            {paragraph.replace("## ", "")}
          </h2>
        );
      }
      if (paragraph.startsWith("### ")) {
        return (
          <h3 key={idx} className="text-xl font-semibold mt-6 mb-3" style={{ color: colors.textPrimary }}>
            {paragraph.replace("### ", "")}
          </h3>
        );
      }
      if (paragraph.startsWith("- ")) {
        const items = paragraph.split("\n").filter(line => line.startsWith("- "));
        return (
          <ul key={idx} className="space-y-2 my-4 ml-4">
            {items.map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-1 flex-shrink-0" style={{ color: colors.accentWellness }} />
                <span style={{ color: colors.textPrimary }}>{item.replace("- ", "")}</span>
              </li>
            ))}
          </ul>
        );
      }
      return (
        <p key={idx} className="mb-4 leading-relaxed" style={{ color: colors.textPrimary }}>
          {paragraph}
        </p>
      );
    });
  };

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
              <span className="text-white/80 hover:text-white cursor-pointer">Pricing</span>
            </Link>
            <Link href="/blog">
              <span className="text-white cursor-pointer font-medium">Blog</span>
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

      <main className="max-w-4xl mx-auto px-6 py-12">
        <Link href="/blog">
          <Button 
            variant="ghost" 
            className="mb-6"
            style={{ color: colors.accentTrust }}
            data-testid="button-back-blog"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Blog
          </Button>
        </Link>

        <article>
          <header className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Badge style={{ backgroundColor: colorConfig.bg, color: colorConfig.text }}>
                {post.category}
              </Badge>
              <span className="flex items-center gap-1 text-sm" style={{ color: colors.textSecondary }}>
                <Clock className="w-3 h-3" />
                {post.readTime}
              </span>
            </div>
            <h1 
              className="text-4xl font-bold mb-4"
              style={{ color: colors.textPrimary }}
            >
              {post.title}
            </h1>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium" style={{ color: colors.textPrimary }}>{post.author}</p>
                <p className="text-sm" style={{ color: colors.textSecondary }}>{post.date}</p>
              </div>
              <Button 
                variant="outline"
                onClick={handleShareLinkedIn}
                style={{ borderColor: "#0A66C2", color: "#0A66C2" }}
                data-testid="button-share-linkedin"
              >
                <SiLinkedin className="w-4 h-4 mr-2" />
                Share on LinkedIn
              </Button>
            </div>
          </header>

          <div 
            className="prose max-w-none"
            style={{ color: colors.textPrimary }}
          >
            {renderContent(post.content)}
          </div>

          <Card 
            className="mt-12"
            style={{ backgroundColor: colors.accentTrust }}
          >
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-white" />
                <CardTitle className="text-lg text-white">
                  Subscribe to Regulatory Alerts
                </CardTitle>
              </div>
              <CardDescription className="text-white/80">
                Get notified when new regulations impact your compliance status.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubscribe} className="flex gap-3">
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 bg-white"
                  style={{ borderColor: colors.borderLight }}
                  data-testid="input-post-subscribe-email"
                />
                <Button 
                  type="submit"
                  className="text-white"
                  style={{ backgroundColor: colors.accentWarm }}
                  data-testid="button-post-subscribe"
                >
                  Subscribe
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </form>
            </CardContent>
          </Card>
        </article>
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
