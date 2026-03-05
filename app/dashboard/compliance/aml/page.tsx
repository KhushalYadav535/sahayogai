'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import { Zap, AlertTriangle, TrendingUp, Shield, RefreshCw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { complianceApi } from '@/lib/api';
import { useAuth } from '@/components/providers/auth-provider';

export default function AMLMonitorPage() {
    const { isAuthenticated } = useAuth();
    const [periodFilter, setPeriodFilter] = useState('30');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [amlData, setAmlData] = useState<any>(null);
    const [flaggedTransactions, setFlaggedTransactions] = useState<any[]>([]);

    // Redirect if not authenticated
    useEffect(() => {
        if (!isAuthenticated) {
            window.location.href = '/login';
        }
    }, [isAuthenticated]);

    // Fetch AML data
    useEffect(() => {
        if (!isAuthenticated) return;
        
        const fetchAmlData = async () => {
            setLoading(true);
            setError(null);
            try {
                // Calculate from date (30 days ago from today)
                const fromDate = new Date(Date.now() - (parseInt(periodFilter) * 24 * 60 * 60 * 1000));
                const response = await complianceApi.aml(fromDate.toISOString());
                setAmlData(response.report);
                setFlaggedTransactions(response.report.flaggedDetails || []);
            } catch (err: any) {
                if (err.message.includes('401') || err.message.includes('Unauthorized')) {
                    setError('Authentication failed. Please log in again.');
                    setTimeout(() => {
                        window.location.href = '/login';
                    }, 2000);
                } else {
                    setError(err instanceof Error ? err.message : 'Failed to fetch AML data');
                }
            } finally {
                setLoading(false);
            }
        };
        fetchAmlData();
    }, [periodFilter, isAuthenticated]);

    const flaggedTxns = flaggedTransactions || [];
    const riskDistribution = amlData?.flaggedTransactions ? [
        { range: 'Low (<40)', count: flaggedTxns.filter(t => t.riskScore < 40).length },
        { range: 'Medium (40-70)', count: flaggedTxns.filter(t => t.riskScore >= 40 && t.riskScore < 70).length },
        { range: 'High (70+)', count: flaggedTxns.filter(t => t.riskScore >= 70).length },
    ] : [
        { range: 'Low (<40)', count: 0 }, { range: 'Medium (40-70)', count: 0 }, { range: 'High (70+)', count: 0 },
    ];

    const amlAlertTypes = flaggedTxns.length > 0 ? [
        { type: 'Structuring', count: flaggedTxns.filter(t => t.reason === 'High value').length, desc: 'Multiple transactions just below reporting threshold' },
        { type: 'Layering', count: flaggedTxns.filter(t => t.reason === 'Threshold').length, desc: 'Complex chain of transfers to obscure origin' },
        { type: 'Integration', count: flaggedTxns.filter(t => t.reason === 'High value').length, desc: 'Large legitimate-looking final transaction' },
        { type: 'Unusual Pattern', count: flaggedTxns.filter(t => t.reason === 'High value').length, desc: 'Transactions inconsistent with member profile' },
    ] : [
        { type: 'Structuring', count: 0, desc: 'Multiple transactions just below reporting threshold' },
        { type: 'Layering', count: 0, desc: 'Complex chain of transfers to obscure origin' },
        { type: 'Integration', count: 0, desc: 'Large legitimate-looking final transaction' },
        { type: 'Unusual Pattern', count: 0, desc: 'Transactions inconsistent with member profile' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div><h1 className="text-2xl font-bold flex items-center gap-2"><Shield className="w-6 h-6" /> AML Monitor</h1>
                    <p className="text-muted-foreground text-sm">AI-powered Anti-Money Laundering transaction surveillance</p></div>
                <Button className="gap-2" onClick={() => window.location.reload()} disabled={loading}>
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
                </Button>
            </div>

            {error && (
                <Alert className="border-red-200 bg-red-50 dark:bg-red-950">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-700">{error}</AlertDescription>
                </Alert>
            )}

            {amlData?.flaggedTransactions > 0 && (
                <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950">
                    <Zap className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-700 text-sm">AI ✦ <strong>High-confidence alert:</strong> {amlData.flaggedTransactions} members flagged for possible structuring behaviour. Review recommended within 24 hours.</AlertDescription>
                </Alert>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    ['Txns Scanned', amlData?.flaggedTransactions || 0, 'text-foreground'], 
                    ['Flagged', amlData?.flaggedTransactions || 0, 'text-amber-600'], 
                    ['High Risk', flaggedTxns.filter(t => t.riskScore >= 80).length, 'text-red-600'], 
                    ['STRs Filed', flaggedTxns.filter(t => t.action === 'STR Filed').length, 'text-green-600']
                ].map(([k, v, color]) => (
                    <Card key={k}><CardContent className="pt-4"><p className="text-xs text-muted-foreground">{k}</p><p className={`text-2xl font-bold mt-1 ${color}`}>{v}</p></CardContent></Card>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                    <CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Risk Score Distribution</CardTitle></CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={160}>
                            <BarChart data={riskDistribution}>
                                <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} />
                                <Tooltip />
                                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle className="text-base">Alert Types Breakdown</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                        {amlAlertTypes.map(a => (
                            <div key={a.type} className="flex items-start gap-3">
                                <Badge className="text-xs bg-red-100 text-red-800 flex-shrink-0">{a.count}</Badge>
                                <div><p className="text-sm font-medium">{a.type}</p><p className="text-xs text-muted-foreground">{a.desc}</p></div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader><CardTitle className="flex items-center justify-between">
                    <span>Flagged Transactions</span>
                    <div className="flex gap-2">
                        {['7', '30', '90'].map(p => <button key={p} onClick={() => setPeriodFilter(p)} className={`px-3 py-1 text-xs rounded border transition-colors ${periodFilter === p ? 'bg-primary/10 border-primary text-primary' : 'border-border hover:border-primary/50'}`}>Last {p}d</button>)}
                    </div>
                </CardTitle></CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Transaction</TableHead><TableHead>Member</TableHead><TableHead>Type</TableHead>
                                <TableHead className="text-right">Amount</TableHead><TableHead>Date</TableHead>
                                <TableHead>Alert</TableHead><TableHead>AI Risk</TableHead><TableHead>Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-8">Loading AML data...</TableCell>
                                </TableRow>
                            ) : flaggedTxns.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-8">No flagged transactions found for the selected period</TableCell>
                                </TableRow>
                            ) : (
                                flaggedTxns.map(t => (
                                    <TableRow key={t.id}>
                                        <TableCell className="font-mono text-xs">{t.id}</TableCell>
                                        <TableCell className="font-medium text-sm">{t.member}</TableCell>
                                        <TableCell className="text-sm">{t.type}</TableCell>
                                        <TableCell className="text-right font-bold">{formatCurrency(t.amount, 0)}</TableCell>
                                        <TableCell className="text-sm">{formatDate(new Date(t.date))}</TableCell>
                                        <TableCell><Badge className="bg-red-100 text-red-800 text-xs">{t.alert}</Badge></TableCell>
                                        <TableCell><span className={`text-sm font-bold ${t.riskScore >= 80 ? 'text-red-600' : t.riskScore >= 60 ? 'text-amber-600' : 'text-green-600'}`}>{t.riskScore}% ✦</span></TableCell>
                                        <TableCell><Badge className={t.action === 'STR Filed' ? 'bg-green-100 text-green-800' : t.action === 'Cleared' ? 'bg-gray-100 text-gray-600' : 'bg-amber-100 text-amber-800'} >{t.action}</Badge></TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
