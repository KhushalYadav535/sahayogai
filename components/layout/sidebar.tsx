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
  Bell,
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
  Hash,
  Clock,
  Lock,
  Percent,
  History,
  Camera,
  PenTool,
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
      { label: 'Photo Approvals', href: '/dashboard/members/photo-approvals', icon: <Camera className="w-4 h-4" />, requiredRoles: [UserRole.SECRETARY, UserRole.SOCIETY_ADMIN, UserRole.PRESIDENT] },
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
      { label: 'Open Account', href: '/dashboard/accounts/new', icon: <FileText className="w-4 h-4" />, requiredPermissions: [Permission.ACCOUNT_CREATE] },
      { label: 'Transfer', href: '/dashboard/accounts/transfer', icon: <CreditCard className="w-4 h-4" />, requiredPermissions: [Permission.ACCOUNT_DEPOSIT] },
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
      { label: 'Loan Products', href: '/dashboard/loans/products', icon: <FileText className="w-4 h-4" />, requiredPermissions: [Permission.LOAN_CREATE] },
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
      { label: 'Account Closure', href: '/dashboard/deposits/close', icon: <UserX className="w-4 h-4" />, requiredPermissions: [Permission.DEPOSIT_VIEW] },
      { label: 'TDS Management', href: '/dashboard/deposits/tds', icon: <Shield className="w-4 h-4" /> },
    ],
  },
  {
    label: 'Interest Rates',
    href: '/dashboard/interest-rates',
    icon: <Percent className="w-5 h-5" />,
    requiredRoles: [UserRole.ACCOUNTANT, UserRole.SENIOR_ACCOUNTANT, UserRole.SOCIETY_ADMIN, UserRole.PRESIDENT],
    tenantOnly: true,
    children: [
      { label: 'Rate Schemes', href: '/dashboard/interest-rates', icon: <Percent className="w-4 h-4" /> },
      { label: 'Audit Trail', href: '/dashboard/interest-rates/audit-trail', icon: <History className="w-4 h-4" />, requiredRoles: [UserRole.AUDITOR, UserRole.COMPLIANCE_OFFICER, UserRole.SOCIETY_ADMIN, UserRole.PRESIDENT] },
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
      { label: 'Anomaly Alerts', href: '/dashboard/accounting/anomaly-alerts', icon: <AlertTriangle className="w-4 h-4" />, requiredRoles: [UserRole.SENIOR_ACCOUNTANT, UserRole.COMPLIANCE_OFFICER] },
      { label: 'Month-End Close', href: '/dashboard/accounting/month-end', icon: <CheckSquare className="w-4 h-4" /> },
      { label: 'Reversal Entries', href: '/dashboard/accounting/reversal', icon: <TrendingUp className="w-4 h-4" /> },
      { label: 'Audit Adjustments', href: '/dashboard/accounting/audit-adjustments', icon: <Shield className="w-4 h-4" /> },
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
    href: '/dashboard/compliance/dashboard',
    icon: <Shield className="w-5 h-5" />,
    requiredPermissions: [Permission.COMPLIANCE_VIEW],
    tenantOnly: true,
    children: [
      { label: 'Dashboard', href: '/dashboard/compliance/dashboard', icon: <BarChart3 className="w-4 h-4" /> },
      { label: 'AI Audit Log', href: '/dashboard/compliance/ai-audit-log', icon: <FileText className="w-4 h-4" /> },
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
    requiredRoles: [UserRole.PRESIDENT, UserRole.ACCOUNTANT, UserRole.SOCIETY_ADMIN, UserRole.SECRETARY],
    tenantOnly: true,
    children: [
      { label: 'Director KPI Dashboard', href: '/dashboard/reports/director-kpi', icon: <BarChart3 className="w-4 h-4" />, requiredRoles: [UserRole.PRESIDENT] },
      { label: 'Custom Report Builder', href: '/dashboard/reports/custom', icon: <BarChart3 className="w-4 h-4" /> },
      { label: 'Predictive Risk', href: '/dashboard/reports/risk', icon: <Shield className="w-4 h-4" /> },
      { label: 'NPA Trend', href: '/dashboard/reports/npa-trend', icon: <TrendingDown className="w-4 h-4" /> },
      { label: 'Loan Portfolio Map', href: '/dashboard/reports/loan-heatmap', icon: <Map className="w-4 h-4" /> },
      { label: 'Member Analytics', href: '/dashboard/reports/member-analytics', icon: <Users className="w-4 h-4" />, requiredRoles: [UserRole.PRESIDENT, UserRole.SECRETARY] },
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
    label: 'AI',
    href: '/dashboard/ai/alerts',
    icon: <Bot className="w-5 h-5" />,
    tenantOnly: true,
    children: [
      { label: 'AI Alerts', href: '/dashboard/ai/alerts', icon: <Zap className="w-4 h-4" /> },
      { label: 'Sahayog Saathi', href: '/dashboard/ai/chat', icon: <Bot className="w-4 h-4" /> },
      { label: 'Compliance Alerts', href: '/dashboard/ai/compliance-alerts', icon: <Bell className="w-4 h-4" /> },
    ],
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
    label: 'Risk & Controls',
    href: '/dashboard/risk-controls',
    icon: <Shield className="w-5 h-5" />,
    requiredRoles: [UserRole.SOCIETY_ADMIN, UserRole.PLATFORM_ADMIN],
    tenantOnly: true,
    children: [
      { label: 'Overview', href: '/dashboard/risk-controls', icon: <Shield className="w-4 h-4" /> },
      { label: 'Sessions', href: '/dashboard/risk-controls/sessions', icon: <Users className="w-4 h-4" /> },
      { label: 'Daily Limits', href: '/dashboard/risk-controls/daily-limits', icon: <CreditCard className="w-4 h-4" /> },
      { label: 'Password', href: '/dashboard/risk-controls/password', icon: <Lock className="w-4 h-4" /> },
      { label: 'AML Alerts', href: '/dashboard/risk-controls/aml-alerts', icon: <AlertTriangle className="w-4 h-4" /> },
      { label: 'Backup Verification', href: '/dashboard/risk-controls/backup-verification', icon: <Database className="w-4 h-4" /> },
      { label: 'Hash Chain', href: '/dashboard/risk-controls/hash-chain', icon: <Hash className="w-4 h-4" /> },
      { label: 'Data Retention', href: '/dashboard/risk-controls/data-retention', icon: <Clock className="w-4 h-4" /> },
    ],
  },
  {
    label: 'Security & RBAC',
    href: '/dashboard/security',
    icon: <Shield className="w-5 h-5" />,
    requiredRoles: [UserRole.SOCIETY_ADMIN, UserRole.PLATFORM_ADMIN],
    tenantOnly: true,
    children: [
      { label: 'MFA Setup', href: '/dashboard/security/mfa', icon: <Lock className="w-4 h-4" /> },
      { label: 'Permissions', href: '/dashboard/security/permissions', icon: <CheckSquare className="w-4 h-4" /> },
      { label: 'Role Assignments', href: '/dashboard/security/roles', icon: <Users className="w-4 h-4" /> },
      { label: 'DPDP Requests', href: '/dashboard/security/dpdp', icon: <FileText className="w-4 h-4" /> },
    ],
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
          className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${isActive
              ? 'bg-gradient-to-r from-primary/10 to-primary/5 text-primary dark:from-primary/20 dark:to-primary/10 dark:text-primary shadow-sm'
              : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground'
            }`}
        >
          <span className={`transition-colors duration-200 ${isActive ? 'text-primary' : 'text-sidebar-foreground/50 group-hover:text-sidebar-foreground/80'}`}>
            {item.icon}
          </span>
          <span className="flex-1 text-left">{item.label}</span>
          {item.badge && (
            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-bold min-w-[20px] shadow-sm">
              {item.badge}
            </span>
          )}
          <ChevronDown className={`w-4 h-4 opacity-40 transition-transform duration-200 ${expanded ? 'rotate-0' : '-rotate-90'}`} />
        </button>
        <div className={`overflow-hidden transition-all duration-300 ease-out ${expanded ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}`}>
          <ul className="ml-4 mt-1 space-y-0.5 border-l-2 border-sidebar-border/50 pl-3 py-1">
            {item.children.map(child => (
              <NavItemComponent key={child.href} item={child} depth={depth + 1} />
            ))}
          </ul>
        </div>
      </li>
    );
  }

  return (
    <li>
      <Link
        href={item.href}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${isActive
            ? 'bg-gradient-to-r from-primary/10 to-primary/5 text-primary dark:from-primary/20 dark:to-primary/10 dark:text-primary shadow-sm'
            : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground'
          }`}
      >
        <span className={`transition-colors duration-200 ${isActive ? 'text-primary' : 'text-sidebar-foreground/50 group-hover:text-sidebar-foreground/80'}`}>
          {item.icon}
        </span>
        <span className="flex-1">{item.label}</span>
        {item.badge && (
          <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-bold min-w-[20px] shadow-sm">
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
        <Button variant="ghost" size="icon" onClick={() => setOpen(!open)} className="bg-card/80 backdrop-blur-sm shadow-lg border border-border/40">
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {open && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm lg:hidden z-30 transition-opacity" onClick={() => setOpen(false)} />
      )}

      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-sidebar border-r border-sidebar-border/60 z-40 transform transition-all duration-300 ease-out lg:translate-x-0 ${open ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
          }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 border-b border-sidebar-border/60 flex-shrink-0">
            <Link href={user?.role === UserRole.PLATFORM_ADMIN ? '/admin/tenants' : '/dashboard'} className="flex items-center gap-3 font-bold text-lg group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-[0_4px_14px_rgba(59,130,246,0.3)] group-hover:shadow-[0_6px_20px_rgba(59,130,246,0.45)] transition-all duration-300">
                <span className="text-white font-bold text-sm">SA</span>
              </div>
              <span className="text-sidebar-foreground tracking-tight">Sahayog <span className="text-primary font-bold">AI</span></span>
            </Link>
          </div>

          {/* User info */}
          {user && (
            <div className="px-4 py-3 border-b border-sidebar-border/60 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  <span className="text-xs font-bold text-primary">{user.name.charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-sidebar-foreground truncate">{user.name}</p>
                  <p className="text-[11px] text-muted-foreground font-medium">{user.role.replace(/_/g, ' ')}</p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-3" onClick={() => setOpen(false)}>
            <ul className="space-y-0.5">
              {navigationItems.map(item => (
                <NavItemComponent key={item.href} item={item} />
              ))}
            </ul>
          </nav>

          {/* Logout */}
          <div className="p-3 border-t border-sidebar-border/60 flex-shrink-0">
            <Button
              variant="ghost"
              className="w-full justify-start rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-all duration-200"
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
