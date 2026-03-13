"use client";

import { useState } from "react";
import { useAuth } from "@/firebase";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup,
  updateProfile
} from "firebase/auth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code2, Github, Mail, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({ title: "LINK ESTABLISHED", description: "Terminal access granted. Welcome back, runner." });
      router.push("/register");
    } catch (error: any) {
      toast({ variant: "destructive", title: "DECRYPT_FAILURE", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName) {
        await updateProfile(userCredential.user, { displayName });
      }
      toast({ title: "NEW IDENTITY REGISTERED", description: "Neural link established. Proceed to data entry." });
      router.push("/register");
    } catch (error: any) {
      toast({ variant: "destructive", title: "REGISTRATION_ERROR", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast({ title: "GOOGLE_UPLINK_SUCCESS", description: "Bypassing standard auth... Access granted." });
      router.push("/register");
    } catch (error: any) {
      toast({ variant: "destructive", title: "UPLINK_DENIED", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md bg-card border-2 border-primary/20 rounded-none shadow-[0_0_50px_rgba(252,238,10,0.1)]">
        <CardHeader className="text-center space-y-4 border-b border-primary/10 pb-8">
          <div className="flex justify-center">
            <div className="bg-primary p-2 rotate-45 shadow-[0_0_15px_rgba(252,238,10,0.5)]">
              <Code2 className="h-10 w-10 text-background -rotate-45" />
            </div>
          </div>
          <div className="space-y-1">
            <CardTitle className="text-4xl font-black tracking-tighter italic uppercase text-primary text-glitch">
              AUTH_TERMINAL
            </CardTitle>
            <CardDescription className="uppercase text-[10px] font-bold tracking-[0.3em] text-muted-foreground">
              Level 02 Security Clearance Required
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-8">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-muted/20 mb-8 rounded-none p-1 border border-primary/10">
              <TabsTrigger value="login" className="rounded-none data-[state=active]:bg-primary data-[state=active]:text-background font-black uppercase italic text-xs">Login</TabsTrigger>
              <TabsTrigger value="signup" className="rounded-none data-[state=active]:bg-primary data-[state=active]:text-background font-black uppercase italic text-xs">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="space-y-6">
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="uppercase text-[10px] font-black tracking-widest text-primary">Email_Address</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="RUNNER@NETWATCH.ORG" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required 
                    className="bg-background border-primary/20 rounded-none focus:border-primary uppercase text-xs font-bold h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="uppercase text-[10px] font-black tracking-widest text-primary">Passkey</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required 
                    className="bg-background border-primary/20 rounded-none focus:border-primary h-12"
                  />
                </div>
                <Button type="submit" className="w-full bg-primary text-background font-black uppercase italic h-14 cyber-button text-lg" disabled={loading}>
                  {loading ? <Loader2 className="animate-spin h-6 w-6" /> : "Initiate_Session"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="space-y-6">
              <form onSubmit={handleSignup} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="signup-name" className="uppercase text-[10px] font-black tracking-widest text-primary">Runner_Callsign</Label>
                  <Input 
                    id="signup-name" 
                    type="text" 
                    placeholder="NEO_EX_V" 
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required 
                    className="bg-background border-primary/20 rounded-none focus:border-primary uppercase text-xs font-bold h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="uppercase text-[10px] font-black tracking-widest text-primary">Primary_Uplink_Email</Label>
                  <Input 
                    id="signup-email" 
                    type="email" 
                    placeholder="RUNNER@NETWATCH.ORG" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required 
                    className="bg-background border-primary/20 rounded-none focus:border-primary uppercase text-xs font-bold h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="uppercase text-[10px] font-black tracking-widest text-primary">New_Passkey</Label>
                  <Input 
                    id="signup-password" 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required 
                    className="bg-background border-primary/20 rounded-none focus:border-primary h-12"
                  />
                </div>
                <Button type="submit" className="w-full bg-primary text-background font-black uppercase italic h-14 cyber-button text-lg" disabled={loading}>
                  {loading ? <Loader2 className="animate-spin h-6 w-6" /> : "Register_New_Agent"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex flex-col space-y-6 pt-2 pb-8">
          <div className="relative w-full">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-primary/10" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-black tracking-[0.3em]">
              <span className="bg-card px-4 text-muted-foreground italic">External_Link_Override</span>
            </div>
          </div>
          <Button variant="outline" className="w-full border-2 border-primary/30 text-primary hover:bg-primary hover:text-background font-black uppercase italic h-12 rounded-none transition-all duration-300" onClick={handleGoogleLogin} disabled={loading}>
            <Mail className="mr-2 h-4 w-4" />
            Uplink_With_Google
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
