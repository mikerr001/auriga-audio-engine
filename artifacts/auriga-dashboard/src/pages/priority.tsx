import { useState } from "react";
import { usePrioritizeMessages } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ListOrdered, Plus, Trash2, GitMerge } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Priority() {
  const { toast } = useToast();
  
  const [messages, setMessages] = useState([
    { id: "m1", text: "Stairs down in 5 meters", type: "hazard", confidence: 0.95 },
    { id: "m2", text: "Turn slightly left", type: "guidance", confidence: 0.8 }
  ]);

  const priorityMutation = usePrioritizeMessages({
    mutation: {
      onSuccess: () => toast({ title: "Prioritization complete" }),
      onError: (err) => toast({ title: "Error", description: String(err), variant: "destructive" })
    }
  });

  const addMsg = () => setMessages([...messages, { id: `m${Date.now()}`, text: "", type: "status", confidence: 0.9 }]);
  const updateMsg = (i: number, f: string, v: any) => { const n = [...messages]; n[i] = { ...n[i], [f]: v }; setMessages(n); };
  const removeMsg = (i: number) => setMessages(messages.filter((_, idx) => idx !== i));

  const handleSubmit = () => {
    priorityMutation.mutate({
      data: {
        messages: messages.map(m => ({...m, type: m.type as any, confidence: Number(m.confidence)}))
      }
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-primary flex items-center gap-2">
          <ListOrdered className="h-6 w-6" /> Priority Matrix
        </h1>
        <p className="text-muted-foreground font-mono text-sm mt-1">Test the conflict resolution and message scoring model</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="font-mono text-sm uppercase">Candidate Messages</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {messages.map((msg, i) => (
              <div key={msg.id} className="flex gap-2 items-start border border-border p-3 rounded bg-muted/10 relative">
                <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => removeMsg(i)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
                <div className="space-y-2 flex-1 pt-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="Type" value={msg.type} onChange={e => updateMsg(i, 'type', e.target.value)} className="font-mono text-xs" />
                    <Input type="number" step="0.1" placeholder="Conf" value={msg.confidence} onChange={e => updateMsg(i, 'confidence', e.target.value)} className="font-mono text-xs" />
                  </div>
                  <Input placeholder="Message Text" value={msg.text} onChange={e => updateMsg(i, 'text', e.target.value)} className="font-mono text-xs" />
                </div>
              </div>
            ))}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={addMsg} className="flex-1 font-mono text-xs border-dashed">
                <Plus className="h-4 w-4 mr-2" /> Add Candidate
              </Button>
              <Button onClick={handleSubmit} disabled={priorityMutation.isPending} className="flex-1">
                {priorityMutation.isPending ? "..." : <><GitMerge className="h-4 w-4 mr-2" /> Run Matrix</>}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="font-mono text-sm uppercase flex justify-between">
              <span>Ranked Output</span>
              {priorityMutation.data && (
                <Badge variant={['high', 'critical'].includes(priorityMutation.data.cognitiveLoadImpact) ? 'destructive' : 'outline'}>
                  LOAD: {priorityMutation.data.cognitiveLoadImpact}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {priorityMutation.data ? (
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="text-xs font-mono text-primary mb-2 border-b border-border pb-1">SELECTED (RANKED):</div>
                  {priorityMutation.data.ranked.map((r, i) => (
                    <div key={i} className="flex gap-3 p-3 bg-muted/20 border border-border rounded">
                      <div className="text-xl font-mono font-bold text-primary w-8 text-center">{r.score}</div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">{r.message.text}</div>
                        <div className="text-xs font-mono text-muted-foreground mt-1 flex gap-2">
                          <Badge variant="outline" className="text-[10px] h-4 py-0">{r.interruptibility}</Badge>
                          <span>{r.reasoning}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {priorityMutation.data.suppressed.length > 0 && (
                  <div className="space-y-3 mt-6">
                    <div className="text-xs font-mono text-warning mb-2 border-b border-warning/30 pb-1">SUPPRESSED (TOO MUCH LOAD):</div>
                    {priorityMutation.data.suppressed.map((s, i) => (
                      <div key={i} className="flex gap-3 p-2 bg-warning/5 border border-warning/20 rounded opacity-70">
                        <div className="text-sm font-mono text-warning w-8 text-center">{s.score}</div>
                        <div className="flex-1">
                          <div className="text-xs line-through">{s.message.text}</div>
                          <div className="text-[10px] font-mono text-warning/80 mt-1">{s.reasoning}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground font-mono text-sm border border-dashed border-border rounded">
                Awaiting candidates...
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
