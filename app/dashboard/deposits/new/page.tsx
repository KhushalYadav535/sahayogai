'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import { ArrowLeft, Search, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import { membersApi, depositsApi } from '@/lib/api';

const RATE_SLABS: Record<string, Record<string, number>> = {
    FDR: { '1-3': 6.5, '3-6': 7.0, '6-12': 7.5, '12-24': 8.0, '24+': 8.25 },
    RD: { '12-24': 7.0, '24-36': 7.25, '36-60': 7.5 },
    MIS: { '60': 7.75 },
};

function getRate(type: string, months: number): number {
    if (type === 'FDR') {
        if (months <= 3) return RATE_SLABS.FDR['1-3'];
        if (months <= 6) return RATE_SLABS.FDR['3-6'];
        if (months <= 12) return RATE_SLABS.FDR['6-12'];
        if (months <= 24) return RATE_SLABS.FDR['12-24'];
        return RATE_SLABS.FDR['24+'];
    }
    if (type === 'RD') return months <= 24 ? 7.0 : months <= 36 ? 7.25 : 7.5;
    return 7.75;
}

function getSlabForTenure(type: string, months: number): string | null {
    if (type === 'FDR') {
        if (months <= 3) return '1-3';
        if (months <= 6) return '3-6';
        if (months <= 12) return '6-12';
        if (months <= 24) return '12-24';
        return '24+';
    }
    if (type === 'RD') {
        if (months <= 24) return '12-24';
        if (months <= 36) return '24-36';
        return '36-60';
    }
    if (type === 'MIS') return '60';
    return null;
}

function calcMaturity(amount: number, rate: number, months: number, compound: string): number {
    if (compound === 'Simple') return amount + (amount * rate * months) / 1200;
    const n = compound === 'Monthly' ? 12 : compound === 'Quarterly' ? 4 : 1;
    return amount * Math.pow(1 + rate / 100 / n, n * months / 12);
}

type MemberItem = { id: string; firstName: string; lastName: string; memberNumber: string; dateOfBirth?: string };

const compoundToApi: Record<string, 'monthly' | 'quarterly' | 'half_yearly' | 'yearly'> = {
    Monthly: 'monthly', Quarterly: 'quarterly', 'Half-Yearly': 'half_yearly', Annually: 'yearly', Simple: 'quarterly',
};

export default function NewDepositPage() {
    const router = useRouter();
    const [search, setSearch] = useState('');
    const [member, setMember] = useState<MemberItem | null>(null);
    const [members, setMembers] = useState<MemberItem[]>([]);
    const [loadingMembers, setLoadingMembers] = useState(false);
    const [type, setType] = useState<'FDR' | 'RD' | 'MIS'>('FDR');
    const [amount, setAmount] = useState(50000);
    const [months, setMonths] = useState(12);
    const [seniorCitizen, setSeniorCitizen] = useState(false);
    const [compound, setCompound] = useState('Quarterly');
    const [payout, setPayout] = useState('On Maturity');
    const [form15G, setForm15G] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [createdDeposit, setCreatedDeposit] = useState<{ depositNumber: string; maturityDate: string; maturityAmount: number } | null>(null);

    const memberAge = member?.dateOfBirth
        ? Math.floor((new Date().getTime() - new Date(member.dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
        : 0;
    const isEligibleSC = memberAge >= 60;

    const fetchMembers = useCallback(async () => {
        if (search.length < 2) return;
        setLoadingMembers(true);
        try {
            const res = await membersApi.list({ search, limit: 20 });
            setMembers(res.members || []);
        } catch {
            setMembers([]);
        } finally {
            setLoadingMembers(false);
        }
    }, [search]);

    useEffect(() => {
        const t = setTimeout(() => fetchMembers(), 300);
        return () => clearTimeout(t);
    }, [fetchMembers, search]);

    let rate = getRate(type, months);
    if (seniorCitizen && isEligibleSC) rate += 0.5;

    const maturity = calcMaturity(amount, rate, months, compound);
    const totalInterest = maturity - amount;
    const tdsApplicable = totalInterest > 40000 && !form15G;

    const handleSubmit = async () => {
        if (!member) return;
        setSubmitting(true);
        try {
            // Ensure all values are proper numbers
            const payload = {
                memberId: member.id,
                depositType: type === 'FDR' ? 'fd' : type === 'RD' ? 'rd' : 'mis',
                principal: Number(amount),
                interestRate: Number(rate),
                tenureMonths: Number(months),
                compoundingFreq: compoundToApi[compound] || 'quarterly',
                form15Exempt: Boolean(form15G),
            };
            
            // Validate required fields
            if (!payload.memberId || !payload.principal || !payload.interestRate || !payload.tenureMonths) {
                alert('Please fill in all required fields');
                setSubmitting(false);
                return;
            }
            
            const res = await depositsApi.create(payload);
            setCreatedDeposit({
                depositNumber: res.deposit?.depositNumber || `DEP-${Date.now()}`,
                maturityDate: res.deposit?.maturityDate ? new Date(res.deposit.maturityDate).toISOString() : new Date(Date.now() + months * 30 * 24 * 60 * 60 * 1000).toISOString(),
                maturityAmount: res.deposit?.maturityAmount ?? maturity,
            });
            setSubmitted(true);
        } catch (e: any) {
            const errorMessage = e?.message || 'Failed to create deposit';
            console.error('Deposit creation error:', e);
            alert(errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    useEffect(() => {
        if (type === 'MIS') { setMonths(60); setCompound('Simple'); setPayout('Monthly'); }
    }, [type]);

    if (submitted && createdDeposit) {
        const matDate = new Date(createdDeposit.maturityDate);
        return (
            <div className="max-w-lg mx-auto text-center space-y-6 py-10">
                <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mx-auto"><CheckCircle className="w-10 h-10 text-green-600" /></div>
                <h2 className="text-2xl font-bold">Deposit Created!</h2>
                <div className="p-4 rounded-lg border border-border space-y-2 text-left text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Deposit No</span><span className="font-mono font-bold">{createdDeposit.depositNumber}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Amount</span><span className="font-bold">{formatCurrency(amount, 0)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Maturity Amount</span><span className="font-bold text-primary">{formatCurrency(createdDeposit.maturityAmount)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Maturity Date</span><span>{formatDate(matDate)}</span></div>
                </div>
                <Badge className="bg-green-100 text-green-800">ACTIVE</Badge>
                <Button onClick={() => router.push('/dashboard/deposits')}>Back to Deposits</Button>
            </div>
        );
    }

    return (
        <div className="max-w-xl mx-auto space-y-6">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="w-4 h-4" /></Button>
                <div><h1 className="text-2xl font-bold">New Deposit</h1><p className="text-muted-foreground text-sm">Create FDR, RD, or MIS deposit</p></div>
            </div>

            {/* Member search */}
            <Card>
                <CardHeader><CardTitle className="text-base">Select Member</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                    <div className="relative"><Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" /><Input className="pl-9" placeholder="Search member..." value={search} onChange={e => { setSearch(e.target.value); setMember(null); }} /></div>
                    {!member && search.length >= 2 && (loadingMembers ? (
                        <p className="text-sm text-muted-foreground">Searching...</p>
                    ) : members.map(m => {
                        const name = `${m.firstName} ${m.lastName}`;
                        return (
                            <button key={m.id} onClick={() => { setMember(m); setSearch(name); }} className="w-full text-left p-3 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-colors">
                                <p className="font-medium">{name}</p><p className="text-xs text-muted-foreground">{m.memberNumber}</p>
                            </button>
                        );
                    }))}
                    {member && <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 flex justify-between items-center"><div><p className="font-medium">{member.firstName} {member.lastName}</p><p className="text-xs text-muted-foreground">{member.memberNumber} • Age: {memberAge}</p></div><Button size="sm" variant="ghost" onClick={() => { setMember(null); setSearch(''); }}>Change</Button></div>}
                </CardContent>
            </Card>

            {/* Deposit type */}
            <div className="grid grid-cols-3 gap-3">
                {(['FDR', 'RD', 'MIS'] as const).map(t => {
                    const isSelected = type === t;
                    return (
                        <button 
                            key={t} 
                            onClick={() => setType(t)} 
                            className={`p-4 rounded-lg border-2 text-center transition-all cursor-pointer ${
                                isSelected 
                                    ? 'border-primary bg-primary/20 ring-2 ring-primary ring-offset-2 shadow-md font-semibold' 
                                    : 'border-border hover:border-primary/50 hover:bg-muted/50'
                            }`}
                        >
                            <p className={`font-bold ${isSelected ? 'text-primary' : ''}`}>{t}</p>
                            <p className={`text-xs mt-1 ${isSelected ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                                {t === 'FDR' ? 'Fixed Deposit' : t === 'RD' ? 'Recurring Deposit' : 'Monthly Income'}
                            </p>
                        </button>
                    );
                })}
            </div>

            {/* Details */}
            <Card>
                <CardContent className="pt-4 space-y-4">
                    <div><label className="text-sm font-medium">Amount (₹) *</label><Input className="mt-1 text-xl font-bold" type="number" value={amount} onChange={e => setAmount(Number(e.target.value))} /></div>
                    <div>
                        <div className="flex justify-between mb-1"><label className="text-sm font-medium">Tenure</label><span className="text-sm font-bold text-primary">{months} months</span></div>
                        <input type="range" min={type === 'MIS' ? 60 : type === 'RD' ? 12 : 1} max={type === 'MIS' ? 60 : 84} value={months} onChange={e => setMonths(Number(e.target.value))} className="w-full" disabled={type === 'MIS'} />
                    </div>

                    {/* Rate Table */}
                    <div className="p-3 rounded-lg bg-muted/30 border border-border">
                        <p className="text-xs font-semibold text-muted-foreground mb-2">APPLICABLE RATES</p>
                        <div className={`grid gap-2 text-xs ${type === 'FDR' ? 'grid-cols-5' : 'grid-cols-3'}`}>
                            {Object.entries(RATE_SLABS[type]).map(([slab, r]) => {
                                const isSelected = getSlabForTenure(type, months) === slab;
                                return (
                                    <div 
                                        key={slab} 
                                        className={`p-2 rounded text-center transition-all cursor-pointer ${isSelected ? 'bg-primary/20 border-2 border-primary font-bold text-primary shadow-sm' : 'bg-card border border-border hover:border-primary/50'}`}
                                        onClick={() => {
                                            // Allow clicking to set tenure based on slab
                                            if (type === 'FDR') {
                                                if (slab === '1-3') setMonths(3);
                                                else if (slab === '3-6') setMonths(6);
                                                else if (slab === '6-12') setMonths(12);
                                                else if (slab === '12-24') setMonths(24);
                                                else if (slab === '24+') setMonths(25);
                                            } else if (type === 'RD') {
                                                if (slab === '12-24') setMonths(24);
                                                else if (slab === '24-36') setMonths(36);
                                                else if (slab === '36-60') setMonths(60);
                                            }
                                        }}
                                    >
                                        <p>{slab}m</p>
                                        <p className="font-semibold">{r}%</p>
                                    </div>
                                );
                            })}
                        </div>
                        <p className="text-xs text-center mt-2 text-primary font-semibold">Applicable Rate: {rate}% p.a.{seniorCitizen && isEligibleSC ? ' (SC +0.50%)' : ''}</p>
                    </div>

                    {/* Senior Citizen */}
                    {isEligibleSC && (
                        <div className="flex items-center justify-between"><label className="text-sm font-medium">Senior Citizen Rate (+0.50%)</label><Switch checked={seniorCitizen} onCheckedChange={setSeniorCitizen} /></div>
                    )}

                    {/* Compounding (FDR only) */}
                    {type === 'FDR' && (
                        <div>
                            <label className="text-sm font-medium">Compounding Frequency</label>
                            <div className="flex gap-2 mt-2">{['Monthly', 'Quarterly', 'Annually', 'Simple'].map(c => <button key={c} onClick={() => setCompound(c)} className={`px-3 py-1 text-sm rounded-full border transition-colors ${compound === c ? 'bg-primary/10 border-primary text-primary font-medium' : 'border-border hover:border-primary/50'}`}>{c}</button>)}</div>
                        </div>
                    )}

                    {/* Payout (FDR only) */}
                    {type === 'FDR' && (
                        <div>
                            <label className="text-sm font-medium">Payout Mode</label>
                            <div className="flex gap-2 mt-2">{['On Maturity', 'Monthly', 'Quarterly'].map(p => <button key={p} onClick={() => setPayout(p)} className={`px-3 py-1 text-sm rounded-full border transition-colors ${payout === p ? 'bg-primary/10 border-primary text-primary font-medium' : 'border-border hover:border-primary/50'}`}>{p}</button>)}</div>
                        </div>
                    )}

                    {/* Maturity preview */}
                    {amount > 0 && (
                        <div className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 space-y-2">
                            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Principal</span><span className="font-medium">{formatCurrency(amount, 0)}</span></div>
                            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Total Interest</span><span className="font-medium text-green-600">+ {formatCurrency(totalInterest)}</span></div>
                            <div className="flex justify-between font-bold text-lg border-t border-primary/20 pt-2"><span>Maturity Amount</span><span className="text-primary">{formatCurrency(maturity)}</span></div>
                        </div>
                    )}

                    {/* TDS warning */}
                    {tdsApplicable && <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950"><AlertTriangle className="h-4 w-4 text-amber-600" /><AlertDescription className="text-amber-700 text-xs">Annual interest exceeds ₹40,000. TDS @ 10% will be deducted at source.</AlertDescription></Alert>}

                    {/* Form 15G/H */}
                    <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                        <div><p className="text-sm font-medium">Form 15G/H Submitted</p><p className="text-xs text-muted-foreground">Exempt from TDS deduction</p></div>
                        <Switch checked={form15G} onCheckedChange={setForm15G} />
                    </div>

                    {amount > 10000 && <Alert><Info className="h-4 w-4" /><AlertDescription className="text-xs">Will require Checker approval (above ₹10,000)</AlertDescription></Alert>}
                    <Button className="w-full" onClick={handleSubmit} disabled={!member || !amount || submitting}>{submitting ? 'Creating...' : 'Create Deposit'}</Button>
                </CardContent>
            </Card>
        </div>
    );
}
