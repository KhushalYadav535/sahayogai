'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/providers/auth-provider';
import { UserRole, Permission } from '@/lib/types/auth';
import {
  LayoutDashboard,
  Users,
  Wallet,
  Banknote,
  TrendingUp,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  Bot,
  Zap,
  CheckSquare,
  BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  requiredRoles?: UserRole[];
  requiredPermissions?: Permission[];
  badge?: number;
}

const navigationItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: <LayoutDashboard className="w-5 h-5" />,
  },
  {
    label: 'Members',
    href: '/dashboard/members',
    icon: <Users className="w-5 h-5" />,
    requiredPermissions: [Permission.MEMBER_VIEW],
  },
  {
    label: 'Loans',
    href: '/dashboard/loans',
    icon: <Banknote className="w-5 h-5" />,
    requiredPermissions: [Permission.LOAN_VIEW],
  },
  {
    label: 'Savings & Deposits',
    href: '/dashboard/accounts',
    icon: <Wallet className="w-5 h-5" />,
    requiredPermissions: [Permission.ACCOUNT_VIEW, Permission.DEPOSIT_VIEW],
  },
  {
    label: 'Governance',
    href: '/dashboard/governance',
    icon: <FileText className="w-5 h-5" />,
    requiredPermissions: [Permission.GOVERNANCE_VIEW],
  },
  {
    label: 'Compliance',
    href: '/dashboard/compliance/reports',
    icon: <TrendingUp className="w-5 h-5" />,
    requiredPermissions: [Permission.COMPLIANCE_VIEW],
  },
  {
    label: 'Approvals',
    href: '/dashboard/approvals',
    icon: <CheckSquare className="w-5 h-5" />,
    requiredRoles: [UserRole.SENIOR_ACCOUNTANT, UserRole.ACCOUNTANT, UserRole.SOCIETY_ADMIN],
    badge: 3,
  },
  {
    label: 'Accounting',
    href: '/dashboard/accounting/coa',
    icon: <BarChart3 className="w-5 h-5" />,
    requiredRoles: [UserRole.ACCOUNTANT, UserRole.SENIOR_ACCOUNTANT, UserRole.SOCIETY_ADMIN],
  },
  {
    label: 'AI Alerts',
    href: '/dashboard/ai/alerts',
    icon: <Zap className="w-5 h-5" />,
    requiredPermissions: [Permission.MEMBER_VIEW],
  },
  {
    label: 'Cash Flow Forecast',
    href: '/dashboard/ai/cash-flow',
    icon: <TrendingUp className="w-5 h-5" />,
    requiredRoles: [UserRole.PRESIDENT, UserRole.ACCOUNTANT, UserRole.SOCIETY_ADMIN],
  },
  {
    label: 'AI Models',
    href: '/dashboard/ai/models',
    icon: <Bot className="w-5 h-5" />,
    requiredRoles: [UserRole.PLATFORM_ADMIN],
  },
  {
    label: 'Settings',
    href: '/dashboard/settings',
    icon: <Settings className="w-5 h-5" />,
    requiredRoles: [UserRole.SOCIETY_ADMIN, UserRole.PLATFORM_ADMIN],
  },
];

export function Sidebar() {
  const { user, hasPermission, hasRole, logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const visibleItems = navigationItems.filter((item) => {
    if (item.requiredRoles && item.requiredRoles.length > 0) {
      if (!hasRole(item.requiredRoles)) return false;
    }
    if (item.requiredPermissions && item.requiredPermissions.length > 0) {
      return item.requiredPermissions.some((perm) => hasPermission(perm));
    }
    return true;
  });

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <>
      {/* Mobile toggle button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setOpen(!open)}
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* Overlay for mobile */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 lg:hidden z-30"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-sidebar border-r border-sidebar-border z-40 transform transition-transform duration-300 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 border-b border-sidebar-border">
            <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg">
              <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
                <span className="text-sidebar-primary-foreground font-bold">SA</span>
              </div>
              <span className="text-sidebar-foreground">Sahayog</span>
            </Link>
          </div>

          {/* User info */}
          {user && (
            <div className="p-4 border-b border-sidebar-border">
              <p className="text-xs text-sidebar-accent-foreground font-semibold mb-1">Logged in as</p>
              <p className="text-sm font-medium text-sidebar-foreground truncate">{user.name}</p>
              <p className="text-xs text-sidebar-muted-foreground">{user.role}</p>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-2">
              {visibleItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                    onClick={() => setOpen(false)}
                  >
                    {item.icon}
                    <span className="flex-1">{item.label}</span>
                    {item.badge && (
                      <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Logout button */}
          <div className="p-4 border-t border-sidebar-border">
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
