'use client';

import React from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { ThemeToggle } from '@/components/theme-toggle';
import { ChatWidget } from '@/components/ai/chat-widget';
import { useAuth } from '@/components/providers/auth-provider';
import { Bell, ChevronDown } from 'lucide-react';
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

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Sidebar />
        <ChatWidget />

        {/* Main content */}
        <div className="lg:ml-64">
          {/* Header */}
          <header className="sticky top-0 bg-background border-b border-border z-30">
            <div className="flex items-center justify-between h-16 px-4 sm:px-6">
              {/* Spacer for mobile */}
              <div className="flex-1" />

              {/* Right side */}
              <div className="flex items-center gap-4">
                {/* Notifications */}
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                </Button>

                {/* Theme toggle */}
                <ThemeToggle />

                {/* User menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                        <span className="text-xs font-bold text-primary-foreground">
                          {user?.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="hidden sm:inline text-sm font-medium">{user?.name}</span>
                      <ChevronDown className="w-4 h-4 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem disabled>
                      <div>
                        <p className="text-sm font-medium">{user?.name}</p>
                        <p className="text-xs text-muted-foreground">{user?.role}</p>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <a href="/settings">Settings</a>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleLogout}>
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
