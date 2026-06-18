import { useState } from "react";
import { useGetSimulationScenarios, getGetSimulationScenariosQueryKey, useRunSimulation } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Activity, AlertTriangle, Bug, Terminal, Volume2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

export default function Simulate() {
  const { toast } = useToast();
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);

  const { data: scenarios, isLoading } = useGetSimulationScenarios({
    query: { queryKey: getGetSimulationScenariosQueryKey() }
  });

  const simMut = useRunSimulation({
    mutation: {
      onSuccess: () => toast({ title: "Simulation complete", description: "View results in the console panel." }),
      onError: (err) => toast({ title: "Sim failed", description: String(err), variant: "destructive" })
    }
  });

  const runSim = (id: string) => {
    setSelectedScenario(id);
    simMut.mutate({ data: { scenarioId: id } });
  };

  const res = simMut.data;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 h-full flex flex-col">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-primary flex items-center gap-2">
          <Terminal className="h-6 w-6" /> Simulation Runner
        </h1>
        <p className="text-muted-foreground font-mono text-sm mt-1">Stress-test the cognitive load models against high-density adversarial environments</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        <Card className="col-span-1 border-border bg-card flex flex-col h-full overflow-hidden">
          <CardHeader className="border-b border-border py-3">
            <CardTitle className="text-sm font-mono text-muted-foreground uppercase">Available Scenarios</CardTitle>
          </CardHeader>
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-3">
              {isLoading ? (
                Array.from({length: 4}).map((_, i) => <Skeleton key={i} className="h-24 w-full bg-muted/50" />)
              ) : (
                scenarios?.scenarios.map((s) => (
                  <div 
                    key={s.id} 
                    className={`border rounded-lg p-3 cursor-pointer transition-colors ${selectedScenario === s.id ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/50'}`}
                    onClick={() => runSim(s.id)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-bold text-sm">{s.name}</h4>
                      {s.adversarial && <Badge variant="destructive" className="text-[9px] h-4 py-0 px-1">ADVERSARIAL</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">{s.description}</p>
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="text-primary">{s.category.toUpperCase()}</span>
                      <span className="text-muted-foreground">{s.eventCount} EVENTS</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </Card>

        <Card className="col-span-1 lg:col-span-2 border-border bg-card flex flex-col h-full overflow-hidden">
          <CardHeader className="border-b border-border py-3">
            <CardTitle className="text-sm font-mono text-muted-foreground uppercase flex items-center gap-2">
              <Activity className="h-4 w-4" /> Telemetry & Results
            </CardTitle>
          </CardHeader>
          <ScrollArea className="flex-1 bg-black/40">
            {simMut.isPending ? (
              <div className="h-full flex flex-col items-center justify-center space-y-4 p-8">
                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <div className="font-mono text-primary animate-pulse">EXECUTING SCENARIO...</div>
              </div>
            ) : res ? (
              <div className="p-6 space-y-8 font-mono">
                {/* Header Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-6 border-b border-border/50">
                  <div>
                    <div className="text-[10px] text-muted-foreground uppercase">Duration</div>
                    <div className="text-2xl text-primary">{(res.duration / 1000).toFixed(1)}s</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground uppercase">Events</div>
                    <div className="text-2xl">{res.totalEvents}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground uppercase">Peak Load</div>
                    <div className={`text-2xl ${['critical','high'].includes(res.cognitiveLoadPeak) ? 'text-destructive' : 'text-warning'}`}>
                      {res.cognitiveLoadPeak.toUpperCase()}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground uppercase">Safety Violations</div>
                    <div className={`text-2xl ${res.safetyViolations > 0 ? 'text-destructive font-bold' : 'text-primary'}`}>
                      {res.safetyViolations}
                    </div>
                  </div>
                </div>

                {/* Message Stats */}
                <div>
                  <h3 className="text-xs text-muted-foreground uppercase mb-3 flex items-center gap-2"><Volume2 className="h-3 w-3" /> Communication Flow</h3>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="bg-primary/10 border border-primary/20 p-3 rounded">
                      <div className="text-primary text-xl font-bold">{res.messagesSpoken}</div>
                      <div className="text-[10px] opacity-70 mt-1">SPOKEN</div>
                    </div>
                    <div className="bg-warning/10 border border-warning/20 p-3 rounded">
                      <div className="text-warning text-xl font-bold">{res.messagesSuppressed}</div>
                      <div className="text-[10px] opacity-70 mt-1">SUPPRESSED (LOAD)</div>
                    </div>
                    <div className="bg-destructive/10 border border-destructive/20 p-3 rounded">
                      <div className="text-destructive text-xl font-bold">{res.messagesInterrupted}</div>
                      <div className="text-[10px] opacity-70 mt-1">INTERRUPTED (PRIORITY)</div>
                    </div>
                  </div>
                </div>

                {/* Anomalies */}
                {(res.weaknesses.length > 0 || res.assumptions.length > 0) && (
                  <div className="space-y-4 pt-6 border-t border-border/50">
                    <h3 className="text-xs text-muted-foreground uppercase flex items-center gap-2"><Bug className="h-3 w-3" /> System Anomalies</h3>
                    
                    {res.weaknesses.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-[10px] text-destructive uppercase">Detected Weaknesses:</div>
                        <ul className="space-y-2">
                          {res.weaknesses.map((w, i) => (
                            <li key={i} className="text-sm bg-destructive/10 border-l-2 border-destructive px-3 py-2 text-foreground/90">
                              {w}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {res.assumptions.length > 0 && (
                      <div className="space-y-2 mt-4">
                        <div className="text-[10px] text-warning uppercase">Risky Assumptions Made:</div>
                        <ul className="space-y-2">
                          {res.assumptions.map((a, i) => (
                            <li key={i} className="text-sm bg-warning/10 border-l-2 border-warning px-3 py-2 text-foreground/90">
                              {a}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground font-mono text-sm">
                Select and run a scenario to view telemetry
              </div>
            )}
          </ScrollArea>
        </Card>
      </div>
    </div>
  );
}
