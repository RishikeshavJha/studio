import { ParticipantDashboard } from "@/components/participant-dashboard";
import { Code2, LayoutDashboard, Settings, HelpCircle, LogOut } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 glass-card border-r border-white/10 hidden md:flex flex-col p-6 space-y-8 shrink-0">
        <div className="flex items-center space-x-2">
          <Code2 className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold tracking-tighter">HackSync</span>
        </div>
        
        <nav className="flex-1 space-y-2">
          <Link href="/dashboard" className="flex items-center space-x-3 p-3 rounded-xl bg-primary/10 text-primary font-medium">
            <LayoutDashboard className="h-5 w-5" />
            <span>Overview</span>
          </Link>
          <button className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-white/5 text-muted-foreground hover:text-white transition-colors">
            <Settings className="h-5 w-5" />
            <span>Event Settings</span>
          </button>
          <button className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-white/5 text-muted-foreground hover:text-white transition-colors">
            <HelpCircle className="h-5 w-5" />
            <span>Support</span>
          </button>
        </nav>

        <div className="pt-4 border-t border-white/10">
          <Link href="/login">
            <Button variant="ghost" className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive">
              <LogOut className="mr-2 h-5 w-5" /> Logout
            </Button>
          </Link>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-muted-foreground">Monitor your hackathon registrations in real-time.</p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/register">
              <Button size="sm" className="bg-primary hover:bg-primary/90">Add Participant</Button>
            </Link>
          </div>
        </header>

        <ParticipantDashboard />
      </main>
    </div>
  );
}