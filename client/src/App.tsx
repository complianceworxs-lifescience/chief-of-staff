import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout";
import Dashboard from "@/pages/dashboard";
import Goals from "@/pages/goals";
import Initiatives from "@/pages/initiatives";
import Directives from "@/pages/directives";
import AnalyticsPage from "@/pages/analytics";
import AiAssistant from "@/pages/ai-assistant";
import GovernancePage from "@/pages/governance";
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
