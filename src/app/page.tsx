import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Cpu, Zap, Shield, Terminal, ChevronRight, Timer } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 lg:px-8 h-20 flex items-center border-b-2 border-primary/20 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <Link className="flex items-center space-x-3" href="/">
          <div className="bg-primary p-1.5 rotate-45">
            <Cpu className="h-6 w-6 text-background -rotate-45" />
          </div>
          <span className="text-2xl font-black tracking-tighter italic uppercase text-primary">BYTEPUNK</span>
        </Link>
        <nav className="ml-auto flex gap-6 sm:gap-10 items-center">
          <Link className="text-sm font-bold uppercase tracking-widest hover:text-primary transition-colors hidden md:block" href="#about">
            01. Protocol
          </Link>
          <Link className="text-sm font-bold uppercase tracking-widest hover:text-primary transition-colors" href="/login">
            02. Login
          </Link>
          <Link href="/register">
            <Button size="sm" className="cyber-button bg-primary text-background font-black uppercase italic">
              Register_Now
            </Button>
          </Link>
        </nav>
      </header>

      <main className="flex-1">
        <section className="relative w-full py-24 md:py-32 lg:py-48 flex flex-col items-center justify-center text-center px-4 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full -z-10">
             <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,rgba(252,238,10,0.1),transparent_70%)]" />
          </div>
          
          <div className="space-y-6 max-w-4xl animate-in fade-in slide-in-from-bottom-10 duration-1000">
            <div className="inline-flex items-center space-x-2 bg-primary/10 border border-primary/20 px-4 py-1.5 rounded-none mb-4">
              <Zap className="h-4 w-4 text-primary animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-[0.3em] text-primary">Status: System Online // 2024.04.10</span>
            </div>
            
            <h1 className="text-6xl font-black tracking-tighter sm:text-7xl md:text-8xl lg:text-9xl uppercase italic leading-[0.8]">
              BYTE<span className="text-primary text-glitch">PUNK</span>
            </h1>
            
            <p className="mx-auto max-w-[800px] text-muted-foreground md:text-xl font-medium tracking-tight uppercase border-l-4 border-primary pl-6 py-2">
              A 24-HOUR UNDERGROUND CODING RITUAL. <br/>
              10th APRIL // GLOBAL ACCESS // ZERO LATENCY.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-12">
              <Link href="/register">
                <Button size="lg" className="h-16 px-10 text-xl font-black bg-primary text-background uppercase italic cyber-button group">
                  Jack_In
                  <ChevronRight className="ml-2 h-6 w-6 group-hover:translate-x-2 transition-transform" />
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button size="lg" variant="outline" className="h-16 px-10 text-xl font-black uppercase italic border-2 border-primary/50 text-primary hover:bg-primary/10 rounded-none">
                  Admin_Terminal
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section id="about" className="w-full py-24 bg-card/30 border-y-2 border-primary/10">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid gap-16 sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex flex-col items-center space-y-6 text-center group">
                <div className="flex h-20 w-20 items-center justify-center border-2 border-primary bg-primary/5 rotate-45 group-hover:bg-primary group-hover:text-background transition-all duration-500">
                  <Timer className="h-10 w-10 -rotate-45" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black uppercase italic">24H Overdrive</h3>
                  <p className="text-muted-foreground font-medium uppercase text-sm tracking-widest">Non-stop execution starting 10:00 AM on April 10th. Speed is life.</p>
                </div>
              </div>
              <div className="flex flex-col items-center space-y-6 text-center group">
                <div className="flex h-20 w-20 items-center justify-center border-2 border-secondary bg-secondary/5 rotate-45 group-hover:bg-secondary group-hover:text-background transition-all duration-500">
                  <Terminal className="h-10 w-10 -rotate-45" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black uppercase italic text-secondary">Tech Stack</h3>
                  <p className="text-muted-foreground font-medium uppercase text-sm tracking-widest">Build anything. Break everything. Our AI agents will judge your code's purity.</p>
                </div>
              </div>
              <div className="flex flex-col items-center space-y-6 text-center group">
                <div className="flex h-20 w-20 items-center justify-center border-2 border-accent bg-accent/5 rotate-45 group-hover:bg-accent group-hover:text-background transition-all duration-500">
                  <Shield className="h-10 w-10 -rotate-45" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black uppercase italic text-accent">Cyber Bounties</h3>
                  <p className="text-muted-foreground font-medium uppercase text-sm tracking-widest">Secure the data, claim the reward. ₹500,000 in total prize pools for top runners.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <footer className="border-t-2 border-primary/20 py-12 px-4 md:px-6 text-center bg-card">
        <div className="flex flex-col items-center space-y-4">
          <div className="flex items-center space-x-2">
            <Cpu className="h-5 w-5 text-primary" />
            <span className="text-xl font-black italic text-primary">BYTEPUNK_CORP</span>
          </div>
          <p className="text-xs uppercase font-bold tracking-[0.5em] text-muted-foreground">© 2024 NEON_DISTRICT. ALL RIGHTS RESERVED.</p>
        </div>
      </footer>
    </div>
  );
}
