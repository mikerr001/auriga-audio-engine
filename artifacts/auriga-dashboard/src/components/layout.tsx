import { Link, useLocation } from "wouter";
import { 
  Activity, AudioWaveform, Zap, Compass, 
  FileArchive, ListOrdered, List, 
  Volume2, Play, ScrollText, BookOpen, Settings 
} from "lucide-react";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider } from "@/components/ui/sidebar";

const navItems = [
  { href: "/", label: "Dashboard", icon: Activity },
  { href: "/synthesize", label: "Synthesize", icon: AudioWaveform },
  { href: "/hazard", label: "Hazard", icon: Zap },
  { href: "/guidance", label: "Guidance", icon: Compass },
  { href: "/compress", label: "Compress", icon: FileArchive },
  { href: "/priority", label: "Priority", icon: ListOrdered },
  { href: "/queue", label: "Queue", icon: List },
  { href: "/vocabulary", label: "Vocabulary", icon: Volume2 },
  { href: "/simulate", label: "Simulate", icon: Play },
  { href: "/observatory", label: "Observatory", icon: ScrollText },
  { href: "/research-debt", label: "Research Debt", icon: BookOpen },
  { href: "/config", label: "Config", icon: Settings },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-background overflow-hidden dark">
        <Sidebar className="border-r border-border bg-sidebar">
          <SidebarContent>
            <div className="flex items-center gap-2 p-4 border-b border-border">
              <div className="bg-primary/20 p-1 rounded">
                <AudioWaveform className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="font-bold text-sm text-primary tracking-wider uppercase">Auriga Engine</h1>
                <p className="text-[10px] text-muted-foreground font-mono">SYS_VER 0.1.0-alpha</p>
              </div>
            </div>
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-mono text-muted-foreground uppercase tracking-widest mt-4 mb-2 px-4">Core Systems</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navItems.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={location === item.href} className="data-[active=true]:bg-primary/10 data-[active=true]:text-primary font-mono text-xs">
                        <Link href={item.href} className="flex items-center gap-3 w-full">
                          <item.icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        <main className="flex-1 overflow-auto bg-background p-6">
          <div className="max-w-6xl mx-auto h-full">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
