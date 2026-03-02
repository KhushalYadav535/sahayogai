'use client';

import React, { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import {
    ArrowLeft, Building2, Users, CreditCard, Zap, Shield, Eye,
    AlertTriangle, CheckCircle, Plus, Minus, Settings, BarChart3,
} from 'lucide-react';
import {
    LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { tenantsApi, platformBillingApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/providers/auth-provider';

const DEFAULT_PLANS: Record<string, number> = { starter: 1000, pro: 5000, enterprise: 15000 };

function planKey(p: string): string {
    const k = (p || 'starter').toLowerCase();
    return k === 'professional' ? 'pro' : k;
}

function mapTenant(t: any, plans: Record<string, number> = DEFAULT_PLANS, overrideMrr?: number, credits?: { txCredits: number; smsCredits: number }) {
    const pk = planKey(t?.plan || 'starter');
    const mrr = overrideMrr != null ? overrideMrr : (t?.billingOverride?.mrr != null ? Number(t.billingOverride.mrr) : (plans[pk] ?? DEFAULT_PLANS.starter));
    const admin = t?.adminUser;
    return {
        id: t?.id,
        name: t?.name || '-',
        regNo: t?.regNumber || t?.code || '-',
        state: t?.state || '-',
        actType: 'MSCS',
        status: (t?.status || 'active').toUpperCase(),
        plan: (t?.plan || 'starter').toUpperCase().replace('enterprise', 'PROFESSIONAL'),
        members: t?._count?.members ?? 0,
        credits: credits?.txCredits ?? 0,
        smsCredits: credits?.smsCredits ?? 0,
        mrr,
        joinedDate: t?.createdAt ? new Date(t.createdAt) : new Date(),
        adminEmail: admin?.email ?? '-',
        phone: '-',
        lastActivity: t?.updatedAt ? new Date(t.updatedAt) : new Date(),
    };
}

export default function TenantDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const { toast } = useToast();
    const { impersonate: doImpersonate } = useAuth();
    const [tenant, setTenant] = useState<ReturnType<typeof mapTenant> | null>(null);
    const [loading, setLoading] = useState(true);
    const [modules, setModules] = useState<string[]>([]);
    const [usageChart, setUsageChart] = useState<{ month: string; txns: number; members: number }[]>([]);
    const [currentUsage, setCurrentUsage] = useState<{ txnVolume: number; memberCount: number } | null>(null);
    const [creditModalOpen, setCreditModalOpen] = useState(false);
    const [creditAction, setCreditAction] = useState<'add' | 'deduct'>('add');
    const [creditAmt, setCreditAmt] = useState('');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState('');
    const [suspendOpen, setSuspendOpen] = useState(false);
    const [impersonateOpen, setImpersonateOpen] = useState(false);
    const [credits, setCredits] = useState(0);
    const [smsCredits, setSmsCredits] = useState(0);

    useEffect(() => {
        Promise.all([
            tenantsApi.get(id),
            tenantsApi.getCredits(id),
            platformBillingApi.getPlans(),
            platformBillingApi.getOverrides().catch(() => ({ overrides: [] })),
            tenantsApi.getModules(id),
        ])
            .then(([tr, cr, pr, or, mod]) => {
                const plans = pr.plans || DEFAULT_PLANS;
                const ov = (or?.overrides || []).find((o: any) => o.tenantId === tr.tenant?.id);
                const overrideMrr = ov?.mrr != null ? Number(ov.mrr) : undefined;
                const cred = cr.credits || { txCredits: 0, smsCredits: 0 };
                const t = mapTenant(tr.tenant, plans, overrideMrr, cred);
                setTenant(t);
                setCredits(t.credits);
                setSmsCredits(t.smsCredits);
                setModules(mod?.modules || []);
            })
            .catch(() => setTenant(null))
            .finally(() => setLoading(false));
    }, [id]);

    useEffect(() => {
        if (!id) return;
        const periods: string[] = [];
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            periods.push(d.toISOString().slice(0, 7));
        }
        Promise.all(periods.map((p) => tenantsApi.getUsage(id, p)))
            .then((results) => {
                const data = results.map((r, i) => ({
                    month: periods[i].slice(5) + '/' + periods[i].slice(2, 4),
                    txns: r.usage?.txnVolume ?? 0,
                    members: r.usage?.memberCount ?? 0,
                }));
                setUsageChart(data);
                if (results[results.length - 1]?.usage) {
                    const u = results[results.length - 1].usage;
                    setCurrentUsage({
                        txnVolume: u.txnVolume ?? 0,
                        memberCount: u.memberCount ?? 0,
                        apiCalls: u.apiCalls ?? 0,
                        loansDisbursed: u.loansDisbursed ?? 0,
                    });
                }
            })
            .catch(() => {});
    }, [id]);

    const handleCreditUpdate = async () => {
        if (!creditAmt || Number(creditAmt) <= 0) return;
        setSaving(true);
        try {
            const delta = creditAction === 'add' ? Number(creditAmt) : -Number(creditAmt);
            const newTx = Math.max(0, credits + delta);
            await tenantsApi.updateCredits(id, { txCredits: newTx });
            setCredits(newTx);
            setCreditModalOpen(false);
            setCreditAmt('');
            setSaved('Credits updated successfully');
            toast({ title: 'Credits updated', description: `TX credits: ${newTx.toLocaleString('en-IN')}` });
            setTimeout(() => setSaved(''), 3000);
        } catch (e) {
            toast({ title: 'Error', description: (e as Error).message, variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    if (loading || !tenant) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <p className="text-muted-foreground">{loading ? 'Loading...' : 'Tenant not found'}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start gap-3">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="w-4 h-4" />
                </Button>
                <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                        <h1 className="text-2xl font-bold">{tenant.name}</h1>
                        <Badge className={tenant.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                            {tenant.status}
                        </Badge>
                        <Badge className="bg-purple-100 text-purple-800">{tenant.plan}</Badge>
                    </div>
                    <p className="text-muted-foreground text-sm">{tenant.regNo} • {tenant.state} • {tenant.actType}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                    <Button variant="outline" size="sm" onClick={() => setImpersonateOpen(true)} className="gap-1">
                        <Eye className="w-3.5 h-3.5" /> Impersonate
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => setSuspendOpen(true)}>
                        Suspend
                    </Button>
                </div>
            </div>

            {saved && (
                <Alert className="border-green-200 bg-green-50 dark:bg-green-950">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-700">{saved}</AlertDescription>
                </Alert>
            )}

            {/* KPI Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { label: 'Members', value: tenant.members, icon: Users, color: 'text-blue-600' },
                    { label: 'TX Credits', value: credits.toLocaleString('en-IN'), icon: Zap, color: 'text-primary' },
                    { label: 'SMS Credits', value: smsCredits.toLocaleString('en-IN'), icon: CreditCard, color: 'text-green-600' },
                    { label: 'MRR', value: formatCurrency(tenant.mrr, 0), icon: BarChart3, color: 'text-primary font-bold' },
                ].map(({ label, value, icon: Icon, color }) => (
                    <Card key={label}>
                        <CardContent className="pt-4 flex items-start gap-3">
                            <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                                <Icon className="w-4 h-4 text-muted-foreground" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">{label}</p>
                                <p className={`text-lg font-bold ${color}`}>{value}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Tabs defaultValue="overview">
                <TabsList className="grid grid-cols-4 w-full">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="usage">Usage</TabsTrigger>
                    <TabsTrigger value="features">Feature Flags</TabsTrigger>
                    <TabsTrigger value="billing">Billing</TabsTrigger>
                </TabsList>

                {/* Overview */}
                <TabsContent value="overview" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card>
                            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Building2 className="w-4 h-4" /> Society Info</CardTitle></CardHeader>
                            <CardContent className="space-y-2 text-sm">
                                {[
                                    ['Reg No', tenant.regNo],
                                    ['State', tenant.state],
                                    ['Act Type', tenant.actType],
                                    ['Admin Email', tenant.adminEmail],
                                    ['Phone', tenant.phone],
                                    ['Joined On', formatDate(tenant.joinedDate)],
                                    ['Last Activity', formatDate(tenant.lastActivity)],
                                ].map(([k, v]) => (
                                    <div key={k} className="flex justify-between">
                                        <span className="text-muted-foreground">{k}</span>
                                        <span className="font-medium">{v}</span>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center justify-between">
                                    <span className="flex items-center gap-2"><Zap className="w-4 h-4" /> Credit Management</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 text-center">
                                    <p className="text-xs text-muted-foreground">Transaction Credits Remaining</p>
                                    <p className="text-3xl font-bold text-primary mt-1">{credits.toLocaleString('en-IN')}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <Button className="gap-2" onClick={() => { setCreditAction('add'); setCreditModalOpen(true); }}>
                                        <Plus className="w-4 h-4" /> Add Credits
                                    </Button>
                                    <Button variant="outline" className="gap-2" onClick={() => { setCreditAction('deduct'); setCreditModalOpen(true); }}>
                                        <Minus className="w-4 h-4" /> Deduct
                                    </Button>
                                </div>
                                <div className="text-xs text-muted-foreground space-y-1">
                                    <div className="flex justify-between"><span>SMS Credits</span><span className="font-medium">{smsCredits.toLocaleString('en-IN')}</span></div>
                                    <div className="flex justify-between"><span>API Calls (this month)</span><span className="font-medium">{currentUsage ? currentUsage.apiCalls.toLocaleString('en-IN') : '—'}</span></div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Usage */}
                <TabsContent value="usage" className="space-y-4">
                    <Card>
                        <CardHeader><CardTitle className="text-base flex items-center gap-2"><BarChart3 className="w-4 h-4" /> Monthly Usage Trend</CardTitle></CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={220}>
                                <LineChart data={usageChart.length ? usageChart : [{ month: '-', txns: 0, members: 0 }]}>
                                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                                    <YAxis tick={{ fontSize: 11 }} />
                                    <Tooltip />
                                    <Line type="monotone" dataKey="txns" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} name="Transactions" />
                                    <Line type="monotone" dataKey="members" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={{ r: 3 }} name="Members" />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {[
                            ['Transactions', currentUsage ? currentUsage.txnVolume.toLocaleString('en-IN') : '—', 'text-primary'],
                            ['SMS Sent', currentUsage ? '—' : '—', 'text-blue-600'],
                            ['Active Members', String(tenant.members || 0), 'text-green-600'],
                            ['Loans Disbursed', currentUsage ? currentUsage.loansDisbursed.toLocaleString('en-IN') : '—', 'text-amber-600'],
                        ].map(([k, v, color]) => (
                            <Card key={k}>
                                <CardContent className="pt-4">
                                    <p className="text-xs text-muted-foreground">{k}</p>
                                    <p className={`text-xl font-bold mt-1 ${color}`}>{v}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                {/* Feature Flags - Modules enabled per tier (read-only from plan) */}
                <TabsContent value="features">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Settings className="w-4 h-4" /> Modules Enabled (Plan: {tenant.plan})</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-1">
                            {modules.length === 0 ? (
                                <p className="text-sm text-muted-foreground py-4">No modules configured for this plan. Configure at Platform Config → Modules.</p>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {modules.map((mod) => (
                                        <div key={mod} className="flex items-center gap-2 p-3 rounded-lg bg-muted/30 border border-border">
                                            <CheckCircle className="w-4 h-4 text-green-600" />
                                            <p className="text-sm font-medium capitalize">{mod}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <p className="text-xs text-muted-foreground mt-4">Modules are controlled per tier in Platform Config. Edit modules there to change availability.</p>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Billing */}
                <TabsContent value="billing" className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                        {[['Plan', tenant.plan], ['MRR', formatCurrency(tenant.mrr, 0)], ['ARR', formatCurrency(tenant.mrr * 12, 0)]].map(([k, v]) => (
                            <Card key={k}><CardContent className="pt-4"><p className="text-xs text-muted-foreground">{k}</p><p className="text-lg font-bold">{v}</p></CardContent></Card>
                        ))}
                    </div>
                    <Card>
                        <CardHeader><CardTitle className="text-base">Invoice History</CardTitle></CardHeader>
                        <CardContent className="space-y-2">
                            {(tenant?.mrr ? [{ id: 'Current', period: new Date().toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }), amount: tenant.mrr, status: 'PENDING' as const }] : []).map(inv => (
                                <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                                    <div>
                                        <p className="text-sm font-medium">{inv.id}</p>
                                        <p className="text-xs text-muted-foreground">{inv.period}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="font-bold">{formatCurrency(inv.amount, 0)}</span>
                                        <Badge className={inv.status === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}>
                                            {inv.status}
                                        </Badge>
                                        <Button size="sm" variant="ghost" className="h-7 text-xs">Download</Button>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                    <div className="flex gap-2">
                        <Button variant="outline">Change Plan</Button>
                        <Button variant="outline">Generate Invoice</Button>
                    </div>
                </TabsContent>
            </Tabs>

            {/* Credit Modal */}
            <Dialog open={creditModalOpen} onOpenChange={setCreditModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{creditAction === 'add' ? 'Add Credits' : 'Deduct Credits'} — {tenant.name}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="flex justify-between text-sm p-3 rounded-lg bg-muted/30 border border-border">
                            <span className="text-muted-foreground">Current Balance</span>
                            <span className="font-bold">{credits.toLocaleString('en-IN')} credits</span>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Number of Credits to {creditAction === 'add' ? 'Add' : 'Deduct'}</label>
                            <Input
                                className="mt-1 text-xl font-bold"
                                type="number"
                                placeholder="0"
                                value={creditAmt}
                                onChange={e => setCreditAmt(e.target.value)}
                            />
                        </div>
                        {creditAmt && (
                            <div className="flex justify-between text-sm p-3 rounded-lg border border-primary/20 bg-primary/5">
                                <span className="text-muted-foreground">New Balance</span>
                                <span className="font-bold text-primary">
                                    {(creditAction === 'add' ? credits + Number(creditAmt) : credits - Number(creditAmt)).toLocaleString('en-IN')} credits
                                </span>
                            </div>
                        )}
                        <Button className="w-full" disabled={!creditAmt || saving} onClick={handleCreditUpdate}>
                            {saving ? 'Updating...' : `Confirm — ${creditAction === 'add' ? 'Add' : 'Deduct'} ${creditAmt || 0} Credits`}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Suspend Modal */}
            <Dialog open={suspendOpen} onOpenChange={setSuspendOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Suspend Tenant</DialogTitle></DialogHeader>
                    <Alert className="border-red-200 bg-red-50 dark:bg-red-950">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-700 text-sm">
                            This will immediately block all logins for <strong>{tenant.name}</strong>. All data is preserved.
                        </AlertDescription>
                    </Alert>
                    <div className="flex gap-2 mt-2">
                        <Button variant="destructive" className="flex-1" onClick={async () => {
                            try {
                                await tenantsApi.updateStatus(id, 'suspended');
                                setTenant(prev => prev ? { ...prev, status: 'SUSPENDED' } : null);
                                setSuspendOpen(false);
                                toast({ title: 'Tenant suspended', description: 'All logins for this tenant are now blocked.' });
                            } catch (e) {
                                toast({ title: 'Error', description: (e as Error).message, variant: 'destructive' });
                            }
                        }}>Confirm Suspend</Button>
                        <Button variant="outline" className="flex-1" onClick={() => setSuspendOpen(false)}>Cancel</Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Impersonate Modal */}
            <Dialog open={impersonateOpen} onOpenChange={setImpersonateOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Impersonate Tenant Session</DialogTitle></DialogHeader>
                    <Alert>
                        <Shield className="h-4 w-4" />
                        <AlertDescription className="text-sm">
                            You will be logged in as <strong>SOCIETY_ADMIN</strong> for <strong>{tenant.name}</strong>. All actions will be attributed to you in the audit log.
                        </AlertDescription>
                    </Alert>
                    <div className="flex gap-2 mt-2">
                        <Button
                            className="flex-1"
                            disabled={saving}
                            onClick={async () => {
                                try {
                                    await doImpersonate(id);
                                    setImpersonateOpen(false);
                                    toast({ title: 'Impersonating', description: `Switching to ${tenant.name}` });
                                    router.push('/dashboard');
                                } catch (e) {
                                    toast({ title: 'Impersonation failed', description: (e as Error).message, variant: 'destructive' });
                                }
                            }}
                        >
                            {saving ? 'Switching...' : 'Enter as Admin'}
                        </Button>
                        <Button variant="outline" className="flex-1" onClick={() => setImpersonateOpen(false)}>Cancel</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
