"use client"

import { useStore } from '@/app/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Navbar } from '@/components/layout/Navbar';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Wallet, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  TrendingUp,
  Receipt,
  PlusCircle
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Dashboard() {
  const { currentUser, expenses } = useStore();
  
  const userExpenses = currentUser?.role === 'ADMIN' ? expenses : expenses.filter(e => e.employeeId === currentUser?.id);
  const totalAmount = userExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const pendingCount = userExpenses.filter(e => e.status === 'PENDING').length;
  const approvedCount = userExpenses.filter(e => e.status === 'APPROVED').length;
  const rejectedCount = userExpenses.filter(e => e.status === 'REJECTED').length;

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
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Welcome back, {currentUser?.name}</h1>
          <p className="text-muted-foreground mt-1">Here's what's happening with your expenses.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Claims</CardTitle>
              <Wallet className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalAmount.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">From {userExpenses.length} claims</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingCount}</div>
              <p className="text-xs text-muted-foreground">Awaiting approval</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{approvedCount}</div>
              <p className="text-xs text-muted-foreground">Ready for payment</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <AlertCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{rejectedCount}</div>
              <p className="text-xs text-muted-foreground">Requires attention</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Expenses</CardTitle>
                <p className="text-sm text-muted-foreground">A history of your submitted claims</p>
              </div>
              <Link href="/expenses/new">
                <Button size="sm" className="gap-2">
                  <PlusCircle className="w-4 h-4" /> New Claim
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {userExpenses.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Vendor/Description</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userExpenses.slice(0, 5).map((exp) => (
                      <TableRow key={exp.id} className="cursor-pointer hover:bg-muted/50 transition-colors">
                        <TableCell className="font-medium">{new Date(exp.date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-semibold">{exp.description}</span>
                            <span className="text-xs text-muted-foreground">ID: {exp.id}</span>
                          </div>
                        </TableCell>
                        <TableCell>{exp.category}</TableCell>
                        <TableCell className="font-bold">${exp.amount.toLocaleString()}</TableCell>
                        <TableCell>{getStatusBadge(exp.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12">
                  <Receipt className="w-12 h-12 text-muted mx-auto mb-4" />
                  <p className="text-muted-foreground">No expenses submitted yet.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Spend Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Monthly Trend</span>
                    <Badge variant="secondary" className="gap-1 text-emerald-600">
                      <TrendingUp className="w-3 h-3" /> +12%
                    </Badge>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: '65%' }}></div>
                  </div>
                  <p className="text-xs text-muted-foreground">You have used 65% of your estimated monthly budget.</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-primary text-primary-foreground">
              <CardHeader>
                <CardTitle className="text-lg">Need Help?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm opacity-90 mb-4">Our support team is here to assist you with any expense-related queries or system issues.</p>
                <Button variant="secondary" size="sm" className="w-full">Contact Support</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}