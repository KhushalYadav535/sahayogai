'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Settings, Save, Cpu, BarChart3 } from 'lucide-react';
import { platformConfigApi, jobsApi } from '@/lib/api';
import { setApiToken } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export default function PlatformConfigPage() {
    const { toast } = useToast();
    const [modules, setModules] = useState<Record<string, string[]>>({ starter: [], pro: [], enterprise: [] });
    const [memberCap, setMemberCap] = useState<Record<string, number>>({ starter: 500, pro: 2000, enterprise: -1 });
    const [mda, setMda] = useState({ fdrTdsRate: 10, minorAge: 18, loanProvisionMap: {} as Record<string, number> });
    const [ai, setAi] = useState({ modelVersion: 'gpt-4o-mini', rollbackVersion: '' as string | null });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [snapshotRunning, setSnapshotRunning] = useState(false);

    useEffect(() => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('sahayog-token') : null;
        if (token) setApiToken(token);
        Promise.all([platformConfigApi.getModules(), platformConfigApi.getMda(), platformConfigApi.getAi()])
            .then(([modRes, mdaRes, aiRes]) => {
                if (modRes.modules) setModules(modRes.modules);
                if (modRes.memberCap) setMemberCap(modRes.memberCap);
                if (mdaRes.mda) setMda(mdaRes.mda);
                if (aiRes.ai) setAi({ ...aiRes.ai, rollbackVersion: aiRes.ai.rollbackVersion ?? '' });
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const handleSaveModules = async () => {
        setSaving(true);
        try {
            await platformConfigApi.setModules({ modules, memberCap });
            toast({ title: 'Saved', description: 'Modules and member caps updated.' });
        } catch (e) {
            toast({ title: 'Error', description: (e as Error).message, variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    const handleSaveMda = async () => {
        setSaving(true);
        try {
            await platformConfigApi.setMda(mda);
            toast({ title: 'Saved', description: 'MDA parameters updated.' });
        } catch (e) {
            toast({ title: 'Error', description: (e as Error).message, variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    const handleSaveAi = async () => {
        setSaving(true);
        try {
            await platformConfigApi.setAi({
                modelVersion: ai.modelVersion,
                rollbackVersion: ai.rollbackVersion || null,
            });
            toast({ title: 'Saved', description: 'AI configuration updated.' });
        } catch (e) {
            toast({ title: 'Error', description: (e as Error).message, variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    const handleRunSnapshot = async () => {
        setSnapshotRunning(true);
        try {
            const res = await jobsApi.runUsageSnapshot();
            toast({ title: 'Success', description: res.message });
        } catch (e) {
            toast({ title: 'Error', description: (e as Error).message, variant: 'destructive' });
        } finally {
            setSnapshotRunning(false);
        }
    };

    const updateModuleList = (tier: string, value: string) => {
        const list = value.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
        setModules((prev) => ({ ...prev, [tier]: list }));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[40vh]">
                <p className="text-muted-foreground">Loading...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Settings className="w-6 h-6" /> Platform Configuration
                </h1>
                <p className="text-muted-foreground text-sm">Modules per tier, member caps, MDA parameters</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Modules Per Tier</CardTitle>
                    <p className="text-sm text-muted-foreground">Comma-separated module IDs (e.g. sb, loans, deposits, reporting, governance, compliance, ai)</p>
                </CardHeader>
                <CardContent className="space-y-4">
                    {(['starter', 'pro', 'enterprise'] as const).map((tier) => (
                        <div key={tier} className="flex flex-wrap gap-4 items-center">
                            <label className="w-24 font-medium capitalize">{tier}</label>
                            <Input
                                className="flex-1 min-w-[200px]"
                                value={(modules[tier] || []).join(', ')}
                                onChange={(e) => updateModuleList(tier, e.target.value)}
                                placeholder="sb, loans, deposits, reporting"
                            />
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">Member cap:</span>
                                <Input
                                    type="number"
                                    className="w-20"
                                    placeholder={tier === 'enterprise' ? '-1' : '500'}
                                    value={memberCap[tier] === -1 ? '' : memberCap[tier]}
                                    onChange={(e) => {
                                        const v = e.target.value;
                                        setMemberCap((p) => ({ ...p, [tier]: v === '' || v === '-1' ? -1 : parseInt(v, 10) || 0 }));
                                    }}
                                />
                                <span className="text-xs text-muted-foreground">(-1=∞)</span>
                            </div>
                        </div>
                    ))}
                    <Button onClick={handleSaveModules} disabled={saving} className="gap-2">
                        <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Modules'}
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Platform MDA Parameters</CardTitle>
                    <p className="text-sm text-muted-foreground">TDS rate (%), minor age, loan provision % per NPA category</p>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-4 items-center">
                        <label className="w-32 font-medium">FDR TDS Rate (%)</label>
                        <Input
                            type="number"
                            className="w-24"
                            value={mda.fdrTdsRate}
                            onChange={(e) => setMda((p) => ({ ...p, fdrTdsRate: parseFloat(e.target.value) || 0 }))}
                        />
                    </div>
                    <div className="flex gap-4 items-center">
                        <label className="w-32 font-medium">Minor Age</label>
                        <Input
                            type="number"
                            className="w-24"
                            value={mda.minorAge}
                            onChange={(e) => setMda((p) => ({ ...p, minorAge: parseInt(e.target.value, 10) || 18 }))}
                        />
                    </div>
                    <Button onClick={handleSaveMda} disabled={saving} className="gap-2">
                        <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save MDA'}
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2"><Cpu className="w-4 h-4" /> AI Configuration</CardTitle>
                    <p className="text-sm text-muted-foreground">Model version, rollback version (Platform-scope)</p>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-4 items-center">
                        <label className="w-32 font-medium">Model Version</label>
                        <Input
                            className="w-48"
                            value={ai.modelVersion}
                            onChange={(e) => setAi((p) => ({ ...p, modelVersion: e.target.value }))}
                            placeholder="gpt-4o-mini"
                        />
                    </div>
                    <div className="flex gap-4 items-center">
                        <label className="w-32 font-medium">Rollback Version</label>
                        <Input
                            className="w-48"
                            value={ai.rollbackVersion ?? ''}
                            onChange={(e) => setAi((p) => ({ ...p, rollbackVersion: e.target.value || null }))}
                            placeholder="Optional - for rollback"
                        />
                    </div>
                    <Button onClick={handleSaveAi} disabled={saving} className="gap-2">
                        <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save AI Config'}
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2"><BarChart3 className="w-4 h-4" /> Usage Snapshot (MT-005)</CardTitle>
                    <p className="text-sm text-muted-foreground">Aggregate usage for all tenants (previous month). Run monthly for accurate historical data.</p>
                </CardHeader>
                <CardContent>
                    <Button onClick={handleRunSnapshot} disabled={snapshotRunning} variant="outline" className="gap-2">
                        <BarChart3 className="w-4 h-4" /> {snapshotRunning ? 'Running...' : 'Run Usage Snapshot'}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
