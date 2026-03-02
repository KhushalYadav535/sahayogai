'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, Plus, Edit, Trash2, CheckCircle, AlertTriangle, Zap, Search } from 'lucide-react';
import { platformRulesApi, setApiToken } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

type RuleAction = 'BLOCK' | 'FLAG' | 'NOTIFY' | 'APPROVE_REQUIRED';
type RuleCategory = 'AML' | 'CREDIT' | 'COMPLIANCE' | 'OPERATIONAL';

interface Rule {
    id: string;
    name: string;
    category: RuleCategory;
    condition: string;
    action: RuleAction;
    enabled: boolean;
    priority: number;
    lastTriggered: string;
    triggerCount: number;
    tenantOverridable: boolean;
}

const CATEGORY_COLORS: Record<RuleCategory, string> = {
    AML: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    CREDIT: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    COMPLIANCE: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    OPERATIONAL: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

const ACTION_COLORS: Record<RuleAction, string> = {
    BLOCK: 'bg-red-100 text-red-800',
    FLAG: 'bg-amber-100 text-amber-800',
    NOTIFY: 'bg-blue-100 text-blue-800',
    APPROVE_REQUIRED: 'bg-purple-100 text-purple-800',
};

const BLANK_RULE: Omit<Rule, 'id' | 'lastTriggered' | 'triggerCount'> = {
    name: '', category: 'OPERATIONAL', condition: '', action: 'FLAG', enabled: true, priority: 2, tenantOverridable: true,
};

export default function PlatformRulesPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [rules, setRules] = useState<Rule[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [catFilter, setCatFilter] = useState<string>('all');
    const [editOpen, setEditOpen] = useState(false);
    const [isNew, setIsNew] = useState(false);
    const [editRule, setEditRule] = useState<Partial<Rule>>({});
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState('');
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const categories: string[] = ['all', 'AML', 'CREDIT', 'COMPLIANCE', 'OPERATIONAL'];

    useEffect(() => {
        const token = typeof localStorage !== 'undefined' ? localStorage.getItem('sahayog-token') : null;
        if (token) setApiToken(token);
        platformRulesApi.list(token || undefined)
            .then((r) => setRules((r.rules || []).map((x: any) => ({ ...x, lastTriggered: x.lastTriggered || 'Never', triggerCount: x.triggerCount ?? 0 }))))
            .catch(() => setRules([]))
            .finally(() => setLoading(false));
    }, []);

    const saveRules = async (newRules: Rule[]) => {
        try {
            await platformRulesApi.save(newRules);
            setRules(newRules);
        } catch (e) {
            toast({ title: 'Error', description: (e as Error).message, variant: 'destructive' });
            throw e;
        }
    };

    const filtered = rules.filter(r =>
        (catFilter === 'all' || r.category === catFilter) &&
        (r.name.toLowerCase().includes(search.toLowerCase()) || r.condition.toLowerCase().includes(search.toLowerCase()))
    );

    const openNew = () => {
        setIsNew(true);
        setEditRule({ ...BLANK_RULE, id: 'R' + String(rules.length + 1).padStart(3, '0') });
        setEditOpen(true);
    };

    const openEdit = (rule: Rule) => {
        setIsNew(false);
        setEditRule({ ...rule });
        setEditOpen(true);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const updated = isNew
                ? [...rules, { ...editRule as Rule, lastTriggered: 'Never', triggerCount: 0 }]
                : rules.map(r => r.id === editRule.id ? { ...r, ...editRule } as Rule : r);
            await saveRules(updated);
            setEditOpen(false);
            setSaved(isNew ? 'Rule created successfully' : 'Rule updated successfully');
            setTimeout(() => setSaved(''), 3000);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        const updated = rules.filter(r => r.id !== id);
        try {
            await saveRules(updated);
            setDeleteId(null);
            setSaved('Rule deleted');
            setTimeout(() => setSaved(''), 2500);
        } catch { /* toast shown by saveRules */ }
    };

    const toggleEnabled = async (id: string) => {
        const token = typeof localStorage !== 'undefined' ? localStorage.getItem('sahayog-token') : null;
        const updated = rules.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r);
        setRules(updated);
        try {
            await platformRulesApi.save(updated, token || undefined);
        } catch {
            setRules(rules);
            toast({ title: 'Error', description: 'Failed to update rule', variant: 'destructive' });
        }
    };

    const enabledCount = rules.filter(r => r.enabled).length;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[40vh]">
                <p className="text-muted-foreground">Loading rules...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Shield className="w-6 h-6" /> Platform Rule Engine
                    </h1>
                    <p className="text-muted-foreground text-sm">Global compliance and risk rules applied across all tenants</p>
                </div>
                <Button onClick={openNew} className="gap-2">
                    <Plus className="w-4 h-4" /> New Rule
                </Button>
            </div>

            {saved && (
                <Alert className="border-green-200 bg-green-50 dark:bg-green-950">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-700 text-sm">{saved}</AlertDescription>
                </Alert>
            )}

            <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                    Platform rules apply to <strong>all tenants</strong> by default. Rules marked <em>tenant-overridable</em> can be adjusted per tenant.
                </AlertDescription>
            </Alert>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    ['Total Rules', rules.length, 'text-foreground'],
                    ['Enabled', enabledCount, 'text-green-600'],
                    ['Disabled', rules.length - enabledCount, 'text-muted-foreground'],
                    ['AML Rules', rules.filter(r => r.category === 'AML').length, 'text-red-600'],
                ].map(([k, v, color]) => (
                    <Card key={String(k)}><CardContent className="pt-4">
                        <p className="text-xs text-muted-foreground">{k}</p>
                        <p className={`text-2xl font-bold mt-1 ${color}`}>{v}</p>
                    </CardContent></Card>
                ))}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-40">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                    <Input className="pl-9" placeholder="Search rules or conditions..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <div className="flex gap-2">
                    {categories.map(c => (
                        <button
                            key={c}
                            onClick={() => setCatFilter(c)}
                            className={`px-3 py-1.5 text-sm rounded-lg border capitalize transition-colors ${catFilter === c ? 'bg-primary/10 border-primary text-primary font-medium' : 'border-border hover:border-primary/50'}`}
                        >
                            {c}
                        </button>
                    ))}
                </div>
            </div>

            {/* Rules List */}
            <div className="space-y-3">
                {filtered.map(rule => (
                    <Card key={rule.id} className={!rule.enabled ? 'opacity-60' : ''}>
                        <CardContent className="pt-4">
                            <div className="flex items-start gap-4">
                                {/* Toggle */}
                                <Switch
                                    checked={rule.enabled}
                                    onCheckedChange={() => toggleEnabled(rule.id)}
                                    className="mt-0.5 flex-shrink-0"
                                />

                                {/* Main Info */}
                                <div className="flex-1 min-w-0 space-y-2">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="font-semibold text-sm">{rule.name}</p>
                                        <span className="text-xs text-muted-foreground font-mono">{rule.id}</span>
                                        <Badge className={CATEGORY_COLORS[rule.category]}>{rule.category}</Badge>
                                        <Badge className={ACTION_COLORS[rule.action]}>{rule.action}</Badge>
                                        {rule.tenantOverridable
                                            ? <Badge variant="outline" className="text-xs">Tenant Overridable</Badge>
                                            : <Badge className="bg-red-50 text-red-700 border border-red-200 text-xs">Platform Only</Badge>
                                        }
                                    </div>
                                    <code className="block text-xs bg-muted/60 rounded px-2 py-1 font-mono text-muted-foreground border border-border">
                                        IF {rule.condition}
                                    </code>
                                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                        <span>Priority: <strong>P{rule.priority}</strong></span>
                                        <span>Triggered: <strong>{rule.triggerCount}×</strong></span>
                                        <span>Last: <strong>{rule.lastTriggered}</strong></span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-1 flex-shrink-0">
                                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => openEdit(rule)}>
                                        <Edit className="w-3.5 h-3.5" />
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                                        onClick={() => setDeleteId(rule.id)}
                                        disabled={rule.category === 'AML' && !rule.tenantOverridable}
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {filtered.length === 0 && (
                    <div className="text-center py-10">
                        <Zap className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                        <p className="text-muted-foreground">No rules match your search</p>
                    </div>
                )}
            </div>

            {/* Create / Edit Modal */}
            <Dialog open={editOpen} onOpenChange={v => !v && setEditOpen(false)}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{isNew ? 'Create New Rule' : 'Edit Rule — ' + editRule.id}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">Rule Name *</label>
                            <Input
                                className="mt-1"
                                value={editRule.name || ''}
                                onChange={e => setEditRule(p => ({ ...p, name: e.target.value }))}
                                placeholder="e.g. High-Value Transfer Alert"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-sm font-medium">Category</label>
                                <Select value={editRule.category} onValueChange={v => setEditRule(p => ({ ...p, category: v as RuleCategory }))}>
                                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {(['AML', 'CREDIT', 'COMPLIANCE', 'OPERATIONAL'] as RuleCategory[]).map(c => (
                                            <SelectItem key={c} value={c}>{c}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="text-sm font-medium">Action</label>
                                <Select value={editRule.action} onValueChange={v => setEditRule(p => ({ ...p, action: v as RuleAction }))}>
                                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {(['BLOCK', 'FLAG', 'NOTIFY', 'APPROVE_REQUIRED'] as RuleAction[]).map(a => (
                                            <SelectItem key={a} value={a}>{a}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium">Condition Expression *</label>
                            <Textarea
                                className="mt-1 font-mono text-sm"
                                rows={3}
                                value={editRule.condition || ''}
                                onChange={e => setEditRule(p => ({ ...p, condition: e.target.value }))}
                                placeholder="e.g. cash_txn_amount > 200000"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                Available vars: cash_txn_amount, withdrawal_amount, emi_overdue_days, member_loan_outstanding, daily_txn_count, account_inactive_months, kyc_expiry_days
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-sm font-medium">Priority (1 = Highest)</label>
                                <Input
                                    className="mt-1"
                                    type="number"
                                    min={1}
                                    max={5}
                                    value={editRule.priority || 2}
                                    onChange={e => setEditRule(p => ({ ...p, priority: Number(e.target.value) }))}
                                />
                            </div>
                            <div className="flex flex-col justify-end">
                                <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                                    <label className="text-sm font-medium cursor-pointer">Tenant Overridable</label>
                                    <Switch
                                        checked={!!editRule.tenantOverridable}
                                        onCheckedChange={v => setEditRule(p => ({ ...p, tenantOverridable: v }))}
                                    />
                                </div>
                            </div>
                        </div>

                        {editRule.category === 'AML' && !editRule.tenantOverridable && (
                            <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950">
                                <AlertTriangle className="h-4 w-4 text-amber-600" />
                                <AlertDescription className="text-amber-700 text-xs">
                                    Platform-only AML rules cannot be overridden or disabled by tenants.
                                </AlertDescription>
                            </Alert>
                        )}

                        <Button
                            className="w-full"
                            disabled={!editRule.name || !editRule.condition || saving}
                            onClick={handleSave}
                        >
                            {saving ? 'Saving...' : isNew ? 'Create Rule' : 'Save Changes'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirm */}
            <Dialog open={!!deleteId} onOpenChange={v => !v && setDeleteId(null)}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Delete Rule</DialogTitle></DialogHeader>
                    <Alert className="border-red-200 bg-red-50 dark:bg-red-950">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-700 text-sm">
                            This rule will be permanently deleted and no longer applied to any tenant.
                        </AlertDescription>
                    </Alert>
                    <div className="flex gap-2 mt-2">
                        <Button variant="destructive" className="flex-1" onClick={() => deleteId && handleDelete(deleteId)} disabled={saving}>
                            Delete Rule
                        </Button>
                        <Button variant="outline" className="flex-1" onClick={() => setDeleteId(null)}>Cancel</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
