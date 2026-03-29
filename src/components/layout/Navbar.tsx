"use client"

import Link from 'next/link';
import { useStore } from '@/app/lib/store';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  LayoutDashboard, 
  PlusCircle, 
  CheckCircle, 
  Settings, 
  LogOut,
  ChevronDown,
  Users,
  Building2,
  Globe
} from 'lucide-react';
import { usePathname } from 'next/navigation';

export function Navbar() {
  const { currentUser, setCurrentUser, users, companies, activeCompanyId, setActiveCompany } = useStore();
  const pathname = usePathname();

  const activeCompany = companies.find(c => c.id === activeCompanyId);
  const userCompanies = companies.filter(c => currentUser?.company_ids.includes(c.id));

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="border-b bg-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold group-hover:scale-105 transition-transform">
                RF
              </div>
              <span className="text-xl font-bold text-primary tracking-tight">ReimburseFlow</span>
            </Link>

            {/* Company Switcher */}
            {currentUser && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 border-primary/20 hover:bg-primary/5">
                    <Building2 className="w-4 h-4 text-primary" />
                    <span className="max-w-[120px] truncate font-bold">{activeCompany?.name}</span>
                    <ChevronDown className="w-3 h-3 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuLabel className="text-[10px] uppercase text-muted-foreground">Switch Organization</DropdownMenuLabel>
                  {userCompanies.map(c => (
                    <DropdownMenuItem 
                      key={c.id} 
                      onClick={() => setActiveCompany(c.id)}
                      className={c.id === activeCompanyId ? "bg-primary/5 font-bold" : ""}
                    >
                      <Building2 className="w-4 h-4 mr-2 opacity-50" />
                      {c.name}
                      <span className="ml-auto text-[10px] bg-muted px-1.5 rounded">{c.base_currency}</span>
                    </DropdownMenuItem>
                  ))}
                  {currentUser.role === 'ADMIN' && (
                    <>
                      <DropdownMenuSeparator />
                      <Link href="/admin/companies">
                        <DropdownMenuItem>
                          <Settings className="w-4 h-4 mr-2" />
                          Manage Companies
                        </DropdownMenuItem>
                      </Link>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            
            <div className="hidden md:flex items-center space-x-1">
              <NavLink href="/dashboard" active={isActive('/dashboard')}>
                <LayoutDashboard className="w-4 h-4" /> Dashboard
              </NavLink>
              <NavLink href="/expenses/new" active={isActive('/expenses/new')}>
                <PlusCircle className="w-4 h-4" /> New Claim
              </NavLink>
              {(currentUser?.role === 'ADMIN' || currentUser?.role === 'MANAGER') && (
                <NavLink href="/approvals" active={isActive('/approvals')}>
                  <CheckCircle className="w-4 h-4" /> Approvals
                </NavLink>
              )}
              {currentUser?.role === 'ADMIN' && (
                <NavLink href="/admin/users" active={isActive('/admin/users')}>
                  <Users className="w-4 h-4" /> Users
                </NavLink>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative flex items-center gap-2 hover:bg-muted p-1 h-10 px-2 rounded-full">
                  <Avatar className="h-8 w-8 border">
                    <AvatarImage src={`https://picsum.photos/seed/${currentUser?.id}/40/40`} />
                    <AvatarFallback>{currentUser?.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:flex flex-col items-start pr-2">
                    <span className="text-sm font-bold leading-none">{currentUser?.name}</span>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{currentUser?.role}</span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>Demo User Profiles</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {users.map((user) => (
                  <DropdownMenuItem key={user.id} onClick={() => setCurrentUser(user)} className="cursor-pointer py-2">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={`https://picsum.photos/seed/${user.id}/30/30`} />
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className={user.id === currentUser?.id ? "font-bold text-primary" : "text-sm"}>{user.name}</span>
                        <span className="text-[10px] text-muted-foreground">{user.role} ({user.company_ids.length} Orgs)</span>
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive py-3">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}

function NavLink({ href, children, active }: { href: string, children: React.ReactNode, active: boolean }) {
  return (
    <Link 
      href={href} 
      className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
        active 
          ? "bg-primary/10 text-primary" 
          : "text-muted-foreground hover:bg-muted hover:text-primary"
      }`}
    >
      {children}
    </Link>
  );
}