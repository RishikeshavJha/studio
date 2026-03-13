"use client";

import { useState } from "react";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, orderBy, query, limit } from "firebase/firestore";
import { 
  Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Users, CreditCard, Calendar, ArrowUpRight, Cpu, Activity } from "lucide-react";
import { format } from "date-fns";

export function ParticipantDashboard() {
  const [search, setSearch] = useState("");
  const firestore = useFirestore();

  const participantsQuery = useMemoFirebase(() => {
    return query(collection(firestore, "participants"), orderBy("createdAt", "desc"), limit(100));
  }, [firestore]);

  const { data: participants, isLoading } = useCollection(participantsQuery);

  const filteredParticipants = participants?.filter(p => 
    p.fullName?.toLowerCase().includes(search.toLowerCase()) || 
    p.teamName?.toLowerCase().includes(search.toLowerCase()) ||
    p.college?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const totalFee = participants?.reduce((acc, p) => acc + (p.registrationFee || 0), 0) || 0;
  const totalMembers = participants?.reduce((acc, p) => acc + (p.teamMembers?.length + 1 || 1), 0) || 0;

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-card border-2 border-primary/20 rounded-none relative overflow-hidden">
          <div className="absolute top-0 right-0 p-2 opacity-10"><Users className="h-12 w-12 text-primary" /></div>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">Total_Strike_Teams</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black italic text-primary">{participants?.length || 0}</div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-secondary mt-1">Live_Connections_Stable</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-2 border-secondary/20 rounded-none relative overflow-hidden">
           <div className="absolute top-0 right-0 p-2 opacity-10"><Activity className="h-12 w-12 text-secondary" /></div>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">Active_Runners</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black italic text-secondary">{totalMembers}</div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">Max_Capacity_512</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-2 border-accent/20 rounded-none relative overflow-hidden">
           <div className="absolute top-0 right-0 p-2 opacity-10"><CreditCard className="h-12 w-12 text-accent" /></div>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">Total_Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black italic text-accent">₹{totalFee.toLocaleString()}</div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">Encryption_Verified</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-2 border-primary/20 rounded-none relative overflow-hidden">
           <div className="absolute top-0 right-0 p-2 opacity-10"><Calendar className="h-12 w-12 text-primary" /></div>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">Last_Uplink</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black italic text-primary">
              {participants && participants.length > 0 && participants[0].createdAt 
                ? format(participants[0].createdAt.toDate(), 'HH:mm') 
                : '--:--'}
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">Real_Time_Pulse</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-2 border-primary/20 rounded-none overflow-hidden">
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-primary/10 pb-6">
          <div className="space-y-1">
            <CardTitle className="text-2xl font-black uppercase italic flex items-center gap-3">
              <Cpu className="h-6 w-6 text-primary" /> Participant_Nexus
            </CardTitle>
            <CardDescription className="uppercase text-[10px] font-bold tracking-widest text-muted-foreground">Sub-grid monitor for all active registration logs.</CardDescription>
          </div>
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
            <Input 
              placeholder="SEARCH_BY_CALLSIGN_OR_NEXUS..." 
              className="pl-10 bg-background border-primary/20 rounded-none focus:border-primary uppercase font-bold text-xs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-primary/5 uppercase font-black text-xs">
              <TableRow className="border-b border-primary/10">
                <TableHead className="text-primary italic">Leader // Callsign</TableHead>
                <TableHead>Nexus_Origin</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Units</TableHead>
                <TableHead className="text-right">Terminal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-40 text-center uppercase font-bold tracking-widest text-primary animate-pulse">
                    Scanning_Encrypted_Channels...
                  </TableCell>
                </TableRow>
              ) : filteredParticipants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-40 text-center uppercase font-bold tracking-widest text-muted-foreground">
                    No_Runners_Found_In_This_Sector.
                  </TableCell>
                </TableRow>
              ) : (
                filteredParticipants.map((p) => (
                  <TableRow key={p.id} className="border-b border-primary/5 hover:bg-primary/5 transition-colors group">
                    <TableCell>
                      <div className="font-black uppercase italic text-sm">{p.fullName}</div>
                      <div className="text-[10px] text-primary font-black tracking-[0.2em]">{p.teamName}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs font-bold uppercase">{p.college}</div>
                      <div className="text-[10px] text-muted-foreground uppercase">{p.degree} // {p.year}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`rounded-none border-2 uppercase font-black text-[9px] tracking-widest px-2 py-0.5 ${p.paymentStatus === 'completed' ? 'border-secondary text-secondary bg-secondary/5' : 'border-accent text-accent bg-accent/5'}`}>
                        {p.paymentStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex -space-x-2">
                        {[1, ...(p.teamMembers || [])].map((_, i) => (
                          <div key={i} className="h-7 w-7 border border-primary bg-background flex items-center justify-center text-[10px] font-black italic text-primary">
                            {i + 1}
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <button className="p-2 border border-primary/20 hover:border-primary hover:bg-primary hover:text-background transition-all">
                        <ArrowUpRight className="h-4 w-4" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
