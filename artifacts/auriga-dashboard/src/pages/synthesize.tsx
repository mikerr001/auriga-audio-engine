import { useState } from "react";
import { useSynthesizeSpeech } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AudioWaveform, Plus, Trash2, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Synthesize() {
  const { toast } = useToast();
  const [observations, setObservations] = useState([{ type: "obstacle", description: "", distance: 2, confidence: 0.9 }]);
  
  const synthesizeMutation = useSynthesizeSpeech({
    mutation: {
      onSuccess: (data) => {
        toast({ title: "Speech Synthesized", description: `Message generated with priority ${data.priority}` });
      },
      onError: (err) => {
        toast({ title: "Synthesis failed", description: String(err), variant: "destructive" });
      }
    }
  });

  const addObservation = () => {
    setObservations([...observations, { type: "obstacle", description: "", distance: 2, confidence: 0.9 }]);
  };

  const updateObservation = (index: number, field: string, value: any) => {
    const newObs = [...observations];
    newObs[index] = { ...newObs[index], [field]: value };
    setObservations(newObs);
  };

  const removeObservation = (index: number) => {
    setObservations(observations.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    synthesizeMutation.mutate({ data: { observations: observations.map(o => ({ ...o, distance: Number(o.distance), confidence: Number(o.confidence) })) } });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-primary flex items-center gap-2">
          <AudioWaveform className="h-6 w-6" /> Synthesizer Test
        </h1>
        <p className="text-muted-foreground font-mono text-sm mt-1">Test the speech generation from raw environment observations</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="font-mono text-sm uppercase">Observations Input</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {observations.map((obs, i) => (
              <div key={i} className="flex gap-2 items-start border border-border p-3 rounded bg-muted/10 relative">
                <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => removeObservation(i)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
                <div className="space-y-2 flex-1 pt-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="Type (e.g. obstacle)" value={obs.type} onChange={e => updateObservation(i, 'type', e.target.value)} className="font-mono text-xs" />
                    <Input type="number" placeholder="Distance (m)" value={obs.distance} onChange={e => updateObservation(i, 'distance', e.target.value)} className="font-mono text-xs" />
                  </div>
                  <Textarea placeholder="Description" value={obs.description} onChange={e => updateObservation(i, 'description', e.target.value)} className="font-mono text-xs resize-none" rows={2} />
                </div>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addObservation} className="w-full font-mono text-xs border-dashed">
              <Plus className="h-4 w-4 mr-2" /> Add Observation
            </Button>
            <Button onClick={handleSubmit} disabled={synthesizeMutation.isPending} className="w-full">
              {synthesizeMutation.isPending ? "Synthesizing..." : <><Send className="h-4 w-4 mr-2" /> Synthesize Audio</>}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="font-mono text-sm uppercase">Generated Result</CardTitle>
          </CardHeader>
          <CardContent>
            {synthesizeMutation.data ? (
              <div className="space-y-4">
                <div className="p-4 bg-muted/20 border border-border rounded">
                  <p className="text-lg font-medium">"{synthesizeMutation.data.text}"</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs font-mono text-muted-foreground uppercase">Priority</div>
                    <div className="font-mono text-xl">{synthesizeMutation.data.priority}</div>
                  </div>
                  <div>
                    <div className="text-xs font-mono text-muted-foreground uppercase">Interruptibility</div>
                    <Badge variant="outline">{synthesizeMutation.data.interruptibility}</Badge>
                  </div>
                </div>
                <div>
                  <div className="text-xs font-mono text-muted-foreground uppercase">Reasoning</div>
                  <p className="text-sm font-mono mt-1 text-muted-foreground">{synthesizeMutation.data.reasoning}</p>
                </div>
              </div>
            ) : (
              <div className="h-full min-h-[200px] flex items-center justify-center text-muted-foreground font-mono text-sm">
                Waiting for input...
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
