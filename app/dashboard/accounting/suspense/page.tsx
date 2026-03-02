'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import { ArrowLeft, AlertTriangle, FileDown, ArrowRight, Loader2, Plus } from 'lucide-react';
import { suspenseApi, glApi } from '@/lib/api';

interface SuspenseItem {
    id: string;
    suspenseNumber: string;
    amount: number;
    receiptDate: string;
    narration?: string | null;
    status: string;
    openFor: number;
}

export default function SuspensePage() {
    const router = useRouter();
    const [items, setItems] = useState<SuspenseItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selected, setSelected] = useState<SuspenseItem | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [createOpen, setCreateOpen] = useState(false);
    const [targetGL, setTargetGL] = useState('');
    const [note, setNote] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [glAccounts, setGlAccounts] = useState<{ code: string; name: string }[]>([]);
    const [newAmount, setNewAmount] = useState('');
    const [newDate, setNewDate] = useState(new Date().toISOString().slice(0, 10));
    const [newNarration, setNewNarration] = useState('');

    const fetchItems = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await suspenseApi.list();
            if (res.success && res.entries) setItems(res.entries);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load suspense');
            setItems([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchGlAccounts = async () => {
        try {
            const res = await glApi.coa.list();
            if (res.success && res.accounts) {
                setGlAccounts(res.accounts.map((a: any) => ({ code: a.code, name: a.name })));
            }
        } catch {
            setGlAccounts([]);
        }
    };

    useEffect(() => {
        fetchItems();
    }, []);

    useEffect(() => {
        if (modalOpen) fetchGlAccounts();
    }, [modalOpen]);

    const openItems = items.filter(i => i.status === 'OPEN' || i.status === 'OVERDUE');
    const totalOpen = openItems.reduce((s, i) => s + i.amount, 0);
    const clearedCount = items.filter(i => i.status === 'CLEARED').length;

    const handleClear = async () => {
        if (!selected) return;
        const acc = glAccounts.find(a => a.code === targetGL);
        if (!acc || !note.trim()) return;
        setSubmitting(true);
        setError(null);
        try {
            const res = await suspenseApi.clear(selected.id, {
                targetGlCode: targetGL,
                targetGlName: acc.name,
                clearingNote: note,
            });
            if (res.success) {
                setModalOpen(false);
                setSelected(null);
                setTargetGL('');
                setNote('');
                fetchItems();
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Clear failed');
        } finally {
            setSubmitting(false);
        }
    };

    const handleCreate = async () => {
        const amt = parseFloat(newAmount);
        if (!newAmount || isNaN(amt) || amt <= 0 || !newDate) return;
        setSubmitting(true);
        setError(null);
        try {
            const res = await suspenseApi.create({
                amount: amt,
                receiptDate: newDate,
                narration: newNarration || undefined,
            });
            if (res.success) {
                setCreateOpen(false);
                setNewAmount('');
                setNewDate(new Date().toISOString().slice(0, 10));
                setNewNarration('');
                fetchItems();
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Create failed');
        } finally {
            setSubmitting(false);
        }
    };

    const handleExport = () => {
        if (items.length === 0) return;
        const header = ['Suspense ID', 'Receipt Date', 'Narration', 'Amount', 'Open For', 'Status'];
        const rows = items.map(i => [i.suspenseNumber, formatDate(i.receiptDate), i.narration || '', i.amount, i.openFor, i.status]);
        const csv = [header.join(','), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Suspense_Ledger.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="w-4 h-4" /></Button>
                <div><h1 className="text-2xl font-bold">Suspense Account Manager</h1><p className="text-muted-foreground text-sm">Uncleared / unidentified transactions pending classification</p></div>
                <Button size="sm" className="ml-auto gap-2" onClick={() => setCreateOpen(true)}><Plus className="w-4 h-4" />Add Entry</Button>
            </div>

            {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
            {totalOpen > 0 && <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950"><AlertTriangle className="h-4 w-4 text-amber-600" /><AlertDescription className="text-amber-700">Suspense balances must be cleared within 30 days as per RBI guidelines.</AlertDescription></Alert>}

            <div className="grid grid-cols-3 gap-4">
                <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Open Balance</p><p className="text-xl font-bold text-amber-600">{formatCurrency(totalOpen, 0)}</p></CardContent></Card>
                <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Open Items</p><p className="text-xl font-bold">{openItems.length}</p></CardContent></Card>
                <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Cleared</p><p className="text-xl font-bold text-green-600">{clearedCount}</p></CardContent></Card>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Suspense Ledger</CardTitle>
                    <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="gap-2" onClick={handleExport} disabled={items.length === 0}><FileDown className="w-4 h-4" />Export CSV</Button>
                        <Button size="sm" variant="outline" onClick={fetchItems} disabled={loading}>Refresh</Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Suspense ID</TableHead><TableHead>Receipt Date</TableHead><TableHead>Narration</TableHead>
                                    <TableHead className="text-right">Amount</TableHead><TableHead>Open For</TableHead>
                                    <TableHead>Status</TableHead><TableHead>Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items.length === 0 ? (
                                    <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">No suspense entries. Click Add Entry to create one.</TableCell></TableRow>
                                ) : (
                                    items.map(item => {
                                        const isCleared = item.status === 'CLEARED';
                                        return (
                                            <TableRow key={item.id} className={item.openFor > 15 && !isCleared ? 'bg-red-50 dark:bg-red-950' : ''}>
                                                <TableCell className="font-mono text-xs">{item.suspenseNumber}</TableCell>
                                                <TableCell>{formatDate(item.receiptDate)}</TableCell>
                                                <TableCell className="max-w-xs truncate text-sm">{item.narration || '—'}</TableCell>
                                                <TableCell className="text-right font-bold">{formatCurrency(item.amount, 0)}</TableCell>
                                                <TableCell>{!isCleared && <span className={`text-xs font-medium ${item.openFor > 15 ? 'text-red-600' : 'text-amber-600'}`}>{item.openFor} days</span>}</TableCell>
                                                <TableCell>
                                                    <span className={`text-xs font-medium ${isCleared ? 'text-green-600' : item.openFor > 15 ? 'text-red-600' : 'text-amber-600'}`}>
                                                        {isCleared ? 'CLEARED' : item.openFor > 15 ? 'OVERDUE' : 'OPEN'}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    {!isCleared && (
                                                        <Button size="sm" className="gap-1 h-7 text-xs" onClick={() => { setSelected(item); setModalOpen(true); setTargetGL(''); setNote(''); }}>
                                                            Clear <ArrowRight className="w-3 h-3" />
                                                        </Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent><DialogHeader><DialogTitle>Clear Suspense Entry</DialogTitle></DialogHeader>
                    {selected && (
                        <div className="space-y-4">
                            <div className="p-3 rounded-lg border border-border space-y-1 text-sm">
                                <div className="flex justify-between"><span className="text-muted-foreground">Suspense ID</span><span className="font-mono font-semibold">{selected.suspenseNumber}</span></div>
                                <div className="flex justify-between"><span className="text-muted-foreground">Amount</span><span className="font-bold text-primary">{formatCurrency(selected.amount)}</span></div>
                                <div className="flex justify-between"><span className="text-muted-foreground">Received</span><span>{formatDate(selected.receiptDate)}</span></div>
                            </div>
                            <div>
                                <label className="text-sm font-medium">Transfer to GL Account</label>
                                <div className="grid grid-cols-1 gap-2 mt-2 max-h-40 overflow-y-auto">
                                    {glAccounts.map(acc => (
                                        <button key={acc.code} onClick={() => setTargetGL(acc.code)} className={`flex items-center justify-between p-2.5 rounded-lg border text-sm transition-colors ${targetGL === acc.code ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/50'}`}>
                                            <span className="font-medium">{acc.name}</span><span className="font-mono text-xs">{acc.code}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div><label className="text-sm font-medium">Clearing Note *</label><Textarea className="mt-1" placeholder="Explain why this entry is being cleared..." value={note} onChange={e => setNote(e.target.value)} rows={2} /></div>
                            <Button className="w-full" disabled={!targetGL || !note.trim() || submitting} onClick={handleClear}>{submitting ? 'Clearing...' : 'Clear to GL Account'}</Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent><DialogHeader><DialogTitle>Add Suspense Entry</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                        <div><label className="text-sm font-medium">Amount *</label><Input type="number" min="0" step="0.01" className="mt-1" placeholder="Amount" value={newAmount} onChange={e => setNewAmount(e.target.value)} /></div>
                        <div><label className="text-sm font-medium">Receipt Date *</label><Input type="date" className="mt-1" value={newDate} onChange={e => setNewDate(e.target.value)} /></div>
                        <div><label className="text-sm font-medium">Narration</label><Input className="mt-1" placeholder="Unrefined deposit, NEFT received..." value={newNarration} onChange={e => setNewNarration(e.target.value)} /></div>
                        <Button className="w-full" disabled={!newAmount || parseFloat(newAmount) <= 0 || !newDate || submitting} onClick={handleCreate}>{submitting ? 'Creating...' : 'Add Entry'}</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
