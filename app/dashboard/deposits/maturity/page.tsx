'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import { ArrowLeft, Calendar, CheckCircle, AlertTriangle } from 'lucide-react';

const maturingDeposits = [
    { id: '1', depositNo: 'FDR-2024-0001', member: 'Priya Sharma', type: 'FDR', amount: 100000, interest: 16993, maturityAmt: 116993, maturityDate: new Date('2026-03-05'), options: ['Renew', 'Payout', 'Part-Renew'] },
    { id: '2', depositNo: 'FDR-2024-0021', member: 'Amit Patel', type: 'FDR', amount: 50000, interest: 4250, maturityAmt: 54250, maturityDate: new Date('2026-03-12'), options: ['Renew', 'Payout'] },
    { id: '3', depositNo: 'RD-2024-0005', member: 'Leela Nair', type: 'RD', amount: 60000, interest: 5100, maturityAmt: 65100, maturityDate: new Date('2026-03-20'), options: ['Renew', 'Payout'] },
];

export default function MaturityProcessingPage() {
    const router = useRouter();
    const [filter, setFilter] = useState<'all' | '7' | '30' | '90'>('30');
    const [selected, setSelected] = useState<Record<string, boolean>>({});
    const [actions, setActions] = useState<Record<string, string>>({});
    const [renewRates, setRenewRates] = useState<Record<string, number>>({});
    const [processOpen, setProcessOpen] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [done, setDone] = useState(false);

    const today = new Date();
    const cutoff = new Date(); cutoff.setDate(today.getDate() + (filter === '7' ? 7 : filter === '30' ? 30 : filter === '90' ? 90 : 9999));
    const filtered = maturingDeposits.filter(d => d.maturityDate <= cutoff);
    const selectedIds = Object.entries(selected).filter(([, v]) => v).map(([id]) => id);
    const selectedDeposits = filtered.filter(d => selectedIds.includes(d.id));

    const handleProcess = async () => {
        setProcessing(true);
        await new Promise(r => setTimeout(r, 1500));
        setProcessing(false);
        setDone(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="w-4 h-4" /></Button>
                <div><h1 className="text-2xl font-bold flex items-center gap-2"><Calendar className="w-6 h-6" /> Maturity Processing Queue</h1>
                    <p className="text-muted-foreground text-sm">Process FDR/RD deposits reaching maturity</p></div>
            </div>

            {done ? (
                <Card><CardContent className="pt-6 text-center py-10 space-y-4">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                    <h2 className="text-xl font-bold">Maturity Processing Complete</h2>
                    <p className="text-muted-foreground">{selectedDeposits.length} deposit(s) processed successfully.</p>
                    <Button onClick={() => router.push('/dashboard/deposits')}>Back to Deposits</Button>
                </CardContent></Card>
            ) : (
                <>
                    {/* Filter */}
                    <div className="flex gap-2 flex-wrap">
                        {(['7', '30', '90', 'all'] as const).map((val) => {
                            const labels: Record<string, string> = { '7': 'Next 7 Days', '30': 'Next 30 Days', '90': 'Next 90 Days', all: 'All Upcoming' };
                            return (
                                <button key={val} onClick={() => setFilter(val)} className={`px-4 py-2 rounded-lg text-sm border transition-colors ${filter === val ? 'bg-primary/10 border-primary text-primary font-medium' : 'border-border hover:border-primary/50'}`}>{labels[val]}</button>
                            );
                        })}
                    </div>

                    <Card>
                        <CardHeader><CardTitle className="flex items-center justify-between"><span>{filtered.length} Deposits Maturing</span>
                            <Button disabled={selectedIds.length === 0} onClick={() => setProcessOpen(true)}>Process {selectedIds.length > 0 ? `(${selectedIds.length})` : ''}</Button>
                        </CardTitle></CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-10"><Checkbox checked={filtered.length > 0 && filtered.every(d => selected[d.id])} onCheckedChange={v => { const s: Record<string, boolean> = {}; filtered.forEach(d => { s[d.id] = !!v; }); setSelected(s); }} /></TableHead>
                                        <TableHead>Deposit No</TableHead><TableHead>Member</TableHead><TableHead>Type</TableHead>
                                        <TableHead className="text-right">Principal</TableHead><TableHead className="text-right">To Pay</TableHead>
                                        <TableHead>Maturity Date</TableHead><TableHead>Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filtered.map(d => {
                                        const days = Math.ceil((d.maturityDate.getTime() - today.getTime()) / 86400000);
                                        return (
                                            <TableRow key={d.id} className={days <= 7 ? 'bg-amber-50 dark:bg-amber-950' : ''}>
                                                <TableCell><Checkbox checked={!!selected[d.id]} onCheckedChange={v => setSelected(prev => ({ ...prev, [d.id]: !!v }))} /></TableCell>
                                                <TableCell className="font-mono text-xs">{d.depositNo}</TableCell>
                                                <TableCell><p className="font-medium">{d.member}</p></TableCell>
                                                <TableCell><Badge variant="outline">{d.type}</Badge></TableCell>
                                                <TableCell className="text-right">{formatCurrency(d.amount, 0)}</TableCell>
                                                <TableCell className="text-right font-bold text-primary">{formatCurrency(d.maturityAmt)}</TableCell>
                                                <TableCell>
                                                    <p>{formatDate(d.maturityDate)}</p>
                                                    <p className={`text-xs ${days <= 7 ? 'text-amber-600 font-medium' : 'text-muted-foreground'}`}>{days <= 0 ? 'MATURED' : `in ${days} days`}</p>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex gap-1">
                                                        {d.options.map(opt => (
                                                            <button key={opt} onClick={() => setActions(prev => ({ ...prev, [d.id]: opt }))} className={`px-2 py-1 text-xs rounded border transition-colors ${actions[d.id] === opt ? 'bg-primary/10 border-primary text-primary font-medium' : 'border-border hover:border-primary/50'}`}>{opt}</button>
                                                        ))}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </>
            )}

            <Dialog open={processOpen} onOpenChange={setProcessOpen}>
                <DialogContent><DialogHeader><DialogTitle>Confirm Maturity Processing</DialogTitle></DialogHeader>
                    <div className="space-y-3 text-sm">
                        <Alert><AlertTriangle className="h-4 w-4" /><AlertDescription className="text-xs">This will submit all selected deposits for Checker approval. Amounts will be posted after approval.</AlertDescription></Alert>
                        {selectedDeposits.map(d => (
                            <div key={d.id} className="flex justify-between p-3 rounded-lg border border-border">
                                <div><p className="font-medium">{d.depositNo}</p><p className="text-xs text-muted-foreground">{d.member} • {actions[d.id] || 'No action selected'}</p></div>
                                <p className="font-bold text-primary">{formatCurrency(d.maturityAmt)}</p>
                            </div>
                        ))}
                    </div>
                    <Button className="w-full mt-4" disabled={processing} onClick={handleProcess}>{processing ? 'Processing...' : 'Confirm & Submit'}</Button>
                </DialogContent>
            </Dialog>
        </div>
    );
}
