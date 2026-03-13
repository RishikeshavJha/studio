"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useFirestore, useUser } from "@/firebase";
import { collection, serverTimestamp, doc, setDoc, getDoc } from "firebase/firestore";
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
      
      // Load existing data from Firebase
      loadExistingData();
    }
  }, [user, form]);

  const loadExistingData = async () => {
    if (!user) return;
    
    try {
      const participantDocRef = doc(firestore, "participants", user.uid);
      const docSnap = await getDoc(participantDocRef);
      
      if (docSnap.exists()) {
        const existingData = docSnap.data();
        
        // Pre-fill all form fields with existing data
        Object.keys(existingData).forEach(key => {
          if (key !== 'id' && key !== 'participationId' && key !== 'paymentId' && 
              key !== 'paymentStatus' && key !== 'registrationFee' && key !== 'currency' && 
              key !== 'createdAt' && key !== 'submittedAt' && key !== 'eventDate' && 
              key !== 'testMode') {
            form.setValue(key as any, existingData[key]);
          }
        });
        
        // Set the step to 4 (final step) if registration is complete
        if (existingData.paymentStatus === "test_completed" || existingData.paymentStatus === "completed") {
          setStep(4);
          toast({ 
            title: "Registration Found", 
            description: `Welcome back! Your Participation ID: ${existingData.participationId}` 
          });
        }
      }
    } catch (error) {
      console.error("Error loading existing data:", error);
    }
  };

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

  const generateParticipationId = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'BP2026';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const processPayment = async (data: FormValues) => {
    if (!user) {
      toast({ variant: "destructive", title: "Auth Required", description: "You must be jacked in (logged in) to register." });
      return;
    }

    setLoading(true);
    
    try {
      const participationId = generateParticipationId();
      const participantDocRef = doc(firestore, "participants", user.uid);
      
      // Save user data to Firebase without requiring payment
      await setDoc(participantDocRef, {
        ...data,
        id: user.uid,
        participationId: participationId,
        paymentId: "test_payment_" + Date.now(),
        paymentStatus: "test_completed",
        registrationFee: 299,
        currency: "INR",
        createdAt: serverTimestamp(),
        submittedAt: new Date().toISOString(),
        eventDate: "2026-04-10",
        testMode: true
      }, { merge: true });

      toast({ title: "DATA_SAVED", description: `Registration complete! Your Participation ID: ${participationId}` });
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1500);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Database Error", description: error.message || "Failed to save data to Firebase." });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (data: FormValues) => {
    processPayment(data);
  };

  const progress = (step / 4) * 100;

  return (
    <div className="w-full max-w-full sm:max-w-2xl mx-auto py-4 sm:py-6 px-3 sm:px-4 min-h-screen">
      <div className="mb-4 sm:mb-6 space-y-3 sm:space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-[9px] sm:text-xs font-black uppercase tracking-[0.2em] text-primary">
          <span className="text-center sm:text-left">STEP_{step}_OF_4</span>
          <span className="text-center sm:text-right">{Math.round(progress)}%_STABLE</span>
        </div>
        <Progress value={progress} className="h-1 sm:h-1.5 bg-primary/10" />
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)}>
        {step === 1 && (
          <Card className="bg-card border-2 border-primary/20 rounded-none shadow-xl sm:shadow-2xl animate-in fade-in zoom-in-95 duration-500 overflow-hidden">
            <CardHeader className="border-b border-primary/10 px-3 sm:px-6 py-3 sm:py-6">
              <CardTitle className="text-lg sm:text-2xl font-black uppercase italic leading-tight">01. Identity_Scan</CardTitle>
              <CardDescription className="text-muted-foreground uppercase text-[7px] sm:text-[10px] tracking-[0.2em] mt-1">Verify your presence in the physical realm.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6 pt-3 sm:pt-6 px-3 sm:px-6">
              <div className="grid grid-cols-1 gap-3 sm:gap-6">
                <div className="space-y-2">
                  <Label className="uppercase text-[9px] sm:text-xs font-bold tracking-widest text-primary">Full Name</Label>
                  <Input {...form.register("fullName")} placeholder="CYBER_RUNNER" className="bg-background border-primary/20 rounded-none focus:border-primary transition-all font-bold text-sm sm:text-base h-10 sm:h-11" />
                  {form.formState.errors.fullName && <p className="text-xs text-accent font-bold uppercase">{form.formState.errors.fullName.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label className="uppercase text-[9px] sm:text-xs font-bold tracking-widest text-primary">Email</Label>
                  <Input {...form.register("email")} placeholder="runner@matrix.net" className="bg-background border-primary/20 rounded-none focus:border-primary transition-all font-bold text-sm sm:text-base h-10 sm:h-11" />
                  {form.formState.errors.email && <p className="text-xs text-accent font-bold uppercase">{form.formState.errors.email.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label className="uppercase text-[9px] sm:text-xs font-bold tracking-widest text-primary">Phone</Label>
                  <Input {...form.register("phone")} placeholder="+91_XXXXXXXXXX" className="bg-background border-primary/20 rounded-none focus:border-primary transition-all font-bold text-sm sm:text-base h-10 sm:h-11" />
                  {form.formState.errors.phone && <p className="text-xs text-accent font-bold uppercase">{form.formState.errors.phone.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label className="uppercase text-[9px] sm:text-xs font-bold tracking-widest text-primary">Gender</Label>
                  <Select onValueChange={(v) => form.setValue("gender", v)} defaultValue={form.getValues("gender")}>
                    <SelectTrigger className="bg-background border-primary/20 rounded-none font-bold text-sm sm:text-base h-10 sm:h-11">
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
                <div className="space-y-2">
                  <Label className="uppercase text-[9px] sm:text-xs font-bold tracking-widest text-primary">Date of Birth</Label>
                  <Input type="date" {...form.register("dateOfBirth")} className="bg-background border-primary/20 rounded-none focus:border-primary font-bold text-sm sm:text-base h-10 sm:h-11" />
                  {form.formState.errors.dateOfBirth && <p className="text-xs text-accent font-bold uppercase">{form.formState.errors.dateOfBirth.message}</p>}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end border-t border-primary/10 mt-3 sm:mt-6 pt-3 sm:pt-6 px-3 sm:px-6">
              <Button type="button" onClick={handleNext} className="cyber-button bg-primary text-background font-black uppercase italic h-9 sm:h-12 px-4 sm:px-8 text-xs sm:text-base animate-pulse hover:scale-105 transition-all duration-200">
                Next_Phase <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {step === 2 && (
          <Card className="bg-card border-2 border-primary/20 rounded-none shadow-xl sm:shadow-2xl animate-in fade-in slide-in-from-right-10 duration-500 overflow-hidden">
            <CardHeader className="border-b border-primary/10 px-3 sm:px-6 py-3 sm:py-6">
              <CardTitle className="text-lg sm:text-2xl font-black uppercase italic text-secondary leading-tight">02. Academic_Nexus</CardTitle>
              <CardDescription className="text-muted-foreground uppercase text-[7px] sm:text-[10px] tracking-[0.2em] mt-1">Map your cognitive training background.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6 pt-3 sm:pt-6 px-3 sm:px-6">
              <div className="space-y-2">
                <Label className="uppercase text-[9px] sm:text-xs font-bold tracking-widest text-secondary">College / University</Label>
                <Input {...form.register("college")} placeholder="TECH_ACADEMY_PRIME" className="bg-background border-primary/20 rounded-none font-bold text-sm sm:text-base h-10 sm:h-11" />
                {form.formState.errors.college && <p className="text-xs text-accent font-bold uppercase">{form.formState.errors.college.message}</p>}
              </div>
              <div className="grid grid-cols-1 gap-3 sm:gap-6">
                <div className="space-y-2">
                  <Label className="uppercase text-[9px] sm:text-xs font-bold tracking-widest text-secondary">Degree</Label>
                  <Input {...form.register("degree")} placeholder="B.TECH_COGNITIVE" className="bg-background border-primary/20 rounded-none font-bold text-sm sm:text-base h-10 sm:h-11" />
                  {form.formState.errors.degree && <p className="text-xs text-accent font-bold uppercase">{form.formState.errors.degree.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label className="uppercase text-[9px] sm:text-xs font-bold tracking-widest text-secondary">Branch</Label>
                  <Input {...form.register("branch")} placeholder="NEURAL_NETWORKS" className="bg-background border-primary/20 rounded-none font-bold text-sm sm:text-base h-10 sm:h-11" />
                  {form.formState.errors.branch && <p className="text-xs text-accent font-bold uppercase">{form.formState.errors.branch.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label className="uppercase text-[9px] sm:text-xs font-bold tracking-widest text-secondary">Year of Study</Label>
                  <Select onValueChange={(v) => form.setValue("year", v)} defaultValue={form.getValues("year")}>
                    <SelectTrigger className="bg-background border-primary/20 rounded-none font-bold text-sm sm:text-base h-10 sm:h-11">
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
            <CardFooter className="flex flex-col sm:flex-row justify-between gap-4 border-t border-primary/10 mt-4 sm:mt-6 pt-4 sm:pt-6 px-4 sm:px-6">
              <Button type="button" variant="ghost" onClick={handleBack} className="uppercase font-bold tracking-widest rounded-none hover:bg-white/5 italic h-10 sm:h-12 px-6 sm:px-8 text-sm sm:text-base">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button type="button" onClick={handleNext} className="cyber-button bg-primary text-background font-black uppercase italic h-10 sm:h-12 px-6 sm:px-8 text-sm sm:text-base">
                Next_Phase <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {step === 3 && (
          <Card className="bg-card border-2 border-primary/20 rounded-none shadow-xl sm:shadow-2xl animate-in fade-in slide-in-from-right-10 duration-500 overflow-hidden">
            <CardHeader className="border-b border-primary/10 px-3 sm:px-6 py-3 sm:py-6">
              <CardTitle className="text-lg sm:text-2xl font-black uppercase italic text-accent flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 leading-tight">
                03. Team_Sync
                <Button type="button" variant="outline" size="sm" onClick={generateAITeamNames} disabled={teamNameLoading} className="border-accent text-accent hover:bg-accent/10 rounded-none uppercase text-[9px] sm:text-[10px] font-black tracking-widest h-8 px-3 transition-all duration-200">
                  {teamNameLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                  AI_GEN_NAME
                </Button>
              </CardTitle>
              <CardDescription className="text-muted-foreground uppercase text-[7px] sm:text-[10px] tracking-[0.2em] mt-1">Assemble your strike team (Max 4).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-8 pt-3 sm:pt-6 px-3 sm:px-6">
              <div className="space-y-2">
                <Label className="uppercase text-[9px] sm:text-xs font-bold tracking-widest text-accent">Team Callsign</Label>
                <Input {...form.register("teamName")} placeholder="NEON_SAMURAIS" className="bg-background border-primary/20 rounded-none text-base sm:text-lg font-black italic text-primary h-10 sm:h-11" />
                {form.formState.errors.teamName && <p className="text-xs text-accent font-bold uppercase">{form.formState.errors.teamName.message}</p>}
                
                {aiSuggestions.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4 animate-in slide-in-from-left-2 duration-300">
                    {aiSuggestions.map((name, i) => (
                      <Button key={i} type="button" variant="secondary" size="sm" onClick={() => form.setValue("teamName", name)} className="text-[9px] sm:text-[10px] bg-primary/5 hover:bg-primary/20 rounded-none border border-primary/10 uppercase font-bold tracking-tighter transition-all duration-200 hover:scale-105">
                        {name}
                      </Button>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-4 sm:space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <Label className="uppercase text-sm font-black tracking-widest flex items-center gap-2 text-primary">
                    <Cpu className="h-4 w-4 animate-pulse" /> Strike_Members
                  </Label>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      if (fields.length < 3) append({ name: "", email: "" });
                    }}
                    disabled={fields.length >= 3}
                    className="border-primary text-primary hover:bg-primary/10 rounded-none h-8 italic font-black text-xs sm:text-sm transition-all duration-200 hover:scale-105"
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add_Unit
                  </Button>
                </div>

                {fields.map((field, index) => (
                  <div key={field.id} className="p-3 sm:p-6 bg-primary/5 border border-primary/10 rounded-none space-y-3 sm:space-y-6 relative overflow-hidden group hover:bg-primary/10 transition-all duration-300">
                    <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="h-8 w-8 text-accent hover:text-accent hover:bg-accent/10 transition-all duration-200">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:gap-6">
                      <div className="space-y-2">
                        <Label className="uppercase text-[9px] sm:text-[10px] font-bold tracking-widest opacity-70">Unit_{index + 2}_Name</Label>
                        <Input {...form.register(`teamMembers.${index}.name`)} placeholder="CO-PILOT" className="bg-background border-primary/10 rounded-none font-bold text-sm sm:text-base h-10 sm:h-11 transition-all duration-200" />
                      </div>
                      <div className="space-y-2">
                        <Label className="uppercase text-[9px] sm:text-[10px] font-bold tracking-widest opacity-70">Unit_{index + 2}_Email</Label>
                        <Input {...form.register(`teamMembers.${index}.email`)} placeholder="unit@matrix.net" className="bg-background border-primary/10 rounded-none font-bold text-sm sm:text-base h-10 sm:h-11 transition-all duration-200" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-4 border-t border-primary/10 mt-3 sm:mt-6 pt-3 sm:pt-6 px-3 sm:px-6">
              <Button type="button" variant="ghost" onClick={handleBack} className="uppercase font-bold tracking-widest rounded-none hover:bg-white/5 italic h-9 sm:h-12 px-4 sm:px-8 text-xs sm:text-base transition-all duration-200">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button type="button" onClick={handleNext} className="cyber-button bg-primary text-background font-black uppercase italic h-9 sm:h-12 px-4 sm:px-8 text-xs sm:text-base animate-pulse hover:scale-105 transition-all duration-200">
                Next_Phase <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {step === 4 && (
          <Card className="bg-card border-2 border-primary/20 rounded-none shadow-xl sm:shadow-2xl animate-in fade-in slide-in-from-right-10 duration-500 overflow-hidden">
            <CardHeader className="border-b border-primary/10 px-3 sm:px-6 py-3 sm:py-6">
              <CardTitle className="text-lg sm:text-2xl font-black uppercase italic leading-tight">04. Final_Auth</CardTitle>
              <CardDescription className="text-muted-foreground uppercase text-[7px] sm:text-[10px] tracking-[0.2em] mt-1">Secure your uplink and initiate payment.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6 pt-3 sm:pt-6 px-3 sm:px-6">
              <div className="space-y-2">
                <Label className="uppercase text-[9px] sm:text-xs font-bold tracking-widest text-primary">LinkedIn Uplink</Label>
                <Input {...form.register("linkedinProfile")} placeholder="https://linkedin.com/in/..." className="bg-background border-primary/20 rounded-none font-bold text-sm sm:text-base h-10 sm:h-11" />
              </div>
              <div className="space-y-2">
                <Label className="uppercase text-[9px] sm:text-xs font-bold tracking-widest text-primary">GitHub Repository</Label>
                <Input {...form.register("githubProfile")} placeholder="https://github.com/..." className="bg-background border-primary/20 rounded-none font-bold text-sm sm:text-base h-10 sm:h-11" />
              </div>

              <div className="mt-4 sm:mt-8 p-3 sm:p-8 border-2 border-primary bg-primary/5 relative overflow-hidden group hover:shadow-[0_0_20px_rgba(252,238,10,0.1)] transition-all duration-300">
                <div className="absolute top-0 right-0 bg-primary text-background px-2 sm:px-4 py-1 font-black italic text-[9px] sm:text-xs uppercase animate-pulse">Official_Access</div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                  <div className="space-y-1">
                    <span className="text-[9px] sm:text-xs uppercase font-black tracking-[0.2em] opacity-70">Registration_Fee</span>
                    <h4 className="text-xl sm:text-4xl font-black italic text-primary text-glitch animate-pulse">₹299.00</h4>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground max-w-full sm:max-w-[200px]">Includes 24h terminal access, energy kits, and cloud infrastructure credits.</p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-4 border-t border-primary/10 mt-3 sm:mt-6 pt-3 sm:pt-6 px-3 sm:px-6">
              <Button type="button" variant="ghost" onClick={handleBack} disabled={loading} className="uppercase font-bold tracking-widest rounded-none italic h-9 sm:h-12 px-4 sm:px-8 text-xs sm:text-base transition-all duration-200">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button type="submit" size="lg" className="cyber-button bg-primary text-background font-black uppercase italic h-10 sm:h-16 px-4 sm:px-10 shadow-[0_0_20px_rgba(252,238,10,0.3)] hover:scale-105 text-xs sm:text-base animate-pulse transition-all duration-200" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : <CreditCard className="mr-2 h-6 w-6" />}
                Save_Data_To_Database
              </Button>
            </CardFooter>
          </Card>
        )}
      </form>
    </div>
  );
}
