"use client"

import { useState } from 'react';
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
import { detectExpenseFraud } from '@/ai/flows/expense-fraud-detection';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, FileText, Sparkles, ShieldCheck, AlertTriangle } from 'lucide-react';

export default function NewExpense() {
  const router = useRouter();
  const { toast } = useToast();
  const { currentUser, addExpense } = useStore();
  
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  
  const [formData, setFormData] = useState({
    amount: '',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    receiptDataUri: '',
  });

  const [fraudResult, setFraudResult] = useState<{
    isFraudulent: boolean;
    reason: string;
    patterns: string[];
  } | null>(null);

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
          category: details.category,
          description: details.vendor,
          date: details.date || prev.date
        }));
        toast({
          title: "Receipt Analyzed",
          description: `Extracted ${details.vendor} - $${details.amount}`,
        });
      } catch (err) {
        toast({
          variant: "destructive",
          title: "Extraction Failed",
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
    if (!currentUser) return;
    
    setLoading(true);
    
    try {
      // Run AI Fraud Detection before final submission
      if (formData.receiptDataUri) {
        const fraud = await detectExpenseFraud({
          expenseDetails: {
            amount: parseFloat(formData.amount),
            category: formData.category,
            description: formData.description,
            date: formData.date,
            merchant: formData.description, // Assuming merchant is the description for this mock
          },
          receiptDataUri: formData.receiptDataUri
        });

        if (fraud.isFraudulent) {
          setFraudResult({
            isFraudulent: true,
            reason: fraud.fraudReason,
            patterns: fraud.unusualPatterns
          });
          setLoading(false);
          return;
        }
      }

      addExpense({
        employeeId: currentUser.id,
        employeeName: currentUser.name,
        amount: parseFloat(formData.amount),
        category: formData.category,
        description: formData.description,
        date: formData.date,
        status: 'PENDING',
        receiptDataUri: formData.receiptDataUri
      });

      toast({
        title: "Expense Submitted",
        description: "Your claim has been sent for approval.",
      });
      router.push('/dashboard');
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Submission Error",
        description: "An error occurred while saving your expense.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="shadow-lg border-primary/10">
          <CardHeader className="border-b bg-muted/30">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Submit Expense</CardTitle>
                <CardDescription>Upload a receipt or fill in the details manually.</CardDescription>
              </div>
              <Sparkles className="w-8 h-8 text-primary opacity-20" />
            </div>
          </CardHeader>
          <CardContent className="pt-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="receipt">Receipt Photo</Label>
                    <div className="relative group">
                      <Input 
                        id="receipt" 
                        type="file" 
                        accept="image/*" 
                        onChange={handleFileUpload}
                        className="cursor-pointer"
                      />
                      <div className="absolute inset-0 pointer-events-none border-2 border-dashed border-muted rounded-md flex flex-col items-center justify-center bg-white/50 group-hover:bg-white transition-colors">
                        {extracting ? (
                          <div className="flex flex-col items-center">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            <span className="text-xs mt-1 text-primary">Analyzing...</span>
                          </div>
                        ) : (
                          <>
                            <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                            <span className="text-xs text-muted-foreground">Click or drag to upload</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount ($)</Label>
                    <Input 
                      id="amount" 
                      type="number" 
                      step="0.01" 
                      required 
                      value={formData.amount} 
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input 
                      id="date" 
                      type="date" 
                      required 
                      value={formData.date} 
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select 
                      value={formData.category} 
                      onValueChange={(val) => setFormData({ ...formData, category: val })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Food">Food & Dining</SelectItem>
                        <SelectItem value="Travel">Travel</SelectItem>
                        <SelectItem value="Office Supplies">Office Supplies</SelectItem>
                        <SelectItem value="Entertainment">Entertainment</SelectItem>
                        <SelectItem value="Utilities">Utilities</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Vendor / Description</Label>
                    <Textarea 
                      id="description" 
                      required 
                      rows={4}
                      value={formData.description} 
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="e.g. Lunch with client at Starbucks"
                    />
                  </div>
                </div>
              </div>

              {fraudResult?.isFraudulent && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex gap-3 items-start animate-in">
                  <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-destructive text-sm">Potential Fraud Flagged</h4>
                    <p className="text-sm text-destructive/80 mt-1">{fraudResult.reason}</p>
                    {fraudResult.patterns.length > 0 && (
                      <ul className="mt-2 text-xs text-destructive/70 list-disc pl-4">
                        {fraudResult.patterns.map((p, i) => <li key={i}>{p}</li>)}
                      </ul>
                    )}
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      className="mt-4 border-destructive text-destructive hover:bg-destructive hover:text-white"
                      onClick={() => setFraudResult(null)}
                    >
                      I want to correct it
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-4 pt-4 border-t">
                <Button type="submit" className="flex-1 gap-2" disabled={loading || extracting}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  {loading ? "Processing..." : "Submit Claim"}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
              </div>
            </form>
          </CardContent>
          <CardFooter className="bg-primary/5 text-xs text-muted-foreground flex items-center gap-2">
            <Sparkles className="w-3 h-3 text-primary" />
            Smart OCR and Fraud Analysis enabled
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}