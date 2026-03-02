'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { configApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Settings, Save, CheckCircle } from 'lucide-react';

const PARAM_CATEGORIES = [
    {
        label: 'Savings Account',
        params: [
            { key: 'sb_min_balance', label: 'Minimum Balance (₹)', type: 'number', value: '1000' },
            { key: 'sb_rate', label: 'Interest Rate (% p.a.)', type: 'number', value: '4.0' },
            { key: 'sb_daily_withdrawal_limit', label: 'Daily Withdrawal Limit (₹)', type: 'number', value: '50000' },
            { key: 'sb_dormancy_months', label: 'Dormancy After (months)', type: 'number', value: '12' },
        ],
    },
    {
        label: 'Loan Rules',
        params: [
            { key: 'loan_max_exposure_pct', label: 'Max Loan-to-Share Ratio (%)', type: 'number', value: '500' },
            { key: 'loan_max_outstanding', label: 'Max Outstanding per Member (₹)', type: 'number', value: '500000' },
            { key: 'loan_penal_rate', label: 'Penal Interest Rate (% p.a.)', type: 'number', value: '24' },
            { key: 'loan_npa_days', label: 'NPA Classification (days overdue)', type: 'number', value: '90' },
        ],
    },
    {
        label: 'Deposit (FDR)',
        params: [
            { key: 'fdr_min_amount', label: 'Minimum Deposit Amount (₹)', type: 'number', value: '5000' },
            { key: 'fdr_tds_threshold', label: 'TDS Threshold Per FY (₹)', type: 'number', value: '40000' },
            { key: 'fdr_senior_citizen_bonus', label: 'Senior Citizen Bonus Rate (%)', type: 'number', value: '0.5' },
            { key: 'fdr_premature_penalty', label: 'Premature Withdrawal Penalty (%)', type: 'number', value: '1.0' },
        ],
    },
    {
        label: 'Membership',
        params: [
            { key: 'membership_joining_fee', label: 'Joining Fee (₹)', type: 'number', value: '50' },
            { key: 'min_share_capital', label: 'Minimum Share Capital (₹)', type: 'number', value: '500' },
            { key: 'membership_renewal_months', label: 'Membership Renewal Period (months)', type: 'number', value: '12' },
        ],
    },
    {
        label: 'Workflow & Approvals',
        params: [
            { key: 'maker_checker_threshold', label: 'Maker-Checker Threshold (₹)', type: 'number', value: '10000' },
            { key: 'auto_approve_below', label: 'Auto-Approve Below (₹)', type: 'number', value: '1000' },
            { key: 'dual_approval_loans', label: 'Dual Approval for Loans > ₹', type: 'number', value: '200000' },
        ],
    },
    {
        label: 'AI & Risk',
        params: [
            { key: 'ai_risk_red_threshold', label: 'AI Red Risk Score Threshold', type: 'number', value: '50' },
            { key: 'aml_cash_threshold', label: 'AML Cash Transaction Threshold (₹)', type: 'number', value: '200000' },
            { key: 'str_alert_enable', label: 'Enable Automatic STR Alerts', type: 'boolean', value: 'true' },
        ],
    },
];

const KEY_MAP: Record<string, string> = {
    sb_min_balance: 'sb_min_balance',
    sb_rate: 'sb_rate',
    sb_daily_withdrawal_limit: 'sb_daily_withdrawal_limit',
    sb_dormancy_months: 'sb_dormancy_months',
    loan_max_exposure_pct: 'loan_max_exposure_pct',
    loan_max_outstanding: 'loan_max_outstanding',
    loan_penal_rate: 'loan_penal_rate',
    loan_npa_days: 'loan_npa_days',
    fdr_min_amount: 'fdr_min_amount',
    fdr_tds_threshold: 'fdr_tds_threshold',
    fdr_senior_citizen_bonus: 'fdr_senior_citizen_bonus',
    fdr_premature_penalty: 'fdr_premature_penalty',
    membership_joining_fee: 'membership_joining_fee',
    min_share_capital: 'min_share_capital',
    membership_renewal_months: 'membership_renewal_months',
    maker_checker_threshold: 'maker_checker_threshold',
    auto_approve_below: 'auto_approve_below',
    dual_approval_loans: 'dual_approval_loans',
    ai_risk_red_threshold: 'ai_risk_red_threshold',
    aml_cash_threshold: 'aml_cash_threshold',
    str_alert_enable: 'str_alert_enable',
};

export default function ParametersPage() {
    const router = useRouter();
    const [values, setValues] = useState<Record<string, string>>(() => Object.fromEntries(PARAM_CATEGORIES.flatMap(c => c.params.map(p => [p.key, p.value]))));
    const [saved, setSaved] = useState(false);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [openCat, setOpenCat] = useState(PARAM_CATEGORIES[0].label);
    const [search, setSearch] = useState('');

    useEffect(() => {
        configApi.list()
            .then(r => {
                if (r.configs?.length) {
                    const map: Record<string, string> = {};
                    r.configs.forEach((c: any) => {
                        const localKey = Object.entries(KEY_MAP).find(([, v]) => v === c.key)?.[0] || c.key;
                        map[localKey] = c.value;
                    });
                    setValues(prev => ({ ...prev, ...map }));
                }
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            for (const [localKey, val] of Object.entries(values)) {
                const apiKey = KEY_MAP[localKey] || localKey;
                await configApi.put(apiKey, { value: val, label: PARAM_CATEGORIES.flatMap(c => c.params).find(p => p.key === localKey)?.label });
            }
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch {
            setSaving(false);
        }
        setSaving(false);
    };

    const filteredCats = PARAM_CATEGORIES.map(cat => ({
        ...cat,
        params: cat.params.filter(p => !search || p.label.toLowerCase().includes(search.toLowerCase()) || p.key.includes(search.toLowerCase())),
    })).filter(cat => cat.params.length > 0);

    return (
        <div className="space-y-6 max-w-3xl">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="w-4 h-4" /></Button>
                <div><h1 className="text-2xl font-bold flex items-center gap-2"><Settings className="w-6 h-6" /> Metadata Parameter Editor</h1>
                    <p className="text-muted-foreground text-sm">Society-level configuration parameters</p></div>
            </div>

            <Alert><AlertDescription className="text-sm">Parameter changes require Checker approval and are logged in the Audit Trail. All monetary values are in INR.</AlertDescription></Alert>

            <div className="flex flex-col sm:flex-row gap-3 items-start">
                <Input placeholder="Search parameters..." value={search} onChange={e => setSearch(e.target.value)} className="sm:w-64" />
                <div className="flex-1" />
                {saved && <div className="flex items-center gap-2 text-green-600 text-sm font-medium"><CheckCircle className="w-4 h-4" /> Changes saved</div>}
                <Button onClick={handleSave} disabled={saving} className="gap-2"><Save className="w-4 h-4" />{saving ? 'Saving...' : 'Save Changes'}</Button>
            </div>

            {filteredCats.map(cat => (
                <Card key={cat.label}>
                    <CardHeader className="cursor-pointer" onClick={() => setOpenCat(openCat === cat.label ? '' : cat.label)}>
                        <CardTitle className="flex items-center justify-between text-base">
                            <span>{cat.label}</span>
                            <span className="text-muted-foreground text-sm">{openCat === cat.label ? '▲' : '▼'}</span>
                        </CardTitle>
                    </CardHeader>
                    {openCat === cat.label && (
                        <CardContent className="space-y-4">
                            {cat.params.map(param => (
                                <div key={param.key} className="flex items-center justify-between gap-4">
                                    <div className="flex-1"><p className="text-sm font-medium">{param.label}</p><p className="text-xs font-mono text-muted-foreground">{param.key}</p></div>
                                    {param.type === 'boolean' ? (
                                        <Switch checked={values[param.key] === 'true'} onCheckedChange={v => setValues(prev => ({ ...prev, [param.key]: String(v) }))} />
                                    ) : (
                                        <Input type="number" step="0.1" value={values[param.key]} onChange={e => setValues(prev => ({ ...prev, [param.key]: e.target.value }))} className="w-36 text-right font-mono" />
                                    )}
                                </div>
                            ))}
                        </CardContent>
                    )}
                </Card>
            ))}
        </div>
    );
}
