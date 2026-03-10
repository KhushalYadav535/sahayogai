'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { ThemeToggle } from '@/components/theme-toggle';
import { ChatWidget } from '@/components/ai/chat-widget';
import { GlobalSearch } from '@/components/common/global-search';
import { NotificationBell } from '@/components/common/notification-panel';
import { useAuth } from '@/components/providers/auth-provider';
import { UserRole } from '@/lib/types/auth';
import { ChevronDown, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  // Ctrl+K global shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Sidebar />
        <ChatWidget />
        <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />

        {/* Main content */}
        <div className="lg:ml-64">
          {/* Header */}
          <header className="sticky top-0 bg-background/80 backdrop-blur-xl border-b border-border/40 z-30 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
            <div className="flex items-center justify-between h-16 px-4 sm:px-6">
              <div className="flex-1" />

              {/* Right side */}
              <div className="flex items-center gap-2">
                {/* Global Search Button */}
                <Button
                  variant="outline"
                  size="sm"
                  className="hidden sm:flex items-center gap-2 text-muted-foreground text-sm w-52 rounded-xl border-border/60 bg-muted/30 hover:bg-muted/50"
                  onClick={() => setSearchOpen(true)}
                >
                  <Search className="w-4 h-4" />
                  <span className="flex-1 text-left">Search...</span>
                  <kbd className="font-mono text-[10px] bg-background px-1.5 py-0.5 rounded-md border border-border/60 text-muted-foreground/70">⌘K</kbd>
                </Button>

                {/* Notifications */}
                <NotificationBell />

                {/* Theme toggle */}
                <ThemeToggle />

                {/* User menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="gap-2 rounded-xl hover:bg-muted/50">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-sm">
                        <span className="text-xs font-bold text-white">
                          {user?.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="hidden sm:inline text-sm font-medium">{user?.name}</span>
                      <ChevronDown className="w-4 h-4 opacity-40" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 rounded-xl">
                    <DropdownMenuItem disabled className="py-3">
                      <div>
                        <p className="text-sm font-semibold">{user?.name}</p>
                        <p className="text-xs text-muted-foreground">{user?.role?.replace(/_/g, ' ')}</p>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="cursor-pointer rounded-lg">
                      <a href="/dashboard/settings/users">Settings</a>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer rounded-lg text-destructive focus:text-destructive">
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="p-4 sm:p-6">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
