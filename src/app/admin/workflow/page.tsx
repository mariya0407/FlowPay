"use client"

import { useStore, ApprovalRule, RuleApprover, UserRole } from '@/app/lib/store';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { 
  Plus, 
  Trash2, 
  GripVertical,
  ShieldCheck,
  Workflow,
  Sparkles,
  Zap
} from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export default function WorkflowConfig() {
  const { approvalRules, ruleApprovers, updateWorkflow, users } = useStore();
  const { toast } = useToast();
  
  const currentRule = approvalRules[0]; 
  const initialSteps = ruleApprovers.filter(ra => ra.rule_id === currentRule.id).sort((a,b) => a.step_order - b.step_order);

  const [ruleName, setRuleName] = useState(currentRule.name);
  const [isManagerApprover, setIsManagerApprover] = useState(currentRule.is_manager_approver);
  const [minPercentage, setMinPercentage] = useState(currentRule.min_approval_percentage);
  const [specialApproverId, setSpecialApproverId] = useState(currentRule.special_approver_id || '');
  const [steps, setSteps] = useState(initialSteps.map(s => ({ approver_id: s.approver_id, step_order: s.step_order })));

  const addStep = () => {
    setSteps([...steps, { approver_id: '', step_order: steps.length + 1 }]);
  };

  const removeStep = (index: number) => {
    const newSteps = steps.filter((_, i) => i !== index);
    setSteps(newSteps.map((s, i) => ({ ...s, step_order: i + 1 })));
  };

  const updateStep = (index: number, approverId: string) => {
    setSteps(steps.map((s, i) => i === index ? { ...s, approver_id: approverId } : s));
  };

  const saveWorkflow = () => {
    if (steps.some(s => !s.approver_id)) {
      toast({ variant: "destructive", title: "Incomplete Steps", description: "Please assign an approver to all steps." });
      return;
    }

    const updatedRule: ApprovalRule = {
      ...currentRule,
      name: ruleName,
      is_manager_approver: isManagerApprover,
      min_approval_percentage: minPercentage,
      special_approver_id: specialApproverId || undefined
    };

    updateWorkflow(updatedRule, steps);
    toast({
      title: "Workflow Engine Updated",
      description: "Hybrid sequence and conditional rules have been synchronized.",
    });
  };

  return (
    <div className="min-h-screen bg-background font-body">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-foreground font-headline">Workflow Strategy</h1>
            <p className="text-muted-foreground mt-1 text-sm">Define sequential hierarchies and hybrid conditional logic.</p>
          </div>
          <Workflow className="w-12 h-12 text-primary/10" />
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card className="border-primary/10">
              <CardHeader className="bg-muted/30 border-b">
                <CardTitle className="text-lg">Sequence (Steps)</CardTitle>
                <CardDescription>Defined path for standard approval routing.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg bg-primary/5 flex items-center gap-4 opacity-70 cursor-not-allowed">
                     <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs italic">
                      M
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-bold uppercase text-muted-foreground">Auto-Injected Step</div>
                      <div className="text-sm font-medium">Direct Manager (If Rule Enabled)</div>
                    </div>
                  </div>

                  {steps.map((step, index) => (
                    <div key={index} className="flex items-center gap-4 p-4 border rounded-lg bg-white shadow-sm group animate-in">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                        {isManagerApprover ? index + 2 : index + 1}
                      </div>
                      <GripVertical className="text-muted-foreground w-4 h-4" />
                      <div className="flex-1">
                        <Select value={step.approver_id} onValueChange={(val) => updateStep(index, val)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select approver..." />
                          </SelectTrigger>
                          <SelectContent>
                            {users.filter(u => u.role !== 'EMPLOYEE').map(u => (
                              <SelectItem key={u.id} value={u.id}>{u.name} ({u.role})</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => removeStep(index)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}

                  <Button variant="outline" className="w-full border-dashed h-12 hover:bg-primary/5" onClick={addStep}>
                    <Plus className="w-4 h-4 mr-2" /> Add Sequence Step
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/10">
              <CardHeader className="bg-muted/30 border-b">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-accent" /> Conditional Overrides
                </CardTitle>
                <CardDescription>Rules that trigger final approval regardless of sequence.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label className="font-bold">Specific Approver Override (e.g. CFO)</Label>
                    <Zap className="w-3 h-3 text-accent" />
                  </div>
                  <Select value={specialApproverId} onValueChange={setSpecialApproverId}>
                    <SelectTrigger>
                      <SelectValue placeholder="No override assigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None (Disabled)</SelectItem>
                      {users.filter(u => u.role !== 'EMPLOYEE').map(u => (
                        <SelectItem key={u.id} value={u.id}>{u.name} (Global Override)</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-muted-foreground italic">If this specific user approves, the claim is auto-approved immediately.</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <Card className="border-primary/10 sticky top-24">
              <CardHeader className="bg-muted/10 border-b">
                <CardTitle className="text-md">Rule Settings</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="flex items-center space-x-2">
                  <Checkbox id="mgr-req" checked={isManagerApprover} onCheckedChange={(v) => setIsManagerApprover(!!v)} />
                  <Label htmlFor="mgr-req" className="text-sm cursor-pointer font-bold">Mandatory Manager Step</Label>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label className="text-sm">Threshold Approval</Label>
                    <span className="text-sm font-black text-primary">{minPercentage}%</span>
                  </div>
                  <Slider value={[minPercentage]} max={100} step={10} onValueChange={([v]) => setMinPercentage(v)} />
                  <p className="text-[9px] text-muted-foreground uppercase font-bold">Minimum % of steps required to approve</p>
                </div>

                <div className="pt-4 border-t">
                  <Button onClick={saveWorkflow} className="w-full gap-2 h-11">
                    <ShieldCheck className="w-4 h-4" /> Save Strategy
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
