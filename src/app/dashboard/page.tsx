"use client"

import { useStore, Expense, UserRole } from '@/app/lib/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Navbar } from '@/components/layout/Navbar';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Wallet, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp,
  Receipt,
  PlusCircle,
  Users,
  Settings,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Dashboard() {
  const { currentUser, expenses, users, baseCurrency } = useStore();

  if (!currentUser) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING': return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Pending</Badge>;
      case 'APPROVED': return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Approved</Badge>;
      case 'REJECTED': return <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200">Rejected</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Helper to filter and calculate
  const getStats = (list: Expense[]) => {
    const total = list.reduce((sum, exp) => sum + exp.convertedAmount, 0);
    const pending = list.filter(e => e.status === 'PENDING').length;
    const approved = list.filter(e => e.status === 'APPROVED').length;
    const rejected = list.filter(e => e.status === 'REJECTED').length;
    return { total, pending, approved, rejected };
  };

  // Render Logic based on Role
  const renderEmployeeDashboard = () => {
    const myExpenses = expenses.filter(e => e.employeeId === currentUser.id);
    const stats = getStats(myExpenses);

    return (
      <div className="space-y-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">My Expenses</h1>
          <p className="text-muted-foreground mt-1">Track your claims and submission history.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Total Submitted" value={`${baseCurrency} ${stats.total.toLocaleString()}`} icon={<Wallet className="h-4 w-4 text-primary" />} subtitle={`${myExpenses.length} claims`} />
          <StatCard title="Awaiting Approval" value={stats.pending} icon={<Clock className="h-4 w-4 text-amber-500" />} subtitle="Pending items" />
          <StatCard title="Approved Claims" value={stats.approved} icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />} subtitle="Ready for payment" />
          <StatCard title="Rejected" value={stats.rejected} icon={<AlertCircle className="h-4 w-4 text-destructive" />} subtitle="Requires attention" />
        </div>

        <ExpenseTable title="Recent Submissions" expenses={myExpenses.slice(0, 5)} showBadge={getStatusBadge} emptyMessage="No expenses submitted yet." />
      </div>
    );
  };

  const renderManagerDashboard = () => {
    const teamUserIds = users.filter(u => u.managerId === currentUser.id).map(u => u.id);
    const teamExpenses = expenses.filter(e => teamUserIds.includes(e.employeeId));
    const myExpenses = expenses.filter(e => e.employeeId === currentUser.id);
    const teamStats = getStats(teamExpenses);

    return (
      <div className="space-y-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Team Overview</h1>
          <p className="text-muted-foreground mt-1">Monitor your direct reports' spending and approvals.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Team Total Spend" value={`${baseCurrency} ${teamStats.total.toLocaleString()}`} icon={<Users className="h-4 w-4 text-primary" />} subtitle={`${teamExpenses.length} total team claims`} />
          <StatCard title="Team Pending" value={teamStats.pending} icon={<Clock className="h-4 w-4 text-amber-500" />} subtitle="Review required" />
          <StatCard title="My Personal Spend" value={`${baseCurrency} ${getStats(myExpenses).total.toLocaleString()}`} icon={<Wallet className="h-4 w-4 text-muted-foreground" />} subtitle="Your own claims" />
          <Link href="/approvals" className="block">
            <Card className="hover:border-primary transition-colors bg-primary/5 cursor-pointer h-full">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center space-y-2">
                  <CheckCircle2 className="h-8 w-8 text-primary" />
                  <div className="font-bold text-lg">Process Approvals</div>
                  <p className="text-xs text-muted-foreground">Go to approval queue</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ExpenseTable title="Team Activity" expenses={teamExpenses.slice(0, 5)} showBadge={getStatusBadge} emptyMessage="No team activity yet." />
          <ExpenseTable title="My Claims" expenses={myExpenses.slice(0, 5)} showBadge={getStatusBadge} emptyMessage="No personal claims yet." />
        </div>
      </div>
    );
  };

  const renderAdminDashboard = () => {
    const stats = getStats(expenses);

    return (
      <div className="space-y-8">
        <header className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Global Control Center</h1>
            <p className="text-muted-foreground mt-1">Company-wide oversight and system configuration.</p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/users"><Button variant="outline" size="sm" className="gap-2"><Users className="w-4 h-4" /> Users</Button></Link>
            <Link href="/admin/workflow"><Button variant="outline" size="sm" className="gap-2"><Settings className="w-4 h-4" /> Workflow</Button></Link>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Company Total" value={`${baseCurrency} ${stats.total.toLocaleString()}`} icon={<ShieldCheck className="h-4 w-4 text-primary" />} subtitle="Across all departments" />
          <StatCard title="Active Users" value={users.length} icon={<Users className="h-4 w-4 text-accent" />} subtitle="Employees onboarded" />
          <StatCard title="Pending Review" value={stats.pending} icon={<Clock className="h-4 w-4 text-amber-500" />} subtitle="Awaiting action" />
          <StatCard title="Total Claims" value={expenses.length} icon={<Receipt className="h-4 w-4 text-primary" />} subtitle="Historical volume" />
        </div>

        <ExpenseTable title="Recent Global Expenses" expenses={expenses.slice(0, 10)} showBadge={getStatusBadge} emptyMessage="No company expenses yet." />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentUser.role === 'ADMIN' && renderAdminDashboard()}
        {currentUser.role === 'MANAGER' && renderManagerDashboard()}
        {currentUser.role === 'EMPLOYEE' && renderEmployeeDashboard()}
      </main>
    </div>
  );
}

function StatCard({ title, value, icon, subtitle }: { title: string, value: string | number, icon: React.ReactNode, subtitle: string }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </CardContent>
    </Card>
  );
}

function ExpenseTable({ title, expenses, showBadge, emptyMessage }: { title: string, expenses: Expense[], showBadge: (s: string) => React.ReactNode, emptyMessage: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">{title}</CardTitle>
        <Link href="/expenses/new">
          <Button variant="ghost" size="sm" className="gap-2 text-primary">
            <PlusCircle className="w-4 h-4" /> New Claim
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {expenses.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((exp) => (
                <TableRow key={exp.id}>
                  <TableCell className="text-xs">{new Date(exp.date).toLocaleDateString()}</TableCell>
                  <TableCell className="font-medium">{exp.employeeName}</TableCell>
                  <TableCell className="max-w-[150px] truncate">{exp.description}</TableCell>
                  <TableCell className="font-bold">{exp.baseCurrency} {exp.convertedAmount.toFixed(2)}</TableCell>
                  <TableCell>{showBadge(exp.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <Receipt className="w-8 h-8 text-muted mx-auto mb-2 opacity-20" />
            <p className="text-sm text-muted-foreground">{emptyMessage}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
