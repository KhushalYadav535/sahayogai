'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Users, Building2, TrendingUp } from 'lucide-react';
import { platformUsageApi } from '@/lib/api';
import { setApiToken } from '@/lib/api';

export default function UsageDashboardPage() {
    const [data, setData] = useState<{ summary: any[]; totals: any; period: string } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('sahayog-token') : null;
        if (token) setApiToken(token);
        platformUsageApi
            .getSummary()
            .then((res) => setData({ summary: res.summary, totals: res.totals, period: res.period }))
            .catch(() => setData(null))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[40vh]">
                <p className="text-muted-foreground">Loading usage data...</p>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="flex items-center justify-center min-h-[40vh]">
                <p className="text-muted-foreground">Failed to load usage data.</p>
            </div>
        );
    }

    const { summary, totals, period } = data;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <BarChart3 className="w-6 h-6" /> Usage Monitoring Dashboard
                </h1>
                <p className="text-muted-foreground text-sm">Cross-tenant aggregate view (period: {period})</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="pt-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Active Tenants</p>
                            <p className="text-2xl font-bold">{totals.totalTenants}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                            <Users className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Total Members</p>
                            <p className="text-2xl font-bold">{totals.totalMembers.toLocaleString('en-IN')}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Total Transactions</p>
                            <p className="text-2xl font-bold">{totals.totalTxns.toLocaleString('en-IN')}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Per-Tenant Usage</CardTitle>
                    <p className="text-sm text-muted-foreground">Member count, transaction volume by tenant</p>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border">
                                    <th className="text-left py-3 font-medium">Tenant</th>
                                    <th className="text-left py-3 font-medium">Plan</th>
                                    <th className="text-right py-3 font-medium">Members</th>
                                    <th className="text-right py-3 font-medium">Transactions</th>
                                    <th className="text-right py-3 font-medium">AI Invocations</th>
                                    <th className="text-right py-3 font-medium">API Calls</th>
                                </tr>
                            </thead>
                            <tbody>
                                {summary.map((row: any) => (
                                    <tr key={row.tenantId} className="border-b border-border/50 hover:bg-muted/30">
                                        <td className="py-2 font-medium">{row.tenantName}</td>
                                        <td className="py-2 capitalize">{row.plan}</td>
                                        <td className="py-2 text-right">{row.memberCount.toLocaleString('en-IN')}</td>
                                        <td className="py-2 text-right">{row.txnVolume.toLocaleString('en-IN')}</td>
                                        <td className="py-2 text-right">{row.aiInvocations?.toLocaleString('en-IN') ?? '—'}</td>
                                        <td className="py-2 text-right">{row.apiCalls?.toLocaleString('en-IN') ?? '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
