'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatCurrency } from '@/lib/utils/formatters';
import { Shield, TrendingDown, AlertTriangle, Brain, BarChart3, Loader2 } from 'lucide-react';
import { reportsApi } from '@/lib/api';
import {
    RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
    LineChart, Line,
} from 'recharts';

const STATUS_COLORS: Record<string, string> = { RED: 'bg-red-100 text-red-800', AMBER: 'bg-amber-100 text-amber-800', GREEN: 'bg-green-100 text-green-800' };

export default function PredictiveRiskDashboard() {
    const router = useRouter();
    const [period, setPeriod] = useState('this_month');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [kpis, setKpis] = useState<Record<string, string>>({});
    const [riskRadar, setRiskRadar] = useState<{ subject: string; A: number }[]>([]);
    const [riskBuckets, setRiskBuckets] = useState<{ range: string; count: number; color: string }[]>([]);
    const [npaMonthTrend, setNpaMonthTrend] = useState<{ month: string; npa: number }[]>([]);
    const [highRiskMembers, setHighRiskMembers] = useState<{ name: string; memberNumber: string; score: number; dpd: number; outstanding: number; flags: string[] }[]>([]);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);
        reportsApi.risk()
            .then((res) => {
                if (cancelled) return;
                if (res.success) {
                    setKpis(res.kpis || {});
                    setRiskRadar(res.riskRadar || []);
                    setRiskBuckets(res.riskBuckets || []);
                    setNpaMonthTrend(res.npaMonthTrend || []);
                    setHighRiskMembers(res.highRiskMembers || []);
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
    }, [period]);

    const kpiEntries = [
        { label: 'NPA Ratio', key: 'npaRatio', status: 'RED' as const },
        { label: 'Avg AI Risk Score', key: 'avgRiskScore', status: 'AMBER' as const },
        { label: 'Overdue Loans', key: 'overdueCount', status: 'AMBER' as const },
        { label: 'High-Risk Members', key: 'highRiskCount', status: 'RED' as const },
        { label: 'Provisioning Coverage', key: 'provCoverage', status: 'GREEN' as const },
    ];

    if (loading && riskRadar.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div><h1 className="text-2xl font-bold flex items-center gap-2"><Shield className="w-6 h-6" /> Predictive Risk Dashboard</h1>
                    <p className="text-muted-foreground text-sm">AI-powered risk analysis and early warning signals</p></div>
                <div className="flex gap-2">{['this_month', 'last_quarter', 'ytd'].map(p => <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${period === p ? 'bg-primary/10 border-primary text-primary font-medium' : 'border-border'}`}>{p === 'this_month' ? 'This Month' : p === 'last_quarter' ? 'Last Quarter' : 'YTD'}</button>)}</div>
            </div>

            {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {kpiEntries.map(({ label, key, status }) => (
                    <Card key={key}>
                        <CardContent className="pt-3 pb-3 text-center">
                            <p className="text-xs text-muted-foreground">{label}</p>
                            <p className="text-xl font-bold mt-1">{kpis[key] ?? '—'}</p>
                            <Badge className={`text-xs mt-1 ${STATUS_COLORS[status]}`}>{status}</Badge>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {highRiskMembers.length > 0 && (
                <Alert className="border-red-200 bg-red-50 dark:bg-red-950">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-700 text-sm">
                        NPA ratio may be rising. {highRiskMembers.length} members flagged as critical risk. Recommend management review.
                    </AlertDescription>
                </Alert>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <Card>
                    <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Brain className="w-4 h-4" /> Risk Dimension Map</CardTitle></CardHeader>
                    <CardContent>
                        {riskRadar.length > 0 ? (
                            <ResponsiveContainer width="100%" height={200}>
                                <RadarChart data={riskRadar}>
                                    <PolarGrid />
                                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
                                    <Radar name="Risk Score" dataKey="A" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.25} />
                                </RadarChart>
                            </ResponsiveContainer>
                        ) : <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">No data</div>}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle className="text-sm flex items-center gap-2"><TrendingDown className="w-4 h-4" /> NPA % Trend</CardTitle></CardHeader>
                    <CardContent>
                        {npaMonthTrend.length > 0 ? (
                            <ResponsiveContainer width="100%" height={200}>
                                <LineChart data={npaMonthTrend}>
                                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                                    <YAxis tickFormatter={v => v.toFixed(1) + '%'} tick={{ fontSize: 10 }} />
                                    <Tooltip formatter={(v: number) => v?.toFixed(1) + '%'} />
                                    <Line type="monotone" dataKey="npa" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} name="NPA %" />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">No data</div>}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="w-4 h-4" /> AI Risk Score Distribution</CardTitle></CardHeader>
                    <CardContent>
                        {riskBuckets.length > 0 ? (
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={riskBuckets}>
                                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                                    <XAxis dataKey="range" tick={{ fontSize: 9 }} />
                                    <YAxis tick={{ fontSize: 10 }} />
                                    <Tooltip />
                                    <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Members" fill="hsl(var(--primary))" />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">No data</div>}
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader><CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-red-500" /> Critical Risk Members</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                    {highRiskMembers.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4">No critical risk members</p>
                    ) : (
                        highRiskMembers.map(member => (
                            <div key={member.memberNumber} className="flex items-center gap-4 p-3 rounded-lg border border-red-200 bg-red-50/50 dark:bg-red-950/30">
                                <div className="w-12 h-12 rounded-full bg-red-100 border-2 border-red-300 flex items-center justify-center flex-shrink-0">
                                    <span className="text-red-700 font-bold text-sm">{member.score}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-sm">{member.name}</p>
                                    <p className="text-xs text-muted-foreground">{member.memberNumber} · {member.dpd}d DPD</p>
                                    <div className="flex gap-1 mt-1">
                                        {member.flags.map(f => <Badge key={f} className="text-xs bg-red-100 text-red-700">{f}</Badge>)}
                                    </div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <p className="font-bold text-sm text-red-600">{formatCurrency(member.outstanding)}</p>
                                    <p className="text-xs text-muted-foreground">Outstanding</p>
                                </div>
                                <Button size="sm" variant="outline" className="border-red-300 text-red-700 hover:bg-red-50 text-xs h-7" onClick={() => router.push('/dashboard/members')}>Review</Button>
                            </div>
                        ))
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
