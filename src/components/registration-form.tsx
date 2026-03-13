"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useFirestore, useUser } from "@/firebase";
import { collection, serverTimestamp, doc, setDoc } from "firebase/firestore";
import { generateTeamNameIdeas } from "@/ai/flows/generate-team-name-ideas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Plus, Trash2, ArrowRight, ArrowLeft, Loader2, CreditCard, Cpu } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const formSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits").max(20),
  gender: z.string().min(1, "Please select gender"),
  dateOfBirth: z.string().min(1, "Please enter date of birth"),
  college: z.string().min(2, "College name is required").max(200),
  degree: z.string().min(2, "Degree is required").max(50),
  branch: z.string().min(2, "Branch is required").max(100),
  year: z.string().min(1, "Year is required"),
  teamName: z.string().min(2, "Team name must be at least 2 characters").max(100),
  teamLeaderName: z.string().min(2, "Team leader name is required").max(100),
  numberOfTeamMembers: z.number().min(1).max(4),
  teamMembers: z.array(z.object({
    name: z.string().min(2, "Member name is required"),
    email: z.string().email("Invalid member email")
  })).max(3),
  linkedinProfile: z.string().url("Invalid URL").optional().or(z.literal("")),
  githubProfile: z.string().url("Invalid URL").optional().or(z.literal("")),
  portfolioWebsite: z.string().url("Invalid URL").optional().or(z.literal(""))
});

type FormValues = z.infer<typeof formSchema>;

export function RegistrationForm() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [teamNameLoading, setTeamNameLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: user?.displayName || "",
      email: user?.email || "",
      phone: "",
      gender: "",
      dateOfBirth: "",
      college: "",
      degree: "",
      branch: "",
      year: "",
      teamName: "",
      teamLeaderName: user?.displayName || "",
      numberOfTeamMembers: 1,
      teamMembers: [],
      linkedinProfile: "",
      githubProfile: "",
      portfolioWebsite: ""
    }
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "teamMembers"
  });

  useEffect(() => {
    if (user) {
      if (user.email) form.setValue("email", user.email);
      if (user.displayName) {
        form.setValue("fullName", user.displayName);
        form.setValue("teamLeaderName", user.displayName);
      }
    }
  }, [user, form]);

  const handleNext = async () => {
    let fieldsToValidate: any[] = [];
    if (step === 1) fieldsToValidate = ['fullName', 'email', 'phone', 'gender', 'dateOfBirth'];
    if (step === 2) fieldsToValidate = ['college', 'degree', 'branch', 'year'];
    if (step === 3) fieldsToValidate = ['teamName', 'teamLeaderName', 'numberOfTeamMembers', 'teamMembers'];

    const isValid = await form.trigger(fieldsToValidate as any);
    if (isValid) setStep(step + 1);
  };

  const handleBack = () => setStep(step - 1);

  const generateAITeamNames = async () => {
    const theme = window.prompt("What's your project theme or hackathon category?");
    if (!theme) return;

    setTeamNameLoading(true);
    try {
      const result = await generateTeamNameIdeas({ keywordsOrTheme: theme });
      setAiSuggestions(result.teamNames);
    } catch (error) {
      toast({ variant: "destructive", title: "Neural Link Failure", description: "Failed to connect to AI matrix." });
    } finally {
      setTeamNameLoading(false);
    }
  };

  const processPayment = async (data: FormValues) => {
    if (!user) {
      toast({ variant: "destructive", title: "Auth Required", description: "You must be jacked in (logged in) to register." });
      return;
    }

    setLoading(true);
    
    // In a real app, you would create an order on your server first.
    // Here we use the Razorpay Checkout directly for prototyping.
    if (!(window as any).Razorpay) {
      toast({ variant: "destructive", title: "Terminal Error", description: "Payment bridge (Razorpay) not found." });
      setLoading(false);
      return;
    }

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_dummy", 
      amount: 299 * 100,
      currency: "INR",
      name: "BYTEPUNK 2024",
      description: "24H HACKATHON ACCESS FEE",
      image: "https://picsum.photos/seed/bytepunk/200/200",
      handler: async function (response: any) {
        try {
          const participantDocRef = doc(firestore, "participants", user.uid);
          
          // Using setDoc with merge to ensure the document maps to the auth UID
          await setDoc(participantDocRef, {
            ...data,
            id: user.uid,
            paymentId: response.razorpay_payment_id,
            paymentStatus: "completed",
            registrationFee: 299,
            currency: "INR",
            createdAt: serverTimestamp(),
            submittedAt: new Date().toISOString(),
          }, { merge: true });

          toast({ title: "LINK ESTABLISHED", description: "Welcome to BytePunk. Terminal access granted." });
          setTimeout(() => {
            window.location.href = "/dashboard";
          }, 1500);
        } catch (error: any) {
          toast({ variant: "destructive", title: "Data Corruption", description: error.message || "Payment clear but link failed." });
        } finally {
          setLoading(false);
        }
      },
      prefill: {
        name: data.fullName,
        email: data.email,
        contact: data.phone
      },
      theme: {
        color: "#fcee0a"
      },
      modal: {
        ondismiss: function() {
          setLoading(false);
        }
      }
    };

    const rzp = new (window as any).Razorpay(options);
    rzp.open();
  };

  const onSubmit = (data: FormValues) => {
    processPayment(data);
  };

  const progress = (step / 4) * 100;

  return (
    <div className="w-full max-w-2xl mx-auto py-10 px-4">
      <div className="mb-10 space-y-4">
        <div className="flex justify-between items-center text-xs font-black uppercase tracking-[0.2em] text-primary">
          <span>DATA_LINK_PROGRESS: STEP_{step}_OF_4</span>
          <span>{Math.round(progress)}%_STABLE</span>
        </div>
        <Progress value={progress} className="h-1 bg-primary/10" />
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)}>
        {step === 1 && (
          <Card className="bg-card border-2 border-primary/20 rounded-none shadow-2xl animate-in fade-in zoom-in-95 duration-500">
            <CardHeader className="border-b border-primary/10">
              <CardTitle className="text-2xl font-black uppercase italic">01. Identity_Scan</CardTitle>
              <CardDescription className="text-muted-foreground uppercase text-[10px] tracking-[0.2em]">Verify your presence in the physical realm.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="uppercase text-xs font-bold tracking-widest text-primary">Full Name</Label>
                  <Input {...form.register("fullName")} placeholder="CYBER_RUNNER" className="bg-background border-primary/20 rounded-none focus:border-primary transition-all font-bold" />
                  {form.formState.errors.fullName && <p className="text-xs text-accent font-bold uppercase">{form.formState.errors.fullName.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label className="uppercase text-xs font-bold tracking-widest text-primary">Email</Label>
                  <Input {...form.register("email")} placeholder="runner@matrix.net" className="bg-background border-primary/20 rounded-none focus:border-primary transition-all font-bold" />
                  {form.formState.errors.email && <p className="text-xs text-accent font-bold uppercase">{form.formState.errors.email.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label className="uppercase text-xs font-bold tracking-widest text-primary">Phone</Label>
                  <Input {...form.register("phone")} placeholder="+91_XXXXXXXXXX" className="bg-background border-primary/20 rounded-none focus:border-primary transition-all font-bold" />
                  {form.formState.errors.phone && <p className="text-xs text-accent font-bold uppercase">{form.formState.errors.phone.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label className="uppercase text-xs font-bold tracking-widest text-primary">Gender</Label>
                  <Select onValueChange={(v) => form.setValue("gender", v)} defaultValue={form.getValues("gender")}>
                    <SelectTrigger className="bg-background border-primary/20 rounded-none font-bold">
                      <SelectValue placeholder="CHOOSE_IDENTITY" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-primary/20">
                      <SelectItem value="male">MALE</SelectItem>
                      <SelectItem value="female">FEMALE</SelectItem>
                      <SelectItem value="other">NON_BINARY</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.gender && <p className="text-xs text-accent font-bold uppercase">{form.formState.errors.gender.message}</p>}
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label className="uppercase text-xs font-bold tracking-widest text-primary">Date of Birth</Label>
                  <Input type="date" {...form.register("dateOfBirth")} className="bg-background border-primary/20 rounded-none focus:border-primary font-bold" />
                  {form.formState.errors.dateOfBirth && <p className="text-xs text-accent font-bold uppercase">{form.formState.errors.dateOfBirth.message}</p>}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end border-t border-primary/10 mt-6 pt-6">
              <Button type="button" onClick={handleNext} className="cyber-button bg-primary text-background font-black uppercase italic h-12 px-8">
                Next_Phase <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {step === 2 && (
          <Card className="bg-card border-2 border-primary/20 rounded-none shadow-2xl animate-in fade-in slide-in-from-right-10 duration-500">
            <CardHeader className="border-b border-primary/10">
              <CardTitle className="text-2xl font-black uppercase italic text-secondary">02. Academic_Nexus</CardTitle>
              <CardDescription className="text-muted-foreground uppercase text-[10px] tracking-[0.2em]">Map your cognitive training background.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-2">
                <Label className="uppercase text-xs font-bold tracking-widest text-secondary">College / University</Label>
                <Input {...form.register("college")} placeholder="TECH_ACADEMY_PRIME" className="bg-background border-primary/20 rounded-none font-bold" />
                {form.formState.errors.college && <p className="text-xs text-accent font-bold uppercase">{form.formState.errors.college.message}</p>}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="uppercase text-xs font-bold tracking-widest text-secondary">Degree</Label>
                  <Input {...form.register("degree")} placeholder="B.TECH_COGNITIVE" className="bg-background border-primary/20 rounded-none font-bold" />
                  {form.formState.errors.degree && <p className="text-xs text-accent font-bold uppercase">{form.formState.errors.degree.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label className="uppercase text-xs font-bold tracking-widest text-secondary">Branch</Label>
                  <Input {...form.register("branch")} placeholder="NEURAL_NETWORKS" className="bg-background border-primary/20 rounded-none font-bold" />
                  {form.formState.errors.branch && <p className="text-xs text-accent font-bold uppercase">{form.formState.errors.branch.message}</p>}
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label className="uppercase text-xs font-bold tracking-widest text-secondary">Year of Study</Label>
                  <Select onValueChange={(v) => form.setValue("year", v)} defaultValue={form.getValues("year")}>
                    <SelectTrigger className="bg-background border-primary/20 rounded-none font-bold">
                      <SelectValue placeholder="SELECT_LEVEL" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-primary/20">
                      <SelectItem value="1st Year">LEVEL_01</SelectItem>
                      <SelectItem value="2nd Year">LEVEL_02</SelectItem>
                      <SelectItem value="3rd Year">LEVEL_03</SelectItem>
                      <SelectItem value="4th Year">LEVEL_04</SelectItem>
                      <SelectItem value="Graduate">LEGACY_RUNNER</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.year && <p className="text-xs text-accent font-bold uppercase">{form.formState.errors.year.message}</p>}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t border-primary/10 mt-6 pt-6">
              <Button type="button" variant="ghost" onClick={handleBack} className="uppercase font-bold tracking-widest rounded-none hover:bg-white/5 italic">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button type="button" onClick={handleNext} className="cyber-button bg-primary text-background font-black uppercase italic h-12 px-8">
                Next_Phase <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {step === 3 && (
          <Card className="bg-card border-2 border-primary/20 rounded-none shadow-2xl animate-in fade-in slide-in-from-right-10 duration-500">
            <CardHeader className="border-b border-primary/10">
              <CardTitle className="text-2xl font-black uppercase italic text-accent flex justify-between items-center">
                03. Team_Sync
                <Button type="button" variant="outline" size="sm" onClick={generateAITeamNames} disabled={teamNameLoading} className="border-accent text-accent hover:bg-accent/10 rounded-none uppercase text-[10px] font-black tracking-widest h-8 px-3">
                  {teamNameLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                  AI_GEN_NAME
                </Button>
              </CardTitle>
              <CardDescription className="text-muted-foreground uppercase text-[10px] tracking-[0.2em]">Assemble your strike team (Max 4).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8 pt-6">
              <div className="space-y-2">
                <Label className="uppercase text-xs font-bold tracking-widest text-accent">Team Callsign</Label>
                <Input {...form.register("teamName")} placeholder="NEON_SAMURAIS" className="bg-background border-primary/20 rounded-none text-xl font-black italic text-primary" />
                {form.formState.errors.teamName && <p className="text-xs text-accent font-bold uppercase">{form.formState.errors.teamName.message}</p>}
                
                {aiSuggestions.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4 animate-in slide-in-from-left-2">
                    {aiSuggestions.map((name, i) => (
                      <Button key={i} type="button" variant="secondary" size="sm" onClick={() => form.setValue("teamName", name)} className="text-[10px] bg-primary/5 hover:bg-primary/20 rounded-none border border-primary/10 uppercase font-bold tracking-tighter">
                        {name}
                      </Button>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <Label className="uppercase text-sm font-black tracking-widest flex items-center gap-2 text-primary">
                    <Cpu className="h-4 w-4" /> Strike_Members
                  </Label>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      if (fields.length < 3) append({ name: "", email: "" });
                    }}
                    disabled={fields.length >= 3}
                    className="border-primary text-primary hover:bg-primary/10 rounded-none h-8 italic font-black"
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add_Unit
                  </Button>
                </div>

                {fields.map((field, index) => (
                  <div key={field.id} className="p-6 bg-primary/5 border border-primary/10 rounded-none space-y-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="h-8 w-8 text-accent hover:text-accent hover:bg-accent/10">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="uppercase text-[10px] font-bold tracking-widest opacity-70">Unit_{index + 2}_Name</Label>
                        <Input {...form.register(`teamMembers.${index}.name`)} placeholder="CO-PILOT" className="bg-background border-primary/10 rounded-none font-bold" />
                      </div>
                      <div className="space-y-2">
                        <Label className="uppercase text-[10px] font-bold tracking-widest opacity-70">Unit_{index + 2}_Email</Label>
                        <Input {...form.register(`teamMembers.${index}.email`)} placeholder="unit@matrix.net" className="bg-background border-primary/10 rounded-none font-bold" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t border-primary/10 mt-6 pt-6">
              <Button type="button" variant="ghost" onClick={handleBack} className="uppercase font-bold tracking-widest rounded-none hover:bg-white/5 italic">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button type="button" onClick={handleNext} className="cyber-button bg-primary text-background font-black uppercase italic h-12 px-8">
                Next_Phase <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {step === 4 && (
          <Card className="bg-card border-2 border-primary/20 rounded-none shadow-2xl animate-in fade-in slide-in-from-right-10 duration-500">
            <CardHeader className="border-b border-primary/10">
              <CardTitle className="text-2xl font-black uppercase italic">04. Final_Auth</CardTitle>
              <CardDescription className="text-muted-foreground uppercase text-[10px] tracking-[0.2em]">Secure your uplink and initiate payment.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-2">
                <Label className="uppercase text-xs font-bold tracking-widest text-primary">LinkedIn Uplink</Label>
                <Input {...form.register("linkedinProfile")} placeholder="https://linkedin.com/in/..." className="bg-background border-primary/20 rounded-none font-bold" />
              </div>
              <div className="space-y-2">
                <Label className="uppercase text-xs font-bold tracking-widest text-primary">GitHub Repository</Label>
                <Input {...form.register("githubProfile")} placeholder="https://github.com/..." className="bg-background border-primary/20 rounded-none font-bold" />
              </div>

              <div className="mt-8 p-8 border-2 border-primary bg-primary/5 relative overflow-hidden group hover:shadow-[0_0_20px_rgba(252,238,10,0.1)] transition-all">
                <div className="absolute top-0 right-0 bg-primary text-background px-4 py-1 font-black italic text-xs uppercase">Official_Access</div>
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <span className="text-xs uppercase font-black tracking-[0.2em] opacity-70">Registration_Fee</span>
                    <h4 className="text-4xl font-black italic text-primary text-glitch">₹299.00</h4>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground max-w-[200px]">Includes 24h terminal access, energy kits, and cloud infrastructure credits.</p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t border-primary/10 mt-6 pt-6">
              <Button type="button" variant="ghost" onClick={handleBack} disabled={loading} className="uppercase font-bold tracking-widest rounded-none italic">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button type="submit" size="lg" className="cyber-button bg-primary text-background font-black uppercase italic h-16 px-10 shadow-[0_0_20px_rgba(252,238,10,0.3)] hover:scale-105" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : <CreditCard className="mr-2 h-6 w-6" />}
                Initiate_Registration
              </Button>
            </CardFooter>
          </Card>
        )}
      </form>
    </div>
  );
}
