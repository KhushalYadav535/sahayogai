'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import { ArrowLeft, Printer, AlertTriangle, Clock, Zap } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { depositsApi } from '@/lib/api';

export default function DepositDetailPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [certOpen, setCertOpen] = useState(false);
    const [prematureOpen, setPrematureOpen] = useState(false);
    const [deposit, setDeposit] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const res = await depositsApi.get(params.id);
                setDeposit(res.deposit);
            } catch {
                setDeposit(null);
            } finally {
                setLoading(false);
            }
        })();
    }, [params.id]);

    if (loading) return <p className="py-8 text-center text-muted-foreground">Loading...</p>;
    if (!deposit) return <div className="py-8 text-center"><p className="text-muted-foreground">Deposit not found</p><Button variant="outline" className="mt-4" onClick={() => router.back()}>Back</Button></div>;

    const memberName = deposit.member ? `${deposit.member.firstName} ${deposit.member.lastName}` : 'Unknown';
    const startDate = new Date(deposit.openedAt);
    const maturityDate = deposit.maturityDate ? new Date(deposit.maturityDate) : new Date(startDate.getTime() + deposit.tenureMonths * 30 * 86400000);
    const principal = Number(deposit.principal);
    const maturityAmount = Number(deposit.maturityAmount) || principal * (1 + (deposit.interestRate / 100) * (deposit.tenureMonths / 12));
    const interest = maturityAmount - principal;

    const today = new Date();
    const totalDays = Math.floor((maturityDate.getTime() - startDate.getTime()) / 86400000);
    const elapsedDays = Math.floor((today.getTime() - startDate.getTime()) / 86400000);
    const remainingDays = Math.max(0, totalDays - elapsedDays);
    const progress = totalDays > 0 ? Math.min(100, (elapsedDays / totalDays) * 100) : 0;
    const penaltyAmt = Math.round(interest * 0.1);

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="w-4 h-4" /></Button>
                <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                        <h1 className="text-2xl font-bold">{deposit.depositNumber}</h1>
                        <Badge className="bg-blue-100 text-blue-800">{String(deposit.depositType || '').toUpperCase()}</Badge>
                        <Badge className="bg-green-100 text-green-800">{deposit.status}</Badge>
                    </div>
                    <p className="text-muted-foreground text-sm">{memberName}</p>
                </div>
            </div>

            {/* AI Anomaly */}
            {deposit.aiAnomalyFlag && (
                <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950">
                    <Zap className="h-4 w-4 text-amber-600" /><AlertDescription className="text-amber-700 text-xs">AI ✦ Anomaly detected: Unusual deposit pattern flagged for review.</AlertDescription>
                </Alert>
            )}

            {/* Lien */}
            {deposit.lienLoanId && (
                <Alert className="border-red-200 bg-red-50 dark:bg-red-950">
                    <AlertTriangle className="h-4 w-4 text-red-600" /><AlertDescription><strong className="text-red-800">LIEN ACTIVE</strong> — Loan {deposit.lienLoanId}. Premature withdrawal not allowed.</AlertDescription>
                </Alert>
            )}

            {/* Maturity countdown */}
            <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
                <CardContent className="pt-5">
                    <div className="flex items-center gap-2 mb-2"><Clock className="w-4 h-4 text-primary" /><p className="text-sm font-semibold text-primary">Matures in {remainingDays} days on {formatDate(maturityDate)}</p></div>
                    <Progress value={progress} className="h-3 mb-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{formatDate(startDate)}</span>
                        <span>{Math.round(progress)}% elapsed</span>
                        <span>{formatDate(maturityDate)}</span>
                    </div>
                </CardContent>
            </Card>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Principal', value: formatCurrency(principal, 0) },
                    { label: 'Interest Accrued', value: formatCurrency(interest), color: 'text-green-600' },
                    { label: 'Maturity Amount', value: formatCurrency(maturityAmount), color: 'text-primary font-bold' },
                    { label: 'TDS Deducted', value: formatCurrency(deposit.tdsDeducted || 0), color: 'text-red-600' },
                ].map(c => (
                    <Card key={c.label}>
                        <CardContent className="pt-4">
                            <p className="text-xs text-muted-foreground">{c.label}</p>
                            <p className={`text-lg font-bold mt-1 ${c.color || ''}`}>{c.value}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Details */}
            <Card>
                <CardHeader><CardTitle className="text-base">Deposit Details</CardTitle></CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        {[['Type', String(deposit.depositType || '').toUpperCase()], ['Interest Rate', deposit.interestRate + '% p.a.'], ['Tenure', deposit.tenureMonths + ' months'], ['Start Date', formatDate(startDate)], ['Maturity Date', formatDate(maturityDate)], ['Compounding', deposit.compoundingFreq || 'Quarterly'], ['Member', memberName]].map(([k, v]) => (
                            <div key={k}><p className="text-xs text-muted-foreground">{k}</p><p className="font-medium mt-0.5">{v}</p></div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
                <Button onClick={() => setCertOpen(true)} variant="outline" className="gap-2"><Printer className="w-4 h-4" /> FDR Certificate</Button>
                {!deposit.lienLoanId && deposit.status === 'active' && <Button onClick={() => setPrematureOpen(true)} variant="destructive" className="gap-2"><AlertTriangle className="w-4 h-4" /> Premature Withdrawal</Button>}
            </div>

            {/* FDR Certificate */}
            <Dialog open={certOpen} onOpenChange={setCertOpen}>
                <DialogContent className="max-w-lg"><DialogHeader><DialogTitle>FDR Certificate</DialogTitle></DialogHeader>
                    <div className="border border-border rounded-lg p-6 space-y-4 text-sm">
                        <div className="text-center border-b border-border pb-4">
                            <p className="text-lg font-bold">Sahayog AI Cooperative Society</p>
                            <p className="text-xs text-muted-foreground">Registered under Maharashtra Co-op Act</p>
                            <p className="text-base font-bold mt-2">FIXED DEPOSIT RECEIPT</p>
                            <p className="font-mono text-xs text-primary mt-1">Certificate No: {deposit.depositNumber}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            {[['Member Name', memberName], ['Amount', formatCurrency(principal, 0)], ['Rate of Interest', deposit.interestRate + '% p.a.'], ['Tenure', deposit.tenureMonths + ' months'], ['Issue Date', formatDate(startDate)], ['Maturity Date', formatDate(maturityDate)], ['Maturity Amount', formatCurrency(maturityAmount)]].map(([k, v]) => (
                                <div key={k}><p className="text-xs text-muted-foreground">{k}</p><p className="font-semibold">{v}</p></div>
                            ))}
                        </div>
                        <p className="text-xs text-muted-foreground border-t border-border pt-3">This certificate is computer generated and does not require signature. Subject to terms and conditions.</p>
                    </div>
                    <Button className="w-full" onClick={() => window.print()}><Printer className="w-4 h-4 mr-2" /> Print / Download PDF</Button>
                </DialogContent>
            </Dialog>

            {/* Premature Withdrawal */}
            <Dialog open={prematureOpen} onOpenChange={setPrematureOpen}>
                <DialogContent><DialogHeader><DialogTitle>Premature Withdrawal Confirmation</DialogTitle></DialogHeader>
                    <div className="space-y-3 text-sm">
                        <Alert className="border-red-200 bg-red-50 dark:bg-red-950"><AlertTriangle className="h-4 w-4 text-red-600" /><AlertDescription className="text-red-700 text-xs">Early withdrawal attracts a penalty of 10% on interest earned.</AlertDescription></Alert>
                        <div className="flex justify-between"><span className="text-muted-foreground">Principal</span><span>{formatCurrency(principal, 0)}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Interest Earned</span><span className="text-green-600">{formatCurrency(interest)}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Penalty (10%)</span><span className="text-red-600">- {formatCurrency(penaltyAmt)}</span></div>
                        <div className="flex justify-between border-t border-border pt-2 font-bold text-base"><span>Net Payable</span><span className="text-primary">{formatCurrency(principal + interest - penaltyAmt)}</span></div>
                    </div>
                    <Button variant="destructive" className="w-full mt-4" onClick={() => setPrematureOpen(false)}>Confirm Premature Withdrawal</Button>
                </DialogContent>
            </Dialog>
        </div>
    );
}
