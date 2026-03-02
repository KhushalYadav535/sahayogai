'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils/formatters';
import { Download, TrendingDown, Loader2 } from 'lucide-react';
import { reportsApi } from '@/lib/api';
import {
    AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    CartesianGrid, Legend,
} from 'recharts';

const NPA_CLASS_COLORS: Record<string, string> = {
    'Sub-Standard': 'bg-amber-100 text-amber-800',
    'Doubtful-1': 'bg-orange-100 text-orange-800',
    'Doubtful-2': 'bg-red-100 text-red-700',
    'Loss': 'bg-red-200 text-red-900',
};

export default function NPATrendPage() {
    const [view, setView] = useState<'trend' | 'irac' | 'register'>('trend');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [summary, setSummary] = useState<{ npaRatio: number; grossNpa: number; netNpa: number; provCoverage: number } | null>(null);
    const [monthlyNPA, setMonthlyNPA] = useState<{ month: string; total: number; sub: number; doubtful: number; loss: number }[]>([]);
    const [dpdBuckets, setDpdBuckets] = useState<{ bucket: string; count: number; outstanding: number }[]>([]);
    const [npaRegister, setNpaRegister] = useState<{ loanId: string; member: string; type: string; outstanding: number; dpd: number; npa: string; provision: number }[]>([]);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);
        reportsApi.npaTrend()
            .then((res) => {
                if (cancelled) return;
                if (res.success) {
                    setSummary(res.summary);
                    setMonthlyNPA(res.monthlyNPA || []);
                    setDpdBuckets(res.dpdBuckets || []);
                    setNpaRegister(res.npaRegister || []);
                }
            })
            .catch((e) => {
                if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load');
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => { cancelled = true; };
    }, []);

    const handleExport = () => {
        const rows = [
            ['NPA Trend Report', new Date().toISOString().slice(0, 10)],
            [],
            ['Summary', 'Value'],
            ['NPA Ratio', summary ? summary.npaRatio.toFixed(1) + '%' : ''],
            ['Gross NPA', summary ? formatCurrency(summary.grossNpa) : ''],
            ['Net NPA', summary ? formatCurrency(summary.netNpa) : ''],
            ['Provisioning Coverage', summary ? summary.provCoverage.toFixed(1) + '%' : ''],
            [],
            ['NPA Register'],
            ['Loan ID', 'Member', 'Type', 'NPA Class', 'DPD', 'Outstanding', 'Provision'],
            ...npaRegister.map(r => [r.loanId, r.member, r.type, r.npa, r.dpd, r.outstanding, r.provision]),
        ];
        const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `NPA_Schedule_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    if (loading && !summary) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2"><TrendingDown className="w-6 h-6 text-red-500" /> NPA Trend Visualization</h1>
                    <p className="text-muted-foreground text-sm">IRAC-based Non-Performing Asset classification and historical trend</p>
                </div>
                <Button variant="outline" className="gap-2" onClick={handleExport}><Download className="w-4 h-4" /> NPA Schedule (NABARD)</Button>
            </div>

            {error && <div className="p-4 rounded-lg bg-red-50 text-red-700">{error}</div>}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    ['NPA Ratio', summary ? summary.npaRatio.toFixed(1) + '%' : '0%', 'text-red-600'],
                    ['Gross NPA', summary ? formatCurrency(summary.grossNpa) : formatCurrency(0), 'text-red-600'],
                    ['Net NPA (after provision)', summary ? formatCurrency(summary.netNpa) : formatCurrency(0), 'text-amber-600'],
                    ['Provisioning Coverage', summary ? summary.provCoverage.toFixed(1) + '%' : '0%', 'text-green-600'],
                ].map(([k, v, color]) => (
                    <Card key={k}><CardContent className="pt-4"><p className="text-xs text-muted-foreground">{k}</p><p className={`text-xl font-bold mt-1 ${color}`}>{v}</p></CardContent></Card>
                ))}
            </div>

            <div className="flex gap-2">
                {(['trend', 'irac', 'register'] as const).map(t => (
                    <button key={t} onClick={() => setView(t)} className={`px-4 py-2 rounded-lg text-sm border transition-colors capitalize ${view === t ? 'bg-primary/10 border-primary text-primary font-medium' : 'border-border hover:border-primary/50'}`}>
                        {t === 'irac' ? 'DPD Buckets' : t === 'register' ? 'NPA Register' : 'Monthly Trend'}
                    </button>
                ))}
            </div>

            {view === 'trend' && (
                <Card>
                    <CardHeader><CardTitle className="text-sm">NPA % by Classification — Monthly Trend</CardTitle></CardHeader>
                    <CardContent>
                        {monthlyNPA.length > 0 ? (
                            <ResponsiveContainer width="100%" height={280}>
                                <AreaChart data={monthlyNPA}>
                                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                                    <YAxis tickFormatter={v => v + '%'} tick={{ fontSize: 10 }} />
                                    <Tooltip formatter={(v: number) => v?.toFixed(1) + '%'} />
                                    <Legend />
                                    <Area type="monotone" dataKey="loss" stackId="1" stroke="#b91c1c" fill="#b91c1c" name="Loss" fillOpacity={0.9} />
                                    <Area type="monotone" dataKey="doubtful" stackId="1" stroke="#ea580c" fill="#ea580c" name="Doubtful" fillOpacity={0.8} />
                                    <Area type="monotone" dataKey="sub" stackId="1" stroke="#f59e0b" fill="#f59e0b" name="Sub-Standard" fillOpacity={0.7} />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : <div className="h-[280px] flex items-center justify-center text-muted-foreground">No trend data</div>}
                        <p className="text-xs text-muted-foreground text-center mt-2">RBI threshold: NPA ratio must be reported over 5% to NABARD</p>
                    </CardContent>
                </Card>
            )}

            {view === 'irac' && (
                <Card>
                    <CardHeader><CardTitle className="text-sm">Loan Portfolio — Days Past Due (DPD) Buckets</CardTitle></CardHeader>
                    <CardContent>
                        {dpdBuckets.length > 0 ? (
                            <>
                                <ResponsiveContainer width="100%" height={240}>
                                    <BarChart data={dpdBuckets} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                                        <XAxis type="number" tick={{ fontSize: 10 }} />
                                        <YAxis dataKey="bucket" type="category" width={130} tick={{ fontSize: 10 }} />
                                        <Tooltip formatter={(v: number) => [v + ' loans', 'Count']} />
                                        <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Loans" />
                                    </BarChart>
                                </ResponsiveContainer>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
                                    {dpdBuckets.slice(4).map(b => (
                                        <div key={b.bucket} className="p-2 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 text-xs">
                                            <p className="font-medium text-red-700">{b.bucket}</p>
                                            <p className="text-muted-foreground">{b.count} loans · {formatCurrency(b.outstanding)}</p>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : <div className="h-[240px] flex items-center justify-center text-muted-foreground">No DPD data</div>}
                    </CardContent>
                </Card>
            )}

            {view === 'register' && (
                <Card>
                    <CardHeader><CardTitle className="text-sm">NPA Register — Active Non-Performing Accounts</CardTitle></CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Loan ID</TableHead><TableHead>Member</TableHead><TableHead>Type</TableHead>
                                    <TableHead>NPA Class</TableHead><TableHead>DPD</TableHead>
                                    <TableHead className="text-right">Outstanding</TableHead>
                                    <TableHead className="text-right">Provision</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {npaRegister.length === 0 ? (
                                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No NPA accounts</TableCell></TableRow>
                                ) : (
                                    npaRegister.map(loan => (
                                        <TableRow key={loan.loanId}>
                                            <TableCell className="font-mono text-xs">{loan.loanId}</TableCell>
                                            <TableCell className="font-medium text-sm">{loan.member}</TableCell>
                                            <TableCell className="text-sm">{loan.type}</TableCell>
                                            <TableCell><Badge className={NPA_CLASS_COLORS[loan.npa] || 'bg-red-100 text-red-800'}>{loan.npa}</Badge></TableCell>
                                            <TableCell className="text-red-600 font-medium">{loan.dpd}d</TableCell>
                                            <TableCell className="text-right">{formatCurrency(loan.outstanding)}</TableCell>
                                            <TableCell className="text-right text-amber-600">{formatCurrency(loan.provision)}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
