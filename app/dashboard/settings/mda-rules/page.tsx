'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { tenantMdaApi } from '@/lib/api';
import { setApiToken } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Settings, Save, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const PROVISION_KEYS = ['standard', 'sma', 'sub_standard', 'doubtful_1', 'doubtful_2', 'doubtful_3', 'loss'];

export default function MdaRulesPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [mda, setMda] = useState({ fdrTdsRate: 10, minorAge: 18, loanProvisionMap: {} as Record<string, number> });
    const [versions, setVersions] = useState<Array<{ id: string; version: number; createdAt: string }>>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('sahayog-token') : null;
        if (token) setApiToken(token);
        Promise.all([tenantMdaApi.get(), tenantMdaApi.getVersions()])
            .then(([mdaRes, verRes]) => {
                if (mdaRes.mda) setMda(mdaRes.mda);
                if (verRes.versions) setVersions(verRes.versions);
            })
            .catch(() => toast({ title: 'Failed to load', variant: 'destructive' }))
            .finally(() => setLoading(false));
    }, [toast]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await tenantMdaApi.put({
                fdrTdsRate: mda.fdrTdsRate,
                minorAge: mda.minorAge,
                loanProvisionMap: mda.loanProvisionMap,
            });
            toast({ title: 'MDA rules saved' });
            const verRes = await tenantMdaApi.getVersions();
            if (verRes.versions) setVersions(verRes.versions);
        } catch (e: any) {
            toast({ title: e?.message || 'Failed to save', variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    const handleRollback = async (versionId: string) => {
        setSaving(true);
        try {
            const res = await tenantMdaApi.rollback(versionId);
            if (res.mda) setMda(res.mda);
            toast({ title: res.message || 'Rolled back' });
            const verRes = await tenantMdaApi.getVersions();
            if (verRes.versions) setVersions(verRes.versions);
        } catch (e: any) {
            toast({ title: e?.message || 'Rollback failed', variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    const updateProvision = (key: string, val: number) => {
        setMda((p) => ({
            ...p,
            loanProvisionMap: { ...(p.loanProvisionMap || {}), [key]: val },
        }));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[40vh]">
                <p className="text-muted-foreground">Loading...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-2xl">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="w-4 h-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Settings className="w-6 h-6" /> MDA Rules (MT-003)
                    </h1>
                    <p className="text-muted-foreground text-sm">Tenant overrides for TDS, minor age, loan provisioning. Platform defaults apply where not overridden.</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Parameters</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between gap-4">
                        <label className="font-medium">FDR TDS Rate (%)</label>
                        <Input
                            type="number"
                            className="w-24"
                            value={mda.fdrTdsRate ?? 10}
                            onChange={(e) => setMda((p) => ({ ...p, fdrTdsRate: parseFloat(e.target.value) || 0 }))}
                        />
                    </div>
                    <div className="flex items-center justify-between gap-4">
                        <label className="font-medium">Minor Age</label>
                        <Input
                            type="number"
                            className="w-24"
                            value={mda.minorAge ?? 18}
                            onChange={(e) => setMda((p) => ({ ...p, minorAge: parseInt(e.target.value, 10) || 18 }))}
                        />
                    </div>
                    <div>
                        <p className="text-sm font-medium mb-2">Loan Provision % (NPA Category)</p>
                        <div className="grid grid-cols-2 gap-2">
                            {PROVISION_KEYS.map((k) => (
                                <div key={k} className="flex items-center justify-between gap-2">
                                    <span className="text-xs capitalize">{k.replace('_', ' ')}</span>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        className="w-20 h-8 text-right"
                                        value={mda.loanProvisionMap?.[k] ?? 0}
                                        onChange={(e) => updateProvision(k, parseFloat(e.target.value) || 0)}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                    <Button onClick={handleSave} disabled={saving} className="gap-2">
                        <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save'}
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <RotateCcw className="w-4 h-4" /> Version History & Rollback
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">Roll back to a previous configuration version.</p>
                </CardHeader>
                <CardContent>
                    {versions.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No versions yet. Save changes to create a version.</p>
                    ) : (
                        <div className="space-y-2">
                            {versions.map((v) => (
                                <div key={v.id} className="flex items-center justify-between p-2 rounded border">
                                    <span className="text-sm">Version {v.version} — {new Date(v.createdAt).toLocaleString()}</span>
                                    <Button variant="outline" size="sm" onClick={() => handleRollback(v.id)} disabled={saving}>
                                        Rollback
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
