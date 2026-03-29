"use client"

import { useStore, Expense, User, ExpenseApproval, ExpenseStatus } from '@/app/lib/store';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  CheckCircle, 
  Eye, 
  FileSearch,
  Check,
  X,
  ShieldCheck,
  Zap,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ApprovalsPage() {
  const { currentUser, expenses, users, expenseApprovals, updateApprovalStatus, receipts, company, approvalRules } = useStore();
  const { toast } = useToast();
  
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [comment, setComment] = useState('');
  const [isActionOpen, setIsActionOpen] = useState(false);
  const [actionType, setActionType] = useState<ExpenseStatus>('APPROVED');

  // Logic: Identify approvals currently waiting for this user
  const myPendingApprovals = expenseApprovals.filter(ea => {
    if (ea.status !== 'PENDING') return false;
    if (ea.approver_id !== currentUser?.id) return false;

    // Check Sequence: It's my turn if all previous steps (lower step_order) are APPROVED
    const siblings = expenseApprovals
      .filter(a => a.expense_id === ea.expense_id)
      .sort((a, b) => a.step_order - b.step_order);
    
    const myIndex = siblings.findIndex(a => a.id === ea.id);
    const previousStepsDone = siblings.slice(0, myIndex).every(s => s.status === 'APPROVED');

    // Admin Override: Admins can see everything in the chain
    const isAdmin = currentUser?.role === 'ADMIN';

    return previousStepsDone || isAdmin;
  });

  const pendingExpenses = expenses.filter(e => 
    myPendingApprovals.some(ea => ea.expense_id === e.id)
  );

  // Admin visibility for rejected claims
  const rejectedExpenses = currentUser?.role === 'ADMIN' ? expenses.filter(e => e.status === 'REJECTED') : [];

  const handleAction = () => {
    if (!selectedExpense || !currentUser) return;
    
    if (actionType === 'REJECTED' && !comment.trim()) {
      toast({
        variant: "destructive",
        title: "Comment Required",
        description: "Rejections require a detailed reason for the employee.",
      });
      return;
    }

    updateApprovalStatus(selectedExpense.id, currentUser.id, actionType, comment);

    toast({
      title: actionType === 'APPROVED' ? "Claim Verified" : "Claim Rejected",
      description: `The submission has been updated in the ledger.`,
    });

    setIsActionOpen(false);
    setSelectedExpense(null);
    setComment('');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING': return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Pending</Badge>;
      case 'APPROVED': return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Approved</Badge>;
      case 'REJECTED': return <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200">Rejected</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-foreground font-headline">Review Queue</h1>
            <p className="text-muted-foreground mt-1 text-sm">Validating claims for <span className="font-bold text-primary">{company.name}</span>.</p>
          </div>
          <div className="bg-primary/5 px-4 py-2 rounded-lg border border-primary/10 flex items-center gap-4">
            <div className="text-right">
              <div className="text-[10px] uppercase font-black text-muted-foreground">Active Policy</div>
              <div className="text-xs font-bold text-primary">{approvalRules[0]?.name}</div>
            </div>
            <Zap className="w-5 h-5 text-accent" />
          </div>
        </header>

        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="bg-muted/50 p-1 border border-primary/10">
            <TabsTrigger value="pending" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              Action Required ({pendingExpenses.length})
            </TabsTrigger>
            {currentUser?.role === 'ADMIN' && (
              <TabsTrigger value="rejected" className="data-[state=active]:bg-destructive data-[state=active]:text-white">
                Rejected Claims ({rejectedExpenses.length})
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="pending">
            <Card className="border-primary/5 shadow-sm">
              <CardHeader className="bg-muted/5 border-b">
                <CardTitle className="text-xl">Inbound Submissions</CardTitle>
                <CardDescription>
                  {pendingExpenses.length} items awaiting your verification.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {pendingExpenses.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/5">
                        <TableHead className="pl-6">Employee</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Submission</TableHead>
                        <TableHead>Amount ({company.base_currency})</TableHead>
                        <TableHead className="text-right pr-6">Validation</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingExpenses.map((exp) => {
                        const employee = users.find(u => u.id === exp.user_id);
                        return (
                          <TableRow key={exp.id} className="hover:bg-muted/5 transition-colors">
                            <TableCell className="pl-6">
                              <div className="flex items-center gap-3 py-1">
                                <Avatar className="h-9 w-9 border-2 border-primary/10">
                                  <AvatarImage src={`https://picsum.photos/seed/${exp.user_id}/36/36`} />
                                  <AvatarFallback>{employee?.name?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                  <span className="font-bold text-sm">{employee?.name}</span>
                                  <span className="text-[10px] text-muted-foreground font-bold uppercase">{new Date(exp.expense_date).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="text-[10px] font-black uppercase tracking-tight">{exp.category}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-bold text-xs line-clamp-1">{exp.description}</span>
                                <span className="text-[10px] text-muted-foreground italic">{exp.currency} {exp.amount}</span>
                              </div>
                            </TableCell>
                            <TableCell className="font-black text-primary">
                              {exp.converted_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell className="text-right pr-6">
                              <div className="flex justify-end gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-600 hover:text-white h-8"
                                  onClick={() => {
                                    setSelectedExpense(exp);
                                    setActionType('APPROVED');
                                    setIsActionOpen(true);
                                  }}
                                >
                                  <Check className="w-3.5 h-3.5 mr-1" /> Approve
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-600 hover:text-white h-8"
                                  onClick={() => {
                                    setSelectedExpense(exp);
                                    setActionType('REJECTED');
                                    setIsActionOpen(true);
                                  }}
                                >
                                  <X className="w-3.5 h-3.5 mr-1" /> Reject
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedExpense(exp)}>
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-24 bg-muted/10">
                    <ShieldCheck className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                    <h3 className="text-xl font-bold font-headline">Clean Slate!</h3>
                    <p className="text-sm text-muted-foreground">All pending claims for your organizational steps are clear.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rejected">
            <Card className="border-destructive/10 shadow-sm">
              <CardHeader className="bg-destructive/5 border-b">
                <CardTitle className="text-xl text-destructive flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" /> Audit Trail: Denied Claims
                </CardTitle>
                <CardDescription>Global view of all rejected expenses for organizational oversight.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {rejectedExpenses.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/5">
                        <TableHead className="pl-6">Employee</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Denied On</TableHead>
                        <TableHead className="text-right pr-6">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rejectedExpenses.map((exp) => {
                        const employee = users.find(u => u.id === exp.user_id);
                        return (
                          <TableRow key={exp.id} className="hover:bg-rose-50/50">
                            <TableCell className="pl-6">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={`https://picsum.photos/seed/${exp.user_id}/32/32`} />
                                  <AvatarFallback>{employee?.name?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <span className="font-bold text-sm">{employee?.name}</span>
                              </div>
                            </TableCell>
                            <TableCell><Badge variant="outline" className="text-rose-600 border-rose-200">{exp.category}</Badge></TableCell>
                            <TableCell className="font-black">{company.base_currency} {exp.converted_amount.toFixed(2)}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{new Date(exp.expense_date).toLocaleDateString()}</TableCell>
                            <TableCell className="text-right pr-6">
                              <Button variant="ghost" size="sm" onClick={() => setSelectedExpense(exp)}>View Details</Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-20 text-muted-foreground">No rejected claims found.</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {selectedExpense && (
          <div className="mt-8 animate-in">
             <Card className="border-primary/20 bg-primary/[0.01]">
              <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
                <div>
                  <div className="text-[10px] uppercase font-black text-primary mb-1">Detailed Verification</div>
                  <CardTitle className="text-2xl">Claim Analysis: {selectedExpense.id.toUpperCase()}</CardTitle>
                </div>
                <Button variant="ghost" size="sm" className="font-bold h-8" onClick={() => setSelectedExpense(null)}>Hide Details</Button>
              </CardHeader>
              <CardContent className="pt-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                  <div className="lg:col-span-2 space-y-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      <DetailItem label="Submission Date" value={new Date(selectedExpense.created_at).toLocaleDateString()} />
                      <DetailItem label="Status" value={getStatusBadge(selectedExpense.status)} />
                      <DetailItem label="Original Value" value={`${selectedExpense.currency} ${selectedExpense.amount}`} />
                      <DetailItem label="Converted Value" value={`${company.base_currency} ${selectedExpense.converted_amount.toFixed(2)}`} />
                    </div>

                    <div className="p-6 bg-white rounded-xl border shadow-sm">
                      <Label className="text-[10px] uppercase font-black text-muted-foreground mb-4 block">Approval Timeline & Rule Strategy</Label>
                      <div className="space-y-6">
                        {expenseApprovals.filter(ea => ea.expense_id === selectedExpense.id).sort((a,b) => a.step_order - b.step_order).map((h, i) => {
                          const approver = users.find(u => u.id === h.approver_id);
                          const isActive = h.status === 'PENDING' && !expenseApprovals.some(prev => prev.expense_id === h.expense_id && prev.step_order < h.step_order && prev.status === 'PENDING');
                          
                          return (
                            <div key={i} className={`flex items-start gap-4 p-3 rounded-lg border transition-all ${h.status === 'APPROVED' ? 'bg-emerald-50/30 border-emerald-100' : h.status === 'REJECTED' ? 'bg-rose-50/30 border-rose-100' : isActive ? 'bg-amber-50/50 border-amber-200' : 'bg-muted/10 border-transparent opacity-60'}`}>
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm shrink-0 shadow-sm ${h.status === 'APPROVED' ? 'bg-emerald-500 text-white' : h.status === 'REJECTED' ? 'bg-rose-500 text-white' : 'bg-amber-500 text-white'}`}>
                                {h.step_order}
                              </div>
                              <div className="flex-1">
                                <div className="flex justify-between items-center mb-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-black text-sm">{approver?.name}</span>
                                    {h.is_manager_step && <Badge variant="secondary" className="text-[8px] h-4">Direct Manager</Badge>}
                                  </div>
                                  {h.acted_at && <span className="text-[10px] text-muted-foreground font-medium">{new Date(h.acted_at).toLocaleString()}</span>}
                                </div>
                                <div className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                                  {h.status} {isActive && <span className="flex items-center text-primary ml-2 animate-pulse"><ArrowRight className="w-3 h-3 mr-1" /> Currently Active</span>}
                                </div>
                                {h.comments && (
                                  <div className="mt-2 p-3 bg-white/80 rounded-lg italic text-xs border border-muted-foreground/10 text-muted-foreground">
                                    "{h.comments}"
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-1 space-y-6">
                    <div className="p-1 border rounded-2xl bg-white shadow-xl rotate-1">
                      <Label className="text-[10px] uppercase font-black text-center block py-2 border-b">Digital Artifact</Label>
                      {receipts.find(r => r.expense_id === selectedExpense.id) ? (
                        <img 
                          src={receipts.find(r => r.expense_id === selectedExpense.id)?.file_url} 
                          alt="Receipt" 
                          className="w-full h-auto object-contain max-h-[600px] rounded-b-xl" 
                        />
                      ) : (
                        <div className="aspect-[3/4] bg-muted flex flex-col items-center justify-center rounded-b-xl text-muted-foreground">
                          <FileSearch className="w-12 h-12 mb-2 opacity-10" />
                          <span className="text-xs font-bold uppercase">No Receipt Found</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      <Dialog open={isActionOpen} onOpenChange={setIsActionOpen}>
        <DialogContent className="sm:max-w-md border-primary/20">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-headline text-3xl">
              {actionType === 'APPROVED' ? <CheckCircle className="text-emerald-500 w-8 h-8" /> : <X className="text-rose-500 w-8 h-8" />}
              {actionType === 'APPROVED' ? 'Verify' : 'Deny'} Claim
            </DialogTitle>
            <DialogDescription className="font-medium">
              Actioning <strong>{selectedExpense?.currency} {selectedExpense?.amount}</strong> for {users.find(u => u.id === selectedExpense?.user_id)?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-6">
            <div className="space-y-3">
              <Label className="flex justify-between items-center">
                <span className="font-black text-xs uppercase tracking-widest text-muted-foreground">Decision Narrative</span>
                {actionType === 'REJECTED' && <Badge variant="destructive" className="text-[8px] uppercase h-4">Mandatory</Badge>}
              </Label>
              <Textarea 
                placeholder={actionType === 'APPROVED' ? "Optional notes for the record..." : "Explain precisely why this claim was denied..."} 
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="min-h-[120px] bg-muted/5 border-primary/10"
              />
            </div>
          </div>
          <DialogFooter className="bg-muted/5 -mx-6 -mb-6 p-6 rounded-b-lg gap-2">
            <Button variant="ghost" className="font-bold" onClick={() => setIsActionOpen(false)}>Cancel</Button>
            <Button 
              variant={actionType === 'APPROVED' ? 'default' : 'destructive'} 
              onClick={handleAction}
              disabled={actionType === 'REJECTED' && !comment.trim()}
              className="px-8 h-10 font-black uppercase tracking-widest"
            >
              Confirm {actionType === 'APPROVED' ? 'Approval' : 'Denial'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DetailItem({ label, value }: { label: string, value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[9px] uppercase text-muted-foreground font-black tracking-widest">{label}</span>
      <div className="text-sm font-bold text-foreground">{value}</div>
    </div>
  );
}
