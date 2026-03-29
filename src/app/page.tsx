"use client"

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, ShieldCheck, Zap, Activity } from 'lucide-react';

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="max-w-3xl w-full text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium animate-in">
            <span>Efficient. Clear. Intelligent.</span>
          </div>
          
          <h1 className="text-6xl font-black tracking-tighter text-foreground sm:text-7xl">
            Flow<span className="text-primary">Pay</span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Experience the next generation of expense management. Automated OCR, AI-powered fraud detection, and flexible approval workflows in one sleek platform.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button size="lg" className="h-14 px-8 text-lg gap-2" onClick={() => router.push('/dashboard')}>
              <LayoutDashboard className="w-5 h-5" /> Enter Dashboard
            </Button>
            <Button size="lg" variant="outline" className="h-14 px-8 text-lg gap-2">
              <ShieldCheck className="w-5 h-5 text-accent" /> How it Works
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-16">
            <div className="space-y-2">
              <div className="w-10 h-10 bg-white rounded-lg shadow-sm flex items-center justify-center mx-auto mb-4">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-bold">Smart OCR</h3>
              <p className="text-sm text-muted-foreground">Instantly extract receipt data with Gemini-powered AI models.</p>
            </div>
            <div className="space-y-2">
              <div className="w-10 h-10 bg-white rounded-lg shadow-sm flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="w-5 h-5 text-accent" />
              </div>
              <h3 className="font-bold">Fraud Guard</h3>
              <p className="text-sm text-muted-foreground">Automated detection of suspicious patterns and discrepancies.</p>
            </div>
            <div className="space-y-2">
              <div className="w-10 h-10 bg-white rounded-lg shadow-sm flex items-center justify-center mx-auto mb-4">
                <Activity className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-bold">Agile Approval</h3>
              <p className="text-sm text-muted-foreground">Configure multi-level sequences for your unique organization.</p>
            </div>
          </div>
        </div>
      </main>
      
      <footer className="py-8 border-t text-center text-sm text-muted-foreground">
        &copy; 2024 FlowPay. Built for the modern enterprise.
      </footer>
    </div>
  );
}
