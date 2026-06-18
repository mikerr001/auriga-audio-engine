import { useState } from "react";
import { useGenerateHazardMessage } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Zap, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Hazard() {
  const { toast } = useToast();
  
  const [hazardData, setHazardData] = useState({
    hazardType: "obstacle",
    severity: "moderate",
    distance: "5",
    direction: "ahead",
    confidence: "0.9",
    urgency: "moderate"
  });

  const hazardMutation = useGenerateHazardMessage({
    mutation: {
      onSuccess: (data) => toast({ title: "Hazard message generated", description: data.text }),
      onError: (err) => toast({ title: "Error", description: String(err), variant: "destructive" })
    }
  });

  const handleSubmit = () => {
    hazardMutation.mutate({
      data: {
        ...hazardData,
        distance: Number(hazardData.distance),
        confidence: Number(hazardData.confidence),
      } as any
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-primary flex items-center gap-2">
          <Zap className="h-6 w-6" /> Hazard Communication
        </h1>
        <p className="text-muted-foreground font-mono text-sm mt-1">Directly trigger hazard alerts bypassing normal synthesis</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="font-mono text-sm uppercase">Hazard Parameters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-mono text-xs">Type</Label>
                <Select value={hazardData.hazardType} onValueChange={v => setHazardData({...hazardData, hazardType: v})}>
                  <SelectTrigger className="font-mono text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="obstacle">Obstacle</SelectItem>
                    <SelectItem value="drop-off">Drop-off</SelectItem>
                    <SelectItem value="stairs-down">Stairs Down</SelectItem>
                    <SelectItem value="door">Door</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="font-mono text-xs">Severity</Label>
                <Select value={hazardData.severity} onValueChange={v => setHazardData({...hazardData, severity: v})}>
                  <SelectTrigger className="font-mono text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="font-mono text-xs">Distance (m)</Label>
                <Input type="number" value={hazardData.distance} onChange={e => setHazardData({...hazardData, distance: e.target.value})} className="font-mono text-xs" />
              </div>
              <div className="space-y-2">
                <Label className="font-mono text-xs">Direction</Label>
                <Select value={hazardData.direction} onValueChange={v => setHazardData({...hazardData, direction: v})}>
                  <SelectTrigger className="font-mono text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ahead">Ahead</SelectItem>
                    <SelectItem value="left">Left</SelectItem>
                    <SelectItem value="right">Right</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleSubmit} disabled={hazardMutation.isPending} className="w-full" variant={hazardData.severity === 'critical' ? 'destructive' : 'default'}>
              {hazardMutation.isPending ? "Generating..." : <><Send className="h-4 w-4 mr-2" /> Generate Hazard Message</>}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="font-mono text-sm uppercase">Output</CardTitle>
          </CardHeader>
          <CardContent>
            {hazardMutation.data ? (
              <div className="space-y-4">
                <div className={`p-4 rounded border ${hazardMutation.data.interruptibility === 'critical' ? 'bg-destructive/20 border-destructive text-destructive' : 'bg-muted/20 border-border'}`}>
                  <p className="text-xl font-bold font-mono">"{hazardMutation.data.text}"</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs font-mono text-muted-foreground uppercase">Interruptibility</div>
                    <Badge variant={hazardMutation.data.interruptibility === 'critical' ? 'destructive' : 'outline'}>
                      {hazardMutation.data.interruptibility}
                    </Badge>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground font-mono text-sm">
                Configure parameters and generate
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
