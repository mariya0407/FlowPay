"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/app/lib/store';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { extractReceiptDetails } from '@/ai/flows/receipt-ocr-extraction';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, Sparkles, ShieldCheck, Globe } from 'lucide-react';

interface Currency {
  code: string;
  name: string;
}

export default function NewExpense() {
  const router = useRouter();
  const { toast } = useToast();
  const { currentUser, addExpense, company, approvalRules } = useStore();
  
  useEffect(() => {
    if (currentUser && currentUser.role !== 'EMPLOYEE') {
      toast({
        variant: "destructive",
        title: "Access Restricted",
        description: "Only Employees are authorized to submit personal expense claims.",
      });
      router.push('/dashboard');
    }
  }, [currentUser, router, toast]);

  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [exchangeRate, setExchangeRate] = useState<number>(1);
  
  const [formData, setFormData] = useState({
    amount: '',
    currency: 'USD',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    receiptDataUri: '',
  });

  useEffect(() => {
    async function fetchCurrencies() {
      try {
        const res = await fetch('https://restcountries.com/v3.1/all?fields=currencies');
        const data = await res.json();
        const codes = new Set<string>();
        const list: Currency[] = [];
        
        data.forEach((country: any) => {
          if (country.currencies) {
            Object.keys(country.currencies).forEach(code => {
              if (!codes.has(code)) {
                codes.add(code);
                list.push({ code, name: country.currencies[code].name });
              }
            });
          }
        });
        setCurrencies(list.sort((a, b) => a.code.localeCompare(b.code)));
      } catch (err) {
        console.error("Failed to fetch currencies", err);
      }
    }
    fetchCurrencies();
  }, []);

  useEffect(() => {
    async function fetchRate() {
      if (!company?.base_currency) return;
      if (formData.currency === company.base_currency) {
        setExchangeRate(1);
        return;
      }
      try {
        const res = await fetch(`https://api.exchangerate-api.com/v4/latest/${formData.currency}`);
        const data = await res.json();
        setExchangeRate(data.rates[company.base_currency] || 1);
      } catch (err) {
        console.error("Failed to fetch exchange rate", err);
      }
    }
    fetchRate();
  }, [formData.currency, company?.base_currency]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setExtracting(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const dataUri = reader.result as string;
      setFormData(prev => ({ ...prev, receiptDataUri: dataUri }));
      
      try {
        const details = await extractReceiptDetails({ photoDataUri: dataUri });
        setFormData(prev => ({
          ...prev,
          amount: details.amount.toString(),
          category: details.category || prev.category,
          description: `${details.vendor}${details.description ? ': ' + details.description : ''}`,
          date: details.date || prev.date
        }));
        toast({
          title: "AI Analysis Complete",
          description: `Extracted ${details.vendor} - ${details.amount} ${formData.currency}`,
        });
      } catch (err) {
        toast({
          variant: "destructive",
          title: "OCR Failed",
          description: "Could not read receipt automatically. Please enter details manually.",
        });
      } finally {
        setExtracting(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !company) return;
    
    setLoading(true);
    const numericAmount = parseFloat(formData.amount);
    const converted = numericAmount * exchangeRate;
    
    try {
      addExpense({
        user_id: currentUser.id,
        company_id: company.id,
        rule_id: approvalRules[0].id,
        amount: numericAmount,
        currency: formData.currency,
        converted_amount: converted,
        category: formData.category,
        description: formData.description,
        expense_date: formData.date,
      }, formData.receiptDataUri);

      toast({
        title: "Claim Submitted",
        description: `Your expense of ${formData.currency} ${numericAmount} has been entered into the approval workflow.`,
      });
      router.push('/dashboard');
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Submission Error",
        description: "An unexpected error occurred during claim processing.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser || currentUser.role !== 'EMPLOYEE') return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="shadow-lg border-primary/10 overflow-hidden">
          <CardHeader className="border-b bg-muted/30 pb-8">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-3xl font-black tracking-tight font-headline">Submit Claim</CardTitle>
                <CardDescription>Scan your receipt for intelligent auto-fill.</CardDescription>
              </div>
              <Sparkles className="w-10 h-10 text-primary opacity-20" />
            </div>
          </CardHeader>
          <CardContent className="pt-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="receipt" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Digital Artifact (Receipt)</Label>
                    <div className="relative group">
                      <Input 
                        id="receipt" 
                        type="file" 
                        accept="image/*" 
                        onChange={handleFileUpload}
                        className="cursor-pointer opacity-0 absolute inset-0 z-10 h-full w-full"
                      />
                      <div className="border-2 border-dashed border-primary/20 rounded-xl p-8 flex flex-col items-center justify-center bg-primary/[0.02] group-hover:bg-primary/5 transition-all min-h-[200px]">
                        {extracting ? (
                          <div className="flex flex-col items-center">
                            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                            <span className="text-sm font-black text-primary animate-pulse">Running OCR Analysis...</span>
                          </div>
                        ) : (
                          <>
                            <Upload className="h-10 w-10 text-primary/40 mb-3 group-hover:scale-110 transition-transform" />
                            <span className="text-sm font-bold text-primary/60">Upload Receipt</span>
                            <span className="text-[10px] text-muted-foreground mt-1">Images only (JPG, PNG)</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="currency">Currency</Label>
                      <Select 
                        value={formData.currency} 
                        onValueChange={(val) => setFormData({ ...formData, currency: val })}
                      >
                        <SelectTrigger className="border-primary/10">
                          <SelectValue placeholder="USD" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          {currencies.map(c => (
                            <SelectItem key={c.code} value={c.code}>{c.code} - {c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="amount">Amount</Label>
                      <Input 
                        id="amount" 
                        type="number" 
                        step="0.01" 
                        required 
                        value={formData.amount} 
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        className="border-primary/10"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  {formData.currency !== company.base_currency && formData.amount && (
                    <div className="p-4 bg-emerald-50/50 rounded-lg border border-emerald-100 flex items-center justify-between animate-in">
                      <div className="flex items-center gap-2 text-xs text-emerald-700 font-black uppercase tracking-wider">
                        <Globe className="w-4 h-4" />
                        Conversion
                      </div>
                      <div className="text-sm font-black text-emerald-700">
                        {company.base_currency} {(parseFloat(formData.amount) * exchangeRate).toFixed(2)}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="date">Transaction Date</Label>
                    <Input 
                      id="date" 
                      type="date" 
                      required 
                      value={formData.date} 
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="border-primary/10"
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="category">Expense Type</Label>
                    <Select 
                      value={formData.category} 
                      onValueChange={(val) => setFormData({ ...formData, category: val })}
                      required
                    >
                      <SelectTrigger className="border-primary/10">
                        <SelectValue placeholder="Select type..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Food">Food & Dining</SelectItem>
                        <SelectItem value="Travel">Travel</SelectItem>
                        <SelectItem value="Office Supplies">Office Supplies</SelectItem>
                        <SelectItem value="Entertainment">Entertainment</SelectItem>
                        <SelectItem value="Utilities">Utilities</SelectItem>
                        <SelectItem value="Other">Miscellaneous</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Vendor / Details</Label>
                    <Textarea 
                      id="description" 
                      required 
                      rows={8}
                      value={formData.description} 
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="border-primary/10 bg-muted/5"
                      placeholder="e.g. Starbucks - Morning client coffee"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-8 border-t">
                <Button type="submit" className="flex-1 h-14 text-lg font-black tracking-widest uppercase gap-2" disabled={loading || extracting}>
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                  {loading ? "Filing Claim..." : "Submit for Approval"}
                </Button>
                <Button type="button" variant="outline" className="h-14 px-8 font-bold border-primary/20" onClick={() => router.back()}>Cancel</Button>
              </div>
            </form>
          </CardContent>
          <CardFooter className="bg-primary/5 py-4 px-6 flex items-center justify-between border-t border-primary/10">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase text-primary/60 tracking-widest">
              <Sparkles className="w-3.5 h-3.5" />
              Gemini Vision Enabled
            </div>
            <div className="text-[10px] italic text-muted-foreground font-medium">FlowPay Enterprise v2.0</div>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
