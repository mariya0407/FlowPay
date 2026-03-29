"use client"

import { useStore, Expense, User, ExpenseApproval } from '@/app/lib/store';
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
  History,
  MessageSquare
} from 'lucide-react';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function ApprovalsPage() {
  const { currentUser, expenses, users, expenseApprovals, updateApprovalStatus, receipts, companies, activeCompanyId } = useStore();
  const { toast } = useToast();
  
  const company = companies.find(c => c.id === activeCompanyId);
  
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [comment, setComment] = useState('');
  const [isActionOpen, setIsActionOpen] = useState(false);
  const [actionType, setActionType] = useState<'APPROVED' | 'REJECTED'>('APPROVED');

  // Find approvals assigned to the current user that are still pending
  const myPendingApprovals = expenseApprovals.filter(ea => {
    if (ea.status !== 'PENDING') return false;
    
    // Check if it's currently this user's turn (Sequential logic)
    const allApprovalsForThisExpense = expenseApprovals
      .filter(a => a.expense_id === ea.expense_id)
      .sort((a, b) => a.step_order - b.step_order);
    
    const currentStepIndex = allApprovalsForThisExpense.findIndex(a => a.status === 'PENDING');
    const isCurrentTurn = allApprovalsForThisExpense[currentStepIndex]?.approver_id === currentUser?.id;

    // Special case: Admin can approve anything at any time if they are in the chain
    const isAdmin = currentUser?.role === 'ADMIN';
    const isAssigned = ea.approver_id === currentUser?.id;

    return (isAssigned && isCurrentTurn) || (isAdmin && isAssigned);
  });

  const pendingExpenses = expenses.filter(e => 
    myPendingApprovals.some(ea => ea.expense_id === e.id)
  );

  const handleAction = () => {
    if (!selectedExpense || !currentUser) return;
    
    if (actionType === 'REJECTED' && !comment.trim()) {
      toast({
        variant: "destructive",
        title: "Comment Required",
        description: "Please provide a reason for rejection.",
      });
      return;
    }

    updateApprovalStatus(selectedExpense.id, currentUser.id, actionType, comment);

    toast({
      title: actionType === 'APPROVED' ? "Claim Approved" : "Claim Rejected",
      description: `The request has been processed.`,
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
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground font-headline">Approval Queue</h1>
          <p className="text-muted-foreground mt-1">Review and manage expense claims for your team.</p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Pending Reviews</CardTitle>
            <CardDescription>
              {pendingExpenses.length} items awaiting your decision.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pendingExpenses.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Original Amount</TableHead>
                    <TableHead>Converted ({company?.base_currency || 'USD'})</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingExpenses.map((exp) => {
                    const employee = users.find(u => u.id === exp.user_id);
                    return (
                      <TableRow key={exp.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={`https://picsum.photos/seed/${exp.user_id}/30/30`} />
                              <AvatarFallback>{employee?.name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="font-medium">{employee?.name}</span>
                              <span className="text-xs text-muted-foreground">{new Date(exp.expense_date).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-semibold line-clamp-1">{exp.description}</span>
                            <span className="text-xs text-muted-foreground">{exp.category}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {exp.currency} {exp.amount.toLocaleString()}
                        </TableCell>
                        <TableCell className="font-bold text-primary">
                          {company?.base_currency || 'USD'} {exp.converted_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-600 hover:text-white"
                              onClick={() => {
                                setSelectedExpense(exp);
                                setActionType('APPROVED');
                                setIsActionOpen(true);
                              }}
                            >
                              <Check className="w-4 h-4 mr-1" /> Approve
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-600 hover:text-white"
                              onClick={() => {
                                setSelectedExpense(exp);
                                setActionType('REJECTED');
                                setIsActionOpen(true);
                              }}
                            >
                              <X className="w-4 h-4 mr-1" /> Reject
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => setSelectedExpense(exp)}>
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
              <div className="text-center py-20 bg-muted/20 rounded-lg border-2 border-dashed border-muted">
                <FileSearch className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">All caught up!</h3>
                <p className="text-muted-foreground">No pending approvals at this time.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {selectedExpense && !isActionOpen && (
          <Card className="mt-8 border-primary/20 bg-primary/[0.02]">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Claim Details: {selectedExpense.id}</CardTitle>
                <CardDescription>Full history and receipt analysis.</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedExpense(null)}>Close</Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <DetailItem label="Submission Date" value={new Date(selectedExpense.created_at).toLocaleDateString()} />
                    <DetailItem label="Status" value={getStatusBadge(selectedExpense.status)} />
                    <DetailItem label="Description" value={selectedExpense.description} />
                    <DetailItem label="Category" value={selectedExpense.category} />
                    <DetailItem label="Original Amount" value={`${selectedExpense.currency} ${selectedExpense.amount}`} />
                  </div>
                  
                  <div className="p-4 bg-white rounded-lg border shadow-sm">
                    <div className="text-sm text-muted-foreground mb-1">Total Converted Value</div>
                    <div className="text-3xl font-black text-primary">
                      {company?.base_currency || 'USD'} {selectedExpense.converted_amount.toFixed(2)}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-bold flex items-center gap-2">
                      <History className="w-4 h-4" /> Approval Flow & History
                    </h4>
                    <div className="space-y-3">
                      {expenseApprovals.filter(ea => ea.expense_id === selectedExpense.id).sort((a,b) => a.step_order - b.step_order).map((h, i) => {
                        const approver = users.find(u => u.id === h.approver_id);
                        return (
                          <div key={i} className="flex gap-3 text-sm animate-in">
                            <div className={`w-1 rounded-full ${h.status === 'APPROVED' ? 'bg-emerald-500' : h.status === 'REJECTED' ? 'bg-rose-500' : 'bg-amber-500'}`} />
                            <div className="flex-1">
                              <div className="flex justify-between items-center">
                                <span className="font-bold">{approver?.name} (Step {h.step_order})</span>
                                {h.acted_at && <span className="text-[10px] text-muted-foreground">{new Date(h.acted_at).toLocaleString()}</span>}
                              </div>
                              <div className="text-xs text-muted-foreground">{h.status}</div>
                              {h.comments && (
                                <div className="mt-1 p-2 bg-muted rounded italic text-xs">
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

                <div className="space-y-4">
                  <h4 className="text-sm font-bold">Receipt Attachment</h4>
                  {receipts.find(r => r.expense_id === selectedExpense.id) ? (
                    <div className="border rounded-xl overflow-hidden bg-white">
                      <img src={receipts.find(r => r.expense_id === selectedExpense.id)?.file_url} alt="Receipt" className="w-full h-auto object-contain max-h-[500px]" />
                    </div>
                  ) : (
                    <div className="aspect-video bg-muted flex items-center justify-center rounded-xl border-2 border-dashed">
                      <span className="text-muted-foreground text-sm">No receipt uploaded</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Decision Dialog */}
      <Dialog open={isActionOpen} onOpenChange={setIsActionOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-headline text-2xl">
              {actionType === 'APPROVED' ? <CheckCircle className="text-emerald-500" /> : <X className="text-rose-500" />}
              {actionType === 'APPROVED' ? 'Approve' : 'Reject'} Claim
            </DialogTitle>
            <DialogDescription>
              Reviewing for <strong>{selectedExpense?.currency} {selectedExpense?.amount}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="flex justify-between">
                <span>Decision Comments</span>
                {actionType === 'REJECTED' && <span className="text-[10px] text-rose-500 font-bold uppercase">Required for Rejection</span>}
              </Label>
              <Textarea 
                placeholder={actionType === 'APPROVED' ? "Optional approval notes..." : "Reason for rejection (required)..."} 
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsActionOpen(false)}>Cancel</Button>
            <Button 
              variant={actionType === 'APPROVED' ? 'default' : 'destructive'} 
              onClick={handleAction}
              disabled={actionType === 'REJECTED' && !comment.trim()}
            >
              {actionType === 'APPROVED' ? 'Confirm Approval' : 'Confirm Rejection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DetailItem({ label, value }: { label: string, value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] uppercase text-muted-foreground font-bold">{label}</span>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}
