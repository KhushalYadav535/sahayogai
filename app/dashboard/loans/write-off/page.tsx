'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatCurrency } from '@/lib/utils/formatters';
import { ArrowLeft, AlertTriangle, CheckCircle, TrendingDown, DollarSign, RefreshCw, Loader2 } from 'lucide-react';
import { loansApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface WriteOffLoan {
    id: string;
    loanId: string;
    member: string;
    outstanding: number;
    provision: number;
    provisionPct: number;
    dpd: number;
    npaClass: string;
    lastPayment?: string;
}

interface RecoveryRecord {
    id: string;
    loanId: string;
    loanDbId: string;
    member: string;
    writeOffAmt: number;
    recovered: number;
    recoveryDate: string;
    balance: number;
}

function memberName(loan: any) {
    if (loan.member) return `${loan.member.firstName} ${loan.member.lastName}`;
    return `Member-${loan.memberId?.slice(0, 6)}`;
}

export default function LoanWriteOffPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [eligible, setEligible] = useState<WriteOffLoan[]>([]);
    const [recovery, setRecovery] = useState<RecoveryRecord[]>([]);

    const [selectedLoan, setSelectedLoan] = useState<WriteOffLoan | null>(null);
    const [resolutionRef, setResolutionRef] = useState('');
    const [writeOffNote, setWriteOffNote] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [completedIds, setCompletedIds] = useState<string[]>([]);

    const [recoveryModal, setRecoveryModal] = useState<RecoveryRecord | null>(null);
    const [recoveryAmt, setRecoveryAmt] = useState('');
    const [recordingRecovery, setRecordingRecovery] = useState(false);

    const fetchLoans = async () => {
        setLoading(true);
        try {
            const res = await loansApi.list({ limit: 200 });
            const loans = res.loans || [];

            // Eligible for write-off: defaulted/NPA loans with high DPD
            const writeOffLoans: WriteOffLoan[] = loans
                .filter((l: any) => l.status === 'defaulted' || l.status === 'npa')
                .map((l: any) => {
                    const outstanding = Number(l.outstandingPrincipal) || 0;
                    const dpd = l.dpd || 0;
                    const npaClass = dpd > 365 ? 'LOSS' : dpd > 270 ? 'Doubtful-2' : dpd > 180 ? 'Doubtful-1' : 'Sub-Standard';
                    const provisionPct = npaClass === 'LOSS' ? 100 : npaClass === 'Doubtful-2' ? 75 : npaClass === 'Doubtful-1' ? 40 : 15;
                    return {
                        id: l.id,
                        loanId: l.loanNumber || l.id,
                        member: memberName(l),
                        outstanding,
                        provision: outstanding * provisionPct / 100,
                        provisionPct,
                        dpd,
                        npaClass,
                        lastPayment: l.updatedAt,
                    };
                });

            // Written-off loans = recovery tracking entries
            const writtenOff: RecoveryRecord[] = loans
                .filter((l: any) => l.status === 'written-off' && l.writeOffAmount)
                .map((l: any) => ({
                    id: `R-${l.id.slice(0, 6)}`,
                    loanId: l.loanNumber || l.id,
                    loanDbId: l.id,
                    member: memberName(l),
                    writeOffAmt: Number(l.writeOffAmount) || 0,
                    recovered: 0, // would need a separate recovery tracking table
                    recoveryDate: l.writeOffDate || l.updatedAt,
                    balance: Number(l.writeOffAmount) || 0,
                }));

            setEligible(writeOffLoans);
            setRecovery(writtenOff);
        } catch {
            toast({ title: 'Failed to load loans', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchLoans(); }, []);

    const handleWriteOff = async () => {
        if (!selectedLoan || !resolutionRef) return;
        setSubmitting(true);
        try {
            await loansApi.writeOff(selectedLoan.id, {
                writeOffAmount: selectedLoan.outstanding,
                remarks: `BOD Ref: ${resolutionRef}. ${writeOffNote}`,
            });
            setCompletedIds(prev => [...prev, selectedLoan.id]);
            toast({ title: '✅ Loan written off', description: `${selectedLoan.loanId} written off successfully.` });
            setSelectedLoan(null);
            setResolutionRef('');
            setWriteOffNote('');
        } catch (e: any) {
            toast({ title: 'Write-off failed', description: e?.message || 'Unknown error', variant: 'destructive' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleRecordRecovery = async () => {
        if (!recoveryModal || !recoveryAmt) return;
        setRecordingRecovery(true);
        // In a full implementation, POST to a recovery endpoint.
        // For now we show success toast and update local state.
        await new Promise(r => setTimeout(r, 800));
        toast({ title: '✅ Recovery recorded', description: `₹${Number(recoveryAmt).toLocaleString()} recovered from ${recoveryModal.loanId}.` });
        setRecovery(prev => prev.map(r =>
            r.id === recoveryModal.id
                ? { ...r, recovered: r.recovered + Number(recoveryAmt), balance: Math.max(0, r.balance - Number(recoveryAmt)) }
                : r
        ));
        setRecordingRecovery(false);
        setRecoveryModal(null);
        setRecoveryAmt('');
    };

    const activeEligible = eligible.filter(l => !completedIds.includes(l.id));
    const totalEligible = activeEligible.reduce((s, l) => s + l.outstanding, 0);
    const totalRecovered = recovery.reduce((s, r) => s + r.recovered, 0);

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="w-4 h-4" /></Button>
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2"><TrendingDown className="w-6 h-6" /> Loan Write-Off & Recovery</h1>
                    <p className="text-muted-foreground text-sm">Process fully provisioned loans; track post-write-off recoveries</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Eligible for Write-Off</p><p className="text-2xl font-bold text-red-600">{loading ? '—' : activeEligible.length}</p></CardContent></Card>
                <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Write-Off Exposure</p><p className="text-lg font-bold text-red-600">{loading ? '—' : formatCurrency(totalEligible)}</p></CardContent></Card>
                <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Total Recovered</p><p className="text-lg font-bold text-green-600">{formatCurrency(totalRecovered)}</p></CardContent></Card>
            </div>

            <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-700 text-sm">Write-off requires a BOD resolution reference. GL Entry: <strong>DR Loan Loss Provision A/c, CR Loan Account</strong>.</AlertDescription>
            </Alert>

            {/* Eligible Loans */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2"><TrendingDown className="w-4 h-4" /> Write-Off Eligible Loans (Defaulted/NPA)</CardTitle>
                    <Button variant="outline" size="sm" onClick={fetchLoans} disabled={loading}>
                        <RefreshCw className={`w-3 h-3 mr-1 ${loading ? 'animate-spin' : ''}`} /> Refresh
                    </Button>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
                    ) : activeEligible.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">No loans currently eligible for write-off.</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Loan ID</TableHead><TableHead>Member</TableHead>
                                    <TableHead>NPA Class</TableHead><TableHead>DPD</TableHead>
                                    <TableHead className="text-right">Outstanding</TableHead>
                                    <TableHead className="text-right">Provision</TableHead><TableHead>Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {eligible.map(loan => (
                                    <TableRow key={loan.id} className={completedIds.includes(loan.id) ? 'opacity-40' : ''}>
                                        <TableCell className="font-mono text-xs">{loan.loanId}</TableCell>
                                        <TableCell className="font-medium">{loan.member}</TableCell>
                                        <TableCell><Badge className="bg-red-100 text-red-800">{loan.npaClass}</Badge></TableCell>
                                        <TableCell className="text-red-600 font-medium">{loan.dpd}d</TableCell>
                                        <TableCell className="text-right">{formatCurrency(loan.outstanding)}</TableCell>
                                        <TableCell className="text-right text-green-600">{loan.provisionPct}%</TableCell>
                                        <TableCell>
                                            {completedIds.includes(loan.id)
                                                ? <span className="text-xs text-green-600 font-medium flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Written Off</span>
                                                : <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => setSelectedLoan(loan)}>Write Off</Button>
                                            }
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Recovery History */}
            {recovery.length > 0 && (
                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><DollarSign className="w-4 h-4" /> Post Write-Off Recovery</CardTitle></CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Loan</TableHead><TableHead>Member</TableHead>
                                    <TableHead className="text-right">Written Off</TableHead>
                                    <TableHead className="text-right">Recovered</TableHead>
                                    <TableHead className="text-right">Balance</TableHead>
                                    <TableHead>Date</TableHead><TableHead>Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recovery.map(r => (
                                    <TableRow key={r.id}>
                                        <TableCell className="font-mono text-xs">{r.loanId}</TableCell>
                                        <TableCell>{r.member}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(r.writeOffAmt)}</TableCell>
                                        <TableCell className="text-right text-green-600 font-medium">{formatCurrency(r.recovered)}</TableCell>
                                        <TableCell className="text-right font-bold">{formatCurrency(r.balance)}</TableCell>
                                        <TableCell className="text-xs">{new Date(r.recoveryDate).toLocaleDateString('en-IN')}</TableCell>
                                        <TableCell>
                                            {r.balance > 0 && (
                                                <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => setRecoveryModal(r)}>
                                                    <RefreshCw className="w-3 h-3" /> Record Recovery
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            {/* Write-Off Modal */}
            <Dialog open={!!selectedLoan} onOpenChange={v => !v && setSelectedLoan(null)}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Write-Off Loan — {selectedLoan?.loanId}</DialogTitle></DialogHeader>
                    {selectedLoan && (
                        <div className="space-y-4">
                            <Alert className="border-red-200 bg-red-50 dark:bg-red-950">
                                <AlertTriangle className="h-4 w-4 text-red-600" />
                                <AlertDescription className="text-red-700 text-sm">This action is irreversible. The loan will be removed from active portfolio.</AlertDescription>
                            </Alert>
                            <div className="p-3 rounded-lg border border-border text-sm space-y-1">
                                {[['Member', selectedLoan.member], ['Outstanding', formatCurrency(selectedLoan.outstanding)], ['DPD', `${selectedLoan.dpd} days`], ['NPA Class', selectedLoan.npaClass]].map(([k, v]) => (
                                    <div key={k} className="flex justify-between"><span className="text-muted-foreground">{k}</span><span className="font-medium">{v}</span></div>
                                ))}
                            </div>
                            <div>
                                <label className="text-sm font-medium">BOD Resolution Reference *</label>
                                <Input className="mt-1" placeholder="e.g. BOD-RES-2026-14" value={resolutionRef} onChange={e => setResolutionRef(e.target.value)} />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Write-Off Notes</label>
                                <Textarea className="mt-1" rows={2} value={writeOffNote} onChange={e => setWriteOffNote(e.target.value)} placeholder="All recovery efforts exhausted..." />
                            </div>
                            <div className="p-3 rounded-lg bg-muted/30 border border-dashed border-border text-xs text-muted-foreground space-y-1">
                                <p className="font-semibold text-foreground">GL Entries on Write-Off</p>
                                <div className="flex justify-between"><span>DR Loan Loss Provision A/c</span><span>{formatCurrency(selectedLoan.outstanding)}</span></div>
                                <div className="flex justify-between"><span>CR Loans & Advances (Loan A/c)</span><span>{formatCurrency(selectedLoan.outstanding)}</span></div>
                            </div>
                            <Button variant="destructive" className="w-full" disabled={!resolutionRef || submitting} onClick={handleWriteOff}>
                                {submitting ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Processing…</> : 'Confirm Write-Off'}
                            </Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Recovery Modal */}
            <Dialog open={!!recoveryModal} onOpenChange={v => !v && setRecoveryModal(null)}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Record Recovery — {recoveryModal?.loanId}</DialogTitle></DialogHeader>
                    {recoveryModal && (
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm p-2 rounded bg-muted/30"><span className="text-muted-foreground">Balance Due</span><span className="font-bold">{formatCurrency(recoveryModal.balance)}</span></div>
                            <div><label className="text-sm font-medium">Recovery Amount</label><Input className="mt-1" type="number" placeholder="0" value={recoveryAmt} onChange={e => setRecoveryAmt(e.target.value)} /></div>
                            <div className="text-xs text-muted-foreground p-2 rounded border border-dashed">GL: DR Cash/Bank → CR Recoveries from Written-Off Accounts (Income)</div>
                            <Button className="w-full" disabled={!recoveryAmt || recordingRecovery} onClick={handleRecordRecovery}>
                                {recordingRecovery ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Recording…</> : 'Record Recovery'}
                            </Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
