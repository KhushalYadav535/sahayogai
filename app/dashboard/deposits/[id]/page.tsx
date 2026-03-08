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
    const [prematureData, setPrematureData] = useState<any>(null);
    const [loadingPremature, setLoadingPremature] = useState(false);
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
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
                    <DialogHeader><DialogTitle>FDR Certificate</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                        <iframe 
                            src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/v1/deposits/${params.id}/certificate`}
                            className="w-full h-[600px] border border-border rounded-lg"
                            title="FDR Certificate"
                        />
                        <div className="flex gap-3">
                            <Button className="flex-1" onClick={async () => {
                                try {
                                    const blob = await depositsApi.getCertificate(params.id);
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `FDR_Certificate_${deposit.depositNumber}.html`;
                                    a.click();
                                    URL.revokeObjectURL(url);
                                } catch (e) {
                                    alert('Failed to download certificate');
                                }
                            }}>
                                <Printer className="w-4 h-4 mr-2" /> Download Certificate
                            </Button>
                            <Button variant="outline" className="flex-1" onClick={() => {
                                const iframe = document.querySelector('iframe');
                                if (iframe) iframe.contentWindow?.print();
                            }}>
                                <Printer className="w-4 h-4 mr-2" /> Print
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Premature Withdrawal */}
            <Dialog open={prematureOpen} onOpenChange={setPrematureOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Premature Withdrawal Confirmation</DialogTitle></DialogHeader>
                    {loadingPremature ? (
                        <div className="py-8 text-center text-muted-foreground">Calculating penalty...</div>
                    ) : prematureData ? (
                        <div className="space-y-4">
                            <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950">
                                <AlertTriangle className="h-4 w-4 text-amber-600" />
                                <AlertDescription className="text-amber-700 text-xs">
                                    Premature withdrawal penalty: {prematureData.penaltyRate}% (Holding period: {prematureData.holdingMonths} months)
                                </AlertDescription>
                            </Alert>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between"><span className="text-muted-foreground">Principal</span><span className="font-medium">{formatCurrency(prematureData.principal, 0)}</span></div>
                                <div className="flex justify-between"><span className="text-muted-foreground">Holding Period</span><span>{prematureData.holdingMonths} months</span></div>
                                <div className="flex justify-between"><span className="text-muted-foreground">Penalty Rate</span><span className="text-red-600">{prematureData.penaltyRate}%</span></div>
                                <div className="flex justify-between"><span className="text-muted-foreground">Interest at Penalized Rate</span><span className="text-green-600">{formatCurrency(prematureData.totalInterest)}</span></div>
                                <div className="flex justify-between"><span className="text-muted-foreground">TDS Deducted</span><span className="text-red-600">- {formatCurrency(prematureData.tdsDeducted || 0)}</span></div>
                                <div className="flex justify-between border-t border-border pt-2 font-bold text-base">
                                    <span>Net Payable</span>
                                    <span className="text-primary">{formatCurrency(prematureData.netPayable)}</span>
                                </div>
                            </div>
                            <Button 
                                variant="destructive" 
                                className="w-full mt-4" 
                                onClick={async () => {
                                    try {
                                        await depositsApi.withdraw(params.id);
                                        alert('Premature withdrawal processed successfully');
                                        setPrematureOpen(false);
                                        router.refresh();
                                    } catch (e: any) {
                                        alert(e.message || 'Failed to process withdrawal');
                                    }
                                }}
                            >
                                Confirm Premature Withdrawal
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <Alert className="border-red-200 bg-red-50 dark:bg-red-950">
                                <AlertTriangle className="h-4 w-4 text-red-600" />
                                <AlertDescription className="text-red-700 text-xs">
                                    Premature withdrawal will attract penalty based on holding period. Click below to calculate.
                                </AlertDescription>
                            </Alert>
                            <Button 
                                className="w-full" 
                                onClick={async () => {
                                    setLoadingPremature(true);
                                    try {
                                        const res = await depositsApi.withdraw(params.id);
                                        setPrematureData(res);
                                    } catch (e: any) {
                                        alert(e.message || 'Failed to calculate penalty');
                                        setPrematureOpen(false);
                                    } finally {
                                        setLoadingPremature(false);
                                    }
                                }}
                            >
                                Calculate Penalty & Net Payable
                            </Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
