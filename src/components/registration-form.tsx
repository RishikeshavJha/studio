"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { auth, db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { generateTeamNameIdeas } from "@/ai/flows/generate-team-name-ideas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Plus, Trash2, ArrowRight, ArrowLeft, Loader2, CreditCard } from "lucide-react";
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

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      email: auth.currentUser?.email || "",
      phone: "",
      gender: "",
      dateOfBirth: "",
      college: "",
      degree: "",
      branch: "",
      year: "",
      teamName: "",
      teamLeaderName: "",
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
    const leaderName = form.watch("fullName");
    form.setValue("teamLeaderName", leaderName);
  }, [form.watch("fullName")]);

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
    const theme = prompt("What's your project theme or hackathon category?");
    if (!theme) return;

    setTeamNameLoading(true);
    try {
      const result = await generateTeamNameIdeas({ keywordsOrTheme: theme });
      setAiSuggestions(result.teamNames);
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to generate names." });
    } finally {
      setTeamNameLoading(false);
    }
  };

  const processPayment = async (data: FormValues) => {
    setLoading(true);
    
    // Check if Razorpay script is loaded
    if (!(window as any).Razorpay) {
      toast({ variant: "destructive", title: "Payment Error", description: "Razorpay script not loaded. Please refresh." });
      setLoading(false);
      return;
    }

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_dummy",
      amount: 299 * 100, // Amount in paise
      currency: "INR",
      name: "HackSync Reg",
      description: "Hackathon Registration Fee",
      image: "https://picsum.photos/seed/hacksync/200/200",
      handler: async function (response: any) {
        // Payment success
        try {
          await addDoc(collection(db, "participants"), {
            ...data,
            paymentId: response.razorpay_payment_id,
            paymentStatus: "completed",
            registrationFee: 299,
            currency: "INR",
            createdAt: serverTimestamp(),
            submittedAt: new Date().toISOString(),
          });
          toast({ title: "Registration Successful!", description: "Welcome to the hackathon." });
          window.location.href = "/dashboard";
        } catch (error) {
          toast({ variant: "destructive", title: "Firestore Error", description: "Payment recorded but data failed to save. Please contact support." });
        }
      },
      prefill: {
        name: data.fullName,
        email: data.email,
        contact: data.phone
      },
      theme: {
        color: "#5E26D9"
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
      <div className="mb-8 space-y-2">
        <div className="flex justify-between items-center text-sm font-medium text-muted-foreground">
          <span>Step {step} of 4</span>
          <span>{Math.round(progress)}% Complete</span>
        </div>
        <Progress value={progress} className="h-2 bg-muted/50" />
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)}>
        {step === 1 && (
          <Card className="glass-card border-none shadow-xl animate-in fade-in slide-in-from-bottom-4">
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Tell us a bit about yourself</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input {...form.register("fullName")} placeholder="John Doe" className="bg-muted/30" />
                  {form.formState.errors.fullName && <p className="text-xs text-destructive">{form.formState.errors.fullName.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input {...form.register("email")} placeholder="john@example.com" className="bg-muted/30" />
                  {form.formState.errors.email && <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input {...form.register("phone")} placeholder="+91 9876543210" className="bg-muted/30" />
                  {form.formState.errors.phone && <p className="text-xs text-destructive">{form.formState.errors.phone.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <Select onValueChange={(v) => form.setValue("gender", v)} defaultValue={form.getValues("gender")}>
                    <SelectTrigger className="bg-muted/30">
                      <SelectValue placeholder="Select Gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.gender && <p className="text-xs text-destructive">{form.formState.errors.gender.message}</p>}
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Date of Birth</Label>
                  <Input type="date" {...form.register("dateOfBirth")} className="bg-muted/30" />
                  {form.formState.errors.dateOfBirth && <p className="text-xs text-destructive">{form.formState.errors.dateOfBirth.message}</p>}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button type="button" onClick={handleNext} className="bg-primary hover:bg-primary/90">
                Continue <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {step === 2 && (
          <Card className="glass-card border-none shadow-xl animate-in fade-in slide-in-from-right-4">
            <CardHeader>
              <CardTitle>Academic Information</CardTitle>
              <CardDescription>Your current educational status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>College / University</Label>
                <Input {...form.register("college")} placeholder="Example University" className="bg-muted/30" />
                {form.formState.errors.college && <p className="text-xs text-destructive">{form.formState.errors.college.message}</p>}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Degree</Label>
                  <Input {...form.register("degree")} placeholder="B.Tech" className="bg-muted/30" />
                  {form.formState.errors.degree && <p className="text-xs text-destructive">{form.formState.errors.degree.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Branch</Label>
                  <Input {...form.register("branch")} placeholder="Computer Science" className="bg-muted/30" />
                  {form.formState.errors.branch && <p className="text-xs text-destructive">{form.formState.errors.branch.message}</p>}
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Year of Study</Label>
                  <Select onValueChange={(v) => form.setValue("year", v)} defaultValue={form.getValues("year")}>
                    <SelectTrigger className="bg-muted/30">
                      <SelectValue placeholder="Select Year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1st Year">1st Year</SelectItem>
                      <SelectItem value="2nd Year">2nd Year</SelectItem>
                      <SelectItem value="3rd Year">3rd Year</SelectItem>
                      <SelectItem value="4th Year">4th Year</SelectItem>
                      <SelectItem value="Graduate">Graduate</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.year && <p className="text-xs text-destructive">{form.formState.errors.year.message}</p>}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button type="button" variant="ghost" onClick={handleBack}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button type="button" onClick={handleNext} className="bg-primary hover:bg-primary/90">
                Continue <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {step === 3 && (
          <Card className="glass-card border-none shadow-xl animate-in fade-in slide-in-from-right-4">
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                Team Information
                <Button type="button" variant="outline" size="sm" onClick={generateAITeamNames} disabled={teamNameLoading} className="glass-card">
                  {teamNameLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                  AI Names
                </Button>
              </CardTitle>
              <CardDescription>Collaborate with others (Min 1, Max 4 total)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Team Name</Label>
                <div className="flex gap-2">
                  <Input {...form.register("teamName")} placeholder="Cyber Samurai" className="bg-muted/30" />
                </div>
                {form.formState.errors.teamName && <p className="text-xs text-destructive">{form.formState.errors.teamName.message}</p>}
                
                {aiSuggestions.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {aiSuggestions.map((name, i) => (
                      <Button key={i} type="button" variant="secondary" size="sm" onClick={() => form.setValue("teamName", name)} className="text-xs">
                        {name}
                      </Button>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label className="text-base font-semibold">Team Members</Label>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      if (fields.length < 3) append({ name: "", email: "" });
                    }}
                    disabled={fields.length >= 3}
                    className="glass-card"
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add Member
                  </Button>
                </div>

                {fields.map((field, index) => (
                  <div key={field.id} className="p-4 rounded-lg bg-muted/20 border border-white/5 space-y-4 animate-in zoom-in-95 duration-200">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Member #{index + 2}</span>
                      <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="h-8 w-8 text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Name</Label>
                        <Input {...form.register(`teamMembers.${index}.name`)} placeholder="Jane Smith" className="bg-muted/30" />
                      </div>
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input {...form.register(`teamMembers.${index}.email`)} placeholder="jane@nc.net" className="bg-muted/30" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button type="button" variant="ghost" onClick={handleBack}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button type="button" onClick={handleNext} className="bg-primary hover:bg-primary/90">
                Continue <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {step === 4 && (
          <Card className="glass-card border-none shadow-xl animate-in fade-in slide-in-from-right-4">
            <CardHeader>
              <CardTitle>Final Touches</CardTitle>
              <CardDescription>Share your profiles and complete payment</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>LinkedIn Profile (Optional)</Label>
                <Input {...form.register("linkedinProfile")} placeholder="https://linkedin.com/in/..." className="bg-muted/30" />
              </div>
              <div className="space-y-2">
                <Label>GitHub Profile (Optional)</Label>
                <Input {...form.register("githubProfile")} placeholder="https://github.com/..." className="bg-muted/30" />
              </div>
              <div className="space-y-2">
                <Label>Portfolio Website (Optional)</Label>
                <Input {...form.register("portfolioWebsite")} placeholder="https://..." className="bg-muted/30" />
              </div>

              <div className="mt-8 p-6 rounded-2xl bg-primary/10 border border-primary/20 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium">Registration Fee</span>
                  <span className="text-2xl font-bold text-secondary">₹299.00</span>
                </div>
                <p className="text-sm text-muted-foreground">This fee covers event access, kits, workshops, and cloud credits.</p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button type="button" variant="ghost" onClick={handleBack} disabled={loading}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button type="submit" size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-bold" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
                Pay & Register
              </Button>
            </CardFooter>
          </Card>
        )}
      </form>
    </div>
  );
}