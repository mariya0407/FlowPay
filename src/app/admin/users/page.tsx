"use client"

import { useStore, User, UserRole } from '@/app/lib/store';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { UserPlus, Search, Edit2, Trash2, Building2, User as UserIcon, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';

export default function UserManagement() {
  const { users, updateUser, companies, activeCompanyId } = useStore();
  const { toast } = useToast();
  const [search, setSearch] = useState('');

  // Filter users who belong to the active company
  const filteredUsers = users.filter(u => 
    u.company_ids.includes(activeCompanyId) &&
    (u.name.toLowerCase().includes(search.toLowerCase()) || 
     u.email.toLowerCase().includes(search.toLowerCase()))
  );

  const handleRoleChange = (id: string, role: UserRole) => {
    updateUser(id, { role });
    toast({ title: "Role Updated", description: `User role changed to ${role}` });
  };

  const handleManagerChange = (id: string, managerId: string) => {
    updateUser(id, { manager_id: managerId === 'none' ? undefined : managerId });
    toast({ title: "Hierarchy Updated", description: "Manager assigned successfully" });
  };

  const handleCompanyToggle = (userId: string, companyId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    let newIds = [...user.company_ids];
    if (newIds.includes(companyId)) {
      if (newIds.length === 1) {
        toast({ variant: "destructive", title: "Action Blocked", description: "User must belong to at least one organization." });
        return;
      }
      newIds = newIds.filter(id => id !== companyId);
    } else {
      newIds.push(companyId);
    }
    
    updateUser(userId, { company_ids: newIds });
    toast({ title: "Organization Access Updated", description: "User permissions synchronized." });
  };

  const activeCompany = companies.find(c => c.id === activeCompanyId);

  return (
    <div className="min-h-screen bg-background font-body">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-foreground font-headline">Staffing Control</h1>
            <p className="text-muted-foreground mt-1">Manage personnel for <span className="font-bold text-primary">{activeCompany?.name}</span>.</p>
          </div>
          <Button className="gap-2">
            <UserPlus className="w-4 h-4" /> Add Member
          </Button>
        </header>

        <Card className="mb-8 border-primary/10 shadow-sm">
          <CardHeader className="bg-muted/10 border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Member Directory</CardTitle>
                <CardDescription>Assign roles and cross-organizational access.</CardDescription>
              </div>
              <div className="relative w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Filter by name or email..." 
                  className="pl-9 h-10"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/5">
                  <TableHead className="pl-6">Profile</TableHead>
                  <TableHead>System Role</TableHead>
                  <TableHead>Direct Manager</TableHead>
                  <TableHead>Active in Orgs</TableHead>
                  <TableHead className="text-right pr-6">Management</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id} className="hover:bg-muted/5 transition-colors">
                    <TableCell className="pl-6">
                      <div className="flex items-center gap-3 py-1">
                        <Avatar className="h-10 w-10 border-2 border-primary/10">
                          <AvatarImage src={`https://picsum.photos/seed/${user.id}/40/40`} />
                          <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-bold text-sm">{user.name}</span>
                          <span className="text-[10px] text-muted-foreground font-medium">{user.email}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select 
                        value={user.role} 
                        onValueChange={(val: UserRole) => handleRoleChange(user.id, val)}
                      >
                        <SelectTrigger className="w-32 h-8 text-xs font-bold border-primary/20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="EMPLOYEE">Employee</SelectItem>
                          <SelectItem value="MANAGER">Manager</SelectItem>
                          <SelectItem value="ADMIN">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select 
                        value={user.manager_id || 'none'} 
                        onValueChange={(val) => handleManagerChange(user.id, val)}
                      >
                        <SelectTrigger className="w-48 h-8 text-xs border-primary/20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Direct Report</SelectItem>
                          {users
                            .filter(u => u.id !== user.id && (u.role === 'MANAGER' || u.role === 'ADMIN'))
                            .map(m => (
                              <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {user.company_ids.map(cid => {
                          const c = companies.find(com => com.id === cid);
                          return (
                            <span key={cid} className="text-[9px] px-1.5 py-0.5 bg-primary/10 text-primary rounded font-black uppercase">
                              {c?.name.substring(0, 10)}
                            </span>
                          );
                        })}
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8"><Edit2 className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/5"><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}