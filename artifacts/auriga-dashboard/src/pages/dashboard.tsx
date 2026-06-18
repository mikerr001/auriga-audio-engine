import { useEffect } from "react";
import { 
  useGetCognitiveLoad, getGetCognitiveLoadQueryKey,
  useGetQueue, getGetQueueQueryKey,
  useGetObservatoryLog, getGetObservatoryLogQueryKey
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Activity, AlertTriangle, ShieldAlert, Cpu, ListOrdered, ScrollText } from "lucide-react";

export default function Dashboard() {
  const { data: cogLoad, isLoading: isCogLoading } = useGetCognitiveLoad({ 
    query: { refetchInterval: 5000, queryKey: getGetCognitiveLoadQueryKey() } 
  });
  
  const { data: queue, isLoading: isQueueLoading } = useGetQueue({ 
    query: { refetchInterval: 5000, queryKey: getGetQueueQueryKey() } 
  });

  const { data: logs, isLoading: isLogLoading } = useGetObservatoryLog(
    { limit: 20 },
    { query: { refetchInterval: 5000, queryKey: getGetObservatoryLogQueryKey({ limit: 20 }) } }
  );

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'critical': return 'bg-destructive/20 text-destructive border-destructive/50';
      case 'high': return 'bg-destructive/20 text-destructive border-destructive/50';
      case 'moderate': return 'bg-warning/20 text-warning border-warning/50';
      case 'low': return 'bg-primary/20 text-primary border-primary/50';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6 flex flex-col h-full animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary flex items-center gap-2">
            <Activity className="h-6 w-6" /> System Dashboard
          </h1>
          <p className="text-muted-foreground font-mono text-sm mt-1">Real-time engine telemetry and cognitive load monitoring</p>
        </div>
        {cogLoad?.overloadRisk && (cogLoad.overloadRisk === 'critical' || cogLoad.overloadRisk === 'high') && (
          <Badge variant="destructive" className="animate-pulse px-4 py-1 text-sm font-mono flex items-center gap-2">
            <ShieldAlert className="h-4 w-4" /> HIGH COGNITIVE BURDEN DETECTED
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-mono text-muted-foreground flex items-center gap-2 uppercase tracking-wider">
              <Cpu className="h-4 w-4 text-primary" /> Cognitive Load
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isCogLoading ? <Skeleton className="h-12 w-full bg-muted/50" /> : (
              <div className="space-y-4">
                <div className="flex items-end justify-between">
                  <div className="text-4xl font-bold font-mono tracking-tighter">
                    {(cogLoad?.userBurden ? cogLoad.userBurden * 100 : 0).toFixed(0)}<span className="text-xl text-muted-foreground">%</span>
                  </div>
                  <Badge variant="outline" className={`font-mono uppercase ${getRiskColor(cogLoad?.overloadRisk || '')}`}>
                    {cogLoad?.overloadRisk || 'Unknown'} Risk
                  </Badge>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${cogLoad?.overloadRisk === 'critical' ? 'bg-destructive' : cogLoad?.overloadRisk === 'high' ? 'bg-warning' : 'bg-primary'}`} 
                    style={{ width: `${Math.min(100, (cogLoad?.userBurden || 0) * 100)}%` }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono text-muted-foreground">
                  <div>FREQ: {cogLoad?.messageFrequency.toFixed(1)} msg/m</div>
                  <div>SUPPRESSED: {cogLoad?.suppressedCount}</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-mono text-muted-foreground flex items-center gap-2 uppercase tracking-wider">
              <ListOrdered className="h-4 w-4 text-primary" /> Queue State
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isQueueLoading ? <Skeleton className="h-12 w-full bg-muted/50" /> : (
              <div className="space-y-4">
                <div className="flex items-end justify-between">
                  <div className="text-4xl font-bold font-mono tracking-tighter">
                    {queue?.totalCount || 0}
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-mono text-destructive">{queue?.criticalCount || 0} Critical</div>
                  </div>
                </div>
                <div className="text-xs font-mono text-muted-foreground border-t border-border pt-2">
                  EST DURATION: {(queue?.estimatedDuration || 0).toFixed(1)}s
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-mono text-muted-foreground flex items-center gap-2 uppercase tracking-wider">
              <Activity className="h-4 w-4 text-primary" /> Engine Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm font-mono border-b border-border pb-2">
                <span className="text-muted-foreground">Synthesizer</span>
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">ONLINE</Badge>
              </div>
              <div className="flex items-center justify-between text-sm font-mono border-b border-border pb-2">
                <span className="text-muted-foreground">Priority Model</span>
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">ONLINE</Badge>
              </div>
              <div className="flex items-center justify-between text-sm font-mono">
                <span className="text-muted-foreground">Overload Protection</span>
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">ACTIVE</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="flex-1 flex flex-col border-border bg-card min-h-0 overflow-hidden">
        <CardHeader className="border-b border-border py-3">
          <CardTitle className="text-sm font-mono text-muted-foreground flex items-center gap-2 uppercase tracking-wider">
            <ScrollText className="h-4 w-4 text-primary" /> Recent Communications
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            {isLogLoading ? (
              <div className="p-4 space-y-4">
                <Skeleton className="h-16 w-full bg-muted/50" />
                <Skeleton className="h-16 w-full bg-muted/50" />
                <Skeleton className="h-16 w-full bg-muted/50" />
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {logs?.entries.slice(0, 20).map((log) => (
                  <div key={log.id} className="p-4 flex gap-4 hover:bg-muted/20 transition-colors">
                    <div className="font-mono text-xs text-muted-foreground shrink-0 w-24">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 })}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`text-[10px] uppercase font-mono px-1 py-0 h-4 rounded-sm
                          ${log.type === 'spoken' ? 'bg-primary/20 text-primary border-primary/30' : 
                            log.type === 'interrupted' || log.type === 'suppressed' ? 'bg-warning/20 text-warning border-warning/30' : 
                            'bg-muted text-muted-foreground border-border'}
                        `}>
                          {log.type}
                        </Badge>
                        {log.priority && (
                          <span className="text-xs font-mono text-muted-foreground">PR: {log.priority}</span>
                        )}
                        {log.confidence && log.confidence < 0.8 && (
                          <span className="text-[10px] font-mono text-warning/80 bg-warning/10 px-1 rounded">UNCERTAIN</span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-foreground">{log.message}</p>
                    </div>
                  </div>
                ))}
                {logs?.entries.length === 0 && (
                  <div className="p-8 text-center text-sm font-mono text-muted-foreground">
                    No recent communications.
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
