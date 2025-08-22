import { Switch, Route } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { attachSSE } from "@/state/sseBridge";
import { Layout } from "@/components/layout";
import Dashboard from "@/pages/dashboard";
import Goals from "@/pages/goals";
import Initiatives from "@/pages/initiatives";
import Directives from "@/pages/directives";
import AnalyticsPage from "@/pages/analytics";
import AiAssistant from "@/pages/ai-assistant";
import GovernancePage from "@/pages/governance";
import { MarketIntelligence } from "@/pages/market-intelligence";
import ActiveInterventionPage from "@/pages/active-intervention";
import WorkloadsPage from "@/pages/workloads";
import COODashboard from "@/pages/coo-dashboard";
import GovernanceDashboard from "@/pages/governance-dashboard";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/goals" component={Goals} />
        <Route path="/initiatives" component={Initiatives} />
        <Route path="/directives" component={Directives} />
        <Route path="/analytics" component={AnalyticsPage} />
        <Route path="/ai-assistant" component={AiAssistant} />
        <Route path="/governance" component={GovernancePage} />
        <Route path="/market-intelligence" component={MarketIntelligence} />
        <Route path="/intervention" component={ActiveInterventionPage} />
        <Route path="/workloads" component={WorkloadsPage} />
        <Route path="/coo" component={COODashboard} />
        <Route path="/governance/dashboard" component={GovernanceDashboard} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  useEffect(() => {
    const cleanup = attachSSE();
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
