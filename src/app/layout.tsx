import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: 'HackSync Reg | Hackathon Registration',
  description: 'The ultimate hackathon registration and team management platform.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        {/* Razorpay script */}
        <script src="https://checkout.razorpay.com/v1/checkout.js" async></script>
      </head>
      <body className="font-body antialiased bg-background text-foreground min-h-screen selection:bg-primary/30 selection:text-white">
        <div className="relative isolate">
          <div className="pointer-events-none fixed inset-0 -z-10 gradient-bg opacity-50" />
          {children}
        </div>
        <Toaster />
      </body>
    </html>
  );
}