'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import { ArrowLeft, Shield, FileText, CheckCircle, RefreshCw, Download } from 'lucide-react';
import { complianceApi, depositsApi } from '@/lib/api';
import { useAuth } from '@/components/providers/auth-provider';


export default function TDSManagementPage() {
    const router = useRouter();
    const { isAuthenticated } = useAuth();
    const [tab, setTab] = useState<'records' | 'quarterly' | 'certificates'>('records');
    const [fy, setFy] = useState('2025-26');
    const [generating, setGenerating] = useState(false);
    const [generated, setGenerated] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [tdsRecords, setTdsRecords] = useState<any[]>([]);
    const [quarterlyData, setQuarterlyData] = useState<any[]>([]);
    const [certificates, setCertificates] = useState<any[]>([]);
    const [summary, setSummary] = useState<any>(null);

    // Redirect if not authenticated
    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, router]);

    const totalTDS = summary?.totalTDS || 0;
    const pendingCount = summary?.pendingCount || 0;
    const exemptCount = summary?.exemptCount || 0;

    // Fetch TDS records
    useEffect(() => {
        if (!isAuthenticated) return; // Don't fetch if not authenticated
        
        const fetchTdsRecords = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await complianceApi.tdsRecords(fy);
                setTdsRecords(response.records || []);
                setSummary(response.summary || {});
            } catch (err: any) {
                if (err.message.includes('401') || err.message.includes('Unauthorized')) {
                    setError('Authentication failed. Please log in again.');
                    setTimeout(() => {
                        router.push('/login');
                    }, 2000);
                } else {
                    setError(err instanceof Error ? err.message : 'Failed to fetch TDS records');
                }
            } finally {
                setLoading(false);
            }
        };
        fetchTdsRecords();
    }, [fy, isAuthenticated, router]);

    // Fetch quarterly data
    useEffect(() => {
        const fetchQuarterlyData = async () => {
            try {
                const response = await complianceApi.tdsQuarterly(fy);
                setQuarterlyData(response.quarterly || []);
            } catch (err) {
                console.error('Failed to fetch quarterly data:', err);
            }
        };
        fetchQuarterlyData();
    }, [fy]);

    const generateCertificates = async () => {
        setGenerating(true);
        setError(null);
        try {
            const response = await complianceApi.generateTdsCertificates(fy);
            setCertificates(response.certificates || []);
            setGenerated(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to generate certificates');
        } finally {
            setGenerating(false);
        }
    };

    const export26Q = async () => {
        try {
            const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3);
            const quarter = `${new Date().getFullYear()}-Q${currentQuarter}`;
            await complianceApi.tds26q(quarter);
            // TODO: Handle file download
            alert('TDS 26Q report exported successfully');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to export 26Q');
        }
    };

    const exportExcel = () => {
        // TODO: Implement Excel export
        alert('Excel export will be implemented');
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="w-4 h-4" /></Button>
                <div><h1 className="text-2xl font-bold flex items-center gap-2"><Shield className="w-6 h-6" /> TDS Management</h1>
                    <p className="text-muted-foreground text-sm">Tax Deducted at Source on interest income</p></div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[['Total TDS Payable', formatCurrency(totalTDS, 0), 'text-primary'], ['Pending Deductions', String(pendingCount), 'text-amber-600'], ['Exempt (15G/H)', String(exemptCount), 'text-green-600'], ['FY', fy, 'text-foreground']].map(([k, v, color]) => (
                    <Card key={k}><CardContent className="pt-4"><p className="text-xs text-muted-foreground">{k}</p><p className={`text-xl font-bold mt-1 ${color}`}>{v}</p></CardContent></Card>
                ))}
            </div>

            {error && (
                <Alert className="border-red-200 bg-red-50 dark:bg-red-950">
                    <CheckCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-700">{error}</AlertDescription>
                </Alert>
            )}

            {/* Tabs */}
            <div className="flex gap-2 border-b border-border">
                {(['records', 'quarterly', 'certificates'] as const).map(t => (
                    <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-medium border-b-2 capitalize transition-colors ${tab === t ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
                        {t === 'records' ? 'TDS Records' : t === 'quarterly' ? 'Quarterly Filing' : 'Form 16A Certificates'}
                    </button>
                ))}
                <Button variant="outline" size="sm" onClick={() => window.location.reload()} disabled={loading} className="ml-auto">
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
            </div>

            {tab === 'records' && (
                <Card>
                    <CardHeader><CardTitle className="flex items-center justify-between">
                        <span>{loading ? 'Loading...' : 'Member-wise TDS'}</span>
                        <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={export26Q} disabled={loading}>Export 26Q</Button>
                            <Button size="sm" variant="outline" onClick={exportExcel} disabled={loading}>Export Excel</Button>
                        </div>
                    </CardTitle></CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Member</TableHead><TableHead>Deposit No</TableHead><TableHead className="text-right">Interest</TableHead>
                                    <TableHead className="text-right">TDS @ 10%</TableHead><TableHead>FY</TableHead><TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8">Loading TDS records...</TableCell>
                                    </TableRow>
                                ) : tdsRecords.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8">No TDS records found for FY {fy}</TableCell>
                                    </TableRow>
                                ) : (
                                    tdsRecords.map((r, i) => (
                                        <TableRow key={r.id || i}>
                                            <TableCell className="font-medium">{r.member}</TableCell>
                                            <TableCell className="font-mono text-xs">{r.depositNo}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(r.interest, 0)}</TableCell>
                                            <TableCell className="text-right font-medium">{r.tdsAmt ? formatCurrency(r.tdsAmt, 0) : '—'}</TableCell>
                                            <TableCell>{r.fy}</TableCell>
                                            <TableCell>
                                                <Badge className={r.status === 'DEPOSITED' ? 'bg-green-100 text-green-800' : r.status === 'EXEMPT' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'}>
                                                    {r.status}{r.form15G ? ' (15G)' : ''}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            {tab === 'quarterly' && (
                <Card>
                    <CardHeader><CardTitle>Quarterly TDS Deposit Status</CardTitle></CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Quarter</TableHead><TableHead>Due Date</TableHead>
                                    <TableHead className="text-right">Amount Payable</TableHead><TableHead>Status</TableHead><TableHead>Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {quarterlyData.map((q, i) => (
                                    <TableRow key={i}>
                                        <TableCell>{q.quarter}</TableCell>
                                        <TableCell>{q.dueDate}</TableCell>
                                        <TableCell className="text-right">{q.payable ? formatCurrency(q.payable, 0) : '—'}</TableCell>
                                        <TableCell><Badge className={q.status === 'PAID' ? 'bg-green-100 text-green-800' : q.status === 'NIL' ? 'bg-gray-100 text-gray-600' : 'bg-amber-100 text-amber-800'}>{q.status}</Badge></TableCell>
                                        <TableCell>{q.status === 'PENDING' && q.payable > 0 && <Button size="sm" variant="outline">File & Pay</Button>}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            {tab === 'certificates' && (
                <Card>
                    <CardHeader><CardTitle>Form 16A — TDS Certificates</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">Generate Form 16A certificates for all members who had TDS deducted in the selected financial year.</p>
                        {!generated ? (
                            <Button onClick={generateCertificates} disabled={generating} className="gap-2"><FileText className="w-4 h-4" />{generating ? 'Generating...' : 'Generate All Form 16A for FY ' + fy}</Button>
                        ) : (
                            <Alert className="border-green-200 bg-green-50 dark:bg-green-950">
                                <CheckCircle className="h-4 w-4 text-green-600" /><AlertDescription className="text-green-700">2 Form 16A certificates generated for FY {fy}. Download below.</AlertDescription>
                            </Alert>
                        )}
                        {generated && certificates.map((cert, i) => (
                            <div key={cert.id || i} className="flex items-center justify-between p-3 rounded-lg border border-border">
                                <div><p className="font-medium text-sm">{cert.member}</p><p className="text-xs text-muted-foreground">{cert.depositNo} • TDS: {formatCurrency(cert.tdsAmount, 0)}</p></div>
                                <div className="flex gap-2">
                                    <Button size="sm" variant="outline" onClick={async () => {
                                        try {
                                            const blob = await depositsApi.getForm16A(cert.id);
                                            const url = URL.createObjectURL(blob);
                                            const a = document.createElement('a');
                                            a.href = url;
                                            a.download = `Form16A_${cert.depositNo}.html`;
                                            a.click();
                                            URL.revokeObjectURL(url);
                                        } catch (e) {
                                            alert('Failed to download Form 16A');
                                        }
                                    }}>
                                        <FileText className="w-4 h-4 mr-1" /> Form 16A
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={() => window.open(cert.certificateUrl, '_blank')}>
                                        <Download className="w-4 h-4 mr-1" /> View
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
