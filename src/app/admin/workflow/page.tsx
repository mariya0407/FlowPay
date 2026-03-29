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
  Info,
  User as UserIcon
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function WorkflowConfig() {
  const { approvalRules, ruleApprovers, updateWorkflow, users } = useStore();
  const { toast } = useToast();
  
  const currentRule = approvalRules[0]; // For MVP we manage the first rule
  const initialSteps = ruleApprovers.filter(ra => ra.rule_id === currentRule.id).sort((a,b) => a.step_order - b.step_order);

  const [ruleName, setRuleName] = useState(currentRule.name);
  const [isManagerApprover, setIsManagerApprover] = useState(currentRule.is_manager_approver);
  const [minPercentage, setMinPercentage] = useState(currentRule.min_approval_percentage);
  const [steps, setSteps] = useState(initialSteps.map(s => ({ approver_id: s.approver_id, step_order: s.step_order })));

  const addStep = () => {
    setSteps([...steps, { approver_id: '', step_order: steps.length + 1 }]);
  };

  const removeStep = (index: number) => {
    const newSteps = steps.filter((_, i) => i !== index);
    // Re-order
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
    };

    updateWorkflow(updatedRule, steps);
    toast({
      title: "Workflow Saved",
      description: "Approval sequence rules have been updated based on the system model.",
    });
  };

  return (
    <div className="min-h-screen bg-background font-body">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground font-headline">Workflow Engine</h1>
            <p className="text-muted-foreground mt-1">Configure multi-level approval sequences based on Rule Approvers.</p>
          </div>
          <Workflow className="w-12 h-12 text-primary/20" />
        </header>

        <Card className="border-primary/10 mb-8">
          <CardHeader className="bg-muted/30 border-b">
            <CardTitle className="text-lg">Rule Configuration</CardTitle>
            <CardDescription>Global settings for this approval rule.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <Label>Rule Name</Label>
              <Input value={ruleName} onChange={(e) => setRuleName(e.target.value)} />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Checkbox id="mgr" checked={isManagerApprover} onCheckedChange={(val) => setIsManagerApprover(!!val)} />
                <Label htmlFor="mgr" className="cursor-pointer">Direct Manager Approval Required</Label>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <Label>Min. Approval Threshold</Label>
                <span className="font-bold text-primary">{minPercentage}%</span>
              </div>
              <Slider value={[minPercentage]} max={100} onValueChange={([v]) => setMinPercentage(v)} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/10">
          <CardHeader className="bg-muted/30 border-b">
            <CardTitle className="text-lg">Sequence (Rule Approvers)</CardTitle>
            <CardDescription>Define the order of individual approvers.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {steps.map((step, index) => (
                <div key={index} className="flex items-center gap-4 p-4 border rounded-lg bg-white shadow-sm group">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                    {step.step_order}
                  </div>
                  <GripVertical className="text-muted-foreground w-4 h-4" />
                  
                  <div className="flex-1">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">Assign Approver</Label>
                    <Select value={step.approver_id} onValueChange={(val) => updateStep(index, val)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select user..." />
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

              <Button variant="outline" className="w-full border-dashed h-12" onClick={addStep}>
                <Plus className="w-4 h-4 mr-2" /> Add Step Approver
              </Button>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2 border-t pt-6">
            <Button variant="outline" onClick={() => window.location.reload()}>Reset</Button>
            <Button onClick={saveWorkflow} className="gap-2 h-10 px-6">
              <ShieldCheck className="w-4 h-4" /> Apply Changes
            </Button>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
