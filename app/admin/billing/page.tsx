'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatCurrency } from '@/lib/utils/formatters';
import { useToast } from '@/hooks/use-toast';
import { CreditCard, TrendingUp, Settings, Edit } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { tenantsApi, platformBillingApi, setApiToken } from '@/lib/api';

const DEFAULT_PLANS: Record<string, number> = { starter: 1000, pro: 5000, enterprise: 15000 };

function planKey(t: any): string {
    const p = ((t?.plan || 'starter') as string).toLowerCase();
    return p === 'professional' ? 'pro' : p;
}

export default function BillingPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [tenants, setTenants] = useState<any[]>([]);
    const [plans, setPlans] = useState<Record<string, number>>(DEFAULT_PLANS);
    const [loading, setLoading] = useState(true);
    const [planEditOpen, setPlanEditOpen] = useState(false);
    const [planForm, setPlanForm] = useState(DEFAULT_PLANS);
    const [savingPlans, setSavingPlans] = useState(false);
    const [overrideEdit, setOverrideEdit] = useState<{ tenantId: string; name: string; mrr: number } | null>(null);
    const [savingOverride, setSavingOverride] = useState(false);

    const [overrides, setOverrides] = useState<Record<string, number>>({});

    useEffect(() => {
        const token = typeof localStorage !== 'undefined' ? localStorage.getItem('sahayog-token') : null;
        if (token) setApiToken(token);
        Promise.all([
            tenantsApi.list(token || undefined),
            platformBillingApi.getPlans(token || undefined),
            platformBillingApi.getOverrides(token || undefined).catch(() => ({ success: true, overrides: [] })),
        ])
            .then(([tr, pr, or]) => {
                setTenants(tr.tenants || []);
                setPlans(pr.plans || DEFAULT_PLANS);
                setPlanForm(pr.plans || DEFAULT_PLANS);
                const map: Record<string, number> = {};
                (or?.overrides || []).forEach((o: any) => { if (o.tenantId) map[o.tenantId] = Number(o.mrr || 0); });
                setOverrides(map);
            })
            .catch(() => { setTenants([]); setPlans(DEFAULT_PLANS); setOverrides({}); })
            .finally(() => setLoading(false));
    }, []);

    const getTenantMrr = (t: any): number => {
        if (overrides[t.id] != null) return overrides[t.id];
        return plans[planKey(t)] ?? DEFAULT_PLANS.starter;
    };

    const activeTenants = tenants.filter((t: any) => {
        const s = (t.status || 'active').toLowerCase();
        return s !== 'suspended' && s !== 'inactive';
    });
    const mrr = tenants.reduce((sum: number, t: any) => sum + getTenantMrr(t), 0);
    const arpu = activeTenants.length ? mrr / activeTenants.length : 0;

    const billingData = [
        { month: 'Oct', mrr: Math.round(mrr * 0.9) },
        { month: 'Nov', mrr: Math.round(mrr * 0.95) },
        { month: 'Dec', mrr },
        { month: 'Jan', mrr },
        { month: 'Feb', mrr },
    ];

    const invoices = activeTenants.slice(0, 10).map((t: any, i: number) => ({
        id: `INV-2026-0${i + 1}`,
        tenantId: t.id,
        tenant: t.name || t.code || '-',
        period: 'Mar 2026',
        amount: getTenantMrr(t),
        status: i % 2 === 0 ? 'PAID' : 'PENDING',
    }));

    const handleSavePlans = async () => {
        setSavingPlans(true);
        try {
            await platformBillingApi.setPlans(planForm);
            setPlans(planForm);
            setPlanEditOpen(false);
            toast({ title: 'Saved', description: 'Plan amounts updated. Tenants will see these amounts.' });
        } catch (e) {
            toast({ title: 'Error', description: (e as Error).message, variant: 'destructive' });
        } finally {
            setSavingPlans(false);
        }
    };

    const handleSaveOverride = async () => {
        if (!overrideEdit) return;
        setSavingOverride(true);
        try {
            await platformBillingApi.setOverride(overrideEdit.tenantId, overrideEdit.mrr);
            setOverrides(prev => ({ ...prev, [overrideEdit.tenantId]: overrideEdit.mrr }));
            setOverrideEdit(null);
            toast({ title: 'Saved', description: `Billing amount set for tenant.` });
        } catch (e) {
            toast({ title: 'Error', description: (e as Error).message, variant: 'destructive' });
        } finally {
            setSavingOverride(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div><h1 className="text-2xl font-bold flex items-center gap-2"><CreditCard className="w-6 h-6" /> Billing Dashboard</h1>
                    <p className="text-muted-foreground text-sm">Platform revenue and subscription management. You decide billing amounts; tenants see them.</p></div>
                <Button variant="outline" size="sm" className="gap-2" onClick={() => { setPlanForm(plans); setPlanEditOpen(true); }}>
                    <Settings className="w-4 h-4" /> Plan Amounts
                </Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[['MRR', formatCurrency(mrr, 0), 'text-primary'], ['ARR', formatCurrency(mrr * 12, 0), 'text-primary'], ['Active Tenants', String(activeTenants.length), 'text-green-600'], ['ARPU', formatCurrency(arpu, 0), 'text-foreground']].map(([k, v, color]) => (
                    <Card key={k}><CardContent className="pt-4"><p className="text-xs text-muted-foreground">{k}</p><p className={`text-xl font-bold mt-1 ${color}`}>{v}</p></CardContent></Card>
                ))}
            </div>

            {loading && <p className="text-sm text-muted-foreground py-2">Loading...</p>}

            <Card>
                <CardHeader><CardTitle className="flex items-center gap-2 text-base"><TrendingUp className="w-4 h-4" /> MRR Trend</CardTitle></CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={billingData.length ? billingData : [{ month: '-', mrr: 0 }]}>
                            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 12 }} tickFormatter={v => '₹' + (v / 1000) + 'K'} />
                            <Tooltip formatter={(v) => [formatCurrency(Number(v), 0), 'MRR']} />
                            <Bar dataKey="mrr" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle className="flex items-center justify-between"><span>Invoices</span><Button size="sm" variant="outline">Generate Invoices</Button></CardTitle></CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader><TableRow><TableHead>Invoice</TableHead><TableHead>Tenant</TableHead><TableHead>Period</TableHead><TableHead className="text-right">Amount</TableHead><TableHead>Status</TableHead><TableHead>Action</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {invoices.map(inv => (
                                <TableRow key={inv.id}>
                                    <TableCell className="font-mono text-xs">{inv.id}</TableCell>
                                    <TableCell>{inv.tenant}</TableCell>
                                    <TableCell>{inv.period}</TableCell>
                                    <TableCell className="text-right font-medium">{formatCurrency(inv.amount, 0)}</TableCell>
                                    <TableCell><Badge className={inv.status === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}>{inv.status}</Badge></TableCell>
                                    <TableCell>
                                        <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => setOverrideEdit({ tenantId: inv.tenantId, name: inv.tenant, mrr: inv.amount })}>
                                            <Edit className="w-3 h-3" /> Edit
                                        </Button>
                                        <Button size="sm" variant="ghost" className="h-7 text-xs">Download</Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Plan amounts modal — super admin sets default MRR per plan */}
            <Dialog open={planEditOpen} onOpenChange={setPlanEditOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle className="flex items-center gap-2"><Settings className="w-4 h-4" /> Plan Billing Amounts (₹/month)</DialogTitle></DialogHeader>
                    <p className="text-sm text-muted-foreground">These amounts apply to all tenants on each plan. You can override per tenant in the invoices table.</p>
                    <div className="space-y-4 mt-2">
                        {['starter', 'pro', 'enterprise'].map(p => (
                            <div key={p} className="flex items-center gap-3">
                                <label className="text-sm font-medium capitalize w-24">{p}</label>
                                <Input type="number" min={0} value={planForm[p] ?? 0} onChange={e => setPlanForm(prev => ({ ...prev, [p]: Number(e.target.value) || 0 }))} />
                                <span className="text-xs text-muted-foreground">₹/month</span>
                            </div>
                        ))}
                        <Button className="w-full" disabled={savingPlans} onClick={handleSavePlans}>{savingPlans ? 'Saving...' : 'Save Plan Amounts'}</Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Per-tenant override modal */}
            <Dialog open={!!overrideEdit} onOpenChange={v => !v && setOverrideEdit(null)}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Set Billing Amount — {overrideEdit?.name}</DialogTitle></DialogHeader>
                    <p className="text-sm text-muted-foreground">Override the plan default for this tenant.</p>
                    {overrideEdit && (
                        <div className="space-y-4 mt-2">
                            <div className="flex items-center gap-3">
                                <label className="text-sm font-medium">Monthly amount (₹)</label>
                                <Input type="number" min={0} value={overrideEdit.mrr} onChange={e => setOverrideEdit(prev => prev ? { ...prev, mrr: Number(e.target.value) || 0 } : null)} />
                            </div>
                            <Button className="w-full" disabled={savingOverride} onClick={handleSaveOverride}>{savingOverride ? 'Saving...' : 'Save'}</Button>
                            <Button variant="outline" className="w-full" onClick={async () => {
                                if (!overrideEdit) return;
                                try {
                                    await platformBillingApi.removeOverride(overrideEdit.tenantId);
                                    setOverrides(prev => { const next = { ...prev }; delete next[overrideEdit.tenantId]; return next; });
                                    setOverrideEdit(null);
                                    toast({ title: 'Removed', description: 'Tenant will use plan default.' });
                                } catch (e) {
                                    toast({ title: 'Error', description: (e as Error).message, variant: 'destructive' });
                                }
                            }}>Use Plan Default</Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
