'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import { ArrowLeft, Shield, FileText, CheckCircle } from 'lucide-react';

const mockTDSRecords = [
    { member: 'Rajesh Kumar', depositNo: 'FDR-2024-0012', interest: 50000, tdsAmt: 5000, fy: '2025-26', status: 'PENDING', form15G: false },
    { member: 'Priya Sharma', depositNo: 'FDR-2024-0001', interest: 25000, tdsAmt: 2500, fy: '2025-26', status: 'DEPOSITED', form15G: false },
    { member: 'Amit Patel', depositNo: 'RD-2024-0004', interest: 35000, tdsAmt: 0, fy: '2025-26', status: 'EXEMPT', form15G: true },
    { member: 'Leela Nair', depositNo: 'FDR-2024-0019', interest: 12000, tdsAmt: 1200, fy: '2025-26', status: 'PENDING', form15G: false },
];

const quarterlyData = [
    { quarter: 'Q1 (Apr-Jun)', dueDate: '15 Jul', payable: 8500, status: 'PAID' },
    { quarter: 'Q2 (Jul-Sep)', dueDate: '15 Oct', payable: 0, status: 'NIL' },
    { quarter: 'Q3 (Oct-Dec)', dueDate: '15 Jan', payable: 3200, status: 'PAID' },
    { quarter: 'Q4 (Jan-Mar)', dueDate: '15 Apr', payable: 4700, status: 'PENDING' },
];

export default function TDSManagementPage() {
    const router = useRouter();
    const [tab, setTab] = useState<'records' | 'quarterly' | 'certificates'>('records');
    const [fy, setFy] = useState('2025-26');
    const [generating, setGenerating] = useState(false);
    const [generated, setGenerated] = useState(false);

    const totalTDS = mockTDSRecords.reduce((s, r) => s + r.tdsAmt, 0);
    const pendingCount = mockTDSRecords.filter(r => r.status === 'PENDING').length;
    const exemptCount = mockTDSRecords.filter(r => r.status === 'EXEMPT').length;

    const generateCertificates = async () => {
        setGenerating(true);
        await new Promise(r => setTimeout(r, 2000));
        setGenerating(false);
        setGenerated(true);
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

            {/* Tabs */}
            <div className="flex gap-2 border-b border-border">
                {(['records', 'quarterly', 'certificates'] as const).map(t => (
                    <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-medium border-b-2 capitalize transition-colors ${tab === t ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
                        {t === 'records' ? 'TDS Records' : t === 'quarterly' ? 'Quarterly Filing' : 'Form 16A Certificates'}
                    </button>
                ))}
            </div>

            {tab === 'records' && (
                <Card>
                    <CardHeader><CardTitle className="flex items-center justify-between">
                        <span>Member-wise TDS</span>
                        <div className="flex gap-2">
                            <Button size="sm" variant="outline">Export 26Q</Button>
                            <Button size="sm" variant="outline">Export Excel</Button>
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
                                {mockTDSRecords.map((r, i) => (
                                    <TableRow key={i}>
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
                                ))}
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
                        {generated && mockTDSRecords.filter(r => r.status === 'DEPOSITED').map((r, i) => (
                            <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border">
                                <div><p className="font-medium text-sm">{r.member}</p><p className="text-xs text-muted-foreground">{r.depositNo} • TDS: {formatCurrency(r.tdsAmt, 0)}</p></div>
                                <Button size="sm" variant="outline">Download</Button>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
