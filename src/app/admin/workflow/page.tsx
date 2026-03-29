"use client"

import { useStore, ApprovalStep, UserRole } from '@/app/lib/store';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Settings, 
  Plus, 
  Trash2, 
  GripVertical,
  ChevronRight,
  ShieldCheck,
  Workflow
} from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export default function WorkflowConfig() {
  const { workflow, setWorkflow } = useStore();
  const { toast } = useToast();
  const [steps, setSteps] = useState<ApprovalStep[]>(workflow);

  const addStep = () => {
    const newStep: ApprovalStep = {
      id: Math.random().toString(36).substr(2, 9),
      name: `Step ${steps.length + 1}`,
      approverRole: 'MANAGER'
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
      description: "Approval sequences have been updated globally.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Approval Workflow</h1>
            <p className="text-muted-foreground mt-1">Define the multi-level approval sequence for expense claims.</p>
          </div>
          <Workflow className="w-12 h-12 text-primary/20" />
        </header>

        <Card className="border-primary/10">
          <CardHeader className="bg-muted/30 border-b">
            <CardTitle className="text-lg">Sequence Configuration</CardTitle>
            <CardDescription>Drag and drop steps to reorder (simulated).</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center gap-4 p-4 bg-white border rounded-xl shadow-sm animate-in group">
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
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase text-muted-foreground">Approver Role</Label>
                      <Select 
                        value={step.approverRole} 
                        onValueChange={(val: UserRole) => updateStep(step.id, { approverRole: val })}
                      >
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MANAGER">Line Manager</SelectItem>
                          <SelectItem value="FINANCE">Finance Dept</SelectItem>
                          <SelectItem value="ADMIN">Administrator</SelectItem>
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
              ))}

              {steps.length === 0 && (
                <div className="text-center py-12 border-2 border-dashed rounded-xl">
                  <p className="text-muted-foreground">No approval steps defined. Click below to add one.</p>
                </div>
              )}

              <Button variant="outline" className="w-full border-dashed" onClick={addStep}>
                <Plus className="w-4 h-4 mr-2" /> Add Level
              </Button>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2 border-t pt-6">
            <Button variant="outline" onClick={() => setSteps(workflow)}>Reset</Button>
            <Button onClick={saveWorkflow} className="gap-2">
              <ShieldCheck className="w-4 h-4" /> Save Sequence
            </Button>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}