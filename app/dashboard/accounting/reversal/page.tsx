'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import { ArrowLeft, AlertTriangle, CheckCircle, RotateCcw, Loader2 } from 'lucide-react';
import { glApi } from '@/lib/api';

interface VoucherRow {
    id: string;
    voucherNumber: string;
    date: string;
    narration?: string | null;
    totalAmount: number;
    status: string;
    makerUserId?: string | null;
}

export default function ReversalPage() {
    const router = useRouter();
    const [search, setSearch] = useState('');
    const [vouchers, setVouchers] = useState<VoucherRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedJV, setSelectedJV] = useState<VoucherRow | null>(null);
    const [reason, setReason] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const fetchVouchers = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await glApi.vouchers.list({ voucherType: 'JV', status: 'posted', limit: 100 });
            if (res.success && res.vouchers) {
                const rows = res.vouchers
                    .filter((v: any) => v.status !== 'reversed')
                    .map((v: any) => ({
                        id: v.id,
                        voucherNumber: v.voucherNumber || v.id,
                        date: v.date,
                        narration: v.narration,
                        totalAmount: Number(v.totalAmount || 0),
                        status: v.status,
                        makerUserId: v.makerUserId,
                    }));
                setVouchers(rows);
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load vouchers');
            setVouchers([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVouchers();
    }, []);

    const filtered = vouchers.filter(j =>
        (j.voucherNumber || '').toLowerCase().includes(search.toLowerCase()) ||
        (j.narration || '').toLowerCase().includes(search.toLowerCase())
    );

    const handleReverse = async () => {
        if (!selectedJV) return;
        setSubmitting(true);
        setError(null);
        try {
            const res = await glApi.vouchers.reverse(selectedJV.id);
            if (res.success && res.reversal) {
                setDone(res.reversal.voucherNumber || 'RV-' + res.reversal.id?.slice(-6));
                setModalOpen(false);
                setSelectedJV(null);
                setReason('');
                fetchVouchers();
            } else {
                setError('Reversal failed');
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Reversal failed');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="w-4 h-4" /></Button>
                <div><h1 className="text-2xl font-bold flex items-center gap-2"><RotateCcw className="w-6 h-6" /> Reversal Entries</h1>
                    <p className="text-muted-foreground text-sm">Create contra entries for posted journal vouchers</p></div>
            </div>

            <Alert><AlertDescription className="text-sm">A reversal creates an equal and opposite journal entry on the current date, maintaining full audit trail of the original and reversed vouchers.</AlertDescription></Alert>

            {done && (
                <Alert className="border-green-200 bg-green-50 dark:bg-green-950">
                    <CheckCircle className="h-4 w-4 text-green-600" /><AlertDescription className="text-green-700">Reversal entry <strong>{done}</strong> created successfully.</AlertDescription>
                </Alert>
            )}

            {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

            <div className="relative">
                <Input placeholder="Search by JV number or narration..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between"><CardTitle>Reversible Journal Vouchers</CardTitle><Button size="sm" variant="outline" onClick={fetchVouchers} disabled={loading}>Refresh</Button></CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>JV Number</TableHead><TableHead>Date</TableHead><TableHead>Narration</TableHead>
                                    <TableHead className="text-right">Amount</TableHead><TableHead>Created By</TableHead>
                                    <TableHead>Status</TableHead><TableHead>Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.length === 0 ? (
                                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No posted journal vouchers to reverse. Create and post JV entries first.</TableCell></TableRow>
                                ) : (
                                    filtered.map(jv => (
                                        <TableRow key={jv.id}>
                                            <TableCell className="font-mono text-xs">{jv.voucherNumber}</TableCell>
                                            <TableCell>{formatDate(jv.date)}</TableCell>
                                            <TableCell className="max-w-xs truncate">{jv.narration || '—'}</TableCell>
                                            <TableCell className="text-right font-medium">{formatCurrency(jv.totalAmount, 0)}</TableCell>
                                            <TableCell>{jv.makerUserId || '—'}</TableCell>
                                            <TableCell>
                                                <Badge className={jv.status === 'POSTED' || jv.status === 'posted' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}>{jv.status}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Button size="sm" variant="outline" className="gap-1" onClick={() => { setSelectedJV(jv); setModalOpen(true); setReason(''); }}>
                                                    <RotateCcw className="w-3 h-3" /> Reverse
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent><DialogHeader><DialogTitle>Create Reversal Entry</DialogTitle></DialogHeader>
                    {selectedJV && (
                        <div className="space-y-4">
                            <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950">
                                <AlertTriangle className="h-4 w-4 text-amber-600" /><AlertDescription className="text-amber-700 text-xs">This will create a contra entry for JV {selectedJV.voucherNumber} dated {formatDate(new Date())}.</AlertDescription>
                            </Alert>
                            <div className="rounded-lg border border-border divide-y divide-border text-sm overflow-hidden">
                                <div className="flex justify-between p-3 bg-muted/30"><span className="font-medium">Original JV</span><span className="font-mono text-xs">{selectedJV.voucherNumber}</span></div>
                                <div className="flex justify-between p-3"><span className="text-muted-foreground">Date</span><span>{formatDate(selectedJV.date)}</span></div>
                                <div className="flex justify-between p-3"><span className="text-muted-foreground">Narration</span><span className="truncate max-w-[180px]">{selectedJV.narration || '—'}</span></div>
                                <div className="flex justify-between p-3"><span className="text-muted-foreground">Amount</span><span className="font-bold">{formatCurrency(selectedJV.totalAmount, 0)}</span></div>
                            </div>
                            <div><label className="text-sm font-medium">Reason for Reversal *</label><Textarea className="mt-1" placeholder="State the reason for reversal..." value={reason} onChange={e => setReason(e.target.value)} rows={3} /></div>
                            <Button className="w-full" disabled={!reason.trim() || submitting} onClick={handleReverse}>{submitting ? 'Creating Reversal...' : 'Create Reversal Entry'}</Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
