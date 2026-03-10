'use client';

import React, { useState, useEffect } from 'react';
import { meApi } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatCurrency } from '@/lib/utils/format';
import { CheckCircle, ArrowUpRight, Zap, CreditCard, Building2, Loader2, ArrowLeft, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { MemberPortalNav } from '@/components/member-portal-nav';
import { motion } from 'framer-motion';

const QUICK_AMOUNTS = [500, 1000, 2000, 5000];

const savedPayees = [
    { id: '1', name: 'Sister', upi: 'sister@oksbi', icon: '👩' },
    { id: '2', name: 'Electricity Bill', upi: 'msedcl@upi', icon: '⚡' },
];

export default function PortalPayPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);

    const [payMode, setPayMode] = useState<'UPI' | 'NEFT' | 'EMI'>('UPI');
    const [payee, setPayee] = useState('');
    const [amount, setAmount] = useState('');
    const [myBalance, setMyBalance] = useState(0);
    const [narration, setNarration] = useState('');

    // Auth & Flow State
    const [otpSent, setOtpSent] = useState(false);
    const [otp, setOtp] = useState('');
    const [sending, setSending] = useState(false);
    const [done, setDone] = useState(false);
    const [txRef, setTxRef] = useState('');

    useEffect(() => {
        let isMounted = true;
        async function loadBal() {
            try {
                const r = await meApi.accounts();
                if (r.success && r.accounts?.length && isMounted) {
                    const total = r.accounts.reduce((s: number, a: any) => s + Number(a.balance || 0), 0);
                    setMyBalance(total);
                }
            } catch (err) {
                console.error("Failed to load balance", err);
            } finally {
                if (isMounted) setLoading(false);
            }
        }
        loadBal();
        return () => { isMounted = false; };
    }, []);

    // Switch mode resets fields
    useEffect(() => { setPayee(''); setAmount(''); setNarration(''); setOtpSent(false); setOtp(''); }, [payMode]);

    const amtNum = Number(amount);
    const isValid = !!payee && amtNum > 0 && amtNum <= myBalance;

    const handleSend = () => {
        if (!isValid) return;
        setOtpSent(true);
        toast({ title: "OTP Sent", description: "Use 1234 for testing." });
    };

    const handleConfirm = async () => {
        if (otp.length < 4) return;
        setSending(true);

        await new Promise(r => setTimeout(r, 1500));

        if (otp !== '1234' && otp !== '0000') {
            setSending(false);
            toast({ title: "Invalid OTP", description: "Please enter the correct OTP.", variant: "destructive" });
            return;
        }

        setTxRef('TXN' + Date.now().toString().slice(-8).toUpperCase());
        setSending(false);
        setDone(true);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground animate-pulse">Loading...</p>
                </div>
            </div>
        );
    }

    if (done) {
        return (
            <div className="min-h-screen relative overflow-hidden pb-24">
                {/* Background glow */}
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                    className="flex flex-col items-center justify-center min-h-[70vh] p-4 text-center space-y-6 relative z-10"
                >
                    <div className="relative">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
                        >
                            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-2xl shadow-emerald-500/30">
                                <CheckCircle className="w-12 h-12 text-white" />
                            </div>
                        </motion.div>
                        <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-secondary animate-float" />
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-3xl font-bold tracking-tight text-foreground">{formatCurrency(amtNum, true)} Sent!</h2>
                        <p className="text-muted-foreground text-lg">Successfully transferred to <strong className="text-foreground">{payee}</strong></p>
                    </div>

                    <Card className="glass w-full max-w-sm border-white/20 dark:border-white/10 shadow-xl">
                        <CardContent className="p-5 text-sm space-y-3">
                            <div className="flex justify-between items-center py-1.5 border-b border-border/30">
                                <span className="text-muted-foreground">Reference No.</span>
                                <span className="font-mono font-bold">{txRef}</span>
                            </div>
                            <div className="flex justify-between items-center py-1.5 border-b border-border/30">
                                <span className="text-muted-foreground">Payment Mode</span>
                                <span className="font-medium">{payMode}</span>
                            </div>
                            <div className="flex justify-between items-center py-1.5">
                                <span className="text-muted-foreground">Status</span>
                                <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 shadow-sm border-emerald-200 dark:border-emerald-800">SUCCESS</Badge>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm pt-4">
                        <motion.div whileTap={{ scale: 0.97 }} className="flex-1">
                            <Button variant="outline" className="w-full h-12 text-base glass border-white/20 dark:border-white/10" onClick={() => { setDone(false); setPayee(''); setAmount(''); setNarration(''); setOtp(''); setOtpSent(false); }}>
                                New Transfer
                            </Button>
                        </motion.div>
                        <motion.div whileTap={{ scale: 0.97 }} className="flex-1">
                            <Button className="w-full h-12 text-base shadow-lg shadow-primary/20" onClick={() => router.push('/portal/account')}>
                                Back to Account
                            </Button>
                        </motion.div>
                    </div>
                </motion.div>
                <MemberPortalNav />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 pb-24 relative">
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
            <div className="absolute bottom-40 left-1/2 w-80 h-80 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md mx-auto p-4 pt-8 space-y-8"
            >
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="-ml-2 hover:bg-muted/50 rounded-xl">
                        <ArrowLeft className="w-5 h-5 text-muted-foreground" />
                    </Button>
                    <h1 className="text-2xl font-bold text-gradient-primary tracking-tight">Transfer Funds</h1>
                </div>

                {/* Balance Card */}
                <div className="glass rounded-2xl border-white/20 dark:border-white/10 p-4 flex items-center justify-between shadow-lg">
                    <div>
                        <p className="text-xs font-semibold text-primary/80 uppercase tracking-wider mb-1">Available Balance</p>
                        <p className="text-2xl font-bold text-foreground">{formatCurrency(myBalance, true)}</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/20">
                        <ArrowUpRight className="w-6 h-6 text-white" />
                    </div>
                </div>

                {/* Mode Selector */}
                <div className="space-y-3">
                    <p className="text-sm font-bold text-foreground/80 flex items-center gap-2">
                        <span className="w-1 h-4 bg-gradient-to-b from-primary to-primary/50 rounded-full" />
                        Select Method
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                        {(['UPI', 'NEFT', 'EMI'] as const).map(m => (
                            <motion.button
                                key={m}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setPayMode(m)}
                                className={`flex flex-col items-center justify-center p-4 rounded-2xl border text-sm font-semibold transition-all duration-300 ${payMode === m
                                    ? 'bg-gradient-to-br from-primary to-primary/90 border-primary text-primary-foreground shadow-xl shadow-primary/20 scale-[1.03]'
                                    : 'glass border-white/20 dark:border-white/10 text-muted-foreground hover:text-foreground hover:shadow-md'
                                    }`}
                            >
                                {m === 'UPI' && <Zap className={`w-5 h-5 mb-2 ${payMode === m ? 'text-primary-foreground' : 'text-primary/70'}`} />}
                                {m === 'NEFT' && <Building2 className={`w-5 h-5 mb-2 ${payMode === m ? 'text-primary-foreground' : 'text-primary/70'}`} />}
                                {m === 'EMI' && <CreditCard className={`w-5 h-5 mb-2 ${payMode === m ? 'text-primary-foreground' : 'text-primary/70'}`} />}
                                {m}
                            </motion.button>
                        ))}
                    </div>
                </div>

                {/* Form */}
                <Card className="glass border-white/20 dark:border-white/10 shadow-xl overflow-hidden">
                    <CardContent className="p-5 space-y-6">
                        {/* Saved Payees (UPI only) */}
                        {payMode === 'UPI' && (
                            <div className="bg-muted/20 -mx-5 -mt-5 px-5 py-4 border-b border-border/30 mb-2">
                                <p className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary/50" /> RECENT CONTACTS
                                </p>
                                <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar -mx-1 px-1">
                                    {savedPayees.map(p => (
                                        <motion.button
                                            key={p.id}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => { setPayee(p.upi); setAmount(''); }}
                                            className={`flex-shrink-0 flex flex-col items-center gap-1.5 p-2.5 rounded-xl border min-w-[72px] transition-all bg-card ${payee === p.upi ? 'border-primary ring-1 ring-primary/20 shadow-lg' : 'border-border/40 hover:border-primary/40 hover:shadow-md'}`}
                                        >
                                            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-xl shadow-sm border border-border/50">{p.icon}</div>
                                            <span className="font-medium text-[10px] truncate w-14 text-center">{p.name.split(' ')[0]}</span>
                                        </motion.button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {!otpSent ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="space-y-5"
                            >
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                        {payMode === 'UPI' ? 'Recipient UPI ID / Number' : payMode === 'NEFT' ? 'Recipient Account Number' : 'Loan Account ID'}
                                    </label>
                                    <div className="focus-glow rounded-lg">
                                        <Input
                                            className="h-12 bg-background/50 border-border/50 font-medium"
                                            placeholder={payMode === 'UPI' ? 'e.g. name@bank or 9876543210' : payMode === 'NEFT' ? 'XXXXXXXXXXXXXX' : 'LN-XXXX-XXXX'}
                                            value={payee}
                                            onChange={e => setPayee(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Amount</label>
                                    <div className="relative focus-glow rounded-lg">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-medium text-muted-foreground">₹</span>
                                        <Input
                                            className="h-14 pl-8 text-2xl font-bold bg-background/50 border-border/50 tracking-tight"
                                            type="number"
                                            placeholder="0"
                                            value={amount}
                                            onChange={e => setAmount(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex gap-2 mt-3 pt-1">
                                        {QUICK_AMOUNTS.map(a => (
                                            <motion.button
                                                key={a}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => setAmount(String(a))}
                                                className="flex-1 py-2 text-xs font-semibold rounded-xl border border-border/60 bg-background text-muted-foreground hover:border-primary/50 hover:bg-primary/5 hover:text-foreground transition-all"
                                            >
                                                +₹{a >= 1000 ? `${a / 1000}k` : a}
                                            </motion.button>
                                        ))}
                                    </div>
                                </div>

                                {amtNum > myBalance && (
                                    <Alert className="border-red-200/50 bg-red-50/30 dark:bg-red-950/10 py-2.5">
                                        <AlertDescription className="text-red-700 dark:text-red-400 text-xs font-medium">
                                            Insufficient balance. You have {formatCurrency(myBalance, true)} available.
                                        </AlertDescription>
                                    </Alert>
                                )}

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Add a Note <span className="normal-case opacity-70">(Optional)</span></label>
                                    <div className="focus-glow rounded-lg">
                                        <Input className="h-11 bg-background/50 border-border/50 text-sm" placeholder="What's this for?" value={narration} onChange={e => setNarration(e.target.value)} />
                                    </div>
                                </div>

                                <motion.div whileTap={{ scale: 0.98 }}>
                                    <Button
                                        className="w-full h-14 text-lg font-semibold shadow-xl shadow-primary/20 mt-2"
                                        disabled={!isValid}
                                        onClick={handleSend}
                                    >
                                        Proceed to Pay {amtNum > 0 ? formatCurrency(amtNum, true) : ''}
                                    </Button>
                                </motion.div>
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="space-y-6 py-2"
                            >
                                <div className="text-center space-y-2 mb-2">
                                    <div className="w-14 h-14 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-primary/20">
                                        <ArrowUpRight className="w-7 h-7 text-white" />
                                    </div>
                                    <h3 className="text-xl font-bold tracking-tight">Enter Security PIN</h3>
                                    <p className="text-sm text-muted-foreground px-4">
                                        Enter the 4-digit PIN sent to your phone to confirm sending <strong className="text-foreground">{formatCurrency(amtNum, true)}</strong> to <span className="text-foreground font-medium">{payee}</span>.
                                    </p>
                                </div>

                                <div className="pt-2">
                                    <div className="focus-glow rounded-lg">
                                        <Input
                                            className="h-16 text-center text-3xl font-mono tracking-[0.5em] bg-background/50 border-primary/30"
                                            maxLength={4}
                                            placeholder="••••"
                                            type="password"
                                            value={otp}
                                            onChange={e => setOtp(e.target.value)}
                                        />
                                    </div>
                                    <p className="text-center text-xs text-muted-foreground mt-3 flex items-center justify-center gap-1">
                                        OTP sent securely <CheckCircle className="w-3 h-3 text-emerald-500 inline" />
                                    </p>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <motion.div whileTap={{ scale: 0.97 }} className="flex-1">
                                        <Button variant="outline" className="w-full h-12 glass border-white/20 dark:border-white/10" disabled={sending} onClick={() => setOtpSent(false)}>Back</Button>
                                    </motion.div>
                                    <motion.div whileTap={{ scale: 0.97 }} className="flex-1">
                                        <Button className="w-full h-12 text-base font-semibold shadow-lg shadow-primary/20" disabled={otp.length < 4 || sending} onClick={handleConfirm}>
                                            {sending ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Verifying...</> : 'Send Securely'}
                                        </Button>
                                    </motion.div>
                                </div>
                            </motion.div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>

            <MemberPortalNav />
        </div>
    );
}
