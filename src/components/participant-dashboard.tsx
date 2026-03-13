"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import { 
  Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Users, CreditCard, Calendar, ArrowUpRight } from "lucide-react";
import { format } from "date-fns";

export function ParticipantDashboard() {
  const [participants, setParticipants] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "participants"), orderBy("createdAt", "desc"), limit(100));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setParticipants(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredParticipants = participants.filter(p => 
    p.fullName?.toLowerCase().includes(search.toLowerCase()) || 
    p.teamName?.toLowerCase().includes(search.toLowerCase()) ||
    p.college?.toLowerCase().includes(search.toLowerCase())
  );

  const totalFee = participants.reduce((acc, p) => acc + (p.registrationFee || 0), 0);
  const totalMembers = participants.reduce((acc, p) => acc + (p.teamMembers?.length + 1 || 1), 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card border-none">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Teams</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{participants.length}</div>
            <p className="text-xs text-muted-foreground">+2 from last hour</p>
          </CardContent>
        </Card>
        <Card className="glass-card border-none">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Hackers</CardTitle>
            <Users className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMembers}</div>
            <p className="text-xs text-muted-foreground">Max capacity 500</p>
          </CardContent>
        </Card>
        <Card className="glass-card border-none">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <CreditCard className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalFee.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">100% processing rate</p>
          </CardContent>
        </Card>
        <Card className="glass-card border-none">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Last Registration</CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {participants.length > 0 && participants[0].createdAt ? format(participants[0].createdAt.toDate(), 'HH:mm') : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">Just now</p>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card border-none overflow-hidden">
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle>Participants</CardTitle>
            <CardDescription>Real-time view of all hackathon registrations.</CardDescription>
          </div>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search hackers, teams..." 
              className="pl-9 glass-card"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-white/10 overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Leader & Team</TableHead>
                  <TableHead>College</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredParticipants.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      {loading ? "Loading live data..." : "No participants found."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredParticipants.map((p) => (
                    <TableRow key={p.id} className="hover:bg-white/5 transition-colors">
                      <TableCell>
                        <div className="font-medium">{p.fullName}</div>
                        <div className="text-xs text-primary font-bold uppercase tracking-wider">{p.teamName}</div>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        <div className="text-sm">{p.college}</div>
                        <div className="text-xs text-muted-foreground">{p.degree}, {p.year}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={p.paymentStatus === 'completed' ? 'default' : 'secondary'} className={p.paymentStatus === 'completed' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : ''}>
                          {p.paymentStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex -space-x-2">
                          {[1, ...(p.teamMembers || [])].map((_, i) => (
                            <div key={i} className="h-7 w-7 rounded-full border-2 border-card bg-primary/20 flex items-center justify-center text-[10px] font-bold">
                              {i + 1}
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
                          <ArrowUpRight className="h-4 w-4 text-secondary" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}