"use client"

import Link from 'next/link';
import { useStore, User } from '@/app/lib/store';
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
  Activity
} from 'lucide-react';

export function Navbar() {
  const { currentUser, setCurrentUser, users } = useStore();

  return (
    <nav className="border-b bg-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold group-hover:scale-105 transition-transform">
                RF
              </div>
              <span className="text-xl font-bold text-primary tracking-tight">ReimburseFlow</span>
            </Link>
            
            <div className="hidden md:flex items-center space-x-4">
              <Link href="/dashboard" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>
              <Link href="/expenses/new" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                <PlusCircle className="w-4 h-4" />
                New Expense
              </Link>
              {(currentUser?.role === 'ADMIN' || currentUser?.role === 'MANAGER' || currentUser?.role === 'FINANCE') && (
                <Link href="/approvals" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                  <CheckCircle className="w-4 h-4" />
                  Approvals
                </Link>
              )}
              {currentUser?.role === 'ADMIN' && (
                <Link href="/admin/workflow" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                  <Settings className="w-4 h-4" />
                  Workflow
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative flex items-center gap-2 hover:bg-muted p-1">
                  <Avatar className="h-8 w-8 border">
                    <AvatarImage src={`https://picsum.photos/seed/${currentUser?.id}/40/40`} />
                    <AvatarFallback>{currentUser?.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:flex flex-col items-start">
                    <span className="text-sm font-medium leading-none">{currentUser?.name}</span>
                    <span className="text-[10px] text-muted-foreground uppercase">{currentUser?.role}</span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Switch User Role (Demo)</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {users.map((user) => (
                  <DropdownMenuItem key={user.id} onClick={() => setCurrentUser(user)} className="cursor-pointer">
                    <div className="flex flex-col">
                      <span className={user.id === currentUser?.id ? "font-bold text-primary" : ""}>{user.name}</span>
                      <span className="text-xs text-muted-foreground">{user.role}</span>
                    </div>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive">
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