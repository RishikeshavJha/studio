import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Code2, Users, CreditCard, Rocket, ChevronRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 lg:px-6 h-16 flex items-center border-b border-white/10 glass-card sticky top-0 z-50">
        <Link className="flex items-center justify-center space-x-2" href="/">
          <Code2 className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold tracking-tighter">HackSync Reg</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link className="text-sm font-medium hover:text-primary transition-colors" href="/login">
            Login
          </Link>
          <Link href="/register">
            <Button size="sm" className="bg-primary hover:bg-primary/90">Register Now</Button>
          </Link>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 flex flex-col items-center justify-center text-center px-4">
          <div className="space-y-4 max-w-3xl">
            <h1 className="text-4xl font-extrabold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
              Innovate. <span className="text-primary">Collaborate.</span> <span className="text-secondary">Conquer.</span>
            </h1>
            <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Join the elite circle of builders. Register for the biggest tech showdown of the year. Secure your spot, build your team, and show the world your potential.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
              <Link href="/register">
                <Button size="lg" className="h-12 px-8 text-lg font-semibold bg-primary hover:bg-primary/90 rounded-full group">
                  Register for Hackathon
                  <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button size="lg" variant="outline" className="h-12 px-8 text-lg font-semibold rounded-full glass-card hover:bg-white/10">
                  Admin Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32 border-t border-white/10 glass-card">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex flex-col items-center space-y-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Users className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold">Team Building</h3>
                <p className="text-muted-foreground">Form teams of 1-4 members. Use our AI tool to generate creative team names based on your theme.</p>
              </div>
              <div className="flex flex-col items-center space-y-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary/10 text-secondary">
                  <CreditCard className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold">Secure Payments</h3>
                <p className="text-muted-foreground">Seamless Razorpay integration for quick and secure registration fee payments.</p>
              </div>
              <div className="flex flex-col items-center space-y-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Rocket className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold">Real-time Updates</h3>
                <p className="text-muted-foreground">Instant confirmation and live dashboard for participants and organizers to track registrations.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t border-white/10 py-8 px-4 md:px-6 text-center text-sm text-muted-foreground glass-card">
        <p>© 2024 HackSync Reg. All rights reserved. Powered by BytePunk.</p>
      </footer>
    </div>
  );
}