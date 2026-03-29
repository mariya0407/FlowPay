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
  ShieldCheck,
  Building2
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Dashboard() {
  const { currentUser, expenses, users, companies, activeCompanyId } = useStore();

  if (!currentUser) return null;

  const currentCompany = companies.find(c => c.id === activeCompanyId);
  const companyExpenses = expenses.filter(e => e.company_id === activeCompanyId);

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
    const myExpenses = companyExpenses.filter(e => e.user_id === currentUser.id);
    const stats = getStats(myExpenses);

    return (
      <div className="space-y-8 animate-in">
        <header className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-foreground font-headline">Personal Ledger</h1>
            <p className="text-muted-foreground mt-1">Reviewing your activity in <span className="font-bold text-primary">{currentCompany?.name}</span>.</p>
          </div>
          <Building2 className="w-12 h-12 text-primary opacity-10" />
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Total Submitted" value={`${currentCompany?.base_currency} ${stats.total.toLocaleString()}`} icon={<Wallet className="h-4 w-4 text-primary" />} subtitle={`${myExpenses.length} claims in this org`} />
          <StatCard title="Awaiting Approval" value={stats.pending} icon={<Clock className="h-4 w-4 text-amber-500" />} subtitle="Pending items" />
          <StatCard title="Approved Claims" value={stats.approved} icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />} subtitle="Ready for payment" />
          <StatCard title="Rejected" value={stats.rejected} icon={<AlertCircle className="h-4 w-4 text-destructive" />} subtitle="Requires attention" />
        </div>

        <ExpenseTable title="Recent Organization Submissions" expenses={myExpenses.slice(0, 5)} showBadge={getStatusBadge} emptyMessage="No expenses submitted for this company." users={users} baseCurrency={currentCompany?.base_currency || 'USD'} />
      </div>
    );
  };

  const renderManagerDashboard = () => {
    const teamUserIds = users.filter(u => u.manager_id === currentUser.id).map(u => u.id);
    const teamExpenses = companyExpenses.filter(e => teamUserIds.includes(e.user_id));
    const myExpenses = companyExpenses.filter(e => e.user_id === currentUser.id);
    const teamStats = getStats(teamExpenses);

    return (
      <div className="space-y-8 animate-in">
        <header className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-foreground font-headline">Command Center</h1>
            <p className="text-muted-foreground mt-1">Managing team activity for <span className="font-bold text-primary">{currentCompany?.name}</span>.</p>
          </div>
          <Building2 className="w-12 h-12 text-primary opacity-10" />
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Team Total Spend" value={`${currentCompany?.base_currency} ${teamStats.total.toLocaleString()}`} icon={<Users className="h-4 w-4 text-primary" />} subtitle={`${teamExpenses.length} total team claims`} />
          <StatCard title="Team Pending" value={teamStats.pending} icon={<Clock className="h-4 w-4 text-amber-500" />} subtitle="Review required" />
          <StatCard title="My Personal Spend" value={`${currentCompany?.base_currency} ${getStats(myExpenses).total.toLocaleString()}`} icon={<Wallet className="h-4 w-4 text-muted-foreground" />} subtitle="Your claims in this org" />
          <Link href="/approvals" className="block h-full">
            <Card className="hover:border-primary transition-all bg-primary/5 cursor-pointer h-full border-primary/20 group">
              <CardContent className="pt-6 flex flex-col items-center justify-center h-full space-y-2">
                <CheckCircle2 className="h-8 w-8 text-primary group-hover:scale-110 transition-transform" />
                <div className="font-bold text-lg">Approvals</div>
                <p className="text-[10px] text-muted-foreground font-bold uppercase">Enter Review Queue</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ExpenseTable title="Team Activity" expenses={teamExpenses.slice(0, 5)} showBadge={getStatusBadge} emptyMessage="No team activity for this organization." users={users} baseCurrency={currentCompany?.base_currency || 'USD'} />
          <ExpenseTable title="My Personal Ledger" expenses={myExpenses.slice(0, 5)} showBadge={getStatusBadge} emptyMessage="No personal claims for this organization." users={users} baseCurrency={currentCompany?.base_currency || 'USD'} />
        </div>
      </div>
    );
  };

  const renderAdminDashboard = () => {
    const stats = getStats(companyExpenses);

    return (
      <div className="space-y-8 animate-in">
        <header className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-foreground font-headline">Enterprise Hub</h1>
            <p className="text-muted-foreground mt-1">Global oversight for <span className="font-bold text-primary">{currentCompany?.name}</span>.</p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/companies"><Button variant="outline" size="sm" className="gap-2 border-primary/20"><Building2 className="w-4 h-4" /> All Orgs</Button></Link>
            <Link href="/admin/users"><Button variant="outline" size="sm" className="gap-2 border-primary/20"><Users className="w-4 h-4" /> Users</Button></Link>
            <Link href="/admin/workflow"><Button variant="outline" size="sm" className="gap-2 border-primary/20"><Settings className="w-4 h-4" /> Rules</Button></Link>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Company Total" value={`${currentCompany?.base_currency} ${stats.total.toLocaleString()}`} icon={<ShieldCheck className="h-4 w-4 text-primary" />} subtitle="Across all active users" />
          <StatCard title="Company Staff" value={users.filter(u => u.company_ids.includes(activeCompanyId)).length} icon={<Users className="h-4 w-4 text-accent" />} subtitle="Total employees" />
          <StatCard title="Pending Review" value={stats.pending} icon={<Clock className="h-4 w-4 text-amber-500" />} subtitle="Queue volume" />
          <StatCard title="Total Claims" value={companyExpenses.length} icon={<Receipt className="h-4 w-4 text-primary" />} subtitle="Historical volume" />
        </div>

        <ExpenseTable title="Active Submissions" expenses={companyExpenses.slice(0, 10)} showBadge={getStatusBadge} emptyMessage="No activity found for this company." users={users} baseCurrency={currentCompany?.base_currency || 'USD'} />
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

function ExpenseTable({ title, expenses, showBadge, emptyMessage, users, baseCurrency }: { title: string, expenses: Expense[], showBadge: (s: string) => React.ReactNode, emptyMessage: string, users: any[], baseCurrency: string }) {
  return (
    <Card className="border-primary/5 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between bg-muted/5 border-b">
        <CardTitle className="text-lg font-bold">{title}</CardTitle>
        <Link href="/expenses/new">
          <Button variant="ghost" size="sm" className="gap-2 text-primary hover:bg-primary/5 font-bold">
            <PlusCircle className="w-4 h-4" /> Create Claim
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="p-0">
        {expenses.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/5">
                <TableHead className="pl-6">Date</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Vendor</TableHead>
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
            <Receipt className="w-10 h-10 text-muted mx-auto mb-2 opacity-10" />
            <p className="text-sm text-muted-foreground font-medium">{emptyMessage}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}