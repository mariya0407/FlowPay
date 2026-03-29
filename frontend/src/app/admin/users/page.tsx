"use client"

import { useStore, User, UserRole } from '@/app/lib/store';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  UserPlus, 
  Search, 
  Edit2, 
  Trash2, 
  Filter, 
  ChevronRight, 
  ChevronDown, 
  UserCircle, 
  ShieldCheck, 
  Briefcase, 
  DollarSign, 
  Crown,
  Network,
  List,
  Maximize2,
  X
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export default function UserManagement() {
  const { users, updateUser, addUser, company } = useStore();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'ALL'>('ALL');
  const [viewType, setViewType] = useState<'LIST' | 'CHART'>('CHART');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(users.map(u => u.id)));
  
  // Add User State
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'EMPLOYEE' as UserRole,
    manager_id: ''
  });

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
    toast({ title: "Authority Updated", description: `User role changed to ${role}` });
  };

  const handleManagerChange = (id: string, managerId: string) => {
    updateUser(id, { manager_id: managerId === 'none' ? undefined : managerId });
    toast({ title: "Hierarchy Updated", description: "Reporting line adjusted." });
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    const id = `u${Date.now()}`;
    addUser({
      id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      company_id: company.id,
      manager_id: newUser.manager_id || undefined,
      created_at: new Date().toISOString()
    });
    toast({ title: "User Onboarded", description: `${newUser.name} added to ${company.name}` });
    setIsAddUserOpen(false);
    setNewUser({ name: '', email: '', role: 'EMPLOYEE', manager_id: '' });
  };

  const rootUsers = useMemo(() => {
    return filteredUsers.filter(u => !u.manager_id || !filteredUsers.some(m => m.id === u.manager_id));
  }, [filteredUsers]);

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'ADMIN': return <Crown className="w-4 h-4 text-primary" />;
      case 'DIRECTOR': return <Crown className="w-4 h-4 text-accent" />;
      case 'MANAGER': return <Briefcase className="w-4 h-4 text-blue-500" />;
      case 'FINANCE': return <DollarSign className="w-4 h-4 text-emerald-500" />;
      default: return <UserCircle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  // HIERARCHY LOGIC: Director > Finance > Manager > Employee
  const getAvailableManagersForRole = (role: UserRole) => {
    switch (role) {
      case 'EMPLOYEE':
        return users.filter(u => u.role === 'MANAGER');
      case 'MANAGER':
        return users.filter(u => u.role === 'FINANCE' || u.role === 'DIRECTOR');
      case 'FINANCE':
        return users.filter(u => u.role === 'DIRECTOR' || u.role === 'ADMIN');
      case 'DIRECTOR':
        return users.filter(u => u.role === 'ADMIN');
      default:
        return users.filter(u => u.role === 'ADMIN');
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
                <button onClick={() => toggleNode(user.id)} className="p-1 hover:bg-muted rounded text-muted-foreground">
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
                  {getAvailableManagersForRole(user.role)
                    .filter(u => u.id !== user.id)
                    .map(m => (
                      <SelectItem key={m.id} value={m.id}>{m.name} ({m.role})</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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

  const renderOrgChartNode = (user: User) => {
    const reports = filteredUsers.filter(u => u.manager_id === user.id);
    const hasReports = reports.length > 0;

    return (
      <div key={user.id} className="flex flex-col items-center">
        <div className="relative p-1 flex flex-col items-center group">
          {/* Vertical line from top if not root */}
          {user.manager_id && (
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-1.5 bg-primary/20" />
          )}
          
          <Card className="w-36 border-2 border-primary/10 hover:border-primary/40 transition-all hover:shadow-lg bg-white z-10 scale-[0.9]">
            <CardContent className="p-2 flex flex-col items-center gap-1.5">
              <div className="relative">
                <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                  <AvatarImage src={`https://picsum.photos/seed/${user.id}/40/40`} />
                  <AvatarFallback className="text-sm font-black">{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 bg-white p-0.5 rounded-full shadow-sm border scale-75">
                  {getRoleIcon(user.role)}
                </div>
              </div>
              <div className="text-center overflow-hidden w-full">
                <div className="font-black text-[10px] tracking-tight truncate px-1">{user.name}</div>
                <div className="text-[7px] text-muted-foreground uppercase font-black tracking-widest mt-0.5">{user.role}</div>
              </div>
              {hasReports && (
                <Badge variant="secondary" className="text-[6px] h-2.5 px-1 font-bold">
                  {reports.length} Reports
                </Badge>
              )}
            </CardContent>
          </Card>

          {/* Vertical line to children */}
          {hasReports && (
            <div className="w-px h-4 bg-primary/20" />
          )}
        </div>

        {hasReports && (
          <div className="relative flex justify-center pt-1">
            {/* Horizontal connecting line */}
            {reports.length > 1 && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 h-px bg-primary/20" 
                   style={{ width: `calc(100% - ${100 / reports.length}%)` }} />
            )}
            <div className="flex gap-2">
              {reports.map(report => renderOrgChartNode(report))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background font-body">
      <Navbar />
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Network className="w-6 h-6 text-primary" />
              <Badge variant="secondary" className="font-black text-[10px] uppercase tracking-widest">Enterprise View</Badge>
            </div>
            <h1 className="text-5xl font-black tracking-tighter text-foreground font-headline leading-none text-primary">Personnel Control</h1>
            <p className="text-muted-foreground mt-2 text-sm max-w-lg">Managing reporting authority for <span className="font-black text-primary border-b-2 border-primary/20">{company.name}</span>.</p>
          </div>
          
          <div className="flex items-center gap-3 bg-muted/30 p-1.5 rounded-xl border">
            <Button 
              variant={viewType === 'CHART' ? 'default' : 'ghost'} 
              size="sm" 
              className="gap-2 font-black uppercase text-[10px] tracking-widest rounded-lg h-9 px-4"
              onClick={() => setViewType('CHART')}
            >
              <Network className="w-3.5 h-3.5" /> Org Chart
            </Button>
            <Button 
              variant={viewType === 'LIST' ? 'default' : 'ghost'} 
              size="sm" 
              className="gap-2 font-black uppercase text-[10px] tracking-widest rounded-lg h-9 px-4"
              onClick={() => setViewType('LIST')}
            >
              <List className="w-3.5 h-3.5" /> List View
            </Button>
            <div className="w-px h-6 bg-border mx-1" />
            <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 h-9 px-4 font-black uppercase tracking-widest text-[10px] rounded-lg">
                  <UserPlus className="w-3.5 h-3.5" /> Add User
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle className="font-headline text-3xl">Onboard Personnel</DialogTitle>
                  <DialogDescription>Register a new member into the organizational hierarchy.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddUser} className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-xs font-black uppercase tracking-widest">Full Name</Label>
                    <Input 
                      id="name" 
                      value={newUser.name} 
                      onChange={e => setNewUser({...newUser, name: e.target.value})}
                      placeholder="e.g. Jordan Smith"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-xs font-black uppercase tracking-widest">Work Email</Label>
                    <Input 
                      id="email" 
                      type="email"
                      value={newUser.email} 
                      onChange={e => setNewUser({...newUser, email: e.target.value})}
                      placeholder="jordan.s@company.com"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="role" className="text-xs font-black uppercase tracking-widest">Level</Label>
                      <Select value={newUser.role} onValueChange={(val: UserRole) => setNewUser({...newUser, role: val})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="EMPLOYEE">Employee</SelectItem>
                          <SelectItem value="MANAGER">Manager</SelectItem>
                          <SelectItem value="FINANCE">Finance</SelectItem>
                          <SelectItem value="DIRECTOR">Director</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mgr" className="text-xs font-black uppercase tracking-widest">Manager</Label>
                      <Select value={newUser.manager_id} onValueChange={(val) => setNewUser({...newUser, manager_id: val})}>
                        <SelectTrigger>
                          <SelectValue placeholder="None" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {getAvailableManagersForRole(newUser.role).map(u => (
                            <SelectItem key={u.id} value={u.id}>{u.name} ({u.role})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-12 font-black uppercase tracking-widest mt-4">Confirm Onboarding</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        <Card className="mb-8 border-primary/10 shadow-xl overflow-hidden bg-white/50 backdrop-blur-sm">
          <CardHeader className="bg-white/80 border-b p-4">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
              <div className="flex-1 w-full lg:max-w-md relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Search personnel database..." 
                  className="pl-11 h-10 border-primary/5 bg-white shadow-inner rounded-lg focus:ring-primary/20"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              
              <div className="flex items-center gap-2 w-full lg:w-auto">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="h-10 flex-1 lg:flex-none gap-3 font-black uppercase text-[10px] tracking-widest border-primary/10 bg-white">
                      <Filter className="w-4 h-4 text-primary" /> 
                      {roleFilter === 'ALL' ? 'All Roles' : roleFilter}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-3 shadow-2xl rounded-2xl border-primary/5">
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-black uppercase text-muted-foreground p-2 tracking-widest">Filter by Level</p>
                      {(['ALL', 'ADMIN', 'DIRECTOR', 'MANAGER', 'FINANCE', 'EMPLOYEE'] as const).map((role) => (
                        <Button 
                          key={role}
                          variant={roleFilter === role ? 'secondary' : 'ghost'} 
                          className="w-full justify-start text-[11px] font-black uppercase h-10 px-4 rounded-lg"
                          onClick={() => setRoleFilter(role)}
                        >
                          <div className="w-6 flex justify-center mr-2">{getRoleIcon(role as any)}</div>
                          {role}
                        </Button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>

                {viewType === 'LIST' && (
                  <Button 
                    variant="outline" 
                    className="h-10 gap-2 font-black uppercase text-[10px] tracking-widest border-primary/10 bg-white"
                    onClick={() => setExpandedNodes(expandedNodes.size > 0 ? new Set() : new Set(users.map(u => u.id)))}
                  >
                    {expandedNodes.size > 0 ? 'Collapse All' : 'Expand All'}
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-0 min-h-[600px] relative">
            {viewType === 'LIST' ? (
              <div className="divide-y divide-primary/5">
                <div className="bg-muted/30 py-3 px-6 border-b flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                  <div className="flex-1 pl-12">User Identity</div>
                  <div className="flex items-center gap-8 pr-[116px]">
                    <div className="w-40 text-center">Security Level</div>
                    <div className="w-48 text-center">Reports To</div>
                  </div>
                </div>
                
                <div className="animate-in">
                  {rootUsers.length > 0 ? (
                    rootUsers.map(user => renderMemberRow(user))
                  ) : (
                    <div className="p-32 text-center text-muted-foreground">
                      <UserCircle className="w-16 h-16 mx-auto mb-6 opacity-10" />
                      <p className="font-black uppercase tracking-widest text-xs">No personnel in current scope</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="overflow-auto p-8 bg-[#f8fafc] animate-in" style={{ height: 'calc(100vh - 350px)' }}>
                <div className="inline-flex flex-col items-center min-w-full origin-top transform transition-transform duration-300">
                  {rootUsers.map(user => (
                    <div key={user.id} className="mb-8 last:mb-0">
                      {renderOrgChartNode(user)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
