import { useGetAudioVocabulary, getGetAudioVocabularyQueryKey, useGenerateAlert } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Volume2, Play } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function Vocabulary() {
  const { toast } = useToast();
  
  const { data: vocab, isLoading } = useGetAudioVocabulary({
    query: { queryKey: getGetAudioVocabularyQueryKey() }
  });

  const playMut = useGenerateAlert({
    mutation: {
      onSuccess: () => toast({ title: "Tone dispatched to queue" }),
      onError: (err) => toast({ title: "Failed to dispatch", description: String(err), variant: "destructive" })
    }
  });

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'critical': return 'border-destructive text-destructive bg-destructive/10';
      case 'warning': return 'border-warning text-warning bg-warning/10';
      case 'navigation': return 'border-primary text-primary bg-primary/10';
      default: return 'border-border text-muted-foreground bg-muted/20';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 h-full flex flex-col">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-primary flex items-center gap-2">
          <Volume2 className="h-6 w-6" /> Non-Verbal Vocabulary
        </h1>
        <p className="text-muted-foreground font-mono text-sm mt-1">Acoustic alert catalog for high-speed, low-load communication v{vocab?.version || "..."}</p>
      </div>

      <Card className="flex-1 flex flex-col border-border bg-card min-h-0 overflow-hidden">
        <CardHeader className="border-b border-border py-3">
          <CardTitle className="text-sm font-mono text-muted-foreground uppercase tracking-wider">Alert Descriptors</CardTitle>
        </CardHeader>
        <CardContent className="p-0 flex-1 overflow-auto">
          {isLoading ? (
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 w-full bg-muted/50" />)}
            </div>
          ) : (
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {vocab?.alerts.map((alert) => (
                <div key={alert.id} className="border border-border rounded-lg bg-card p-4 hover:border-primary/50 transition-colors flex flex-col">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-lg">{alert.name}</h3>
                        <Badge variant="outline" className={`text-[10px] font-mono h-5 py-0 ${getAlertColor(alert.alertType)}`}>
                          {alert.alertType}
                        </Badge>
                      </div>
                      <p className="text-sm font-mono text-muted-foreground mt-1">{alert.meaning}</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="rounded-full h-8 w-8 shrink-0 hover:text-primary hover:bg-primary/20"
                      onClick={() => playMut.mutate({ data: { alertType: alert.alertType as any } })}
                      disabled={playMut.isPending}
                    >
                      <Play className="h-4 w-4 ml-0.5" />
                    </Button>
                  </div>
                  
                  <div className="mt-auto pt-3 border-t border-border grid grid-cols-2 gap-2 text-xs font-mono text-muted-foreground">
                    <div>
                      <span className="opacity-50">FREQ: </span>
                      {alert.frequency ? `${alert.frequency}Hz` : 'Mixed'}
                    </div>
                    <div>
                      <span className="opacity-50">DUR: </span>
                      {alert.duration ? `${alert.duration}ms` : 'Variable'}
                    </div>
                    <div className="col-span-2 flex items-center gap-2">
                      <span className="opacity-50">PATTERN: </span>
                      <span className="font-medium text-foreground">{alert.pattern || 'Continuous'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
