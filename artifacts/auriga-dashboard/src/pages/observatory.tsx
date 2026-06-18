import { useGetObservatoryLog, getGetObservatoryLogQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollText, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

export default function Observatory() {
  const [filter, setFilter] = useState("");
  const { data: logs, isLoading } = useGetObservatoryLog(
    { limit: 100 },
    { query: { refetchInterval: 5000, queryKey: getGetObservatoryLogQueryKey({ limit: 100 }) } }
  );

  const filteredLogs = logs?.entries.filter(log => 
    log.type.toLowerCase().includes(filter.toLowerCase()) || 
    log.message.toLowerCase().includes(filter.toLowerCase())
  );

  const getTypeStyle = (type: string) => {
    switch(type) {
      case 'spoken': return 'bg-primary/20 text-primary border-primary/30';
      case 'suppressed': return 'bg-warning/20 text-warning border-warning/30';
      case 'interrupted': return 'bg-destructive/20 text-destructive border-destructive/30';
      case 'overload': return 'bg-destructive text-destructive-foreground border-destructive';
      case 'priority-conflict': return 'bg-warning/20 text-warning border-warning/30';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary flex items-center gap-2">
            <ScrollText className="h-6 w-6" /> Observatory
          </h1>
          <p className="text-muted-foreground font-mono text-sm mt-1">Immutable chronological log of all engine decisions and state changes</p>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Filter logs..." 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)} 
            className="pl-8 font-mono text-xs" 
          />
        </div>
      </div>

      <Card className="flex-1 flex flex-col border-border bg-card min-h-0 overflow-hidden">
        <CardHeader className="border-b border-border py-3 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-mono text-muted-foreground uppercase tracking-wider">Master Event Log</CardTitle>
          <span className="text-xs font-mono text-muted-foreground">{logs?.totalCount || 0} TOTAL EVENTS</span>
        </CardHeader>
        <CardContent className="p-0 flex-1 overflow-auto">
          {isLoading ? (
            <div className="p-4 space-y-4">
              {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 w-full bg-muted/50" />)}
            </div>
          ) : (
            <table className="w-full text-left text-sm font-mono border-collapse">
              <thead className="bg-muted/30 sticky top-0 backdrop-blur z-10 border-b border-border shadow-sm">
                <tr>
                  <th className="px-4 py-3 font-medium text-muted-foreground w-40">Timestamp</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground w-32">Event Type</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground w-20">Pri</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground w-20">Conf</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Payload / Message</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredLogs?.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/10">
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {new Date(log.timestamp).toISOString().replace('T', ' ').replace('Z', '')}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={`text-[10px] h-5 py-0 uppercase ${getTypeStyle(log.type)}`}>
                        {log.type}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {log.priority !== undefined && log.priority !== null ? log.priority : '-'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {log.confidence !== undefined && log.confidence !== null ? (log.confidence * 100).toFixed(0) + '%' : '-'}
                    </td>
                    <td className={`px-4 py-3 font-medium ${['interrupted','suppressed','overload'].includes(log.type) ? 'text-muted-foreground opacity-80' : 'text-foreground'}`}>
                      {log.message}
                    </td>
                  </tr>
                ))}
                {filteredLogs?.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      No events matching the filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
