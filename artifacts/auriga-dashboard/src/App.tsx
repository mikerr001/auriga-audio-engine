import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout";
import Dashboard from "@/pages/dashboard";
import Synthesize from "@/pages/synthesize";
import Hazard from "@/pages/hazard";
import Guidance from "@/pages/guidance";
import Compress from "@/pages/compress";
import Priority from "@/pages/priority";
import Queue from "@/pages/queue";
import Vocabulary from "@/pages/vocabulary";
import Simulate from "@/pages/simulate";
import Observatory from "@/pages/observatory";
import ResearchDebt from "@/pages/research-debt";
import Config from "@/pages/config";
import Validate from "@/pages/validate";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/speech" component={Synthesize} />
        <Route path="/hazard" component={Hazard} />
        <Route path="/guidance" component={Guidance} />
        <Route path="/compress" component={Compress} />
        <Route path="/prioritize" component={Priority} />
        <Route path="/queue" component={Queue} />
        <Route path="/vocabulary" component={Vocabulary} />
        <Route path="/simulate" component={Simulate} />
        <Route path="/observatory" component={Observatory} />
        <Route path="/research-debt" component={ResearchDebt} />
        <Route path="/config" component={Config} />
        <Route path="/validate" component={Validate} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
