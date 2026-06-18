import { useGetQueue, getGetQueueQueryKey, useDequeueMessage, useClearQueue, useEnqueueMessage } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { List, Trash2, Ban, PlayCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function Queue() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: queue, isLoading } = useGetQueue({ 
    query: { refetchInterval: 3000, queryKey: getGetQueueQueryKey() } 
  });

  const dequeueMut = useDequeueMessage({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetQueueQueryKey() }),
      onError: (err) => toast({ title: "Failed to dequeue", description: String(err), variant: "destructive" })
    }
  });

  const clearMut = useClearQueue({
    mutation: {
      onSuccess: () => {
        toast({ title: "Queue cleared" });
        queryClient.invalidateQueries({ queryKey: getGetQueueQueryKey() });
      }
    }
  });

  const enqueueMut = useEnqueueMessage({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetQueueQueryKey() })
    }
  });

  const handleTestInject = () => {
    enqueueMut.mutate({
      data: {
        text: `Test inject ${Math.floor(Math.random()*1000)}`,
        type: "status",
        confidence: 0.9,
        interruptibility: "important"
      }
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary flex items-center gap-2">
            <List className="h-6 w-6" /> Live Queue
          </h1>
          <p className="text-muted-foreground font-mono text-sm mt-1">Monitor and manage the active speech playback buffer</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleTestInject} disabled={enqueueMut.isPending} className="font-mono text-xs">
            <PlayCircle className="h-4 w-4 mr-2" /> Inject
          </Button>
          <Button variant="destructive" size="sm" onClick={() => clearMut.mutate()} disabled={clearMut.isPending || !queue?.totalCount} className="font-mono text-xs">
            <Ban className="h-4 w-4 mr-2" /> Purge
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-card border border-border p-4 rounded-lg flex flex-col items-center justify-center">
          <div className="text-xs font-mono text-muted-foreground uppercase mb-1">Total</div>
          <div className="text-3xl font-mono font-bold">{queue?.totalCount || 0}</div>
        </div>
        <div className="bg-card border border-border p-4 rounded-lg flex flex-col items-center justify-center">
          <div className="text-xs font-mono text-destructive uppercase mb-1">Critical</div>
          <div className="text-3xl font-mono font-bold text-destructive">{queue?.criticalCount || 0}</div>
        </div>
        <div className="bg-card border border-border p-4 rounded-lg flex flex-col items-center justify-center">
          <div className="text-xs font-mono text-muted-foreground uppercase mb-1">Est. Wait</div>
          <div className="text-3xl font-mono font-bold text-primary">{(queue?.estimatedDuration || 0).toFixed(1)}s</div>
        </div>
        <div className="bg-card border border-border p-4 rounded-lg flex flex-col items-center justify-center">
          <div className="text-xs font-mono text-muted-foreground uppercase mb-1">Status</div>
          <Badge variant={queue?.overloadRisk ? 'destructive' : 'outline'} className="mt-1 font-mono uppercase">
            {queue?.overloadRisk ? 'OVERLOAD' : 'NOMINAL'}
          </Badge>
        </div>
      </div>

      <Card className="flex-1 flex flex-col border-border bg-card min-h-0 overflow-hidden">
        <CardHeader className="border-b border-border py-3">
          <CardTitle className="text-sm font-mono text-muted-foreground uppercase tracking-wider">Buffer Sequence</CardTitle>
        </CardHeader>
        <CardContent className="p-0 flex-1 overflow-auto">
          {isLoading ? (
            <div className="p-4 space-y-4">
              {[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full bg-muted/50" />)}
            </div>
          ) : queue?.messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-muted-foreground font-mono text-sm">
              Buffer empty
            </div>
          ) : (
            <table className="w-full text-left text-sm font-mono">
              <thead className="bg-muted/30 sticky top-0 backdrop-blur z-10 border-b border-border">
                <tr>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Pos</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Message</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Priority</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Class</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {queue?.messages.map((msg, i) => (
                  <tr key={msg.id} className="hover:bg-muted/10">
                    <td className="px-4 py-3 text-muted-foreground">#{i + 1}</td>
                    <td className={`px-4 py-3 font-medium ${msg.interruptibility === 'critical' ? 'text-destructive' : 'text-foreground'}`}>
                      {msg.text}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-12 bg-muted h-1.5 rounded-full overflow-hidden">
                          <div className="bg-primary h-full" style={{width: `${msg.priority}%`}} />
                        </div>
                        <span className="text-xs">{msg.priority}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={`text-[10px] h-5 py-0 ${
                        msg.interruptibility === 'critical' ? 'border-destructive text-destructive' :
                        msg.interruptibility === 'urgent' ? 'border-warning text-warning' : ''
                      }`}>
                        {msg.interruptibility}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => dequeueMut.mutate({ messageId: msg.id })}
                        disabled={dequeueMut.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
