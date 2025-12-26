import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { initGA } from "./lib/analytics";
import { attachSSE } from "@/state/sseBridge";
import { Layout } from "@/components/layout";
import { UserProvider } from "@/contexts/user-context";
import Dashboard from "@/pages/dashboard";
import ExecutiveCommand from "@/pages/executive-command";
import Goals from "@/pages/goals-fixed";
import Initiatives from "@/pages/initiatives";
import Directives from "@/pages/directives";
import DirectiveCenter from "@/pages/directive-center";
import AnalyticsPage from "@/pages/analytics";
import AiAssistant from "@/pages/ai-assistant";
import GovernancePage from "@/pages/governance";
import { MarketIntelligence } from "@/pages/market-intelligence";
import COODashboard from "@/pages/coo-dashboard";
import { CRODashboard } from "@/components/CRODashboard";
import GovernanceDashboard from "@/pages/governance-dashboard";
import NotFound from "@/pages/not-found";
import ROICalculator from "@/pages/roi-calculator";
import ComplianceDashboard from "@/pages/compliance-dashboard";
import PricingPage from "@/pages/pricing";
import SignUpPage from "@/pages/signup";
import LoginPage from "@/pages/login";
import OverviewPage from "@/pages/overview";
import FAQPage from "@/pages/faq";
import BlogPage from "@/pages/blog";
import BlogPostPage from "@/pages/blog-post";

function Router() {
  const [location] = useLocation();
  
  // Marketing Site (Public) - Root Level
  if (location === "/" || location === "/overview") {
    return <OverviewPage />;
  }

  if (location === "/pricing") {
    return <PricingPage />;
  }

  if (location === "/signup") {
    return <SignUpPage />;
  }

  if (location === "/login") {
    return <LoginPage />;
  }

  if (location === "/faq") {
    return <FAQPage />;
  }

  if (location === "/blog") {
    return <BlogPage />;
  }

  if (location.startsWith("/blog/")) {
    return <BlogPostPage />;
  }

  if (location === "/roi-calculator") {
    return <ROICalculator />;
  }

  // Operations Portal (Private) - /app prefix
  if (location.startsWith("/app")) {
    return (
      <Layout>
        <Switch>
          <Route path="/app" component={ComplianceDashboard} />
          <Route path="/app/dashboard" component={ComplianceDashboard} />
          <Route path="/app/command" component={ExecutiveCommand} />
          <Route path="/app/analytics" component={AnalyticsPage} />
          <Route path="/app/goals" component={Goals} />
          <Route path="/app/initiatives" component={Initiatives} />
          <Route path="/app/directive-center" component={DirectiveCenter} />
          <Route path="/app/directives" component={Directives} />
          <Route path="/app/ai-assistant" component={AiAssistant} />
          <Route path="/app/governance" component={GovernancePage} />
          <Route path="/app/governance/dashboard" component={GovernanceDashboard} />
          <Route path="/app/market-intelligence" component={MarketIntelligence} />
          <Route path="/app/coo" component={COODashboard} />
          <Route path="/app/cro" component={CRODashboard} />
          <Route path="/app/executive" component={Dashboard} />
          <Route component={NotFound} />
        </Switch>
      </Layout>
    );
  }

  // Legacy routes redirect - maintain backwards compatibility (redirect to /app)
  if (location === "/compliance" || location === "/dashboard") {
    window.location.href = "/app/dashboard";
    return null;
  }

  return <NotFound />;
}

function App() {
  useEffect(() => {
    // Initialize Server-Sent Events
    const cleanup = attachSSE();
    
    // Initialize Google Analytics for external self-learning verification
    if (import.meta.env.VITE_GA_MEASUREMENT_ID) {
      initGA();
      console.log('🔍 GA4 initialized for external learning verification');
    } else {
      console.warn('GA4 Measurement ID not found - external verification unavailable');
    }
    
    return cleanup;
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <UserProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </UserProvider>
    </QueryClientProvider>
  );
}

export default App;
