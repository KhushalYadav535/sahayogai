'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils/formatters';
import { Users, TrendingUp, ArrowLeft, BarChart3 } from 'lucide-react';
import { reportsApi, setApiToken } from '@/lib/api';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
    PieChart, Pie, Cell,
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function MemberAnalyticsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [analytics, setAnalytics] = useState<any>(null);

    useEffect(() => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('sahayog-token') : null;
        if (token) setApiToken(token);
        let cancelled = false;
        setLoading(true);
        setError(null);
        reportsApi.memberAnalytics(token || undefined)
            .then((res) => {
                if (cancelled) return;
                if (res.success) {
                    setAnalytics(res);
                } else {
                    setError('Failed to load analytics');
                }
            })
            .catch((e) => {
                if (!cancelled) {
                    setError(e instanceof Error ? e.message : 'Failed to load');
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => { cancelled = true; };
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <p className="text-muted-foreground">Loading member analytics...</p>
            </div>
        );
    }

    if (error || !analytics) {
        return (
            <div className="space-y-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="w-4 h-4" />
                </Button>
                <p className="text-muted-foreground">{error || 'Failed to load analytics'}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="w-4 h-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <BarChart3 className="w-6 h-6" /> Member Analytics (BI-008)
                    </h1>
                    <p className="text-muted-foreground text-sm">Comprehensive member insights and trends</p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Members', value: analytics.summary?.totalMembers || 0, icon: Users },
                    { label: 'Active Members', value: analytics.summary?.activeMembers || 0, icon: TrendingUp },
                    { label: 'New This Week', value: analytics.summary?.newMembersThisWeek || 0, icon: Users },
                    { label: 'Growth Rate', value: analytics.summary?.growthRate || '0%', icon: TrendingUp },
                ].map(({ label, value, icon: Icon }) => (
                    <Card key={label}>
                        <CardContent className="pt-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-muted-foreground">{label}</p>
                                    <p className="text-xl font-bold mt-1">{value}</p>
                                </div>
                                <Icon className="w-8 h-8 text-muted-foreground opacity-50" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader><CardTitle>Members by Status</CardTitle></CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie
                                    data={analytics.byStatus || []}
                                    dataKey="count"
                                    nameKey="status"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                    label={(entry) => `${entry.status}: ${entry.count}`}
                                >
                                    {(analytics.byStatus || []).map((_: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Members by Gender</CardTitle></CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={analytics.byGender || []}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="gender" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="count" fill="#3b82f6" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* KYC Status */}
            <Card>
                <CardHeader><CardTitle>KYC Status Distribution</CardTitle></CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {(analytics.kycStatus || []).map((item: any) => (
                            <div key={item.status} className="text-center p-4 rounded-lg border">
                                <p className="text-2xl font-bold">{item.count}</p>
                                <p className="text-sm text-muted-foreground capitalize">{item.status}</p>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Top Members */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader><CardTitle>Top 10 Members by Savings</CardTitle></CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Member</TableHead>
                                    <TableHead className="text-right">Balance</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {(analytics.topMembersBySavings || []).map((m: any, idx: number) => (
                                    <TableRow key={idx}>
                                        <TableCell>
                                            <div>
                                                <p className="font-medium">{m.memberName}</p>
                                                <p className="text-xs text-muted-foreground">{m.memberNumber}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            {formatCurrency(m.balance, 0)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Top 10 Members by Loan Outstanding</CardTitle></CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Member</TableHead>
                                    <TableHead className="text-right">Outstanding</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {(analytics.topMembersByLoans || []).map((m: any, idx: number) => (
                                    <TableRow key={idx}>
                                        <TableCell>
                                            <div>
                                                <p className="font-medium">{m.memberName}</p>
                                                <p className="text-xs text-muted-foreground">{m.memberNumber}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            {formatCurrency(m.outstanding, 0)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
