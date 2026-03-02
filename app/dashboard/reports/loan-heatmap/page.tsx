'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils/formatters';
import { Download, BarChart3, Loader2 } from 'lucide-react';
import { reportsApi } from '@/lib/api';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    CartesianGrid, Treemap, Cell,
} from 'recharts';

const COLORS = ['#22c55e', '#16a34a', '#f97316', '#f59e0b', '#22c55e', '#ef4444'];

export default function LoanPortfolioHeatmapPage() {
    const [view, setView] = useState<'heatmap' | 'aging' | 'officer'>('heatmap');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [heatmapData, setHeatmapData] = useState<{ name: string; size: number; count: number; npa: number; color: string }[]>([]);
    const [agingData, setAgingData] = useState<{ range: string; amount: number; count: number }[]>([]);
    const [kpis, setKpis] = useState<{ totalPortfolio: number; totalNpa: number; activeLoans: number; avgLoanSize: number } | null>(null);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);
        reportsApi.portfolio()
            .then((res) => {
                if (cancelled) return;
                if (res.success) {
                    setHeatmapData(res.heatmapData || []);
                    setAgingData(res.agingData || []);
                    setKpis(res.kpis || null);
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

    const totalPortfolio = kpis?.totalPortfolio ?? heatmapData.reduce((s, d) => s + d.size, 0);
    const totalNpa = kpis?.totalNpa ?? heatmapData.reduce((s, d) => s + d.size * (d.npa / 100), 0);
    const activeLoans = kpis?.activeLoans ?? heatmapData.reduce((s, d) => s + d.count, 0);
    const avgLoanSize = kpis?.avgLoanSize ?? (activeLoans > 0 ? totalPortfolio / activeLoans : 0);

    const handleExport = () => {
        const rows = [
            ['Loan Portfolio Report', new Date().toISOString().slice(0, 10)],
            [],
            ['Product', 'Size', 'Count', 'NPA %'],
            ...heatmapData.map(d => [d.name, d.size, d.count, d.npa.toFixed(1) + '%']),
            [],
            ['Aging', 'Amount', 'Count'],
            ...agingData.map(d => [d.range, d.amount, d.count]),
        ];
        const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Portfolio_Report_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const CustomTreemapContent = ({ x, y, width, height, index }: { x?: number; y?: number; width?: number; height?: number; index?: number }) => {
        const d = heatmapData[index ?? 0];
        if (!d || !width || !height || width < 40 || height < 30) return null;
        return (
            <g>
                <rect x={x} y={y} width={width} height={height} fill={d.color} stroke="#fff" strokeWidth={2} rx={4} />
                <text x={(x ?? 0) + (width ?? 0) / 2} y={(y ?? 0) + (height ?? 0) / 2 - 8} textAnchor="middle" fill="white" fontSize={11} fontWeight={600}>{d.name}</text>
                <text x={(x ?? 0) + (width ?? 0) / 2} y={(y ?? 0) + (height ?? 0) / 2 + 8} textAnchor="middle" fill="white" fontSize={10}>{formatCurrency(d.size, 0)}</text>
                <text x={(x ?? 0) + (width ?? 0) / 2} y={(y ?? 0) + (height ?? 0) / 2 + 22} textAnchor="middle" fill="rgba(255,255,255,0.85)" fontSize={9}>NPA: {d.npa.toFixed(1)}%</text>
            </g>
        );
    };

    if (loading && heatmapData.length === 0) {
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
                    <h1 className="text-2xl font-bold flex items-center gap-2"><BarChart3 className="w-6 h-6" /> Loan Portfolio Heatmap</h1>
                    <p className="text-muted-foreground text-sm">Visual portfolio analysis by product, aging, and performance</p>
                </div>
                <Button variant="outline" className="gap-2" onClick={handleExport}><Download className="w-4 h-4" /> Portfolio Report</Button>
            </div>

            {error && <div className="p-4 rounded-lg bg-red-50 text-red-700">{error}</div>}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    ['Total Portfolio', formatCurrency(totalPortfolio, 0), 'text-primary'],
                    ['NPA Exposure', formatCurrency(totalNpa, 0), 'text-red-600'],
                    ['Active Loans', String(activeLoans), 'text-foreground'],
                    ['Avg Loan Size', formatCurrency(avgLoanSize, 0), 'text-foreground'],
                ].map(([k, v, color]) => (
                    <Card key={k}><CardContent className="pt-4"><p className="text-xs text-muted-foreground">{k}</p><p className={`text-xl font-bold mt-1 ${color}`}>{v}</p></CardContent></Card>
                ))}
            </div>

            <div className="flex gap-2">
                {(['heatmap', 'aging', 'officer'] as const).map(t => (
                    <button key={t} onClick={() => setView(t)} className={`px-4 py-2 rounded-lg text-sm border transition-colors ${view === t ? 'bg-primary/10 border-primary text-primary font-medium' : 'border-border hover:border-primary/50'}`}>
                        {t === 'heatmap' ? 'Portfolio Heatmap' : t === 'aging' ? 'Aging Analysis' : 'Officer Performance'}
                    </button>
                ))}
            </div>

            {view === 'heatmap' && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm flex items-center justify-between">
                            Portfolio Heatmap by Product × Size × NPA
                            <div className="flex gap-2 text-xs">
                                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-500 inline-block" /> Low NPA (&lt;3%)</span>
                                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-500 inline-block" /> Medium (3-6%)</span>
                                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500 inline-block" /> High (&gt;6%)</span>
                            </div>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {heatmapData.length > 0 ? (
                            <>
                                <ResponsiveContainer width="100%" height={320}>
                                    <Treemap data={heatmapData} dataKey="size" aspectRatio={4 / 3} content={<CustomTreemapContent />}>
                                        {heatmapData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                    </Treemap>
                                </ResponsiveContainer>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
                                    {heatmapData.map(d => (
                                        <div key={d.name} className="flex items-center gap-2 p-2 rounded-lg border border-border">
                                            <div className="w-3 h-3 rounded flex-shrink-0" style={{ backgroundColor: d.color }} />
                                            <div className="min-w-0">
                                                <p className="text-xs font-medium truncate">{d.name}</p>
                                                <p className="text-xs text-muted-foreground">{d.count} loans · NPA {d.npa.toFixed(1)}%</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : <div className="h-[320px] flex items-center justify-center text-muted-foreground">No portfolio data</div>}
                    </CardContent>
                </Card>
            )}

            {view === 'aging' && (
                <Card>
                    <CardHeader><CardTitle className="text-sm">Loan Aging — Outstanding by Disbursement Vintage</CardTitle></CardHeader>
                    <CardContent>
                        {agingData.length > 0 ? (
                            <>
                                <ResponsiveContainer width="100%" height={260}>
                                    <BarChart data={agingData}>
                                        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                                        <XAxis dataKey="range" tick={{ fontSize: 10 }} />
                                        <YAxis tickFormatter={v => '₹' + (v / 100000).toFixed(0) + 'L'} tick={{ fontSize: 10 }} />
                                        <Tooltip formatter={(v: number) => formatCurrency(v)} />
                                        <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Outstanding" />
                                    </BarChart>
                                </ResponsiveContainer>
                                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-3">
                                    {agingData.map(d => (
                                        <div key={d.range} className="text-center p-2 rounded-lg bg-muted/30 border border-border">
                                            <p className="text-xs font-medium">{d.range}</p>
                                            <p className="text-sm font-bold mt-0.5">{d.count}</p>
                                            <p className="text-xs text-muted-foreground">loans</p>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : <div className="h-[260px] flex items-center justify-center text-muted-foreground">No aging data</div>}
                    </CardContent>
                </Card>
            )}

            {view === 'officer' && (
                <Card>
                    <CardHeader><CardTitle className="text-sm">Loan Officer Portfolio Performance</CardTitle></CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground py-8 text-center">Officer-level data requires user assignment on loans. Configure loan officers in loan settings to view performance by officer.</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
