'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import { ArrowLeft, Upload, CheckCircle, X, AlertTriangle, Zap, RefreshCw, Loader2, FileDown } from 'lucide-react';
import { bankReconApi } from '@/lib/api';

interface ReconEntry {
    id: string;
    source: 'GL' | 'BANK';
    date: string;
    narration?: string;
    amount: number;
    type: 'CR' | 'DR';
    status: string;
    confidence?: number | null;
}

interface UploadItem {
    id: string;
    fileName: string;
    bankName?: string;
    periodStart: string;
    periodEnd: string;
    transactionCount: number;
    createdAt: string;
}

export default function BankReconciliationPage() {
    const router = useRouter();
    const fileRef = useRef<HTMLInputElement>(null);
    const [uploads, setUploads] = useState<UploadItem[]>([]);
    const [entries, setEntries] = useState<ReconEntry[]>([]);
    const [currentUpload, setCurrentUpload] = useState<{ id: string; fileName: string; periodStart: string; periodEnd: string } | null>(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [running, setRunning] = useState(false);
    const [filter, setFilter] = useState<'all' | 'MATCHED' | 'UNMATCHED'>('all');
    const [manualMatchBank, setManualMatchBank] = useState<ReconEntry | null>(null);
    const [manualMatchGl, setManualMatchGl] = useState<ReconEntry | null>(null);
    const [matching, setMatching] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchUploads = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await bankReconApi.uploads();
            if (res.success && res.uploads) setUploads(res.uploads);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load');
        } finally {
            setLoading(false);
        }
    };

    const fetchEntries = async (uploadId: string) => {
        setLoading(true);
        setError(null);
        try {
            const res = await bankReconApi.entries(uploadId);
            if (res.success && res.entries) {
                setEntries(res.entries);
                setCurrentUpload(res.upload ? { id: res.upload.id, fileName: res.upload.fileName, periodStart: res.upload.periodStart, periodEnd: res.upload.periodEnd } : null);
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load entries');
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchUploads();
    }, []);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        setError(null);
        try {
            const text = await file.text();
            const res = await bankReconApi.upload({
                fileName: file.name,
                csvContent: text,
            });
            if (res.success && res.upload) {
                fetchUploads();
                fetchEntries(res.upload.id);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Upload failed');
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    };

    const handleRunMatch = async () => {
        if (!currentUpload) return;
        setRunning(true);
        setError(null);
        try {
            const res = await bankReconApi.run(currentUpload.id);
            if (res.success) fetchEntries(currentUpload.id);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Match failed');
        } finally {
            setRunning(false);
        }
    };

    const handleManualMatch = async () => {
        if (!manualMatchBank || !manualMatchGl || manualMatchBank.source !== 'BANK' || manualMatchGl.source !== 'GL') return;
        setMatching(true);
        setError(null);
        try {
            const res = await bankReconApi.match({ bankEntryId: manualMatchBank.id, glEntryId: manualMatchGl.id });
            if (res.success) {
                setManualMatchBank(null);
                setManualMatchGl(null);
                if (currentUpload) fetchEntries(currentUpload.id);
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Match failed');
        } finally {
            setMatching(false);
        }
    };

    const matched = entries.filter(e => e.status === 'MATCHED');
    const unmatched = entries.filter(e => e.status === 'UNMATCHED');
    const glEntries = entries.filter(e => e.source === 'GL');
    const bankEntries = entries.filter(e => e.source === 'BANK');
    const filtered = entries.filter(e => filter === 'all' || e.status === filter);

    const handleExport = () => {
        if (entries.length === 0) return;
        const header = ['Source', 'Date', 'Narration', 'Amount', 'Type', 'Status'];
        const rows = entries.map(e => [e.source, formatDate(e.date), e.narration || '', e.amount, e.type, e.status]);
        const csv = [header.join(','), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Bank_Recon_${currentUpload?.fileName || 'report'}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="w-4 h-4" /></Button>
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2"><RefreshCw className="w-6 h-6" /> Bank Reconciliation</h1>
                    <p className="text-muted-foreground text-sm">Upload bank statement and match with GL entries</p>
                </div>
                {currentUpload && <Button className="ml-auto gap-2" variant="outline" size="sm" onClick={handleExport}><FileDown className="w-4 h-4" /> Export Recon Report</Button>}
            </div>

            {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

            {!currentUpload ? (
                <>
                    <Card>
                        <CardContent className="pt-6 space-y-4">
                            <div className="text-center space-y-2">
                                <Upload className="w-12 h-12 text-muted-foreground mx-auto" />
                                <p className="font-semibold">Upload Bank Statement</p>
                                <p className="text-sm text-muted-foreground">CSV format: date, narration, amount, type (CR/DR)</p>
                            </div>
                            <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleFileSelect} />
                            <Button className="w-full" onClick={() => fileRef.current?.click()} disabled={uploading}>
                                {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                Upload CSV
                            </Button>
                        </CardContent>
                    </Card>
                    {uploads.length > 0 && (
                        <Card>
                            <CardHeader><h3 className="font-semibold">Previous Uploads</h3></CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {uploads.map(u => (
                                        <div key={u.id} className="flex items-center justify-between p-3 rounded-lg border">
                                            <span className="font-medium">{u.fileName}</span>
                                            <span className="text-sm text-muted-foreground">{u.transactionCount} transactions</span>
                                            <Button size="sm" variant="outline" onClick={() => fetchEntries(u.id)}>Open</Button>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </>
            ) : (
                <>
                    <Card>
                        <CardContent className="pt-6 flex items-center justify-between">
                            <div>
                                <p className="font-semibold">{currentUpload.fileName}</p>
                                <p className="text-sm text-muted-foreground">{formatDate(currentUpload.periodStart)} – {formatDate(currentUpload.periodEnd)}</p>
                            </div>
                            <Button onClick={handleRunMatch} disabled={running} className="gap-2">
                                {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                                {running ? 'Matching...' : 'Run Auto-Match'}
                            </Button>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {[
                            ['GL Entries', glEntries.length, 'text-primary'],
                            ['Bank Entries', bankEntries.length, 'text-primary'],
                            ['Matched', Math.floor(matched.length / 2), 'text-green-600'],
                            ['Unmatched', unmatched.length, 'text-red-600'],
                        ].map(([k, v, color]) => (
                            <Card key={String(k)}><CardContent className="pt-4"><p className="text-xs text-muted-foreground">{k}</p><p className={`text-2xl font-bold ${color}`}>{v}</p></CardContent></Card>
                        ))}
                    </div>

                    {unmatched.length > 0 && (
                        <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950">
                            <AlertTriangle className="h-4 w-4 text-amber-600" />
                            <AlertDescription className="text-amber-700 text-sm">{unmatched.length} entries could not be automatically matched. Use Manual Match to link bank and GL entries.</AlertDescription>
                        </Alert>
                    )}

                    <div className="flex gap-2">
                        {(['all', 'MATCHED', 'UNMATCHED'] as const).map(f => (
                            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${filter === f ? 'bg-primary/10 border-primary text-primary font-medium' : 'border-border hover:border-primary/50'}`}>{f === 'all' ? 'All' : f}</button>
                        ))}
                    </div>

                    <Card>
                        <CardContent className="pt-4">
                            {loading ? (
                                <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Source</TableHead><TableHead>Date</TableHead>
                                            <TableHead>Narration</TableHead>
                                            <TableHead className="text-right">Amount</TableHead>
                                            <TableHead>Status</TableHead><TableHead>Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filtered.map(entry => (
                                            <TableRow key={`${entry.source}-${entry.id}`} className={entry.status === 'MATCHED' ? 'bg-green-50/50 dark:bg-green-950/20' : 'bg-amber-50/50 dark:bg-amber-950/20'}>
                                                <TableCell>
                                                    <Badge className={entry.source === 'GL' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}>{entry.source}</Badge>
                                                </TableCell>
                                                <TableCell className="text-xs">{formatDate(entry.date)}</TableCell>
                                                <TableCell className="text-sm max-w-[200px] truncate">{entry.narration || '—'}</TableCell>
                                                <TableCell className={`text-right font-medium ${entry.type === 'CR' ? 'text-green-600' : 'text-red-500'}`}>
                                                    {entry.type === 'CR' ? '+' : '-'}{formatCurrency(entry.amount)}
                                                </TableCell>
                                                <TableCell>
                                                    {entry.status === 'MATCHED'
                                                        ? <Badge className="bg-green-100 text-green-800 gap-1"><CheckCircle className="w-3 h-3" /> Matched</Badge>
                                                        : <Badge className="bg-amber-100 text-amber-800 gap-1"><X className="w-3 h-3" /> Unmatched</Badge>
                                                    }
                                                </TableCell>
                                                <TableCell>
                                                    {entry.status === 'UNMATCHED' && entry.source === 'BANK' && (
                                                        <Button size="sm" variant="ghost" className="h-6 text-xs px-2" onClick={() => { setManualMatchBank(entry); setManualMatchGl(null); }}>Manual Match</Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>

                    <Button variant="outline" onClick={() => { setCurrentUpload(null); setEntries([]); }}>Back to Uploads</Button>
                </>
            )}

            <Dialog open={!!manualMatchBank} onOpenChange={(v) => { if (!v) { setManualMatchBank(null); setManualMatchGl(null); } }}>
                <DialogContent><DialogHeader><DialogTitle>Manual Match</DialogTitle></DialogHeader>
                    {manualMatchBank && (
                        <div className="space-y-4">
                            <div className="p-3 rounded border bg-purple-50 dark:bg-purple-950/30 text-sm">
                                Bank entry: {formatDate(manualMatchBank.date)} — {manualMatchBank.type} {formatCurrency(manualMatchBank.amount)}
                            </div>
                            <div>
                                <label className="text-sm font-medium">Select GL entry to match</label>
                                <div className="mt-2 max-h-48 overflow-y-auto space-y-1 border rounded-lg p-2">
                                    {entries.filter(e => e.source === 'GL' && e.status === 'UNMATCHED').map(gl => (
                                        <button key={gl.id} onClick={() => setManualMatchGl(gl)} className={`w-full text-left p-2 rounded text-sm transition-colors ${manualMatchGl?.id === gl.id ? 'bg-primary/20 border border-primary' : 'hover:bg-muted border border-transparent'}`}>
                                            {formatDate(gl.date)} — {gl.type} {formatCurrency(gl.amount)} — {gl.narration?.slice(0, 30) || '—'}
                                        </button>
                                    ))}
                                    {entries.filter(e => e.source === 'GL' && e.status === 'UNMATCHED').length === 0 && (
                                        <p className="text-sm text-muted-foreground py-4">No unmatched GL entries</p>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => { setManualMatchBank(null); setManualMatchGl(null); }}>Cancel</Button>
                                <Button onClick={handleManualMatch} disabled={!manualMatchGl || matching}>
                                    {matching ? 'Matching...' : manualMatchGl ? `Match` : 'Select GL entry'}
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
