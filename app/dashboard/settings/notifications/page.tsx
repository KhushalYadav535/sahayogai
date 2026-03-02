'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { configApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, Bell, Edit, CheckCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type Template = {
    id: string;
    event: string;
    channels: string[];
    sms: string;
    email: string;
    active: boolean;
};

const DEFAULT_TEMPLATES: Template[] = [
    { id: 'loan_disburse', event: 'Loan Disbursement', channels: ['SMS', 'Email'], sms: 'Dear {member_name}, your loan of ₹{amount} (Ref: {loan_id}) has been disbursed. EMI: ₹{emi}/month. -SahayogAI', email: 'Your loan application {loan_id} has been approved and disbursed.', active: true },
    { id: 'emi_due', event: 'EMI Due Reminder (3 days prior)', channels: ['SMS', 'WhatsApp'], sms: 'Dear {member_name}, your EMI of ₹{amount} for loan {loan_id} is due on {due_date}. -SahayogAI', email: '', active: true },
    { id: 'emi_overdue', event: 'EMI Overdue Alert', channels: ['SMS', 'Email'], sms: 'Dear {member_name}, your EMI of ₹{amount} is overdue by {days} days. Please pay immediately to avoid penal charges. -SahayogAI', email: '', active: true },
    { id: 'deposit_mature', event: 'Deposit Maturity (7 days prior)', channels: ['SMS', 'Email'], sms: 'Dear {member_name}, your FDR {deposit_no} of ₹{amount} matures on {maturity_date}. Please contact us for renewal. -SahayogAI', email: '', active: true },
    { id: 'kyc_expiry', event: 'KYC Expiry Reminder', channels: ['Email'], sms: '', email: 'Your KYC documents are expiring in {days} days. Please update your documents at the branch.', active: true },
    { id: 'ai_risk_alert', event: 'AI Risk Score Alert', channels: ['Email', 'In-App'], sms: '', email: 'AI risk score for member {member_name} has dropped to {score} (RED). Immediate review recommended.', active: false },
];

const CONFIG_KEY = 'notification_templates';

export default function NotificationsPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [templates, setTemplates] = useState<Template[]>(DEFAULT_TEMPLATES);
    const [loading, setLoading] = useState(true);
    const [editTpl, setEditTpl] = useState<Template | null>(null);
    const [editSms, setEditSms] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [saving, setSaving] = useState(false);

    // Load templates from backend SystemConfig
    useEffect(() => {
        configApi.get(CONFIG_KEY)
            .then(r => {
                if (r.config?.value) {
                    try {
                        const parsed = JSON.parse(r.config.value) as Template[];
                        if (Array.isArray(parsed) && parsed.length > 0) setTemplates(parsed);
                    } catch {/* use defaults */ }
                }
            })
            .catch(() => {/* use defaults */ })
            .finally(() => setLoading(false));
    }, []);

    // Persist full templates array
    const persistTemplates = async (updated: Template[]) => {
        await configApi.put(CONFIG_KEY, {
            value: JSON.stringify(updated),
            label: 'Notification Templates',
        });
    };

    const openEdit = (tpl: Template) => {
        setEditTpl(tpl);
        setEditSms(tpl.sms);
        setEditEmail(tpl.email);
    };

    const handleSaveTemplate = async () => {
        if (!editTpl) return;
        setSaving(true);
        try {
            const updated = templates.map(t =>
                t.id === editTpl.id ? { ...t, sms: editSms, email: editEmail } : t
            );
            await persistTemplates(updated);
            setTemplates(updated);
            setEditTpl(null);
            toast({ title: 'Template saved' });
        } catch {
            toast({ title: 'Failed to save template', variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    const handleToggleActive = async (id: string, value: boolean) => {
        const updated = templates.map(t => t.id === id ? { ...t, active: value } : t);
        setTemplates(updated);
        try {
            await persistTemplates(updated);
        } catch {
            // revert on failure
            setTemplates(templates);
            toast({ title: 'Failed to update', variant: 'destructive' });
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[40vh]">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-3xl">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="w-4 h-4" /></Button>
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2"><Bell className="w-6 h-6" /> Notification Templates</h1>
                    <p className="text-muted-foreground text-sm">Configure SMS, Email, WhatsApp message templates</p>
                </div>
            </div>

            <div className="space-y-4">
                {templates.map(tpl => (
                    <Card key={tpl.id}>
                        <CardContent className="pt-4">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 flex-wrap mb-2">
                                        <p className="font-semibold text-sm">{tpl.event}</p>
                                        {tpl.channels.map(ch => (
                                            <Badge key={ch} className="bg-blue-100 text-blue-800 text-xs">{ch}</Badge>
                                        ))}
                                        {!tpl.active && <Badge className="bg-gray-100 text-gray-500 text-xs">Disabled</Badge>}
                                    </div>
                                    {tpl.sms && (
                                        <p className="text-xs text-muted-foreground mt-1 border-l-2 border-primary/30 pl-2 italic line-clamp-2">{tpl.sms}</p>
                                    )}
                                    {!tpl.sms && tpl.email && (
                                        <p className="text-xs text-muted-foreground mt-1 border-l-2 border-blue-300 pl-2 italic line-clamp-2">{tpl.email}</p>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <Switch
                                        checked={tpl.active}
                                        onCheckedChange={v => handleToggleActive(tpl.id, v)}
                                    />
                                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => openEdit(tpl)}>
                                        <Edit className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Edit Modal */}
            <Dialog open={!!editTpl} onOpenChange={v => !v && setEditTpl(null)}>
                <DialogContent className="max-w-lg">
                    <DialogHeader><DialogTitle>Edit Template — {editTpl?.event}</DialogTitle></DialogHeader>
                    {editTpl && (
                        <div className="space-y-4">
                            <p className="text-xs text-muted-foreground">
                                Available variables: {'{member_name}'}, {'{amount}'}, {'{loan_id}'}, {'{emi}'}, {'{due_date}'}, {'{days}'}, {'{deposit_no}'}, {'{maturity_date}'}, {'{score}'}
                            </p>
                            {editTpl.channels.includes('SMS') && (
                                <div>
                                    <label className="text-sm font-medium">SMS Template (max 160 chars)</label>
                                    <Textarea
                                        className="mt-1 font-mono text-sm"
                                        value={editSms}
                                        onChange={e => setEditSms(e.target.value)}
                                        rows={4}
                                        maxLength={160}
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">{editSms.length}/160 characters</p>
                                </div>
                            )}
                            {editTpl.channels.includes('Email') && (
                                <div>
                                    <label className="text-sm font-medium">Email Body</label>
                                    <Textarea
                                        className="mt-1 text-sm"
                                        value={editEmail}
                                        onChange={e => setEditEmail(e.target.value)}
                                        rows={4}
                                    />
                                </div>
                            )}
                            <div className="flex gap-2">
                                <Button className="flex-1 gap-2" onClick={handleSaveTemplate} disabled={saving}>
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                    {saving ? 'Saving...' : 'Save Template'}
                                </Button>
                                <Button variant="outline" className="flex-1" onClick={() => setEditTpl(null)}>Cancel</Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
