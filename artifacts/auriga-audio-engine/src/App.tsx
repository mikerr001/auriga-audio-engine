import { Switch, Route, Router as WouterRouter, Link, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import Speech from "@/pages/Speech";
import Hazard from "@/pages/Hazard";
import Guidance from "@/pages/Guidance";
import Queue from "@/pages/Queue";
import Prioritize from "@/pages/Prioritize";
import Simulate from "@/pages/Simulate";
import Validate from "@/pages/Validate";
import Vocabulary from "@/pages/Vocabulary";
import Config from "@/pages/Config";
import Observatory from "@/pages/Observatory";
import ResearchDebt from "@/pages/ResearchDebt";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 2000, retry: 1 } },
});

const NAV_ITEMS = [
  { path: "/", label: "Dashboard", icon: "◈" },
  { path: "/speech", label: "Speech Engine", icon: "◎" },
  { path: "/hazard", label: "Hazard Comm.", icon: "△" },
  { path: "/guidance", label: "Guidance Comm.", icon: "→" },
  { path: "/queue", label: "Queue Manager", icon: "≡" },
  { path: "/prioritize", label: "Priority Engine", icon: "⊞" },
  { path: "/simulate", label: "Simulator", icon: "⊙" },
  { path: "/validate", label: "Validation", icon: "✓" },
  { path: "/vocabulary", label: "Audio Vocab.", icon: "♫" },
  { path: "/config", label: "Configuration", icon: "⚙" },
  { path: "/observatory", label: "Observatory", icon: "◉" },
  { path: "/research-debt", label: "Research Debt", icon: "⚠" },
];

function Sidebar() {
  const [location] = useLocation();
  return (
    <aside className="w-56 shrink-0 flex flex-col border-r border-sidebar-border bg-sidebar h-screen sticky top-0">
      <div className="p-4 border-b border-sidebar-border">
        <div className="font-mono text-xs text-muted-foreground tracking-widest uppercase mb-1">Project Auriga</div>
        <div className="font-mono text-sm font-bold text-info">Audio Engine</div>
        <div className="font-mono text-xs text-muted-foreground mt-0.5">v1.0.0 — ACTIVE</div>
      </div>
      <nav className="flex-1 overflow-y-auto py-2">
        {NAV_ITEMS.map((item) => {
          const active = item.path === "/" ? location === "/" : location.startsWith(item.path);
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center gap-2.5 px-4 py-2 text-xs font-mono transition-colors ${
                active
                  ? "bg-info/10 text-info border-l-2 border-info"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground border-l-2 border-transparent"
              }`}
              data-testid={`nav-${item.label.replace(/\s/g, "-").toLowerCase()}`}
            >
              <span className="text-base leading-none w-4 text-center shrink-0">{item.icon}</span>
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-sidebar-border">
        <div className="font-mono text-xs text-muted-foreground">
          Constitutional constraints active
        </div>
      </div>
    </aside>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/speech" component={Speech} />
        <Route path="/hazard" component={Hazard} />
        <Route path="/guidance" component={Guidance} />
        <Route path="/queue" component={Queue} />
        <Route path="/prioritize" component={Prioritize} />
        <Route path="/simulate" component={Simulate} />
        <Route path="/validate" component={Validate} />
        <Route path="/vocabulary" component={Vocabulary} />
        <Route path="/config" component={Config} />
        <Route path="/observatory" component={Observatory} />
        <Route path="/research-debt" component={ResearchDebt} />
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
