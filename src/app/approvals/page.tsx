"use client"

import { useStore } from '@/app/lib/store';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  CheckCircle, 
  XCircle, 
  Eye, 
  MessageSquare, 
  FileSearch,
  Check,
  X,
  User,
  Calendar,
  Tag
} from 'lucide-react';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

export default function ApprovalsPage() {
  const { currentUser, expenses, workflow, updateExpenseStatus } = useStore();
  const { toast } = useToast();
  
  const [selectedExpense, setSelectedExpense] = useState<any>(null);
  const [comment, setComment] = useState('');
  const [isActionOpen, setIsActionOpen] = useState(false);
  const [actionType, setActionType] = useState<'APPROVE' | 'REJECT'>('APPROVE');

  // Filter expenses that the current user can approve based on the current step in the workflow
  const pendingApprovals = expenses.filter(exp => {
    if (exp.status !== 'PENDING') return false;
    const currentStep = workflow[exp.currentStepIndex];
    if (!currentStep) return false;
    return currentUser?.role === currentStep.approverRole || currentUser?.role === 'ADMIN';
  });

  const handleAction = () => {
    if (!selectedExpense || !currentUser) return;
    
    updateExpenseStatus(
      selectedExpense.id, 
      currentUser.id, 
      actionType === 'APPROVE' ? 'APPROVED' : 'REJECTED', 
      comment
    );

    toast({
      title: actionType === 'APPROVE' ? "Expense Approved" : "Expense Rejected",
      description: `The claim for $${selectedExpense.amount} has been updated.`,
    });

    setIsActionOpen(false);
    setSelectedExpense(null);
    setComment('');
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Approval Queue</h1>
          <p className="text-muted-foreground mt-1">Review and action pending expense requests.</p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Pending Claims</CardTitle>
            <CardDescription>
              {pendingApprovals.length} items requiring your review.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pendingApprovals.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Workflow Progress</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingApprovals.map((exp) => (
                    <TableRow key={exp.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>{exp.employeeName.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-medium">{exp.employeeName}</span>
                            <span className="text-xs text-muted-foreground">{new Date(exp.date).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold">{exp.description}</span>
                          <span className="text-xs text-muted-foreground">{exp.category}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-bold text-lg text-primary">
                        ${exp.amount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 w-32">
                          <div className="text-[10px] text-muted-foreground uppercase">Step {exp.currentStepIndex + 1} of {workflow.length}</div>
                          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary transition-all duration-500" 
                              style={{ width: `${((exp.currentStepIndex + 1) / workflow.length) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-medium">{workflow[exp.currentStepIndex]?.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-600 hover:text-white"
                            onClick={() => {
                              setSelectedExpense(exp);
                              setActionType('APPROVE');
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
                              setActionType('REJECT');
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
                  ))}
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
      </main>

      {/* Action Dialog */}
      <Dialog open={isActionOpen} onOpenChange={setIsActionOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{actionType === 'APPROVE' ? 'Approve' : 'Reject'} Expense Claim</DialogTitle>
            <DialogDescription>
              Reviewing claim from <strong>{selectedExpense?.employeeName}</strong> for <strong>${selectedExpense?.amount}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Comments</Label>
              <Textarea 
                placeholder="Provide details or reasoning for your decision..." 
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsActionOpen(false)}>Cancel</Button>
            <Button 
              variant={actionType === 'APPROVE' ? 'default' : 'destructive'} 
              onClick={handleAction}
            >
              {actionType === 'APPROVE' ? 'Confirm Approval' : 'Confirm Rejection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Minimal Avatar helper
function Avatar({ children, className }: { children: React.ReactNode, className?: string }) {
  return <div className={`flex items-center justify-center rounded-full bg-primary/10 text-primary font-bold ${className}`}>{children}</div>
}
function AvatarFallback({ children }: { children: React.ReactNode }) {
  return <span>{children}</span>
}