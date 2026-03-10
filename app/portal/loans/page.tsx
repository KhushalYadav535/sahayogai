'use client';

import React, { useState, useEffect } from 'react';
import { meApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import { CheckCircle, ArrowRight, Loader2, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { MemberPortalNav } from '@/components/member-portal-nav';
import { motion } from 'framer-motion';

const stagger = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

export default function PortalLoansPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [payOpen, setPayOpen] = useState(false);
    const [isPaying, setIsPaying] = useState(false);

    const [myLoans, setMyLoans] = useState<{ id: string; apiId?: string; type: string; outstanding: number; emi: number; nextDueDate: Date; overdueDays: number; status: string }[]>([]);
    const [myDeposits, setMyDeposits] = useState<{ id: string; type: string; amount: number; interestRate: number; maturityAmt: number; maturityDate: Date | null; status: string }[]>([]);

    const [selectedLoan, setSelectedLoan] = useState<typeof myLoans[0] | null>(null);
    const [paid, setPaid] = useState(false);
    const [payMode, setPayMode] = useState('UPI');

    useEffect(() => {
        let isMounted = true;

        async function loadData() {
            try {
                const [loansRes, depsRes] = await Promise.all([
                    meApi.loans().catch(() => ({ success: false, loans: [] })),
                    meApi.deposits().catch(() => ({ success: false, deposits: [] }))
                ]);

                if (isMounted) {
                    if (loansRes.success && loansRes.loans) {
                        const loansWithSchedule = await Promise.all(
                            loansRes.loans.map(async (l: any) => {
                                try {
                                    const scheduleRes = await meApi.loanSchedule(l.id);
                                    const schedule = scheduleRes.success ? scheduleRes.loan?.emiSchedule || [] : [];
                                    const nextPendingEmi = schedule.find((e: any) => e.status === 'pending' || e.status === 'overdue');
                                    const overdueEmis = schedule.filter((e: any) => {
                                        const dueDate = new Date(e.dueDate);
                                        return dueDate < new Date() && e.status !== 'paid';
                                    });

                                    return {
                                        id: l.loanNumber || l.id.slice(0, 8).toUpperCase(),
                                        apiId: l.id,
                                        type: l.loanType || 'Loan',
                                        outstanding: Number(l.outstandingPrincipal) || 0,
                                        emi: nextPendingEmi ? Number(nextPendingEmi.totalEmi || 0) : 0,
                                        nextDueDate: nextPendingEmi ? new Date(nextPendingEmi.dueDate) : new Date(),
                                        overdueDays: overdueEmis.length > 0 ? Math.ceil((new Date().getTime() - new Date(overdueEmis[0].dueDate).getTime()) / (1000 * 60 * 60 * 24)) : 0,
                                        status: l.status || 'ACTIVE',
                                    };
                                } catch {
                                    return {
                                        id: l.loanNumber || l.id.slice(0, 8).toUpperCase(),
                                        apiId: l.id,
                                        type: l.loanType || 'Loan',
                                        outstanding: Number(l.outstandingPrincipal) || 0,
                                        emi: 0,
                                        nextDueDate: new Date(),
                                        overdueDays: 0,
                                        status: l.status || 'ACTIVE',
                                    };
                                }
                            })
                        );
                        setMyLoans(loansWithSchedule);
                    }

                    if (depsRes.success && depsRes.deposits) {
                        setMyDeposits(depsRes.deposits.map((d: any) => ({
                            id: d.id.slice(0, 10).toUpperCase(),
                            type: d.depositType === 'fdr' ? 'Fixed Deposit' : 'Recurring Deposit',
                            amount: Number(d.amount) || 0,
                            interestRate: Number(d.interestRate) || 0,
                            maturityAmt: Number(d.maturityAmount) || 0,
                            maturityDate: d.maturityDate ? new Date(d.maturityDate) : null,
                            status: d.status
                        })));
                    }
                }
            } catch (err) {
                console.error("Failed to load loans/deposits", err);
                if (isMounted) toast({ title: "Error", description: "Failed to load all data.", variant: "destructive" });
            } finally {
                if (isMounted) setLoading(false);
            }
        }

        loadData();
        return () => { isMounted = false; };
    }, [toast]);

    const handlePay = async () => {
        if (!selectedLoan || !selectedLoan.apiId) return;
        setIsPaying(true);
        try {
            await meApi.payLoan(selectedLoan.apiId, { amount: selectedLoan.emi || selectedLoan.outstanding || 100 });
            await new Promise(r => setTimeout(r, 800));
            setPaid(true);
            setTimeout(() => {
                setPayOpen(false);
                setPaid(false);
                setIsPaying(false);
            }, 2000);
        } catch (err) {
            console.error(err);
            toast({ title: "Payment Failed", description: "Could not process payment at this time.", variant: "destructive" });
            setIsPaying(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground animate-pulse">Loading your portfolio...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 pb-24 relative">
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
            <div className="absolute bottom-40 left-0 w-80 h-80 bg-accent/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3 pointer-events-none" />

            <div className="space-y-8 max-w-4xl mx-auto p-4 pt-8">

                {/* LOANS SECTION */}
                <section>
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-between mb-6"
                    >
                        <h1 className="text-2xl font-bold text-gradient-primary">My Loans</h1>
                        <Badge variant="outline" className="glass border-primary/20 text-primary shadow-sm">{myLoans.length} Active</Badge>
                    </motion.div>

                    {myLoans.length === 0 ? (
                        <Card className="glass border-white/20 dark:border-white/10 border-dashed shadow-none">
                            <CardContent className="flex flex-col items-center justify-center py-14 text-center">
                                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
                                    <ArrowRight className="w-6 h-6 text-primary opacity-50" />
                                </div>
                                <p className="text-muted-foreground font-medium">No active loans found</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <motion.div variants={stagger} initial="hidden" animate="show" className="grid gap-4">
                            {myLoans.map(loan => (
                                <motion.div key={loan.id} variants={fadeUp}>
                                    <Card className={`glass hover-lift overflow-hidden border-white/20 dark:border-white/10 shadow-lg transition-all ${loan.overdueDays > 0 ? 'ring-1 ring-red-300/50 border-l-4 border-l-red-500' : 'border-l-4 border-l-primary'}`}>
                                        <CardHeader className="bg-muted/10 pb-4 border-b border-border/30">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">{loan.type}</p>
                                                    <CardTitle className="text-lg">#{loan.id}</CardTitle>
                                                </div>
                                                <Badge className={`px-2.5 py-1 shadow-sm ${loan.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-secondary text-secondary-foreground'}`}>
                                                    {loan.status}
                                                </Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="pt-5 space-y-5">
                                            <div className="grid grid-cols-3 gap-4">
                                                <div className="bg-primary/5 p-3 rounded-xl border border-primary/10">
                                                    <p className="text-xs text-muted-foreground mb-1 font-medium">Outstanding</p>
                                                    <p className="font-bold text-lg text-primary">{formatCurrency(loan.outstanding, true)}</p>
                                                </div>
                                                <div className="bg-muted/20 p-3 rounded-xl border border-border/30">
                                                    <p className="text-xs text-muted-foreground mb-1 font-medium">Monthly EMI</p>
                                                    <p className="font-bold text-lg text-foreground/90">{formatCurrency(loan.emi, true)}</p>
                                                </div>
                                                <div className="bg-muted/20 p-3 rounded-xl border border-border/30">
                                                    <p className="text-xs text-muted-foreground mb-1 font-medium">Next Due</p>
                                                    <p className="font-bold text-foreground/90 text-sm mt-1">{formatDate(loan.nextDueDate)}</p>
                                                </div>
                                            </div>

                                            {loan.overdueDays > 0 && (
                                                <Alert className="border-red-200/50 bg-red-50/30 dark:bg-red-950/10 py-2">
                                                    <AlertDescription className="text-red-700 dark:text-red-400 text-xs font-medium flex items-center justify-between">
                                                        <span>Your EMI is overdue by {loan.overdueDays} days. Please pay immediately.</span>
                                                        <Badge variant="destructive" className="text-[10px] uppercase animate-pulse">Action Required</Badge>
                                                    </AlertDescription>
                                                </Alert>
                                            )}

                                            <div className="flex flex-wrap gap-2 mt-2">
                                                <motion.div whileTap={{ scale: 0.97 }} className="flex-1 sm:flex-none">
                                                    <Button
                                                        variant="outline"
                                                        className="w-full glass border-white/20 dark:border-white/10"
                                                        onClick={() => router.push(`/member-portal/loans/${loan.apiId}`)}
                                                    >
                                                        View EMI Schedule
                                                    </Button>
                                                </motion.div>
                                                <motion.div whileTap={{ scale: 0.97 }} className="flex-1 sm:flex-none">
                                                    <Button
                                                        className="w-full shadow-lg shadow-primary/20"
                                                        onClick={() => { setSelectedLoan(loan); setPayOpen(true); }}
                                                    >
                                                        Pay EMI Now <ArrowRight className="w-4 h-4 ml-2" />
                                                    </Button>
                                                </motion.div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </section>

                {/* DEPOSITS SECTION */}
                <section className="pt-4">
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="flex items-center justify-between mb-6"
                    >
                        <h2 className="text-2xl font-bold text-gradient-accent">My Deposits</h2>
                        <Badge variant="outline" className="glass border-emerald-200/50 text-emerald-700 dark:text-emerald-400 shadow-sm">{myDeposits.length} Active</Badge>
                    </motion.div>

                    {myDeposits.length === 0 ? (
                        <Card className="glass border-white/20 dark:border-white/10 border-dashed shadow-none">
                            <CardContent className="flex flex-col items-center justify-center py-14 text-center">
                                <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center mb-3">
                                    <CheckCircle className="w-6 h-6 text-emerald-600 opacity-50" />
                                </div>
                                <p className="text-muted-foreground font-medium">No active deposits found</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <motion.div variants={stagger} initial="hidden" animate="show" className="grid gap-4 md:grid-cols-2">
                            {myDeposits.map(dep => (
                                <motion.div key={dep.id} variants={fadeUp}>
                                    <Card className="glass hover-lift overflow-hidden border-white/20 dark:border-white/10 shadow-lg">
                                        <div className="h-1.5 w-full bg-gradient-to-r from-emerald-400 to-teal-500" />
                                        <CardContent className="p-5">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <p className="text-sm font-medium text-muted-foreground">{dep.type}</p>
                                                    <p className="font-mono text-sm mt-0.5 text-foreground/80">#{dep.id}</p>
                                                </div>
                                                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800 shadow-sm">{dep.status}</Badge>
                                            </div>

                                            <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm mt-6">
                                                <div className="bg-muted/20 p-3 rounded-xl border border-border/30">
                                                    <p className="text-xs text-muted-foreground font-medium mb-1">Principal Amount</p>
                                                    <p className="font-bold text-lg text-foreground/90">{formatCurrency(dep.amount, true)}</p>
                                                </div>
                                                <div className="bg-emerald-50/50 dark:bg-emerald-950/10 p-3 rounded-xl border border-emerald-200/30 dark:border-emerald-800/20">
                                                    <p className="text-xs text-muted-foreground font-medium mb-1">Maturity Amount</p>
                                                    <p className="font-bold text-lg text-emerald-600">{formatCurrency(dep.maturityAmt, true)}</p>
                                                </div>
                                                <div className="bg-muted/20 p-3 rounded-xl border border-border/30">
                                                    <p className="text-xs text-muted-foreground font-medium mb-1">Interest Rate</p>
                                                    <p className="font-medium">{dep.interestRate}% <span className="text-muted-foreground text-[10px]">p.a.</span></p>
                                                </div>
                                                <div className="bg-muted/20 p-3 rounded-xl border border-border/30">
                                                    <p className="text-xs text-muted-foreground font-medium mb-1">Matures On</p>
                                                    <p className="font-medium text-foreground/90">{dep.maturityDate ? formatDate(dep.maturityDate) : 'N/A'}</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </section>

                {/* Pay EMI Modal */}
                <Dialog open={payOpen} onOpenChange={v => !v && !isPaying && setPayOpen(false)}>
                    <DialogContent className="sm:max-w-md glass border-white/20 dark:border-white/10 shadow-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-xl">Pay EMI</DialogTitle>
                        </DialogHeader>

                        {paid ? (
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="text-center py-10 space-y-4"
                            >
                                <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20">
                                    <CheckCircle className="w-10 h-10 text-white" />
                                </div>
                                <h3 className="text-2xl font-bold tracking-tight text-emerald-700 dark:text-emerald-400">Payment Successful!</h3>
                                <p className="text-muted-foreground text-sm max-w-[250px] mx-auto leading-relaxed">
                                    {formatCurrency(selectedLoan?.emi || selectedLoan?.outstanding || 0, true)} paid successfully towards Loan #{selectedLoan?.id} via {payMode}.
                                </p>
                            </motion.div>
                        ) : (
                            <div className="space-y-6 py-4">
                                <div className="glass p-4 rounded-xl border-white/20 dark:border-white/10 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Amount to Pay</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">Loan #{selectedLoan?.id}</p>
                                    </div>
                                    <p className="text-2xl font-bold text-primary tracking-tight">
                                        {formatCurrency(selectedLoan?.emi || selectedLoan?.outstanding || 0, true)}
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-sm font-semibold text-foreground/90">Select Payment Mode</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {['UPI', 'Net Banking', 'Debit Card'].map(m => (
                                            <button
                                                key={m}
                                                onClick={() => setPayMode(m)}
                                                className={`px-3 py-2.5 text-xs font-medium rounded-xl border transition-all ${payMode === m ? 'bg-gradient-to-br from-primary to-primary/90 border-primary text-primary-foreground shadow-lg shadow-primary/20 ring-2 ring-primary/20 ring-offset-1' : 'bg-background border-border hover:border-primary/50 hover:bg-muted/50'}`}
                                            >
                                                {m}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {payMode === 'UPI' && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="space-y-2"
                                    >
                                        <label className="text-xs font-medium text-muted-foreground">Enter your UPI ID</label>
                                        <div className="focus-glow rounded-lg">
                                            <Input placeholder="e.g. rajesh@upi or 9876543210@ybl" className="h-11 bg-background/50 border-border/50" />
                                        </div>
                                    </motion.div>
                                )}

                                <motion.div whileTap={{ scale: 0.98 }}>
                                    <Button
                                        className="w-full h-12 text-base font-semibold shadow-lg shadow-primary/20"
                                        onClick={handlePay}
                                        disabled={isPaying}
                                    >
                                        {isPaying ? (
                                            <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Processing...</>
                                        ) : (
                                            `Pay ${formatCurrency(selectedLoan?.emi || selectedLoan?.outstanding || 0, true)} Securely`
                                        )}
                                    </Button>
                                </motion.div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>

            <MemberPortalNav />
        </div>
    );
}
