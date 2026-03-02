'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, ArrowLeft, ArrowRight, Building2, Settings, CreditCard } from 'lucide-react';
import { tenantsApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

const STEPS = ['Society Info', 'Plan & Credits', 'Admin Setup', 'Review'];
const INDIAN_STATES = ['Andhra Pradesh', 'Karnataka', 'Kerala', 'Maharashtra', 'Tamil Nadu', 'Telangana', 'Gujarat', 'Rajasthan', 'Uttar Pradesh'];

const PLAN_MAP: Record<string, string> = { STARTER: 'starter', PROFESSIONAL: 'pro', ENTERPRISE: 'enterprise' };

export default function NewTenantPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [step, setStep] = useState(0);

    const [society, setSociety] = useState({ name: '', regNo: '', regDate: '', state: '', district: '', address: '', actType: 'MSCS', phone: '', email: '' });
    const [plan, setPlan] = useState({ tier: '', credits: 100, smsCredits: 500 });
    const [admin, setAdmin] = useState({ name: '', email: '', phone: '', tempPassword: '' });

    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState(false);
    const [createdTenantId, setCreatedTenantId] = useState<string | null>(null);

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            const base = (society.regNo || society.name.replace(/\s+/g, '')).replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 12) || 'TEN';
            const code = base + '-' + Date.now().toString().slice(-6);
            const res = await tenantsApi.create({
                name: society.name,
                code,
                district: society.district || undefined,
                state: society.state || undefined,
                regNumber: society.regNo || undefined,
                plan: (PLAN_MAP[plan.tier] || 'starter') as 'starter' | 'pro' | 'enterprise',
                adminUser: {
                    name: admin.name,
                    email: admin.email,
                    password: admin.tempPassword,
                },
            });
            setCreatedTenantId(res.tenant?.id || null);
            setDone(true);
            toast({ title: 'Tenant onboarded', description: `Admin ${admin.email} can now login with the password you set.` });
        } catch (e) {
            toast({ title: 'Failed', description: e instanceof Error ? e.message : 'Could not onboard tenant', variant: 'destructive' });
        } finally {
            setSubmitting(false);
        }
    };

    const canNext = () => {
        if (step === 0) return !!society.name && !!society.regNo && !!society.state;
        if (step === 1) return !!plan.tier;
        if (step === 2) return !!admin.name && !!admin.email && !!admin.tempPassword;
        return true;
    };

    if (done) {
        return (
            <div className="max-w-lg mx-auto text-center py-12 space-y-6">
                <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mx-auto"><CheckCircle className="w-10 h-10 text-green-600" /></div>
                <h2 className="text-2xl font-bold">Tenant Onboarded!</h2>
                <div className="p-4 rounded-lg border border-border space-y-2 text-left text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Society</span><span>{society.name}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Plan</span><span><Badge>{plan.tier}</Badge></span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Admin Email</span><span className="text-primary">{admin.email}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Admin Password</span><span className="font-mono text-amber-600">(the one you set)</span></div>
                </div>
                <p className="text-sm text-muted-foreground">Admin can login with email <strong>{admin.email}</strong> and the temporary password you set.</p>
                <Button onClick={() => router.push('/admin/tenants')}>Back to Tenants</Button>
            </div>
        );
    }

    return (
        <div className="max-w-xl mx-auto space-y-6">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="w-4 h-4" /></Button>
                <div><h1 className="text-2xl font-bold">Onboard New Tenant</h1><p className="text-muted-foreground text-sm">Step {step + 1} of {STEPS.length}: {STEPS[step]}</p></div>
            </div>

            <div className="flex gap-1">{STEPS.map((s, i) => <div key={i} className={`flex-1 h-2 rounded-full transition-all ${i <= step ? 'bg-primary' : 'bg-muted'}`} />)}</div>

            <Card>
                <CardContent className="pt-5 space-y-4">
                    {step === 0 && (
                        <>
                            <div><label className="text-sm font-medium">Society Name *</label><Input className="mt-1" value={society.name} onChange={e => setSociety(p => ({ ...p, name: e.target.value }))} /></div>
                            <div className="grid grid-cols-2 gap-3">
                                <div><label className="text-sm font-medium">Registration No *</label><Input className="mt-1 font-mono" value={society.regNo} onChange={e => setSociety(p => ({ ...p, regNo: e.target.value }))} /></div>
                                <div><label className="text-sm font-medium">Registration Date</label><Input className="mt-1" type="date" value={society.regDate} onChange={e => setSociety(p => ({ ...p, regDate: e.target.value }))} /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div><label className="text-sm font-medium">State *</label>
                                    <Select value={society.state} onValueChange={v => setSociety(p => ({ ...p, state: v }))}>
                                        <SelectTrigger className="mt-1"><SelectValue placeholder="Select state" /></SelectTrigger>
                                        <SelectContent>{INDIAN_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div><label className="text-sm font-medium">Act Type</label>
                                    <Select value={society.actType} onValueChange={v => setSociety(p => ({ ...p, actType: v }))}>
                                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                                        <SelectContent>{['MSCS', 'State Co-op', 'PACS', 'Credit Union'].map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div><label className="text-sm font-medium">Phone</label><Input className="mt-1" value={society.phone} onChange={e => setSociety(p => ({ ...p, phone: e.target.value }))} /></div>
                            <div><label className="text-sm font-medium">Email</label><Input className="mt-1" type="email" value={society.email} onChange={e => setSociety(p => ({ ...p, email: e.target.value }))} /></div>
                        </>
                    )}

                    {step === 1 && (
                        <>
                            <div>
                                <label className="text-sm font-medium">Subscription Plan *</label>
                                <div className="grid grid-cols-3 gap-3 mt-2">
                                    {[['STARTER', '₹2,000/mo', '100 members', 'bg-blue-50 border-blue-200'], ['PROFESSIONAL', '₹5,000/mo', '500 members', 'bg-purple-50 border-purple-200'], ['ENTERPRISE', 'Custom', 'Unlimited', 'bg-amber-50 border-amber-200']].map(([tier, price, limit, cls]) => (
                                        <button key={tier} onClick={() => setPlan(p => ({ ...p, tier }))} className={`p-4 rounded-lg border text-center transition-all ${plan.tier === tier ? 'ring-2 ring-primary border-primary' : 'border-border hover:border-primary/50'}`}>
                                            <p className="font-bold text-sm">{tier}</p><p className="text-xs text-muted-foreground mt-1">{price}</p><p className="text-xs text-muted-foreground">{limit}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div><label className="text-sm font-medium">Transaction Credits</label><Input className="mt-1" type="number" value={plan.credits} onChange={e => setPlan(p => ({ ...p, credits: Number(e.target.value) }))} /></div>
                                <div><label className="text-sm font-medium">SMS Credits</label><Input className="mt-1" type="number" value={plan.smsCredits} onChange={e => setPlan(p => ({ ...p, smsCredits: Number(e.target.value) }))} /></div>
                            </div>
                        </>
                    )}

                    {step === 2 && (
                        <>
                            <Alert><AlertDescription className="text-xs">The Admin user will be the primary administrator for this tenant. Login credentials will be emailed.</AlertDescription></Alert>
                            <div><label className="text-sm font-medium">Admin Full Name *</label><Input className="mt-1" value={admin.name} onChange={e => setAdmin(p => ({ ...p, name: e.target.value }))} /></div>
                            <div><label className="text-sm font-medium">Admin Email *</label><Input className="mt-1" type="email" value={admin.email} onChange={e => setAdmin(p => ({ ...p, email: e.target.value }))} /></div>
                            <div><label className="text-sm font-medium">Mobile</label><Input className="mt-1" value={admin.phone} onChange={e => setAdmin(p => ({ ...p, phone: e.target.value }))} /></div>
                            <div><label className="text-sm font-medium">Temporary Password *</label><PasswordInput className="mt-1" value={admin.tempPassword} onChange={e => setAdmin(p => ({ ...p, tempPassword: e.target.value }))} /></div>
                        </>
                    )}

                    {step === 3 && (
                        <div className="space-y-3 text-sm divide-y divide-border">
                            <div className="pb-2 font-semibold flex items-center gap-2"><Building2 className="w-4 h-4" /> Society Details</div>
                            {[['Name', society.name], ['Reg No', society.regNo], ['State', society.state], ['Act Type', society.actType]].map(([k, v]) => <div key={k} className="flex justify-between py-1"><span className="text-muted-foreground">{k}</span><span>{v}</span></div>)}
                            <div className="pt-2 pb-2 font-semibold flex items-center gap-2"><CreditCard className="w-4 h-4" /> Plan</div>
                            {[['Plan', plan.tier], ['TX Credits', plan.credits], ['SMS Credits', plan.smsCredits]].map(([k, v]) => <div key={k} className="flex justify-between py-1"><span className="text-muted-foreground">{k}</span><span>{v}</span></div>)}
                            <div className="pt-2 font-semibold flex items-center gap-2"><Settings className="w-4 h-4" /> Admin User</div>
                            {[['Name', admin.name], ['Email', admin.email]].map(([k, v]) => <div key={k} className="flex justify-between py-1"><span className="text-muted-foreground">{k}</span><span>{v}</span></div>)}
                        </div>
                    )}

                    <div className="flex justify-between pt-3 border-t border-border">
                        <Button variant="outline" onClick={() => step > 0 ? setStep(s => s - 1) : router.back()}><ArrowLeft className="w-4 h-4 mr-2" />{step === 0 ? 'Cancel' : 'Back'}</Button>
                        {step < 3 ? <Button onClick={() => setStep(s => s + 1)} disabled={!canNext()}>Next <ArrowRight className="w-4 h-4 ml-2" /></Button> : <Button onClick={handleSubmit} disabled={submitting}>{submitting ? 'Onboarding...' : 'Onboard Tenant'}</Button>}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
