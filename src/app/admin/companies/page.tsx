"use client"

import { useStore } from '@/app/lib/store';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, Plus, Globe, Calendar, ArrowRight, ShieldCheck } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export default function CompanyManagement() {
  const { companies, addCompany } = useStore();
  const { toast } = useToast();
  
  const [newCompany, setNewCompany] = useState({
    name: '',
    base_currency: 'USD'
  });

  const [currencies, setCurrencies] = useState<{code: string, name: string}[]>([]);

  useEffect(() => {
    fetch('https://restcountries.com/v3.1/all?fields=currencies')
      .then(res => res.json())
      .then(data => {
        const list: {code: string, name: string}[] = [];
        const seen = new Set();
        data.forEach((item: any) => {
          if (item.currencies) {
            Object.entries(item.currencies).forEach(([code, details]: [string, any]) => {
              if (!seen.has(code)) {
                seen.add(code);
                list.push({ code, name: details.name });
              }
            });
          }
        });
        setCurrencies(list.sort((a,b) => a.code.localeCompare(b.code)));
      });
  }, []);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompany.name) return;
    
    addCompany(newCompany);
    setNewCompany({ name: '', base_currency: 'USD' });
    toast({
      title: "Organization Created",
      description: `${newCompany.name} has been added to the system.`,
    });
  };

  return (
    <div className="min-h-screen bg-background font-body">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-8">
          <h1 className="text-4xl font-black tracking-tight text-foreground font-headline">Organization Management</h1>
          <p className="text-muted-foreground mt-1">Create and manage multiple company workspaces as a global administrator.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Create Form */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24 border-primary/10 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl">New Organization</CardTitle>
                <CardDescription>Register a new company to enable unique workflows.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Company Name</Label>
                    <Input 
                      id="name" 
                      placeholder="e.g. Acme Innovations" 
                      value={newCompany.name}
                      onChange={e => setNewCompany({...newCompany, name: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">Base Currency</Label>
                    <Select 
                      value={newCompany.base_currency} 
                      onValueChange={val => setNewCompany({...newCompany, base_currency: val})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {currencies.map(c => (
                          <SelectItem key={c.code} value={c.code}>{c.code} - {c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full gap-2 mt-4">
                    <Plus className="w-4 h-4" /> Create Company
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* List */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">Active Workspaces ({companies.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {companies.map(company => (
                <Card key={company.id} className="hover:border-primary/40 transition-all group border-primary/5">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="bg-primary/10 p-2 rounded-lg group-hover:bg-primary/20 transition-colors">
                        <Building2 className="w-5 h-5 text-primary" />
                      </div>
                      <ShieldCheck className="w-4 h-4 text-accent opacity-0 group-hover:opacity-100" />
                    </div>
                    <CardTitle className="mt-4 text-xl">{company.name}</CardTitle>
                    <CardDescription className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-tighter">
                      ID: {company.id}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Globe className="w-3 h-3" />
                      Standard: <span className="font-bold text-foreground">{company.base_currency}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      Created: <span className="text-foreground">{new Date(company.created_at).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-2">
                    <Button variant="ghost" size="sm" className="w-full group/btn hover:bg-primary/5 text-primary">
                      Manage Workspace <ArrowRight className="w-3 h-3 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}