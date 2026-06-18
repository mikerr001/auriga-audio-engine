import { useState } from "react";
import { useGenerateGuidanceMessage } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Compass, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Guidance() {
  const { toast } = useToast();
  
  const [data, setData] = useState({
    direction: "forward",
    urgency: "moderate",
    distanceMeters: "10",
    context: ""
  });

  const generateMutation = useGenerateGuidanceMessage({
    mutation: {
      onSuccess: (res) => toast({ title: "Guidance generated", description: "Message priority evaluated." }),
      onError: (err) => toast({ title: "Error", description: String(err), variant: "destructive" })
    }
  });

  const handleSubmit = () => {
    generateMutation.mutate({
      data: {
        direction: data.direction as any,
        urgency: data.urgency as any,
        distanceMeters: data.distanceMeters ? Number(data.distanceMeters) : undefined,
        context: data.context || undefined
      }
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-primary flex items-center gap-2">
          <Compass className="h-6 w-6" /> Guidance Navigation
        </h1>
        <p className="text-muted-foreground font-mono text-sm mt-1">Generate routing instructions for standard navigation</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="font-mono text-sm uppercase">Navigation Vector</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-mono text-xs">Direction</Label>
                <Select value={data.direction} onValueChange={v => setData({...data, direction: v})}>
                  <SelectTrigger className="font-mono text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="forward">Forward</SelectItem>
                    <SelectItem value="left">Left</SelectItem>
                    <SelectItem value="right">Right</SelectItem>
                    <SelectItem value="stop">Stop</SelectItem>
                    <SelectItem value="slow-down">Slow Down</SelectItem>
                    <SelectItem value="reassess">Reassess</SelectItem>
                    <SelectItem value="back">Back</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="font-mono text-xs">Urgency</Label>
                <Select value={data.urgency} onValueChange={v => setData({...data, urgency: v})}>
                  <SelectTrigger className="font-mono text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="immediate">Immediate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="font-mono text-xs">Distance (m)</Label>
                <Input type="number" value={data.distanceMeters} onChange={e => setData({...data, distanceMeters: e.target.value})} className="font-mono text-xs" />
              </div>
              <div className="space-y-2">
                <Label className="font-mono text-xs">Context (optional)</Label>
                <Input placeholder="e.g. crossing street" value={data.context} onChange={e => setData({...data, context: e.target.value})} className="font-mono text-xs" />
              </div>
            </div>
            <Button onClick={handleSubmit} disabled={generateMutation.isPending} className="w-full">
              {generateMutation.isPending ? "Computing..." : <><Send className="h-4 w-4 mr-2" /> Dispatch Vector</>}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="font-mono text-sm uppercase">Synthesized Instruction</CardTitle>
          </CardHeader>
          <CardContent>
            {generateMutation.data ? (
              <div className="space-y-4">
                <div className={`p-4 rounded border ${generateMutation.data.interruptibility === 'critical' ? 'bg-destructive/20 border-destructive text-destructive' : 'bg-muted/20 border-border'}`}>
                  <p className="text-xl font-bold font-mono">"{generateMutation.data.text}"</p>
                </div>
                <div className="grid grid-cols-3 gap-4 border-t border-border pt-4 mt-4">
                  <div>
                    <div className="text-xs font-mono text-muted-foreground uppercase">Interrupt</div>
                    <Badge variant={generateMutation.data.interruptibility === 'critical' ? 'destructive' : 'outline'}>{generateMutation.data.interruptibility}</Badge>
                  </div>
                  <div>
                    <div className="text-xs font-mono text-muted-foreground uppercase">Priority</div>
                    <div className="font-mono">{generateMutation.data.priority}</div>
                  </div>
                  <div>
                    <div className="text-xs font-mono text-muted-foreground uppercase">Confidence</div>
                    <div className="font-mono">{(generateMutation.data.confidence * 100).toFixed(0)}%</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-[150px] flex items-center justify-center text-muted-foreground font-mono text-sm border border-dashed border-border rounded">
                Awaiting vector inputs...
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
