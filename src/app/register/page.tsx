import { RegistrationForm } from "@/components/registration-form";
import { Code2 } from "lucide-react";
import Link from "next/link";

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-6 h-20 flex items-center glass-card border-b border-white/10 shrink-0">
        <Link className="flex items-center space-x-2" href="/">
          <Code2 className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold tracking-tighter">HackSync Reg</span>
        </Link>
      </header>
      <main className="flex-1 flex flex-col items-center py-12">
        <div className="text-center mb-8 space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">Hackathon Registration</h1>
          <p className="text-muted-foreground max-w-lg mx-auto">Complete all four steps to secure your participation in the upcoming BytePunk Global Hackathon.</p>
        </div>
        <RegistrationForm />
      </main>
    </div>
  );
}