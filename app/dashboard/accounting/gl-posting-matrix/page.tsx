'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Database, Search } from 'lucide-react';

const MATRIX = [
    { event: 'Savings Deposit (Cash)', dr: 'Cash in Hand (1001)', cr: 'SB Account — Member (2001)', module: 'Accounts', auto: true },
    { event: 'Savings Withdrawal (Cash)', dr: 'SB Account — Member (2001)', cr: 'Cash in Hand (1001)', module: 'Accounts', auto: true },
    { event: 'Loan Disbursement', dr: 'Loan Principal O/S (3001)', cr: 'SB Account — Member (2001)', module: 'Loans', auto: true },
    { event: 'EMI Collection (Principal)', dr: 'SB Account — Member (2001)', cr: 'Loan Principal O/S (3001)', module: 'Loans', auto: true },
    { event: 'EMI Collection (Interest)', dr: 'SB Account — Member (2001)', cr: 'Interest Income — Loan (4001)', module: 'Loans', auto: true },
    { event: 'FDR Booking', dr: 'SB Account — Member (2001)', cr: 'FDR Liability (2020)', module: 'Deposits', auto: true },
    { event: 'FDR Maturity Payout', dr: 'FDR Liability (2020)', cr: 'SB Account — Member (2001)', module: 'Deposits', auto: true },
    { event: 'Interest Accrual (FDR)', dr: 'Interest on FDR Expense (5001)', cr: 'Accrued Interest Payable (2030)', module: 'Deposits', auto: true },
    { event: 'TDS Deduction', dr: 'Accrued Interest Payable (2030)', cr: 'TDS Payable to IT Dept (2040)', module: 'Deposits', auto: true },
    { event: 'RD Installment Receipt', dr: 'Cash / SB (1001/2001)', cr: 'RD Liability (2021)', module: 'Deposits', auto: true },
    { event: 'Share Capital Subscription', dr: 'SB Account — Member (2001)', cr: 'Share Capital A/C (6001)', module: 'Accounts', auto: true },
    { event: 'Fixed Asset Purchase', dr: 'Fixed Asset A/C (7001)', cr: 'Cash / Bank (1001)', module: 'Accounting', auto: false },
    { event: 'Depreciation', dr: 'Depreciation Expense (5010)', cr: 'Accumulated Depreciation (7002)', module: 'Accounting', auto: true },
    { event: 'Salary Payment', dr: 'Salary Expense (5020)', cr: 'Cash / Bank (1001)', module: 'Accounting', auto: false },
    { event: 'Penal Interest Charge', dr: 'Accrued Penal Interest (2003)', cr: 'Penal Interest Income (4002)', module: 'Loans', auto: true },
];

export default function GLPostingMatrixPage() {
    const router = useRouter();
    const [search, setSearch] = useState('');
    const [moduleFilter, setModuleFilter] = useState<string>('all');

    const modules = ['all', ...Array.from(new Set(MATRIX.map(r => r.module)))];
    const filtered = MATRIX.filter(r =>
        (moduleFilter === 'all' || r.module === moduleFilter) &&
        (r.event.toLowerCase().includes(search.toLowerCase()) || r.dr.toLowerCase().includes(search.toLowerCase()) || r.cr.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="w-4 h-4" /></Button>
                <div><h1 className="text-2xl font-bold flex items-center gap-2"><Database className="w-6 h-6" /> Auto GL Posting Matrix</h1>
                    <p className="text-muted-foreground text-sm">Read-only view of event-driven double-entry rules</p></div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1"><Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" /><Input className="pl-9" placeholder="Search events, DR or CR accounts..." value={search} onChange={e => setSearch(e.target.value)} /></div>
                <div className="flex gap-2">
                    {modules.map(m => <button key={m} onClick={() => setModuleFilter(m)} className={`px-3 py-1.5 rounded-lg text-sm border capitalize transition-colors ${moduleFilter === m ? 'bg-primary/10 border-primary text-primary font-medium' : 'border-border hover:border-primary/50'}`}>{m}</button>)}
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between"><span>{filtered.length} Posting Rules</span><Button size="sm" variant="outline" onClick={() => {
                    const header = ['Business Event', 'DR (Debit)', 'CR (Credit)', 'Module', 'Type'];
                    const rows = filtered.map(r => [r.event, r.dr, r.cr, r.module, r.auto ? 'Auto' : 'Manual']);
                    const csv = [header.join(','), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
                    const blob = new Blob([csv], { type: 'text/csv' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'GL_Posting_Matrix_Rules.csv';
                    a.click();
                    URL.revokeObjectURL(url);
                }}>Export Rules</Button></CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Business Event</TableHead>
                                    <TableHead>DR (Debit)</TableHead>
                                    <TableHead>CR (Credit)</TableHead>
                                    <TableHead>Module</TableHead>
                                    <TableHead>Type</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.map((row, i) => (
                                    <TableRow key={i}>
                                        <TableCell className="font-medium text-sm max-w-xs">{row.event}</TableCell>
                                        <TableCell className="text-red-700 dark:text-red-400 font-mono text-xs">{row.dr}</TableCell>
                                        <TableCell className="text-green-700 dark:text-green-400 font-mono text-xs">{row.cr}</TableCell>
                                        <TableCell><Badge variant="outline" className="text-xs">{row.module}</Badge></TableCell>
                                        <TableCell>
                                            <Badge className={row.auto ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'}>
                                                {row.auto ? 'Auto' : 'Manual'}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <p className="text-xs text-muted-foreground text-center">Read-only. Contact Platform Administrator to add or modify posting rules.</p>
        </div>
    );
}
