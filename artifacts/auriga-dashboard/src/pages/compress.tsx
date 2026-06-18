import { useState } from "react";
import { useCompressSpeech } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FileArchive, Plus, Trash2, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Compress() {
  const { toast } = useToast();
  
  const [observations, setObservations] = useState([
    { type: "obstacle", description: "Trash can on sidewalk", distance: 3, confidence: 0.9 },
    { type: "surface-change", description: "Curb transition", distance: 4, confidence: 0.8 }
  ]);
  const [maxWords, setMaxWords] = useState("10");

  const compressMutation = useCompressSpeech({
    mutation: {
      onSuccess: () => toast({ title: "Compression successful" }),
      onError: (err) => toast({ title: "Error", description: String(err), variant: "destructive" })
    }
  });

  const addObservation = () => setObservations([...observations, { type: "obstacle", description: "", distance: 2, confidence: 0.9 }]);
  const updateObservation = (i: number, f: string, v: any) => { const n = [...observations]; n[i] = { ...n[i], [f]: v }; setObservations(n); };
  const removeObservation = (i: number) => setObservations(observations.filter((_, idx) => idx !== i));

  const handleSubmit = () => {
    compressMutation.mutate({
      data: {
        observations: observations.map(o => ({...o, distance: Number(o.distance), confidence: Number(o.confidence)})),
        maxWords: maxWords ? Number(maxWords) : undefined
      }
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-primary flex items-center gap-2">
          <FileArchive className="h-6 w-6" /> Cognitive Compression
        </h1>
        <p className="text-muted-foreground font-mono text-sm mt-1">Combine multiple observations into dense, low-burden speech</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="font-mono text-sm uppercase">Raw Observations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 border-b border-border pb-4">
              <span className="font-mono text-xs text-muted-foreground">MAX WORDS LIMIT:</span>
              <Input type="number" value={maxWords} onChange={e => setMaxWords(e.target.value)} className="w-24 font-mono text-xs" />
            </div>
            
            {observations.map((obs, i) => (
              <div key={i} className="flex gap-2 items-start border border-border p-3 rounded bg-muted/10 relative">
                <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => removeObservation(i)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
                <div className="space-y-2 flex-1 pt-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="Type" value={obs.type} onChange={e => updateObservation(i, 'type', e.target.value)} className="font-mono text-xs" />
                    <Input type="number" placeholder="Dist" value={obs.distance} onChange={e => updateObservation(i, 'distance', e.target.value)} className="font-mono text-xs" />
                  </div>
                  <Input placeholder="Description" value={obs.description} onChange={e => updateObservation(i, 'description', e.target.value)} className="font-mono text-xs" />
                </div>
              </div>
            ))}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={addObservation} className="flex-1 font-mono text-xs border-dashed">
                <Plus className="h-4 w-4 mr-2" /> Add
              </Button>
              <Button onClick={handleSubmit} disabled={compressMutation.isPending} className="flex-1">
                {compressMutation.isPending ? "..." : <><ArrowRight className="h-4 w-4 mr-2" /> Compress</>}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="font-mono text-sm uppercase">Compression Output</CardTitle>
          </CardHeader>
          <CardContent>
            {compressMutation.data ? (
              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-4 pb-4 border-b border-border text-center">
                  <div>
                    <div className="text-xs font-mono text-muted-foreground uppercase">Ratio</div>
                    <div className="font-mono text-xl text-primary">{(compressMutation.data.compressionRatio * 100).toFixed(0)}%</div>
                  </div>
                  <div>
                    <div className="text-xs font-mono text-muted-foreground uppercase">Words</div>
                    <div className="font-mono text-xl">{compressMutation.data.wordCount}</div>
                  </div>
                  <div>
                    <div className="text-xs font-mono text-muted-foreground uppercase">Safety</div>
                    <Badge variant={compressMutation.data.safetyPreserved ? "outline" : "destructive"}>
                      {compressMutation.data.safetyPreserved ? "PRESERVED" : "COMPROMISED"}
                    </Badge>
                  </div>
                </div>

                <div>
                  <div className="text-xs font-mono text-muted-foreground mb-2">ORIGINAL:</div>
                  <ul className="list-disc pl-4 space-y-1 text-sm font-mono text-muted-foreground">
                    {compressMutation.data.original.map((o, i) => <li key={i}>{o}</li>)}
                  </ul>
                </div>
                
                <div>
                  <div className="text-xs font-mono text-primary mb-2">COMPRESSED:</div>
                  <div className="p-4 rounded border bg-primary/10 border-primary/30">
                    <p className="text-lg font-bold font-mono text-foreground">"{compressMutation.data.compressed}"</p>
                  </div>
                </div>

                {compressMutation.data.droppedItems.length > 0 && (
                  <div>
                    <div className="text-xs font-mono text-warning mb-2">DROPPED (DEEMED LOW PRIORITY):</div>
                    <ul className="list-disc pl-4 space-y-1 text-xs font-mono text-warning/80">
                      {compressMutation.data.droppedItems.map((o, i) => <li key={i}>{o}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground font-mono text-sm border border-dashed border-border rounded">
                Awaiting observation set...
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
