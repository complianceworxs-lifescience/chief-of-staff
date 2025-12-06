import { Switch, Route } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { initGA } from "./lib/analytics";
import { attachSSE } from "@/state/sseBridge";
import { Layout } from "@/components/layout";
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

function Router() {
  return (
    <Switch>
      <Route path="/roi-calculator" component={ROICalculator} />
      <Route>
        <Layout>
          <Switch>
            <Route path="/" component={ExecutiveCommand} />
            <Route path="/command" component={ExecutiveCommand} />
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/goals" component={Goals} />
            <Route path="/initiatives" component={Initiatives} />
            <Route path="/directive-center" component={DirectiveCenter} />
            <Route path="/directives" component={Directives} />
            <Route path="/analytics" component={AnalyticsPage} />
            <Route path="/ai-assistant" component={AiAssistant} />
            <Route path="/governance" component={GovernancePage} />
            <Route path="/market-intelligence" component={MarketIntelligence} />
            <Route path="/coo" component={COODashboard} />
            <Route path="/cro" component={CRODashboard} />
            <Route path="/governance/dashboard" component={GovernanceDashboard} />
            <Route component={NotFound} />
          </Switch>
        </Layout>
      </Route>
    </Switch>
  );
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
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
