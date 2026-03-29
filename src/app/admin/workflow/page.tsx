"use client"

import { useStore, ApprovalStep, UserRole } from '@/app/lib/store';
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
  Info
} from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function WorkflowConfig() {
  const { workflow, setWorkflow } = useStore();
  const { toast } = useToast();
  const [steps, setSteps] = useState<ApprovalStep[]>(workflow);

  const addStep = () => {
    const newStep: ApprovalStep = {
      id: Math.random().toString(36).substr(2, 9),
      name: `New Step`,
      approverRole: 'MANAGER',
      isRequired: true,
      minApprovalPercentage: 100
    };
    setSteps([...steps, newStep]);
  };

  const removeStep = (id: string) => {
    setSteps(steps.filter(s => s.id !== id));
  };

  const updateStep = (id: string, updates: Partial<ApprovalStep>) => {
    setSteps(steps.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const saveWorkflow = () => {
    setWorkflow(steps);
    toast({
      title: "Workflow Saved",
      description: "Approval sequence rules have been updated.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Workflow Engine</h1>
            <p className="text-muted-foreground mt-1">Configure multi-level approval sequences and conditional rules.</p>
          </div>
          <Workflow className="w-12 h-12 text-primary/20" />
        </header>

        <Card className="border-primary/10">
          <CardHeader className="bg-muted/30 border-b">
            <CardTitle className="text-lg">Sequence Configuration</CardTitle>
            <CardDescription>Define how expenses flow through your organization.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              {steps.map((step, index) => (
                <div key={step.id} className="relative flex flex-col p-6 bg-white border rounded-xl shadow-sm animate-in group">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-bold">
                      {index + 1}
                    </div>
                    <GripVertical className="w-5 h-5 text-muted-foreground cursor-grab active:cursor-grabbing" />
                    
                    <div className="grid grid-cols-2 gap-4 flex-1">
                      <div className="space-y-1">
                        <Label className="text-[10px] uppercase text-muted-foreground">Step Name</Label>
                        <Input 
                          value={step.name} 
                          onChange={(e) => updateStep(step.id, { name: e.target.value })}
                          className="h-9 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] uppercase text-muted-foreground">Approver Role</Label>
                        <Select 
                          value={step.approverRole} 
                          onValueChange={(val: UserRole) => updateStep(step.id, { approverRole: val })}
                        >
                          <SelectTrigger className="h-9 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MANAGER">Manager</SelectItem>
                            <SelectItem value="FINANCE">Finance</SelectItem>
                            <SelectItem value="ADMIN">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => removeStep(step.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pl-12 border-l-2 border-primary/5 ml-4">
                    <div className="flex items-center gap-3">
                      <Checkbox 
                        id={`required-${step.id}`} 
                        checked={step.isRequired}
                        onCheckedChange={(val) => updateStep(step.id, { isRequired: !!val })}
                      />
                      <Label htmlFor={`required-${step.id}`} className="text-sm font-medium cursor-pointer">
                        Mandatory Step
                      </Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger><Info className="w-4 h-4 text-muted-foreground" /></TooltipTrigger>
                          <TooltipContent>If checked, this role MUST approve before completion.</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <Label className="text-xs font-semibold">Min. Approval Threshold</Label>
                        <span className="text-xs font-bold text-primary">{step.minApprovalPercentage}%</span>
                      </div>
                      <Slider 
                        value={[step.minApprovalPercentage]} 
                        max={100} 
                        step={10} 
                        onValueChange={([val]) => updateStep(step.id, { minApprovalPercentage: val })}
                      />
                      <p className="text-[10px] text-muted-foreground">Percentage of role members required for step completion.</p>
                    </div>
                  </div>
                </div>
              ))}

              {steps.length === 0 && (
                <div className="text-center py-12 border-2 border-dashed rounded-xl">
                  <p className="text-muted-foreground">No approval steps defined. Click below to add one.</p>
                </div>
              )}

              <Button variant="outline" className="w-full border-dashed h-12" onClick={addStep}>
                <Plus className="w-4 h-4 mr-2" /> Add Approval Level
              </Button>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2 border-t pt-6">
            <Button variant="outline" onClick={() => setSteps(workflow)}>Reset</Button>
            <Button onClick={saveWorkflow} className="gap-2 h-10 px-6">
              <ShieldCheck className="w-4 h-4" /> Apply Changes
            </Button>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
