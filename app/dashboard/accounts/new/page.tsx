'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { Permission } from '@/lib/types/auth';
import { sbApi, membersApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Wallet, CheckCircle, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type MemberItem = { id: string; firstName: string; lastName: string; memberNumber: string };

export default function OpenAccountPage() {
    const router = useRouter();
    const { hasPermission } = useAuth();
    const { toast } = useToast();

    // Member search state
    const [search, setSearch] = useState('');
    const [members, setMembers] = useState<MemberItem[]>([]);
    const [loadingMembers, setLoadingMembers] = useState(false);
    const [selectedMember, setSelectedMember] = useState<MemberItem | null>(null);

    const [form, setForm] = useState({
        openingDeposit: '',
        interestRate: '4.00',
        operationMode: 'SINGLE',
        nominee: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState<{ accountNumber: string } | null>(null);

    // Debounced search
    const fetchMembers = useCallback(async () => {
        if (search.length < 2) { setMembers([]); return; }
        setLoadingMembers(true);
        try {
            const res = await membersApi.list({ search, status: 'ACTIVE', limit: 20 });
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

    if (!hasPermission(Permission.ACCOUNT_CREATE)) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Alert>
                    <AlertDescription>You do not have permission to open new savings accounts.</AlertDescription>
                </Alert>
            </div>
        );
    }

    const handleSubmit = async () => {
        if (!selectedMember) {
            toast({ title: 'Please select a member', variant: 'destructive' });
            return;
        }
        if (!form.openingDeposit) {
            toast({ title: 'Opening deposit is required', variant: 'destructive' });
            return;
        }
        const deposit = parseFloat(form.openingDeposit);
        if (isNaN(deposit) || deposit < 500) {
            toast({ title: 'Opening deposit must be at least ₹500', variant: 'destructive' });
            return;
        }
        setSubmitting(true);
        try {
            const res = await sbApi.create({
                memberId: selectedMember.id,
                openingDeposit: deposit,
                interestRate: parseFloat(form.interestRate),
                operationMode: form.operationMode,
                nominee: form.nominee || undefined,
            });
            if (res.success && res.account) {
                setSuccess({ accountNumber: res.account.accountNumber });
            } else {
                throw new Error(res.message || 'Failed to open account');
            }
        } catch (e: any) {
            toast({ title: e?.message || 'Failed to open account', variant: 'destructive' });
        } finally {
            setSubmitting(false);
        }
    };

    if (success) {
        return (
            <div className="max-w-lg mx-auto">
                <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
                    <CardContent className="pt-8 pb-8 flex flex-col items-center text-center gap-4">
                        <CheckCircle className="w-16 h-16 text-green-500" />
                        <h2 className="text-2xl font-bold text-green-700 dark:text-green-400">Account Opened Successfully!</h2>
                        <p className="text-muted-foreground">Savings account has been created.</p>
                        <div className="bg-white dark:bg-background rounded-lg px-6 py-3 border w-full">
                            <p className="text-sm text-muted-foreground">Account Number</p>
                            <p className="text-xl font-bold font-mono tracking-wider">{success.accountNumber}</p>
                        </div>
                        <div className="flex gap-3 mt-2">
                            <Button variant="outline" onClick={() => {
                                setSuccess(null);
                                setSelectedMember(null);
                                setSearch('');
                                setForm({ openingDeposit: '', interestRate: '4.00', operationMode: 'SINGLE', nominee: '' });
                            }}>
                                Open Another
                            </Button>
                            <Button onClick={() => router.push('/dashboard/accounts')}>
                                View All Accounts
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="w-4 h-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Wallet className="w-6 h-6 text-primary" /> Open Savings Account
                    </h1>
                    <p className="text-muted-foreground text-sm">Create a new SB account for an active member</p>
                </div>
            </div>

            {/* Member Search */}
            <Card>
                <CardHeader><CardTitle className="text-base">Select Member</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                        <Input
                            className="pl-9"
                            placeholder="Search by name or member number..."
                            value={search}
                            onChange={e => { setSearch(e.target.value); setSelectedMember(null); }}
                        />
                    </div>

                    {/* Search results */}
                    {!selectedMember && search.length >= 2 && (
                        loadingMembers ? (
                            <p className="text-sm text-muted-foreground">Searching...</p>
                        ) : members.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No active members found for "{search}"</p>
                        ) : (
                            <div className="space-y-2">
                                {members.map(m => (
                                    <button
                                        key={m.id}
                                        onClick={() => { setSelectedMember(m); setSearch(`${m.firstName} ${m.lastName}`); }}
                                        className="w-full text-left p-3 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-colors"
                                    >
                                        <p className="font-medium">{m.firstName} {m.lastName}</p>
                                        <p className="text-xs text-muted-foreground">{m.memberNumber}</p>
                                    </button>
                                ))}
                            </div>
                        )
                    )}

                    {/* Selected member chip */}
                    {selectedMember && (
                        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 flex justify-between items-center">
                            <div>
                                <p className="font-medium">{selectedMember.firstName} {selectedMember.lastName}</p>
                                <p className="text-xs text-muted-foreground">{selectedMember.memberNumber}</p>
                            </div>
                            <Button size="sm" variant="ghost" onClick={() => { setSelectedMember(null); setSearch(''); }}>
                                Change
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Account Details</CardTitle>
                    <CardDescription>All fields with * are mandatory. Opening deposit minimum is ₹500.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                    {/* Opening deposit */}
                    <div>
                        <label className="text-sm font-medium">Opening Deposit (₹) *</label>
                        <Input
                            className="mt-1"
                            type="number"
                            min={500}
                            placeholder="Minimum ₹500"
                            value={form.openingDeposit}
                            onChange={e => setForm(p => ({ ...p, openingDeposit: e.target.value }))}
                        />
                    </div>

                    {/* Interest rate */}
                    <div>
                        <label className="text-sm font-medium">Interest Rate (% p.a.)</label>
                        <Input
                            className="mt-1"
                            type="number"
                            step="0.25"
                            value={form.interestRate}
                            onChange={e => setForm(p => ({ ...p, interestRate: e.target.value }))}
                        />
                        <p className="text-xs text-muted-foreground mt-1">Default: 4.00% (as per society parameters)</p>
                    </div>

                    {/* Operation mode */}
                    <div>
                        <label className="text-sm font-medium">Operation Mode</label>
                        <Select value={form.operationMode} onValueChange={v => setForm(p => ({ ...p, operationMode: v }))}>
                            <SelectTrigger className="mt-1">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="SINGLE">Single (Individual)</SelectItem>
                                <SelectItem value="EITHER_OR_SURVIVOR">Either or Survivor (Joint)</SelectItem>
                                <SelectItem value="JOINTLY">Jointly (Both signatures required)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Nominee */}
                    <div>
                        <label className="text-sm font-medium">Nominee Name</label>
                        <Input
                            className="mt-1"
                            placeholder="Enter nominee name"
                            value={form.nominee}
                            onChange={e => setForm(p => ({ ...p, nominee: e.target.value }))}
                        />
                        <p className="text-xs text-muted-foreground mt-1">Nominee details can be updated later from member profile.</p>
                    </div>

                    <Alert>
                        <AlertDescription className="text-xs">
                            The account number will be auto-generated per the society's configured format (e.g. SB-2025-000001). GL entry will be auto-posted: DR Cash/Bank → CR SB Account.
                        </AlertDescription>
                    </Alert>

                    <Button
                        className="w-full"
                        disabled={submitting || !selectedMember || !form.openingDeposit}
                        onClick={handleSubmit}
                    >
                        {submitting ? 'Opening Account...' : 'Open Savings Account'}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
