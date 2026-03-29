"use client"

import { useStore, Expense } from '@/app/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Navbar } from '@/components/layout/Navbar';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Wallet, 
  Clock, 
  CheckCircle2, 
  Receipt,
  PlusCircle,
  Users,
  Settings,
  ShieldCheck,
  Briefcase,
  XCircle,
  TrendingUp,
  FileSearch,
  CreditCard
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function Dashboard() {
  const { currentUser, expenses, users, company } = useStore();

  if (!currentUser) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING': return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Pending</Badge>;
      case 'APPROVED': return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Approved</Badge>;
      case 'REJECTED': return <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200">Rejected</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStats = (list: Expense[]) => {
    const total = list.reduce((sum, exp) => sum + exp.converted_amount, 0);
    const pending = list.filter(e => e.status === 'PENDING').length;
    const approved = list.filter(e => e.status === 'APPROVED').length;
    const rejected = list.filter(e => e.status === 'REJECTED').length;
    return { total, pending, approved, rejected };
  };

  const renderEmployeeDashboard = () => {
    const myExpenses = expenses.filter(e => e.user_id === currentUser.id);
    const stats = getStats(myExpenses);

    return (
      <div className="space-y-8 animate-in">
        <header className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-foreground font-headline">Personal Ledger</h1>
            <p className="text-muted-foreground mt-1 text-sm">Reviewing your activity at <span className="font-bold text-primary">{company.name}</span>.</p>
          </div>
          <CreditCard className="w-12 h-12 text-primary opacity-10" />
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Total Spent" value={`${company.base_currency} ${stats.total.toLocaleString()}`} icon={<Wallet className="h-4 w-4 text-primary" />} subtitle={`${myExpenses.length} total claims`} />
          <StatCard title="In Review" value={stats.pending} icon={<Clock className="h-4 w-4 text-amber-500" />} subtitle="Awaiting approval" />
          <StatCard title="Paid Out" value={stats.approved} icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />} subtitle="Finalized claims" />
          <StatCard title="Denied" value={stats.rejected} icon={<XCircle className="h-4 w-4 text-destructive" />} subtitle="Claims needing edits" />
        </div>

        <ExpenseTable 
          title="Recent Submissions" 
          expenses={myExpenses.slice(0, 5)} 
          showBadge={getStatusBadge} 
          emptyMessage="You haven't submitted any expenses yet." 
          users={users} 
          baseCurrency={company.base_currency}
          showCreateButton={true}
        />
      </div>
    );
  };

  const renderApproverDashboard = () => {
    // For Managers, Finance, and Directors
    const teamUserIds = users.filter(u => u.manager_id === currentUser.id).map(u => u.id);
    const relevantExpenses = currentUser.role === 'ADMIN' ? expenses : expenses.filter(e => teamUserIds.includes(e.user_id));
    const stats = getStats(relevantExpenses);

    return (
      <div className="space-y-8 animate-in">
        <header className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-foreground font-headline">Review Hub</h1>
            <p className="text-muted-foreground mt-1 text-sm">Overseeing departmental spend for <span className="font-bold text-primary">{company.name}</span>.</p>
          </div>
          <Briefcase className="w-12 h-12 text-primary opacity-10" />
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Scope Volume" value={`${company.base_currency} ${stats.total.toLocaleString()}`} icon={<Receipt className="h-4 w-4 text-primary" />} subtitle="Total tracked volume" />
          <StatCard title="Awaiting You" value={stats.pending} icon={<Clock className="h-4 w-4 text-amber-500" />} subtitle="Action required" />
          <StatCard title="Processed" value={stats.approved} icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />} subtitle="Approved by you" />
          <Link href="/approvals" className="block h-full">
            <Card className="hover:border-primary transition-all bg-primary/5 cursor-pointer h-full border-primary/20 group">
              <CardContent className="pt-6 flex flex-col items-center justify-center h-full space-y-2">
                <ShieldCheck className="h-8 w-8 text-primary group-hover:scale-110 transition-transform" />
                <div className="font-bold text-lg">Open Approvals</div>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Action Queue</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        <ExpenseTable 
          title="Review Queue Activity" 
          expenses={relevantExpenses.slice(0, 10)} 
          showBadge={getStatusBadge} 
          emptyMessage="No activity in your oversight scope." 
          users={users} 
          baseCurrency={company.base_currency}
          showCreateButton={false}
        />
      </div>
    );
  };

  const renderAdminDashboard = () => {
    const stats = getStats(expenses);

    return (
      <div className="space-y-8 animate-in">
        <header className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-foreground font-headline">Organization Oversight</h1>
            <p className="text-muted-foreground mt-1 text-sm">Global system control for <span className="font-bold text-primary">{company.name}</span>.</p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/users"><Button variant="outline" size="sm" className="gap-2 border-primary/20"><Users className="w-4 h-4" /> User Base</Button></Link>
            <Link href="/admin/workflow"><Button variant="outline" size="sm" className="gap-2 border-primary/20"><Settings className="w-4 h-4" /> Rules Engine</Button></Link>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Global Spend" value={`${company.base_currency} ${stats.total.toLocaleString()}`} icon={<Wallet className="h-4 w-4 text-primary" />} subtitle="All claims combined" />
          <StatCard title="Org Users" value={users.length} icon={<Users className="h-4 w-4 text-accent" />} subtitle="Across all levels" />
          <StatCard title="Active Pending" value={stats.pending} icon={<Clock className="h-4 w-4 text-amber-500" />} subtitle="Total volume" />
          <StatCard title="Rejected Audit" value={stats.rejected} icon={<XCircle className="h-4 w-4 text-destructive" />} subtitle="Denial history" />
        </div>

        <ExpenseTable 
          title="All Submissions Ledger" 
          expenses={expenses} 
          showBadge={getStatusBadge} 
          emptyMessage="No system activity recorded yet." 
          users={users} 
          baseCurrency={company.base_currency}
          showCreateButton={false}
        />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentUser.role === 'ADMIN' ? renderAdminDashboard() : 
         ['MANAGER', 'FINANCE', 'DIRECTOR'].includes(currentUser.role) ? renderApproverDashboard() : 
         renderEmployeeDashboard()}
      </main>
    </div>
  );
}

function StatCard({ title, value, icon, subtitle }: { title: string, value: string | number, icon: React.ReactNode, subtitle: string }) {
  return (
    <Card className="hover:shadow-lg transition-all border-primary/5">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs font-black uppercase tracking-wider text-muted-foreground">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-black text-foreground">{value}</div>
        <p className="text-[10px] text-muted-foreground mt-1 font-bold">{subtitle}</p>
      </CardContent>
    </Card>
  );
}

function ExpenseTable({ title, expenses, showBadge, emptyMessage, users, baseCurrency, showCreateButton }: { title: string, expenses: Expense[], showBadge: (s: string) => React.ReactNode, emptyMessage: string, users: any[], baseCurrency: string, showCreateButton: boolean }) {
  return (
    <Card className="border-primary/5 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between bg-muted/5 border-b">
        <CardTitle className="text-lg font-bold">{title}</CardTitle>
        {showCreateButton && (
          <Link href="/expenses/new">
            <Button variant="ghost" size="sm" className="gap-2 text-primary hover:bg-primary/5 font-bold">
              <PlusCircle className="w-4 h-4" /> Create Claim
            </Button>
          </Link>
        )}
      </CardHeader>
      <CardContent className="p-0">
        {expenses.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/5">
                <TableHead className="pl-6">Date</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Vendor/Description</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead className="pr-6">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((exp) => {
                const user = users.find(u => u.id === exp.user_id);
                return (
                  <TableRow key={exp.id} className="hover:bg-muted/5">
                    <TableCell className="text-[10px] font-bold pl-6">{new Date(exp.expense_date).toLocaleDateString()}</TableCell>
                    <TableCell className="font-medium text-xs">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={`https://picsum.photos/seed/${user?.id}/20/20`} />
                          <AvatarFallback className="text-[8px]">{user?.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        {user?.name}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[150px] truncate text-xs font-medium">{exp.description}</TableCell>
                    <TableCell className="font-black text-xs text-primary">{baseCurrency} {exp.converted_amount.toFixed(2)}</TableCell>
                    <TableCell className="pr-6">{showBadge(exp.status)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-20 border-2 border-dashed rounded-lg border-muted/20 m-6">
            <FileSearch className="w-10 h-10 text-muted mx-auto mb-2 opacity-10" />
            <p className="text-sm text-muted-foreground font-medium">{emptyMessage}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
