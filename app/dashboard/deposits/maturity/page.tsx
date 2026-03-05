'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import { ArrowLeft, Calendar, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { createPortal } from 'react-dom';
import { depositsApi } from '@/lib/api';
import { useAuth } from '@/components/providers/auth-provider';


export default function MaturityProcessingPage() {
    const router = useRouter();
    const { user, isAuthenticated } = useAuth();
    const [filter, setFilter] = useState<'all' | '7' | '30' | '90'>('30');
    const [selected, setSelected] = useState<Record<string, boolean>>({});
    const [actions, setActions] = useState<Record<string, string>>({});
    const [renewRates, setRenewRates] = useState<Record<string, number>>({});
    const [processOpen, setProcessOpen] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [done, setDone] = useState(false);
    const [maturingDeposits, setMaturingDeposits] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Redirect if not authenticated
    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, router]);

    const today = new Date();
    const cutoff = new Date(); cutoff.setDate(today.getDate() + (filter === '7' ? 7 : filter === '30' ? 30 : filter === '90' ? 90 : 9999));
    const filtered = maturingDeposits.filter(d => new Date(d.maturityDate) <= cutoff);
    const selectedIds = Object.entries(selected).filter(([, v]) => v).map(([id]) => id);
    const selectedDeposits = filtered.filter(d => selectedIds.includes(d.id));

    // Fetch maturing deposits
    useEffect(() => {
        if (!isAuthenticated) return; // Don't fetch if not authenticated
        
        const fetchMaturingDeposits = async () => {
            setLoading(true);
            setError(null);
            try {
                const days = filter === 'all' ? 365 : parseInt(filter);
                const response = await depositsApi.getMaturing(days);
                setMaturingDeposits(response.deposits || []);
            } catch (err: any) {
                if (err.message.includes('401') || err.message.includes('Unauthorized')) {
                    setError('Authentication failed. Please log in again.');
                    // Redirect to login after a short delay
                    setTimeout(() => {
                        router.push('/login');
                    }, 2000);
                } else {
                    setError(err instanceof Error ? err.message : 'Failed to fetch maturing deposits');
                }
                setMaturingDeposits([]);
            } finally {
                setLoading(false);
            }
        };
        fetchMaturingDeposits();
    }, [filter, isAuthenticated, router]);

    const handleProcess = async () => {
        setProcessing(true);
        try {
            // Process each selected deposit based on action
            const processPromises = selectedDeposits.map(async (deposit) => {
                const action = actions[deposit.id];
                if (action === 'Payout' || action === 'Part-Renew') {
                    // Call mature API for payout
                    return await depositsApi.mature(deposit.id);
                }
                // TODO: Implement renewal logic
                return { success: true, message: 'Renewal not implemented yet' };
            });
            
            await Promise.all(processPromises);
            setDone(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to process deposits');
        } finally {
            setProcessing(false);
        }
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
                    <div className="flex gap-2 flex-wrap items-center">
                        {(['7', '30', '90', 'all'] as const).map((val) => {
                            const labels: Record<string, string> = { '7': 'Next 7 Days', '30': 'Next 30 Days', '90': 'Next 90 Days', all: 'All Upcoming' };
                            return (
                                <button key={val} onClick={() => setFilter(val)} className={`px-4 py-2 rounded-lg text-sm border transition-colors ${filter === val ? 'bg-primary/10 border-primary text-primary font-medium' : 'border-border hover:border-primary/50'}`}>{labels[val]}</button>
                            );
                        })}
                        <Button variant="outline" size="sm" onClick={() => window.location.reload()} disabled={loading}>
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>

                    {error && (
                        <Alert className="border-red-200 bg-red-50 dark:bg-red-950">
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                            <AlertDescription className="text-red-700">{error}</AlertDescription>
                        </Alert>
                    )}

                    <Card>
                        <CardHeader><CardTitle className="flex items-center justify-between"><span>{loading ? 'Loading...' : `${filtered.length} Deposits Maturing`}</span>
                            <Button disabled={selectedIds.length === 0 || loading} onClick={() => setProcessOpen(true)}>Process {selectedIds.length > 0 ? `(${selectedIds.length})` : ''}</Button>
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
                                        const days = Math.ceil((new Date(d.maturityDate).getTime() - today.getTime()) / 86400000);
                                        const memberName = d.member ? `${d.member.firstName} ${d.member.lastName}` : 'Unknown Member';
                                        const totalInterest = Number(d.accruedInterest) || 0;
                                        const maturityAmount = Number(d.maturityAmount) || (Number(d.principal) + totalInterest);
                                        const availableOptions = ['Payout']; // TODO: Add renewal options based on business logic
                                        
                                        return (
                                            <TableRow key={d.id} className={days <= 7 ? 'bg-amber-50 dark:bg-amber-950' : ''}>
                                                <TableCell><Checkbox checked={!!selected[d.id]} onCheckedChange={v => setSelected(prev => ({ ...prev, [d.id]: !!v }))} /></TableCell>
                                                <TableCell className="font-mono text-xs">{d.depositNumber}</TableCell>
                                                <TableCell><p className="font-medium">{memberName}</p></TableCell>
                                                <TableCell><Badge variant="outline">{d.depositType.toUpperCase()}</Badge></TableCell>
                                                <TableCell className="text-right">{formatCurrency(Number(d.principal), 0)}</TableCell>
                                                <TableCell className="text-right font-bold text-primary">{formatCurrency(maturityAmount)}</TableCell>
                                                <TableCell>
                                                    <p>{formatDate(new Date(d.maturityDate))}</p>
                                                    <p className={`text-xs ${days <= 7 ? 'text-amber-600 font-medium' : 'text-muted-foreground'}`}>{days <= 0 ? 'MATURED' : `in ${days} days`}</p>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex gap-1">
                                                        {availableOptions.map(opt => (
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

            {typeof window !== 'undefined' && createPortal(
                <Dialog open={processOpen} onOpenChange={setProcessOpen}>
                    <DialogContent 
                        className="z-[9999]" 
                        style={{ zIndex: 9999, position: 'relative' }}
                    >
                        <DialogHeader>
                            <DialogTitle>Confirm Maturity Processing</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-3 text-sm">
                            <Alert>
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription className="text-xs">
                                    This will submit all selected deposits for Checker approval. Amounts will be posted after approval.
                                </AlertDescription>
                            </Alert>
                            {selectedDeposits.map(d => {
                                const memberName = d.member ? `${d.member.firstName} ${d.member.lastName}` : 'Unknown Member';
                                const totalInterest = Number(d.accruedInterest) || 0;
                                const maturityAmount = Number(d.maturityAmount) || (Number(d.principal) + totalInterest);
                                
                                return (
                                    <div key={d.id} className="flex justify-between p-3 rounded-lg border border-border">
                                        <div>
                                            <p className="font-medium">{d.depositNumber}</p>
                                            <p className="text-xs text-muted-foreground">{memberName} • {actions[d.id] || 'No action selected'}</p>
                                        </div>
                                        <p className="font-bold text-primary">{formatCurrency(maturityAmount)}</p>
                                    </div>
                                );
                            })}
                        </div>
                        <Button className="w-full mt-4" disabled={processing} onClick={handleProcess}>
                            {processing ? 'Processing...' : 'Confirm & Submit'}
                        </Button>
                    </DialogContent>
                </Dialog>,
                document.body
            )}
        </div>
    );
}
