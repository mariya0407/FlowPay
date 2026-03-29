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
  AlertCircle,
  MessageSquare,
  Clock
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
  // Hierarchy: DIRECTOR > FINANCE > MANAGER > EMPLOYEES
  const myPendingApprovals = expenseApprovals.filter(ea => {
    if (ea.status !== 'PENDING') return false;
    
    // Admins see everything (Monitor & Override)
    if (currentUser?.role === 'ADMIN') return true;
    
    // Regular approvers only see what is assigned to them
    if (ea.approver_id !== currentUser?.id) return false;

    // Sequential Check: It's my turn if all previous steps (lower step_order) are APPROVED
    const siblings = expenseApprovals
      .filter(a => a.expense_id === ea.expense_id)
      .sort((a, b) => a.step_order - b.step_order);
    
    const myIndex = siblings.findIndex(a => a.id === ea.id);
    const previousStepsDone = siblings.slice(0, myIndex).every(s => s.status === 'APPROVED');

    return previousStepsDone;
  });

  const pendingExpenses = expenses.filter(e => 
    myPendingApprovals.some(ea => ea.expense_id === e.id)
  );

  // Global visibility for rejected claims for Admins
  const rejectedExpenses = currentUser?.role === 'ADMIN' ? expenses.filter(e => e.status === 'REJECTED') : [];

  const handleAction = () => {
    if (!selectedExpense || !currentUser) return;
    
    // Logic constraint: Rejections MUST have a comment
    if (actionType === 'REJECTED' && !comment.trim()) {
      toast({
        variant: "destructive",
        title: "Comment Required",
        description: "Rejections require a detailed reason for the employee.",
      });
      return;
    }

    // Capture the specific step ID if it's an admin override or regular step
    const myStep = expenseApprovals.find(ea => ea.expense_id === selectedExpense.id && ea.approver_id === currentUser.id && ea.status === 'PENDING');
    
    // If admin is overriding, we find the currently active step to apply the action
    let targetApproverId = currentUser.id;
    if (currentUser.role === 'ADMIN' && !myStep) {
        const activeStep = expenseApprovals
            .filter(ea => ea.expense_id === selectedExpense.id && ea.status === 'PENDING')
            .sort((a,b) => a.step_order - b.step_order)[0];
        if (activeStep) targetApproverId = activeStep.approver_id;
    }

    updateApprovalStatus(selectedExpense.id, targetApproverId, actionType, comment);

    toast({
      title: actionType === 'APPROVED' ? "Claim Verified" : "Claim Rejected",
      description: `The submission has been updated in the ledger.`,
    });

    setIsActionOpen(false);
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
    <div className="min-h-screen bg-background font-body">
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
            <ShieldCheck className="w-5 h-5 text-accent" />
          </div>
        </header>

        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="bg-muted/50 p-1 border border-primary/10">
            <TabsTrigger value="pending" className="data-[state=active]:bg-primary data-[state=active]:text-white h-9 px-6 rounded-md font-bold uppercase text-[10px] tracking-widest">
              Action Required ({pendingExpenses.length})
            </TabsTrigger>
            {currentUser?.role === 'ADMIN' && (
              <TabsTrigger value="rejected" className="data-[state=active]:bg-destructive data-[state=active]:text-white h-9 px-6 rounded-md font-bold uppercase text-[10px] tracking-widest">
                Audit: Rejected ({rejectedExpenses.length})
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="pending">
            <Card className="border-primary/5 shadow-sm overflow-hidden">
              <CardHeader className="bg-muted/5 border-b p-4">
                <CardTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-500" /> Current Submissions
                </CardTitle>
                <CardDescription>
                  Reviewing {pendingExpenses.length} items awaiting organizational verification.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {pendingExpenses.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/10">
                        <TableHead className="pl-6 text-[10px] font-black uppercase tracking-widest">Employee</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest">Category</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest">Description</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest">Amount ({company.base_currency})</TableHead>
                        <TableHead className="text-right pr-6 text-[10px] font-black uppercase tracking-widest">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingExpenses.map((exp) => {
                        const employee = users.find(u => u.id === exp.user_id);
                        return (
                          <TableRow key={exp.id} className="hover:bg-muted/5 transition-colors group">
                            <TableCell className="pl-6">
                              <div className="flex items-center gap-3 py-1">
                                <Avatar className="h-9 w-9 border-2 border-primary/10 shadow-sm">
                                  <AvatarImage src={`https://picsum.photos/seed/${exp.user_id}/36/36`} />
                                  <AvatarFallback className="text-xs font-black">{employee?.name?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                  <span className="font-bold text-sm tracking-tight">{employee?.name}</span>
                                  <span className="text-[10px] text-muted-foreground font-black uppercase">{new Date(exp.expense_date).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="text-[9px] font-black uppercase tracking-tighter px-2 py-0.5">{exp.category}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-bold text-xs truncate max-w-[200px]">{exp.description}</span>
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
                                  className="bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-600 hover:text-white h-8 font-black uppercase text-[9px] tracking-widest"
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
                                  className="bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-600 hover:text-white h-8 font-black uppercase text-[9px] tracking-widest"
                                  onClick={() => {
                                    setSelectedExpense(exp);
                                    setActionType('REJECTED');
                                    setIsActionOpen(true);
                                  }}
                                >
                                  <X className="w-3.5 h-3.5 mr-1" /> Reject
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/5" onClick={() => setSelectedExpense(exp)}>
                                  <Eye className="w-4 h-4 text-primary" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-32 bg-muted/5 border-2 border-dashed m-6 rounded-2xl">
                    <ShieldCheck className="w-16 h-16 text-muted-foreground mx-auto mb-6 opacity-10" />
                    <h3 className="text-2xl font-black font-headline text-muted-foreground">Inbox Clear</h3>
                    <p className="text-sm text-muted-foreground mt-2">There are no pending claims requiring your signature at this moment.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rejected">
            <Card className="border-destructive/10 shadow-sm overflow-hidden">
              <CardHeader className="bg-destructive/5 border-b p-4">
                <CardTitle className="text-lg font-black uppercase tracking-tight text-destructive flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" /> Denied Submissions Registry
                </CardTitle>
                <CardDescription>Comprehensive audit log of all non-compliant claims in the organization.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {rejectedExpenses.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/5">
                        <TableHead className="pl-6 text-[10px] font-black uppercase tracking-widest">Employee</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest">Category</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest">Total Value</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest">Rejection Date</TableHead>
                        <TableHead className="text-right pr-6 text-[10px] font-black uppercase tracking-widest">View</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rejectedExpenses.map((exp) => {
                        const employee = users.find(u => u.id === exp.user_id);
                        return (
                          <TableRow key={exp.id} className="hover:bg-rose-50/50 transition-colors">
                            <TableCell className="pl-6">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={`https://picsum.photos/seed/${exp.user_id}/32/32`} />
                                  <AvatarFallback className="text-[10px] font-black">{employee?.name?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <span className="font-bold text-sm tracking-tight">{employee?.name}</span>
                              </div>
                            </TableCell>
                            <TableCell><Badge variant="outline" className="text-rose-600 border-rose-200 text-[10px] uppercase font-black">{exp.category}</Badge></TableCell>
                            <TableCell className="font-black text-destructive">{company.base_currency} {exp.converted_amount.toFixed(2)}</TableCell>
                            <TableCell className="text-[10px] font-bold text-muted-foreground uppercase">{new Date(exp.expense_date).toLocaleDateString()}</TableCell>
                            <TableCell className="text-right pr-6">
                              <Button variant="ghost" size="sm" className="font-black uppercase text-[10px] tracking-widest text-primary" onClick={() => setSelectedExpense(exp)}>Details</Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-24 text-muted-foreground/40 italic">No rejected claims recorded in the ledger.</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {selectedExpense && (
          <div className="mt-12 animate-in">
             <Card className="border-primary/20 bg-primary/[0.01] shadow-2xl rounded-2xl overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between border-b bg-white/50 backdrop-blur-sm p-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                    <span className="text-[10px] uppercase font-black text-primary tracking-widest">Audit Investigation</span>
                  </div>
                  <CardTitle className="text-3xl font-black font-headline">Claim Artifact: {selectedExpense.id.toUpperCase()}</CardTitle>
                </div>
                <Button variant="ghost" size="sm" className="font-black uppercase text-[10px] tracking-widest h-10 px-4 hover:bg-destructive/5 hover:text-destructive" onClick={() => setSelectedExpense(null)}>Close View</Button>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
                  <div className="lg:col-span-2 space-y-12">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                      <DetailItem label="Submission" value={new Date(selectedExpense.created_at).toLocaleDateString()} />
                      <DetailItem label="Current State" value={getStatusBadge(selectedExpense.status)} />
                      <DetailItem label="Inbound Currency" value={`${selectedExpense.currency} ${selectedExpense.amount}`} />
                      <DetailItem label="Settlement Value" value={`${company.base_currency} ${selectedExpense.converted_amount.toFixed(2)}`} />
                    </div>

                    <div className="space-y-6">
                      <div className="flex items-center gap-3">
                        <MessageSquare className="w-5 h-5 text-primary/40" />
                        <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-[0.2em]">Decision Workflow & Comments</Label>
                      </div>
                      <div className="space-y-4 relative">
                        <div className="absolute left-5 top-0 bottom-0 w-px bg-primary/10" />
                        {expenseApprovals.filter(ea => ea.expense_id === selectedExpense.id).sort((a,b) => a.step_order - b.step_order).map((h, i) => {
                          const approver = users.find(u => u.id === h.approver_id);
                          const isActive = h.status === 'PENDING' && !expenseApprovals.some(prev => prev.expense_id === h.expense_id && prev.step_order < h.step_order && prev.status === 'PENDING');
                          
                          return (
                            <div key={i} className={`relative flex items-start gap-6 p-4 rounded-xl border transition-all ${h.status === 'APPROVED' ? 'bg-emerald-50/20 border-emerald-100 shadow-sm' : h.status === 'REJECTED' ? 'bg-rose-50/20 border-rose-100 shadow-sm' : isActive ? 'bg-amber-50/30 border-amber-200 ring-2 ring-amber-100' : 'bg-muted/5 border-transparent opacity-40'}`}>
                              <div className={`z-10 w-10 h-10 rounded-full flex items-center justify-center font-black text-xs shrink-0 shadow-md ${h.status === 'APPROVED' ? 'bg-emerald-500 text-white' : h.status === 'REJECTED' ? 'bg-rose-500 text-white' : isActive ? 'bg-amber-500 text-white animate-pulse' : 'bg-muted text-muted-foreground border'}`}>
                                {h.step_order}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-2">
                                  <div className="flex flex-col">
                                    <div className="flex items-center gap-2">
                                      <span className="font-black text-sm text-foreground">{approver?.name}</span>
                                      <Badge variant="outline" className="text-[8px] font-black uppercase h-3.5 px-1 py-0">{approver?.role}</Badge>
                                      {h.is_manager_step && <Badge variant="secondary" className="text-[8px] h-3.5 px-1 font-black">MANAGER</Badge>}
                                    </div>
                                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tight mt-0.5">
                                      {h.status} {h.acted_at && `• ${new Date(h.acted_at).toLocaleTimeString()}`}
                                    </span>
                                  </div>
                                  {isActive && <div className="text-[8px] font-black bg-primary text-white px-2 py-0.5 rounded uppercase tracking-widest shadow-sm">Current Step</div>}
                                </div>
                                {h.comments && (
                                  <div className="mt-3 p-4 bg-white/80 rounded-lg border border-primary/5 shadow-inner">
                                    <div className="text-[8px] uppercase font-black text-muted-foreground mb-1 flex items-center gap-1">
                                        <MessageSquare className="w-2.5 h-2.5" /> Note from Approver
                                    </div>
                                    <p className="italic text-xs text-foreground/80 leading-relaxed font-medium">"{h.comments}"</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-1">
                    <div className="sticky top-32 space-y-4">
                        <Label className="text-[10px] uppercase font-black text-center block text-muted-foreground tracking-widest">Digital Artifact (Receipt)</Label>
                        <div className="p-2 border-2 border-primary/10 rounded-3xl bg-white shadow-2xl -rotate-1 hover:rotate-0 transition-transform duration-500 overflow-hidden">
                        {receipts.find(r => r.expense_id === selectedExpense.id) ? (
                            <img 
                            src={receipts.find(r => r.expense_id === selectedExpense.id)?.file_url} 
                            alt="Receipt Investigation" 
                            className="w-full h-auto object-contain max-h-[550px] rounded-2xl" 
                            />
                        ) : (
                            <div className="aspect-[3/4] bg-muted/20 flex flex-col items-center justify-center rounded-2xl text-muted-foreground/30">
                            <FileSearch className="w-16 h-16 mb-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest">No Artifact Found</span>
                            </div>
                        )}
                        </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* Decision Dialog */}
      <Dialog open={isActionOpen} onOpenChange={setIsActionOpen}>
        <DialogContent className="sm:max-w-md border-primary/10 shadow-2xl rounded-2xl overflow-hidden p-0">
          <div className={actionType === 'APPROVED' ? "h-2 bg-emerald-500" : "h-2 bg-rose-500"} />
          <div className="p-6 pt-8">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-3 font-black text-3xl font-headline tracking-tight">
                {actionType === 'APPROVED' ? <CheckCircle className="text-emerald-500 w-10 h-10" /> : <X className="text-rose-500 w-10 h-10" />}
                {actionType === 'APPROVED' ? 'Authorize' : 'Decline'} Claim
                </DialogTitle>
                <DialogDescription className="font-bold text-muted-foreground mt-2">
                Actioning <span className="text-foreground">{selectedExpense?.currency} {selectedExpense?.amount}</span> submission from {users.find(u => u.id === selectedExpense?.user_id)?.name}.
                </DialogDescription>
            </DialogHeader>
            <div className="space-y-5 py-8">
                <div className="space-y-3">
                <div className="flex justify-between items-center">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Decision Narrative</Label>
                    {actionType === 'REJECTED' && <Badge variant="destructive" className="text-[8px] uppercase font-black px-1.5 h-4">Mandatory</Badge>}
                </div>
                <Textarea 
                    placeholder={actionType === 'APPROVED' ? "Optional: Add context for this approval..." : "Required: Explain specifically why this claim does not meet organizational policy..."} 
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="min-h-[140px] bg-muted/10 border-primary/5 focus:ring-primary/20 rounded-xl resize-none font-medium"
                />
                <p className="text-[9px] text-muted-foreground italic">This note will be visible in the claim audit trail and the employee's dashboard.</p>
                </div>
            </div>
            <DialogFooter className="flex flex-col sm:flex-row gap-3">
                <Button variant="ghost" className="font-black uppercase text-[10px] tracking-widest flex-1 h-12" onClick={() => setIsActionOpen(false)}>Cancel</Button>
                <Button 
                variant={actionType === 'APPROVED' ? 'default' : 'destructive'} 
                onClick={handleAction}
                disabled={actionType === 'REJECTED' && !comment.trim()}
                className="flex-1 h-12 font-black uppercase tracking-[0.2em] text-xs shadow-lg"
                >
                Confirm {actionType === 'APPROVED' ? 'Approval' : 'Rejection'}
                </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DetailItem({ label, value }: { label: string, value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[9px] uppercase text-muted-foreground font-black tracking-[0.2em] leading-none">{label}</span>
      <div className="text-sm font-black text-foreground tracking-tight">{value}</div>
    </div>
  );
}
