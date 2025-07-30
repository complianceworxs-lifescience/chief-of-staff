import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout";
import Dashboard from "@/pages/dashboard";
import CommunicationsPage from "@/pages/communications";
import AnalyticsPage from "@/pages/analytics";
import RecommendationsPage from "@/pages/recommendations";
import WorkloadsPage from "@/pages/workloads";
import AiAssistant from "@/pages/ai-assistant";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/communications" component={CommunicationsPage} />
        <Route path="/analytics" component={AnalyticsPage} />
        <Route path="/recommendations" component={RecommendationsPage} />
        <Route path="/workloads" component={WorkloadsPage} />
        <Route path="/ai-assistant" component={AiAssistant} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
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
