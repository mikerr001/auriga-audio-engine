import { useState } from "react";
import { useGetResearchDebt, getGetResearchDebtQueryKey, useAddResearchDebt } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, Plus, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ResearchDebt() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    title: "", category: "cognitive-load", severity: "medium", description: "", impact: ""
  });

  const { data: debt, isLoading } = useGetResearchDebt({
    query: { queryKey: getGetResearchDebtQueryKey() }
  });

  const addMut = useAddResearchDebt({
    mutation: {
      onSuccess: () => {
        toast({ title: "Debt documented" });
        setIsAdding(false);
        setFormData({ title: "", category: "cognitive-load", severity: "medium", description: "", impact: "" });
        queryClient.invalidateQueries({ queryKey: getGetResearchDebtQueryKey() });
      },
      onError: (err) => toast({ title: "Failed to save", description: String(err), variant: "destructive" })
    }
  });

  const handleSubmit = () => {
    addMut.mutate({
      data: {
        ...formData,
        assumptions: [],
        failureModes: []
      } as any
    });
  };

  const getSeverityStyle = (sev: string) => {
    switch (sev) {
      case 'critical': return 'bg-destructive text-destructive-foreground border-destructive animate-pulse';
      case 'high': return 'bg-destructive/20 text-destructive border-destructive/50';
      case 'medium': return 'bg-warning/20 text-warning border-warning/50';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary flex items-center gap-2">
            <BookOpen className="h-6 w-6" /> Research Debt Register
          </h1>
          <p className="text-muted-foreground font-mono text-sm mt-1">Documenting systematic weaknesses, untested assumptions, and model limitations</p>
        </div>
        <Button onClick={() => setIsAdding(!isAdding)} variant={isAdding ? "secondary" : "default"}>
          {isAdding ? "Cancel" : <><Plus className="h-4 w-4 mr-2" /> Log Debt</>}
        </Button>
      </div>

      {isAdding && (
        <Card className="border-primary/50 bg-primary/5 shadow-lg border-2">
          <CardHeader className="py-4">
            <CardTitle className="text-sm font-mono text-primary uppercase">New Debt Entry</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Input placeholder="Title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="font-mono" />
              </div>
              <div className="space-y-2">
                <Select value={formData.severity} onValueChange={v => setFormData({...formData, severity: v})}>
                  <SelectTrigger className="font-mono"><SelectValue placeholder="Severity" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Select value={formData.category} onValueChange={v => setFormData({...formData, category: v})}>
                  <SelectTrigger className="font-mono"><SelectValue placeholder="Category" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="speech-model">Speech Model</SelectItem>
                    <SelectItem value="priority-model">Priority Model</SelectItem>
                    <SelectItem value="cognitive-load">Cognitive Load</SelectItem>
                    <SelectItem value="hazard-detection">Hazard Detection</SelectItem>
                    <SelectItem value="user-study">User Study Needs</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Input placeholder="Impact" value={formData.impact} onChange={e => setFormData({...formData, impact: e.target.value})} className="font-mono" />
              </div>
            </div>
            <Textarea placeholder="Detailed description of the theoretical or empirical debt..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="font-mono resize-none h-24" />
            <div className="flex justify-end">
              <Button onClick={handleSubmit} disabled={addMut.isPending || !formData.title}>Save Entry</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          Array.from({length: 6}).map((_, i) => <Card key={i} className="h-48 bg-muted/20 border-border animate-pulse" />)
        ) : (
          debt?.entries.map((entry) => (
            <Card key={entry.id} className="border-border bg-card hover:border-primary/30 transition-colors flex flex-col">
              <CardHeader className="py-3 px-4 border-b border-border/50 flex flex-row items-start justify-between space-y-0">
                <div className="space-y-1">
                  <Badge variant="outline" className="text-[9px] font-mono uppercase bg-muted text-muted-foreground">{entry.category}</Badge>
                  <CardTitle className="text-base font-bold leading-tight">{entry.title}</CardTitle>
                </div>
                <Badge variant="outline" className={`ml-2 text-[10px] font-mono uppercase ${getSeverityStyle(entry.severity)}`}>
                  {entry.severity}
                </Badge>
              </CardHeader>
              <CardContent className="p-4 flex-1 flex flex-col">
                <p className="text-sm text-muted-foreground mb-4 line-clamp-3 flex-1">{entry.description}</p>
                <div className="mt-auto space-y-3">
                  <div className="bg-muted/30 p-2 rounded border border-border text-xs font-mono">
                    <span className="text-primary/70">IMPACT:</span> {entry.impact}
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
                    <span>{new Date(entry.createdAt).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1 hover:text-primary cursor-pointer"><ExternalLink className="h-3 w-3" /> Details</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
