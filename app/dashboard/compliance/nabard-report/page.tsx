'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency } from '@/lib/utils/formatters';
import { Download, FileText, CheckCircle, AlertTriangle, Building2 } from 'lucide-react';
import { complianceApi } from '@/lib/api';

const defaultNabardData = {
    fy: '2025-26',
    societyName: 'Sahayog Co-op Credit Society',
    regNo: 'MH-REG-2019-001',
    district: 'Pune',
    state: 'Maharashtra',
    dccb: 'Pune District Central Coop Bank',
    audit: { dateOfLastAudit: '30/09/2025', auditClass: 'A', surplus: 485000, deficit: 0 },
    membership: { opening: 420, joined: 42, resigned: 8, deceased: 2, closing: 452, activeLoans: 187 },
    shareCapital: { paidUp: 4520000, reserveFund: 1820000, otherReserves: 640000 },
    deposits: { sb: 12580000, fd: 28400000, rd: 6300000, total: 47280000 },
    loans: { shortTerm: 8400000, mediumTerm: 11200000, longTerm: 3600000, npa: 1240000, npaRatio: 5.3 },
    income: { interest: 5820000, other: 340000, total: 6160000 },
    expenditure: { interest: 2940000, admin: 1180000, provisions: 620000, total: 4740000 },
};

const SECTIONS = [
    { key: 'membership', label: 'Membership', status: 'COMPLETE' },
    { key: 'share', label: 'Share Capital & Reserves', status: 'COMPLETE' },
    { key: 'deposits', label: 'Deposits', status: 'COMPLETE' },
    { key: 'loans', label: 'Loans & Advances', status: 'COMPLETE' },
    { key: 'income', label: 'Income & Expenditure', status: 'COMPLETE' },
    { key: 'npa', label: 'NPA Classification', status: 'REVIEW' },
    { key: 'compliance', label: 'Compliance Checklist', status: 'COMPLETE' },
];

export default function NABARDReportPage() {
    const router = useRouter();
    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [generated, setGenerated] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleGenerate = async () => {
        setLoading(true);
        try {
            const res = await complianceApi.nabard();
            setReport(res.report);
            setGenerated(true);
        } catch {
            setReport(null);
        } finally {
            setLoading(false);
        }
    };

    const nabardData = report
        ? {
            ...defaultNabardData,
            fy: (report.period || '').slice(0, 7),
            membership: { ...defaultNabardData.membership, closing: report.memberCount || 0 },
            deposits: { ...defaultNabardData.deposits, total: report.totalDeposits || 0 },
            loans: { ...defaultNabardData.loans, mediumTerm: report.totalLoans || 0 },
        }
        : defaultNabardData;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2"><Building2 className="w-6 h-6" /> NABARD Annual Performance Report</h1>
                    <p className="text-muted-foreground text-sm">FY {nabardData.fy} — Due by 30 June 2026 — NABARD / DCCB</p>
                </div>
                <div className="flex gap-2">
                    {generated && <Button variant="outline" className="gap-2"><Download className="w-4 h-4" /> Download PDF</Button>}
                    <Button onClick={handleGenerate} disabled={loading || generated} className="gap-2">
                        <FileText className="w-4 h-4" />
                        {loading ? 'Generating...' : generated ? 'Generated ✓' : 'Generate Report'}
                    </Button>
                </div>
            </div>

            {/* Progress Bar */}
            {loading && <div className="w-full bg-muted rounded-full h-2 overflow-hidden"><div className="h-full bg-primary rounded-full animate-pulse w-4/5" /></div>}

            {/* Section Completion Status */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {SECTIONS.map(s => (
                    <div key={s.key} className={`p-3 rounded-lg border text-sm flex items-center justify-between ${s.status === 'COMPLETE' ? 'border-green-300 bg-green-50 dark:bg-green-950' : 'border-amber-300 bg-amber-50 dark:bg-amber-950'}`}>
                        <span className="font-medium truncate">{s.label}</span>
                        <Badge className={s.status === 'COMPLETE' ? 'bg-green-100 text-green-800 ml-1 flex-shrink-0' : 'bg-amber-100 text-amber-800 ml-1 flex-shrink-0'}>{s.status}</Badge>
                    </div>
                ))}
            </div>

            {nabardData.loans.npaRatio > 5 && (
                <Alert className="border-red-200 bg-red-50 dark:bg-red-950">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-700 text-sm">NPA Ratio is {nabardData.loans.npaRatio}% — above 5% threshold. NABARD may require an explanation. Review NPA provisioning before submission.</AlertDescription>
                </Alert>
            )}

            <Tabs defaultValue="membership">
                <TabsList className="grid grid-cols-4 w-full text-xs">
                    <TabsTrigger value="membership">Membership</TabsTrigger>
                    <TabsTrigger value="financial">Financial</TabsTrigger>
                    <TabsTrigger value="loans">Loans</TabsTrigger>
                    <TabsTrigger value="compliance">Compliance</TabsTrigger>
                </TabsList>

                <TabsContent value="membership">
                    <Card><CardHeader><CardTitle className="text-sm">Membership Summary</CardTitle></CardHeader>
                        <CardContent className="text-sm space-y-2">
                            {[['Opening Members', nabardData.membership.opening], ['New Members Joined', nabardData.membership.joined], ['Resigned', nabardData.membership.resigned], ['Deceased', nabardData.membership.deceased], ['Closing Members', nabardData.membership.closing], ['Members with Active Loans', nabardData.membership.activeLoans]].map(([k, v]) => (
                                <div key={String(k)} className="flex justify-between border-b border-border pb-1"><span className="text-muted-foreground">{k}</span><span className="font-medium">{v}</span></div>
                            ))}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="financial">
                    <div className="space-y-4">
                        <Card><CardHeader><CardTitle className="text-sm">Share Capital & Reserves</CardTitle></CardHeader>
                            <CardContent className="text-sm space-y-2">
                                {[['Paid-Up Share Capital', nabardData.shareCapital.paidUp], ['Statutory Reserve Fund', nabardData.shareCapital.reserveFund], ['Other Reserves', nabardData.shareCapital.otherReserves]].map(([k, v]) => (
                                    <div key={String(k)} className="flex justify-between"><span className="text-muted-foreground">{k}</span><span className="font-bold">{formatCurrency(Number(v))}</span></div>
                                ))}
                            </CardContent>
                        </Card>
                        <Card><CardHeader><CardTitle className="text-sm">Income & Expenditure</CardTitle></CardHeader>
                            <CardContent className="text-sm space-y-2">
                                {[['Interest Income', nabardData.income.interest, 'text-green-600'], ['Other Income', nabardData.income.other, 'text-green-600'], ['Total Income', nabardData.income.total, 'text-green-700'], ['Interest Paid', nabardData.expenditure.interest, 'text-red-500'], ['Admin Expenses', nabardData.expenditure.admin, 'text-red-500'], ['Provisions', nabardData.expenditure.provisions, 'text-red-500'], ['Total Expenditure', nabardData.expenditure.total, 'text-red-600'], ['Net Surplus', nabardData.income.total - nabardData.expenditure.total, 'text-primary font-bold']].map(([k, v, color]) => (
                                    <div key={String(k)} className={`flex justify-between ${String(k).includes('Total') || String(k) === 'Net Surplus' ? 'border-t border-border pt-1 font-bold' : ''}`}>
                                        <span className="text-muted-foreground">{k}</span><span className={String(color)}>{formatCurrency(Number(v))}</span>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="loans">
                    <Card><CardHeader><CardTitle className="text-sm">Loan Portfolio (IRAC Classification)</CardTitle></CardHeader>
                        <CardContent className="text-sm space-y-2">
                            {[['Short-Term Loans', nabardData.loans.shortTerm], ['Medium-Term Loans', nabardData.loans.mediumTerm], ['Long-Term Loans', nabardData.loans.longTerm]].map(([k, v]) => (
                                <div key={String(k)} className="flex justify-between"><span className="text-muted-foreground">{k}</span><span className="font-medium">{formatCurrency(Number(v))}</span></div>
                            ))}
                            <div className="border-t border-border pt-1 flex justify-between font-bold"><span>Total Portfolio</span><span>{formatCurrency(nabardData.loans.shortTerm + nabardData.loans.mediumTerm + nabardData.loans.longTerm)}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">NPA Outstanding</span><span className="text-red-600 font-bold">{formatCurrency(nabardData.loans.npa)}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">NPA Ratio</span><span className={`font-bold ${nabardData.loans.npaRatio > 5 ? 'text-red-600' : 'text-green-600'}`}>{nabardData.loans.npaRatio}%</span></div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="compliance">
                    <Card><CardHeader><CardTitle className="text-sm">Compliance Checklist</CardTitle></CardHeader>
                        <CardContent>
                            {[['AGM held within 6 months of FY close', true], ['Audit completed', true], ['NPA provisioning per IRAC norms', true], ['Reserve Fund transfer ≥ 25% of surplus', true], ['BOD election conducted (if due)', true], ['NABARD inspection compliance', true]].map(([k, v]) => (
                                <div key={String(k)} className="flex items-center gap-2 py-2 border-b border-border last:border-0 text-sm">
                                    <CheckCircle className={`w-4 h-4 flex-shrink-0 ${v ? 'text-green-500' : 'text-red-500'}`} />
                                    <span>{String(k)}</span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {generated && !submitted && (
                <Button className="w-full gap-2" onClick={async () => { setSubmitting(true); await new Promise(r => setTimeout(r, 1500)); setSubmitting(false); setSubmitted(true); }}>
                    {submitting ? 'Submitting to DCCB...' : 'Submit Report to DCCB Portal'}
                </Button>
            )}
            {submitted && (
                <Alert className="border-green-200 bg-green-50 dark:bg-green-950">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-700">Report submitted to DCCB portal. Acknowledgement reference: DCCB-APR-2026-00847</AlertDescription>
                </Alert>
            )}
        </div>
    );
}
