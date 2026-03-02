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
import { CheckCircle, ArrowUpRight, Zap, CreditCard, Building2, Loader2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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

        // Simulate network / transfer
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
        return <div className="min-h-[50vh] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
    }

    if (done) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center space-y-6 animate-in zoom-in-95 duration-500">
                <div className="relative">
                    <div className="absolute inset-0 bg-emerald-500 blur-2xl opacity-20 rounded-full" />
                    <div className="relative w-24 h-24 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shadow-sm">
                        <CheckCircle className="w-12 h-12 text-emerald-600" />
                    </div>
                </div>

                <div className="space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">{formatCurrency(amtNum, true)} Sent!</h2>
                    <p className="text-muted-foreground text-lg">Successfully transferred to <strong>{payee}</strong></p>
                </div>

                <Card className="w-full max-w-sm border-dashed bg-muted/30">
                    <CardContent className="p-5 text-sm space-y-3">
                        <div className="flex justify-between items-center py-1 border-b border-border/50">
                            <span className="text-muted-foreground">Reference No.</span>
                            <span className="font-mono font-bold">{txRef}</span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b border-border/50">
                            <span className="text-muted-foreground">Payment Mode</span>
                            <span className="font-medium">{payMode}</span>
                        </div>
                        <div className="flex justify-between items-center py-1">
                            <span className="text-muted-foreground">Status</span>
                            <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 shadow-none border-emerald-200">SUCCESS</Badge>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm pt-4">
                    <Button variant="outline" className="flex-1 h-12 text-base" onClick={() => { setDone(false); setPayee(''); setAmount(''); setNarration(''); setOtp(''); setOtpSent(false); }}>
                        New Transfer
                    </Button>
                    <Button className="flex-1 h-12 text-base shadow-sm" onClick={() => router.push('/portal/account')}>
                        Back to Account
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto p-4 pb-20 pt-8 space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => router.back()} className="-ml-2">
                    <ArrowLeft className="w-5 h-5 text-muted-foreground" />
                </Button>
                <h1 className="text-2xl font-bold tracking-tight">Transfer Funds</h1>
            </div>

            {/* Balance Card mini */}
            <div className="rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 p-4 flex items-center justify-between">
                <div>
                    <p className="text-xs font-medium text-primary/80 uppercase tracking-wider mb-1">Available Balance</p>
                    <p className="text-2xl font-bold text-foreground">{formatCurrency(myBalance, true)}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <ArrowUpRight className="w-6 h-6 text-primary" />
                </div>
            </div>

            {/* Mode Selector */}
            <div className="space-y-3">
                <p className="text-sm font-semibold text-foreground/80">Select Method</p>
                <div className="grid grid-cols-3 gap-2">
                    {(['UPI', 'NEFT', 'EMI'] as const).map(m => (
                        <button
                            key={m}
                            onClick={() => setPayMode(m)}
                            className={`flex flex-col items-center justify-center p-4 rounded-xl border text-sm font-semibold transition-all duration-200 ${payMode === m ? 'border-primary bg-primary text-primary-foreground shadow-md scale-[1.02]' : 'bg-card border-border hover:border-primary/40 hover:bg-muted/50 text-muted-foreground hover:text-foreground'}`}
                        >
                            {m === 'UPI' && <Zap className={`w-5 h-5 mb-2 ${payMode === m ? 'text-primary-foreground' : 'text-primary/70'}`} />}
                            {m === 'NEFT' && <Building2 className={`w-5 h-5 mb-2 ${payMode === m ? 'text-primary-foreground' : 'text-primary/70'}`} />}
                            {m === 'EMI' && <CreditCard className={`w-5 h-5 mb-2 ${payMode === m ? 'text-primary-foreground' : 'text-primary/70'}`} />}
                            {m}
                        </button>
                    ))}
                </div>
            </div>

            {/* Form */}
            <Card className="border-border/60 shadow-sm overflow-hidden">
                <CardContent className="p-5 space-y-6">
                    {/* Saved Payees (UPI only for now) */}
                    {payMode === 'UPI' && (
                        <div className="bg-muted/30 -mx-5 -mt-5 px-5 py-4 border-b border-border/50 mb-2">
                            <p className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary/50" /> RECENT CONTACTS
                            </p>
                            <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar -mx-1 px-1">
                                {savedPayees.map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => { setPayee(p.upi); setAmount(''); }}
                                        className={`flex-shrink-0 flex flex-col items-center gap-1.5 p-2.5 rounded-xl border min-w-[72px] transition-all bg-card ${payee === p.upi ? 'border-primary ring-1 ring-primary/20 shadow-sm' : 'border-border/60 hover:border-primary/40'}`}
                                    >
                                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-xl shadow-sm border border-border/50">{p.icon}</div>
                                        <span className="font-medium text-[10px] truncate w-14 text-center">{p.name.split(' ')[0]}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {!otpSent ? (
                        <div className="space-y-5 animate-in fade-in slide-in-from-left-2 duration-300">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    {payMode === 'UPI' ? 'Recipient UPI ID / Number' : payMode === 'NEFT' ? 'Recipient Account Number' : 'Loan Account ID'}
                                </label>
                                <Input
                                    className="h-12 bg-muted/20 border-border/60 focus-visible:ring-primary/30 font-medium"
                                    placeholder={payMode === 'UPI' ? 'e.g. name@bank or 9876543210' : payMode === 'NEFT' ? 'XXXXXXXXXXXXXX' : 'LN-XXXX-XXXX'}
                                    value={payee}
                                    onChange={e => setPayee(e.target.value)}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Amount</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-medium text-muted-foreground">₹</span>
                                    <Input
                                        className="h-14 pl-8 text-2xl font-bold bg-muted/20 border-border/60 focus-visible:ring-primary/30 tracking-tight"
                                        type="number"
                                        placeholder="0"
                                        value={amount}
                                        onChange={e => setAmount(e.target.value)}
                                    />
                                </div>
                                <div className="flex gap-2 mt-3 pt-1">
                                    {QUICK_AMOUNTS.map(a => (
                                        <button
                                            key={a}
                                            onClick={() => setAmount(String(a))}
                                            className="flex-1 py-1.5 text-xs font-medium rounded-lg border border-border/80 bg-background text-muted-foreground hover:border-primary/50 hover:bg-primary/5 hover:text-foreground transition-all"
                                        >
                                            +₹{a >= 1000 ? `${a / 1000}k` : a}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {amtNum > myBalance && (
                                <Alert className="border-red-200 bg-red-50/50 dark:bg-red-950/20 py-2.5">
                                    <AlertDescription className="text-red-700 dark:text-red-400 text-xs font-medium">
                                        Insufficient balance. You have {formatCurrency(myBalance, true)} available.
                                    </AlertDescription>
                                </Alert>
                            )}

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Add a Note <span className="normal-case opacity-70">(Optional)</span></label>
                                <Input className="h-11 bg-muted/20 border-border/60 text-sm" placeholder="What's this for?" value={narration} onChange={e => setNarration(e.target.value)} />
                            </div>

                            <Button
                                className="w-full h-14 text-lg font-semibold shadow-md mt-2"
                                disabled={!isValid}
                                onClick={handleSend}
                            >
                                Proceed to Pay {amtNum > 0 ? formatCurrency(amtNum, true) : ''}
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-6 py-2 animate-in slide-in-from-right-2 duration-300">
                            <div className="text-center space-y-2 mb-2">
                                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <ArrowUpRight className="w-6 h-6 text-primary" />
                                </div>
                                <h3 className="text-xl font-bold tracking-tight">Enter Security PIN</h3>
                                <p className="text-sm text-muted-foreground px-4">
                                    Enter the 4-digit PIN sent to your phone to confirm sending <strong className="text-foreground">{formatCurrency(amtNum, true)}</strong> to <span className="text-foreground">{payee}</span>.
                                </p>
                            </div>

                            <div className="pt-2">
                                <Input
                                    className="h-16 text-center text-3xl font-mono tracking-[0.5em] bg-muted/30 border-primary/30 focus-visible:ring-primary"
                                    maxLength={4}
                                    placeholder="••••"
                                    type="password"
                                    value={otp}
                                    onChange={e => setOtp(e.target.value)}
                                />
                                <p className="text-center text-xs text-muted-foreground mt-3 flex items-center justify-center gap-1">
                                    OTP sent securely <CheckCircle className="w-3 h-3 text-emerald-500 inline" />
                                </p>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <Button variant="outline" className="flex-1 h-12" disabled={sending} onClick={() => setOtpSent(false)}>Back</Button>
                                <Button className="flex-1 h-12 text-base font-semibold" disabled={otp.length < 4 || sending} onClick={handleConfirm}>
                                    {sending ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Verifying...</> : 'Send Securely'}
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
