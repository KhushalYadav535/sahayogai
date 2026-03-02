'use client';

import React from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { useAuth } from '@/components/providers/auth-provider';
import { UserRole } from '@/lib/types/auth';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { Building2, CreditCard, Shield, ChevronDown, BarChart3, Settings } from 'lucide-react';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { usePathname } from 'next/navigation';

const ADMIN_NAV = [
    { label: 'Tenants', href: '/admin/tenants', icon: Building2 },
    { label: 'Billing', href: '/admin/billing', icon: CreditCard },
    { label: 'Usage', href: '/admin/usage', icon: BarChart3 },
    { label: 'Platform Config', href: '/admin/config', icon: Settings },
    { label: 'Platform Rules', href: '/admin/rules', icon: Shield },
];

function AdminGuard({ children }: { children: React.ReactNode }) {
    const { hasRole } = useAuth();
    if (!hasRole([UserRole.PLATFORM_ADMIN])) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center space-y-3">
                    <Shield className="w-12 h-12 text-red-500 mx-auto" />
                    <h2 className="text-xl font-bold">Access Denied</h2>
                    <p className="text-muted-foreground">Platform Administrator role required.</p>
                    <Button asChild><Link href="/dashboard">Back to Dashboard</Link></Button>
                </div>
            </div>
        );
    }
    return <>{children}</>;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user, logout } = useAuth();
    const pathname = usePathname();

    return (
        <ProtectedRoute>
            <AdminGuard>
                <div className="min-h-screen bg-background">
                    {/* Admin header */}
                    <header className="h-14 border-b border-border bg-card sticky top-0 z-40 flex items-center px-6 gap-4">
                        <Link href="/admin/tenants" className="flex items-center gap-2 font-bold text-primary">
                            <Shield className="w-5 h-5" /><span>SahayogAI Platform Admin</span>
                        </Link>
                        <nav className="flex gap-1 ml-4">
                            {ADMIN_NAV.map(nav => {
                                const Icon = nav.icon;
                                const active = pathname.startsWith(nav.href);
                                return (
                                    <Link key={nav.href} href={nav.href} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}>
                                        <Icon className="w-4 h-4" />{nav.label}
                                    </Link>
                                );
                            })}
                        </nav>
                        <div className="ml-auto flex items-center gap-2">
                            <ThemeToggle />
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="gap-2">
                                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground">{user?.name?.charAt(0)}</div>
                                        {user?.name}<ChevronDown className="w-3 h-3" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    {user?.role !== UserRole.PLATFORM_ADMIN && (
                                        <DropdownMenuItem asChild><Link href="/dashboard">Switch to Dashboard</Link></DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem onClick={() => logout()}>Logout</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </header>
                    <main className="p-6">{children}</main>
                </div>
            </AdminGuard>
        </ProtectedRoute>
    );
}
