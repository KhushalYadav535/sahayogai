'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatCurrency } from '@/lib/utils/formatters';
import { TrendingUp, TrendingDown, Minus, CheckCircle, AlertTriangle, XCircle, BarChart3, ArrowLeft } from 'lucide-react';
import { reportsApi, setApiToken } from '@/lib/api';

const STATUS_COLORS: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
    GREEN: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-200', icon: <CheckCircle className="w-5 h-5" /> },
    AMBER: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-800 dark:text-amber-200', icon: <AlertTriangle className="w-5 h-5" /> },
    RED: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-200', icon: <XCircle className="w-5 h-5" /> },
};

const TREND_ICONS: Record<string, React.ReactNode> = {
    UP: <TrendingUp className="w-4 h-4 text-green-600" />,
    DOWN: <TrendingDown className="w-4 h-4 text-red-600" />,
    FLAT: <Minus className="w-4 h-4 text-gray-600" />,
};

export default function DirectorKpiDashboard() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [kpis, setKpis] = useState<Array<{
        name: string;
        value: string;
        formula: string;
        status: 'GREEN' | 'AMBER' | 'RED';
        trend?: string;
        variance?: string;
    }>>([]);

    useEffect(() => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('sahayog-token') : null;
        if (token) setApiToken(token);
        let cancelled = false;
        setLoading(true);
        setError(null);
        reportsApi.directorKpi(token || undefined)
            .then((res) => {
                if (cancelled) return;
                if (res.success && res.kpis) {
                    setKpis(res.kpis);
                } else {
                    setError('Failed to load KPIs');
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
                <p className="text-muted-foreground">Loading Director KPIs...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="w-4 h-4" />
                </Button>
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
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
                        <BarChart3 className="w-6 h-6" /> Director KPI Dashboard (BI-007)
                    </h1>
                    <p className="text-muted-foreground text-sm">Six key performance indicators for Board of Directors</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {kpis.map((kpi, idx) => {
                    const statusStyle = STATUS_COLORS[kpi.status] || STATUS_COLORS.AMBER;
                    return (
                        <Card key={idx} className={`${statusStyle.bg} border-2`}>
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-base font-semibold">{kpi.name}</CardTitle>
                                    <div className={statusStyle.text}>{statusStyle.icon}</div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-bold">{kpi.value}</span>
                                    {kpi.trend && TREND_ICONS[kpi.trend] && (
                                        <span>{TREND_ICONS[kpi.trend]}</span>
                                    )}
                                </div>
                                {kpi.variance && (
                                    <Badge variant="outline" className="text-xs">
                                        Variance: {kpi.variance}
                                    </Badge>
                                )}
                                <p className="text-xs text-muted-foreground mt-2 font-mono">{kpi.formula}</p>
                                <Badge className={`${statusStyle.bg} ${statusStyle.text} border-0`}>
                                    {kpi.status}
                                </Badge>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Traffic Light Legend</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <span><strong>Green:</strong> Performance meets or exceeds targets</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-amber-600" />
                            <span><strong>Amber:</strong> Performance within acceptable range, needs attention</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <XCircle className="w-5 h-5 text-red-600" />
                            <span><strong>Red:</strong> Performance below threshold, immediate action required</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
