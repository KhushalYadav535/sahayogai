'use client';

import React, { useState } from 'react';
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
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Database,
  CreditCard,
  PiggyBank,
  Shield,
  Landmark,
  Search,
  UserX,
  UserCheck,
  TrendingDown,
  RefreshCw,
  Building2,
  Send,
  Map,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter, usePathname } from 'next/navigation';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  requiredRoles?: UserRole[];
  requiredPermissions?: Permission[];
  tenantOnly?: boolean;  // hide for platform admin (superadmin)
  platformOnly?: boolean;  // show only for platform admin
  badge?: number;
  children?: NavItem[];
}

const navigationItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: <LayoutDashboard className="w-5 h-5" />,
    tenantOnly: true,
  },
  {
    label: 'Members',
    href: '/dashboard/members',
    icon: <Users className="w-5 h-5" />,
    requiredPermissions: [Permission.MEMBER_VIEW],
    tenantOnly: true,
    children: [
      { label: 'All Members', href: '/dashboard/members', icon: <Users className="w-4 h-4" /> },
      { label: 'Minor Conversion', href: '/dashboard/members/minor-conversion', icon: <UserCheck className="w-4 h-4" /> },
    ],
  },
  {
    label: 'Savings Accounts',
    href: '/dashboard/accounts',
    icon: <Wallet className="w-5 h-5" />,
    requiredPermissions: [Permission.ACCOUNT_VIEW],
    tenantOnly: true,
    children: [
      { label: 'All Accounts', href: '/dashboard/accounts', icon: <Wallet className="w-4 h-4" /> },
      { label: 'Transfer', href: '/dashboard/accounts/transfer', icon: <CreditCard className="w-4 h-4" /> },
    ],
  },
  {
    label: 'Loans',
    href: '/dashboard/loans',
    icon: <Banknote className="w-5 h-5" />,
    requiredPermissions: [Permission.LOAN_VIEW],
    tenantOnly: true,
    children: [
      { label: 'All Loans', href: '/dashboard/loans', icon: <Banknote className="w-4 h-4" /> },
      { label: 'New Application', href: '/dashboard/loans/new', icon: <FileText className="w-4 h-4" />, requiredPermissions: [Permission.LOAN_CREATE] },
      { label: 'EMI Collection', href: '/dashboard/loans/emi-collection', icon: <CreditCard className="w-4 h-4" />, requiredPermissions: [Permission.LOAN_REPAY] },
      { label: 'Write-Off & Recovery', href: '/dashboard/loans/write-off', icon: <TrendingDown className="w-4 h-4" /> },
    ],
  },
  {
    label: 'Deposits',
    href: '/dashboard/deposits',
    icon: <PiggyBank className="w-5 h-5" />,
    requiredPermissions: [Permission.DEPOSIT_VIEW],
    children: [
      { label: 'All Deposits', href: '/dashboard/deposits', icon: <PiggyBank className="w-4 h-4" /> },
      { label: 'New Deposit', href: '/dashboard/deposits/new', icon: <FileText className="w-4 h-4" />, requiredPermissions: [Permission.DEPOSIT_CREATE] },
      { label: 'Maturity Queue', href: '/dashboard/deposits/maturity', icon: <TrendingUp className="w-4 h-4" /> },
      { label: 'TDS Management', href: '/dashboard/deposits/tds', icon: <Shield className="w-4 h-4" /> },
    ],
  },
  {
    label: 'Accounting',
    href: '/dashboard/accounting/coa',
    icon: <BarChart3 className="w-5 h-5" />,
    requiredRoles: [UserRole.ACCOUNTANT, UserRole.SENIOR_ACCOUNTANT, UserRole.SOCIETY_ADMIN],
    tenantOnly: true,
    children: [
      { label: 'Chart of Accounts', href: '/dashboard/accounting/coa', icon: <Database className="w-4 h-4" /> },
      { label: 'Journal Entries', href: '/dashboard/accounting/journal', icon: <FileText className="w-4 h-4" /> },
      { label: 'Trial Balance', href: '/dashboard/accounting/trial-balance', icon: <BarChart3 className="w-4 h-4" /> },
      { label: 'Balance Sheet', href: '/dashboard/accounting/balance-sheet', icon: <Landmark className="w-4 h-4" /> },
      { label: 'P&L Statement', href: '/dashboard/accounting/pl', icon: <TrendingUp className="w-4 h-4" /> },
      { label: 'GL Posting Matrix', href: '/dashboard/accounting/gl-posting-matrix', icon: <Database className="w-4 h-4" /> },
      { label: 'Day-End Process', href: '/dashboard/accounting/day-end', icon: <CheckSquare className="w-4 h-4" /> },
      { label: 'Month-End Close', href: '/dashboard/accounting/month-end', icon: <CheckSquare className="w-4 h-4" /> },
      { label: 'Reversal Entries', href: '/dashboard/accounting/reversal', icon: <TrendingUp className="w-4 h-4" /> },
      { label: 'Suspense Accounts', href: '/dashboard/accounting/suspense', icon: <AlertTriangle className="w-4 h-4" /> },
      { label: 'Bank Reconciliation', href: '/dashboard/accounting/bank-reconciliation', icon: <RefreshCw className="w-4 h-4" /> },
    ],
  },
  {
    label: 'Governance',
    href: '/dashboard/governance',
    icon: <FileText className="w-5 h-5" />,
    requiredPermissions: [Permission.GOVERNANCE_VIEW],
    tenantOnly: true,
  },
  {
    label: 'Compliance',
    href: '/dashboard/compliance/reports',
    icon: <Shield className="w-5 h-5" />,
    requiredPermissions: [Permission.COMPLIANCE_VIEW],
    tenantOnly: true,
    children: [
      { label: 'Reports Hub', href: '/dashboard/compliance/reports', icon: <FileText className="w-4 h-4" /> },
      { label: 'NABARD Report', href: '/dashboard/compliance/nabard-report', icon: <Building2 className="w-4 h-4" /> },
      { label: 'Registrar Return', href: '/dashboard/compliance/registrar-return', icon: <Send className="w-4 h-4" /> },
      { label: 'TDS 26Q Filing', href: '/dashboard/compliance/tds-26q', icon: <FileText className="w-4 h-4" /> },
      { label: 'STR Queue', href: '/dashboard/compliance/str', icon: <AlertTriangle className="w-4 h-4" />, requiredPermissions: [Permission.STR_GENERATE] },
      { label: 'AML Monitor', href: '/dashboard/compliance/aml', icon: <Shield className="w-4 h-4" />, requiredPermissions: [Permission.COMPLIANCE_EDIT] },
    ],
  },
  {
    label: 'Reports & BI',
    href: '/dashboard/reports/custom',
    icon: <BarChart3 className="w-5 h-5" />,
    requiredRoles: [UserRole.PRESIDENT, UserRole.ACCOUNTANT, UserRole.SOCIETY_ADMIN],
    tenantOnly: true,
    children: [
      { label: 'Custom Report Builder', href: '/dashboard/reports/custom', icon: <BarChart3 className="w-4 h-4" /> },
      { label: 'Predictive Risk', href: '/dashboard/reports/risk', icon: <Shield className="w-4 h-4" /> },
      { label: 'NPA Trend', href: '/dashboard/reports/npa-trend', icon: <TrendingDown className="w-4 h-4" /> },
      { label: 'Loan Portfolio Map', href: '/dashboard/reports/loan-heatmap', icon: <Map className="w-4 h-4" /> },
    ],
  },
  {
    label: 'Approvals',
    href: '/dashboard/approvals',
    icon: <CheckSquare className="w-5 h-5" />,
    requiredRoles: [UserRole.SENIOR_ACCOUNTANT, UserRole.ACCOUNTANT, UserRole.SOCIETY_ADMIN],
    badge: 3,
    tenantOnly: true,
  },
  {
    label: 'AI Alerts',
    href: '/dashboard/ai/alerts',
    icon: <Zap className="w-5 h-5" />,
    requiredPermissions: [Permission.MEMBER_VIEW],
    tenantOnly: true,
  },
  {
    label: 'Cash Flow',
    href: '/dashboard/ai/cash-flow',
    icon: <TrendingUp className="w-5 h-5" />,
    requiredRoles: [UserRole.PRESIDENT, UserRole.ACCOUNTANT, UserRole.SOCIETY_ADMIN],
    tenantOnly: true,
  },
  {
    label: 'AI Models',
    href: '/dashboard/ai/models',
    icon: <Bot className="w-5 h-5" />,
    requiredRoles: [UserRole.PLATFORM_ADMIN],
    platformOnly: true,
  },
  {
    label: 'Settings',
    href: '/dashboard/settings/parameters',
    icon: <Settings className="w-5 h-5" />,
    requiredRoles: [UserRole.SOCIETY_ADMIN, UserRole.PLATFORM_ADMIN],
    tenantOnly: true,
    children: [
      { label: 'Parameters', href: '/dashboard/settings/parameters', icon: <Settings className="w-4 h-4" /> },
      { label: 'MDA Rules', href: '/dashboard/settings/mda-rules', icon: <Shield className="w-4 h-4" /> },
      { label: 'Users', href: '/dashboard/settings/users', icon: <Users className="w-4 h-4" /> },
      { label: 'Billing & Plan', href: '/dashboard/settings/billing', icon: <CreditCard className="w-4 h-4" /> },
      { label: 'Notifications', href: '/dashboard/settings/notifications', icon: <Zap className="w-4 h-4" /> },
      { label: 'Audit Log', href: '/dashboard/settings/audit-log', icon: <FileText className="w-4 h-4" /> },
    ],
  },
  {
    label: 'Admin',
    href: '/admin/tenants',
    icon: <Landmark className="w-5 h-5" />,
    requiredRoles: [UserRole.PLATFORM_ADMIN],
    platformOnly: true,
    children: [
      { label: 'Tenants', href: '/admin/tenants', icon: <Users className="w-4 h-4" /> },
      { label: 'Billing', href: '/admin/billing', icon: <CreditCard className="w-4 h-4" /> },
      { label: 'Platform Rules', href: '/admin/rules', icon: <Shield className="w-4 h-4" /> },
    ],
  },
];

function NavItemComponent({ item, depth = 0 }: { item: NavItem; depth?: number }) {
  const { user, hasPermission, hasRole } = useAuth();
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(() => {
    if (!item.children) return false;
    return item.children.some(c => pathname.startsWith(c.href)) || pathname.startsWith(item.href);
  });

  const isPlatformAdmin = user?.role === UserRole.PLATFORM_ADMIN;
  if (item.tenantOnly && isPlatformAdmin) return null;
  if (item.platformOnly && !isPlatformAdmin) return null;
  if (item.requiredRoles && item.requiredRoles.length > 0 && !hasRole(item.requiredRoles)) return null;
  if (item.requiredPermissions && item.requiredPermissions.length > 0 && !item.requiredPermissions.some(p => hasPermission(p))) return null;

  const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

  if (item.children) {
    return (
      <li>
        <button
          onClick={() => setExpanded(!expanded)}
          className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
            }`}
        >
          {item.icon}
          <span className="flex-1 text-left">{item.label}</span>
          {item.badge && (
            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
              {item.badge}
            </span>
          )}
          {expanded ? <ChevronDown className="w-4 h-4 opacity-50" /> : <ChevronRight className="w-4 h-4 opacity-50" />}
        </button>
        {expanded && (
          <ul className="ml-4 mt-1 space-y-1 border-l border-sidebar-border pl-3">
            {item.children.map(child => (
              <NavItemComponent key={child.href} item={child} depth={depth + 1} />
            ))}
          </ul>
        )}
      </li>
    );
  }

  return (
    <li>
      <Link
        href={item.href}
        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
          }`}
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
  );
}

export function Sidebar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <>
      {/* Mobile toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button variant="ghost" size="icon" onClick={() => setOpen(!open)}>
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {open && (
        <div className="fixed inset-0 bg-black/50 lg:hidden z-30" onClick={() => setOpen(false)} />
      )}

      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-sidebar border-r border-sidebar-border z-40 transform transition-transform duration-300 lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 border-b border-sidebar-border flex-shrink-0">
            <Link href={user?.role === UserRole.PLATFORM_ADMIN ? '/admin/tenants' : '/dashboard'} className="flex items-center gap-2 font-bold text-lg">
              <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
                <span className="text-sidebar-primary-foreground font-bold">SA</span>
              </div>
              <span className="text-sidebar-foreground">Sahayog AI</span>
            </Link>
          </div>

          {/* User info */}
          {user && (
            <div className="p-4 border-b border-sidebar-border flex-shrink-0">
              <p className="text-xs text-sidebar-accent-foreground font-semibold mb-1">Logged in as</p>
              <p className="text-sm font-medium text-sidebar-foreground truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.role}</p>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-3" onClick={() => setOpen(false)}>
            <ul className="space-y-1">
              {navigationItems.map(item => (
                <NavItemComponent key={item.href} item={item} />
              ))}
            </ul>
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-sidebar-border flex-shrink-0">
            <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
              <LogOut className="w-5 h-5 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
