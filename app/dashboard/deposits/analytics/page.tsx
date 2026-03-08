'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils/formatters';
import { depositsApi } from '@/lib/api';
import { TrendingUp, PieChart, Calendar, DollarSign } from 'lucide-react';

export default function DepositAnalyticsPage() {
    const [analytics, setAnalytics] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const params: any = {};
            if (dateRange.startDate) params.startDate = dateRange.startDate;
            if (dateRange.endDate) params.endDate = dateRange.endDate;
            const res = await depositsApi.getAnalytics(params);
            setAnalytics(res.analytics);
        } catch {
            setAnalytics(null);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <p className="py-8 text-center text-muted-foreground">Loading analytics...</p>;
    if (!analytics) return <div className="py-8 text-center"><p className="text-muted-foreground">Failed to load analytics</p></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Deposit Portfolio Analytics</h1>
                <div className="flex gap-2">
                    <input
                        type="date"
                        value={dateRange.startDate}
                        onChange={e => setDateRange({ ...dateRange, startDate: e.target.value })}
                        className="px-3 py-1 border rounded text-sm"
                    />
                    <input
                        type="date"
                        value={dateRange.endDate}
                        onChange={e => setDateRange({ ...dateRange, endDate: e.target.value })}
                        className="px-3 py-1 border rounded text-sm"
                    />
                    <Button onClick={fetchAnalytics} size="sm">Apply</Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground">Total Deposits</p>
                                <p className="text-2xl font-bold mt-1">{analytics.summary.totalDeposits}</p>
                            </div>
                            <PieChart className="w-8 h-8 text-primary opacity-50" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground">Total Principal</p>
                                <p className="text-2xl font-bold mt-1">{formatCurrency(analytics.summary.totalPrincipal, 0)}</p>
                            </div>
                            <DollarSign className="w-8 h-8 text-green-600 opacity-50" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground">Accrued Interest</p>
                                <p className="text-2xl font-bold mt-1">{formatCurrency(analytics.summary.totalAccruedInterest)}</p>
                            </div>
                            <TrendingUp className="w-8 h-8 text-blue-600 opacity-50" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground">Maturity Amount</p>
                                <p className="text-2xl font-bold mt-1">{formatCurrency(analytics.summary.totalMaturityAmount, 0)}</p>
                            </div>
                            <Calendar className="w-8 h-8 text-purple-600 opacity-50" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader><CardTitle>Deposits by Type</CardTitle></CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {Object.entries(analytics.byType || {}).map(([type, count]: [string, any]) => (
                                <div key={type} className="flex items-center justify-between">
                                    <span className="text-sm font-medium">{type.toUpperCase()}</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-primary" 
                                                style={{ width: `${(count / analytics.summary.totalDeposits) * 100}%` }}
                                            />
                                        </div>
                                        <span className="text-sm font-bold w-12 text-right">{count}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Deposits by Status</CardTitle></CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {Object.entries(analytics.byStatus || {}).map(([status, count]: [string, any]) => (
                                <div key={status} className="flex items-center justify-between">
                                    <span className="text-sm font-medium capitalize">{status.replace('_', ' ')}</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-green-600" 
                                                style={{ width: `${(count / analytics.summary.totalDeposits) * 100}%` }}
                                            />
                                        </div>
                                        <span className="text-sm font-bold w-12 text-right">{count}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Maturing Soon */}
            <Card>
                <CardHeader><CardTitle>Maturing Soon (Next 30 Days)</CardTitle></CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-2xl font-bold">{analytics.maturingSoon.count} deposits</p>
                            <p className="text-sm text-muted-foreground mt-1">Total amount maturing</p>
                        </div>
                        <div className="text-right">
                            <p className="text-2xl font-bold text-primary">{formatCurrency(analytics.maturingSoon.totalAmount, 0)}</p>
                            <p className="text-sm text-muted-foreground mt-1">Requires action</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
