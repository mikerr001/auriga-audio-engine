import { useState, useEffect } from "react";
import { useGetAudioConfig, getGetAudioConfigQueryKey, useUpdateAudioConfig } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Config() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: config, isLoading } = useGetAudioConfig({
    query: { queryKey: getGetAudioConfigQueryKey() }
  });

  const [formData, setFormData] = useState<any>(null);

  useEffect(() => {
    if (config && !formData) {
      setFormData(config);
    }
  }, [config, formData]);

  const updateMut = useUpdateAudioConfig({
    mutation: {
      onSuccess: () => {
        toast({ title: "Configuration Updated", description: "Engine parameters hot-swapped." });
        queryClient.invalidateQueries({ queryKey: getGetAudioConfigQueryKey() });
      },
      onError: (err) => toast({ title: "Update Failed", description: String(err), variant: "destructive" })
    }
  });

  const handleSave = () => {
    if (formData) {
      updateMut.mutate({ data: formData });
    }
  };

  if (isLoading || !formData) return <div className="h-full flex items-center justify-center font-mono">LOADING CONFIG...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary flex items-center gap-2">
            <Settings className="h-6 w-6" /> Engine Configuration
          </h1>
          <p className="text-muted-foreground font-mono text-sm mt-1">Live parameter control. Changes apply immediately to the next frame.</p>
        </div>
        <Button onClick={handleSave} disabled={updateMut.isPending} size="lg" className="font-mono font-bold tracking-wider">
          <Save className="h-4 w-4 mr-2" /> APPLY CHANGES
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="font-mono text-sm uppercase">Global Toggles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-3 bg-muted/20 border border-border rounded-lg">
              <div className="space-y-0.5">
                <Label className="text-base font-bold font-mono">Engine Enabled</Label>
                <div className="text-xs text-muted-foreground">Master kill switch for all audio output</div>
              </div>
              <Switch checked={formData.enabled} onCheckedChange={c => setFormData({...formData, enabled: c})} />
            </div>
            
            <div className="flex items-center justify-between p-3 bg-muted/20 border border-border rounded-lg">
              <div className="space-y-0.5">
                <Label className="text-base font-bold font-mono">Suppress Low Confidence</Label>
                <div className="text-xs text-muted-foreground">Silently drop inputs below the threshold</div>
              </div>
              <Switch checked={formData.suppressLowConfidence} onCheckedChange={c => setFormData({...formData, suppressLowConfidence: c})} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="font-mono text-sm uppercase">Synthesis Style</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label className="font-mono">Verbosity Mode</Label>
              <Select value={formData.verbosityMode} onValueChange={v => setFormData({...formData, verbosityMode: v})}>
                <SelectTrigger className="font-mono"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="short">Short</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="verbose">Verbose</SelectItem>
                  <SelectItem value="expert">Expert (Code)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label className="font-mono">Personality Style</Label>
              <Select value={formData.personalityStyle} onValueChange={v => setFormData({...formData, personalityStyle: v})}>
                <SelectTrigger className="font-mono"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="minimal">Minimal / Robotic</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="detailed">Detailed / Descriptive</SelectItem>
                  <SelectItem value="research">Research (Metric-heavy)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card md:col-span-2">
          <CardHeader>
            <CardTitle className="font-mono text-sm uppercase">Thresholds & Limits</CardTitle>
          </CardHeader>
          <CardContent className="space-y-8 pt-4">
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <Label className="font-mono">Speech Rate Multiplier</Label>
                <span className="font-mono text-xl text-primary">{formData.speechRate}x</span>
              </div>
              <Slider 
                min={0.5} max={2.0} step={0.1} 
                value={[formData.speechRate]} 
                onValueChange={v => setFormData({...formData, speechRate: v[0]})} 
              />
              <div className="flex justify-between text-xs text-muted-foreground font-mono">
                <span>0.5x (Slow)</span>
                <span>1.0x (Normal)</span>
                <span>2.0x (Fast)</span>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-border">
              <div className="flex justify-between items-end">
                <Label className="font-mono">Confidence Threshold</Label>
                <span className="font-mono text-xl text-primary">{(formData.confidenceThreshold * 100).toFixed(0)}%</span>
              </div>
              <Slider 
                min={0} max={1} step={0.05} 
                value={[formData.confidenceThreshold]} 
                onValueChange={v => setFormData({...formData, confidenceThreshold: v[0]})} 
              />
            </div>

            <div className="space-y-4 pt-4 border-t border-border">
              <div className="flex justify-between items-end">
                <Label className="font-mono">Max Messages Per Minute</Label>
                <span className="font-mono text-xl text-primary">{formData.maxMessagesPerMinute}</span>
              </div>
              <Slider 
                min={10} max={120} step={5} 
                value={[formData.maxMessagesPerMinute]} 
                onValueChange={v => setFormData({...formData, maxMessagesPerMinute: v[0]})} 
              />
              <p className="text-xs text-muted-foreground font-mono mt-2">Dictates the hard limit before overload protection engages and aggressive summarization begins.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
