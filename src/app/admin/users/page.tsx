"use client"

import { useStore, User, UserRole } from '@/app/lib/store';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, Search, Edit2, Trash2, Filter, ChevronRight, ChevronDown, UserCircle, ShieldCheck, Briefcase, DollarSign, Crown } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function UserManagement() {
  const { users, updateUser, company } = useStore();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'ALL'>('ALL');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(users.map(u => u.id)));

  const toggleNode = (id: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(id)) newExpanded.delete(id);
    else newExpanded.add(id);
    setExpandedNodes(newExpanded);
  };

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) || 
                          u.email.toLowerCase().includes(search.toLowerCase());
      const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

  const handleRoleChange = (id: string, role: UserRole) => {
    updateUser(id, { role });
    toast({ title: "Role Updated", description: `User role changed to ${role}` });
  };

  const handleManagerChange = (id: string, managerId: string) => {
    updateUser(id, { manager_id: managerId === 'none' ? undefined : managerId });
    toast({ title: "Hierarchy Updated", description: "Manager assigned successfully" });
  };

  // Build Hierarchy Tree
  const buildTree = (managerId?: string): User[] => {
    return filteredUsers.filter(u => u.manager_id === managerId);
  };

  const rootUsers = useMemo(() => {
    // Top-level users: either have no manager OR their manager isn't in the filtered list
    return filteredUsers.filter(u => !u.manager_id || !filteredUsers.some(m => m.id === u.manager_id));
  }, [filteredUsers]);

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'ADMIN': return <Crown className="w-3.5 h-3.5 text-primary" />;
      case 'DIRECTOR': return <Crown className="w-3.5 h-3.5 text-accent" />;
      case 'MANAGER': return <Briefcase className="w-3.5 h-3.5 text-blue-500" />;
      case 'FINANCE': return <DollarSign className="w-3.5 h-3.5 text-emerald-500" />;
      default: return <UserCircle className="w-3.5 h-3.5 text-muted-foreground" />;
    }
  };

  const renderMemberRow = (user: User, level: number = 0) => {
    const reports = filteredUsers.filter(u => u.manager_id === user.id);
    const hasReports = reports.length > 0;
    const isExpanded = expandedNodes.has(user.id);

    return (
      <div key={user.id} className="flex flex-col">
        <div 
          className={cn(
            "group flex items-center justify-between p-4 border-b hover:bg-muted/50 transition-colors",
            level > 0 && "bg-muted/5"
          )}
          style={{ paddingLeft: `${(level * 24) + 16}px` }}
        >
          <div className="flex items-center gap-4 flex-1">
            <div className="w-6 flex justify-center">
              {hasReports ? (
                <button onClick={() => toggleNode(user.id)} className="p-1 hover:bg-muted rounded">
                  {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
              ) : (
                <div className="w-4" />
              )}
            </div>
            
            <Avatar className="h-10 w-10 border-2 border-primary/10">
              <AvatarImage src={`https://picsum.photos/seed/${user.id}/40/40`} />
              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm">{user.name}</span>
                <Badge variant="outline" className="text-[9px] h-4 uppercase font-black px-1.5 py-0 flex items-center gap-1">
                  {getRoleIcon(user.role)} {user.role}
                </Badge>
              </div>
              <span className="text-[11px] text-muted-foreground">{user.email}</span>
            </div>
          </div>

          <div className="flex items-center gap-8 pr-4">
            <div className="flex flex-col gap-1 w-40">
              <span className="text-[10px] uppercase font-black text-muted-foreground/60 tracking-widest">Update Role</span>
              <Select 
                value={user.role} 
                onValueChange={(val: UserRole) => handleRoleChange(user.id, val)}
              >
                <SelectTrigger className="w-full h-8 text-xs font-bold border-primary/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EMPLOYEE">Employee</SelectItem>
                  <SelectItem value="MANAGER">Manager</SelectItem>
                  <SelectItem value="FINANCE">Finance</SelectItem>
                  <SelectItem value="DIRECTOR">Director</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1 w-48">
              <span className="text-[10px] uppercase font-black text-muted-foreground/60 tracking-widest">Reports To</span>
              <Select 
                value={user.manager_id || 'none'} 
                onValueChange={(val) => handleManagerChange(user.id, val)}
              >
                <SelectTrigger className="w-full h-8 text-xs border-primary/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Manager</SelectItem>
                  {users
                    .filter(u => u.id !== user.id && ['MANAGER', 'DIRECTOR', 'ADMIN'].includes(u.role))
                    .map(m => (
                      <SelectItem key={m.id} value={m.id}>{m.name} ({m.role})</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="ghost" size="icon" className="h-8 w-8"><Edit2 className="w-3.5 h-3.5" /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/5"><Trash2 className="w-3.5 h-3.5" /></Button>
            </div>
          </div>
        </div>
        
        {hasReports && isExpanded && (
          <div className="flex flex-col">
            {reports.map(report => renderMemberRow(report, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background font-body">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-foreground font-headline">Member Directory</h1>
            <p className="text-muted-foreground mt-1 text-sm">Visualizing reporting lines for <span className="font-bold text-primary">{company.name}</span>.</p>
          </div>
          <Button className="gap-2 h-11 px-6 font-black uppercase tracking-widest text-xs">
            <UserPlus className="w-4 h-4" /> Add Member
          </Button>
        </header>

        <Card className="mb-8 border-primary/10 shadow-sm overflow-hidden">
          <CardHeader className="bg-muted/30 border-b p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 max-w-md relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Search by name or email..." 
                  className="pl-9 h-11 border-primary/10 bg-white"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="h-11 gap-2 font-bold border-primary/10">
                      <Filter className="w-4 h-4" /> 
                      {roleFilter === 'ALL' ? 'All Roles' : roleFilter}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56 p-2">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase text-muted-foreground p-2 tracking-widest">Filter by Position</p>
                      {(['ALL', 'ADMIN', 'DIRECTOR', 'MANAGER', 'FINANCE', 'EMPLOYEE'] as const).map((role) => (
                        <Button 
                          key={role}
                          variant={roleFilter === role ? 'secondary' : 'ghost'} 
                          className="w-full justify-start text-xs font-bold h-9"
                          onClick={() => setRoleFilter(role)}
                        >
                          {role}
                        </Button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>

                <Button 
                  variant="outline" 
                  className="h-11 font-bold border-primary/10"
                  onClick={() => setExpandedNodes(expandedNodes.size > 0 ? new Set() : new Set(users.map(u => u.id)))}
                >
                  {expandedNodes.size > 0 ? 'Collapse All' : 'Expand All'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="bg-muted/5 py-2 px-6 border-b flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
              <div className="flex-1 pl-10">Organization Structure</div>
              <div className="flex items-center gap-8 pr-[116px]">
                <div className="w-40 text-center">Permission Level</div>
                <div className="w-48 text-center">Reporting Hierarchy</div>
              </div>
            </div>
            
            <div className="divide-y">
              {rootUsers.length > 0 ? (
                rootUsers.map(user => renderMemberRow(user))
              ) : (
                <div className="p-20 text-center text-muted-foreground">
                  <UserPlus className="w-12 h-12 mx-auto mb-4 opacity-10" />
                  <p className="font-bold">No members found matching your filters.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
