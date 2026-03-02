'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import { ArrowLeft, ArrowRight, CheckCircle, AlertTriangle, Upload, UserX } from 'lucide-react';

const STEPS = ['Resignation Details', 'Dues Calculation', 'Net Refund', 'Approval & Closure'];

const memberData = {
    name: 'Rajesh Kumar',
    memberId: 'MEM-202401-0001',
    shares: 25,
    shareNominalValue: 100,
    sbBalance: 12500,
    fdBalance: 50000,
    accrued: 432,
    loanOutstanding: 32500,
    penalInterest: 820,
    otherLiabilities: 0,
};

export default function MemberExitPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [step, setStep] = useState(0);
    const [reason, setReason] = useState('');
    const [letterUploaded, setLetterUploaded] = useState(false);
    const [approvalNote, setApprovalNote] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState(false);

    const shareValue = memberData.shares * memberData.shareNominalValue;
    const totalAssets = memberData.sbBalance + memberData.fdBalance + memberData.accrued + shareValue;
    const totalLiabilities = memberData.loanOutstanding + memberData.penalInterest + memberData.otherLiabilities;
    const netRefund = totalAssets - totalLiabilities;
    const canExit = netRefund >= 0;

    const handleSubmit = async () => {
        setSubmitting(true);
        await new Promise(r => setTimeout(r, 1800));
        setSubmitting(false);
        setDone(true);
    };

    if (done) {
        return (
            <div className="max-w-lg mx-auto text-center py-12 space-y-6">
                <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mx-auto">
                    <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold">Exit Application Submitted</h2>
                <div className="p-4 rounded-lg border border-border text-left text-sm space-y-2">
                    <div className="flex justify-between"><span className="text-muted-foreground">Member</span><span className="font-medium">{memberData.name}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Net Refund</span><span className="font-bold text-primary">{formatCurrency(netRefund)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Status</span><Badge className="bg-amber-100 text-amber-800">PENDING APPROVAL</Badge></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Processing</span><span>Within 30 days (as per bye-laws)</span></div>
                </div>
                <p className="text-sm text-muted-foreground">Secretary → President approval required. Refund processed after final approval.</p>
                <Button onClick={() => router.back()}>Back to Member Profile</Button>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-xl mx-auto">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="w-4 h-4" /></Button>
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2"><UserX className="w-6 h-6" /> Member Exit & Share Refund</h1>
                    <p className="text-muted-foreground text-sm">{memberData.name} — {memberData.memberId}</p>
                </div>
            </div>

            {/* Progress */}
            <div className="flex items-center gap-2">
                {STEPS.map((s, i) => (
                    <React.Fragment key={s}>
                        <div className={`flex items-center gap-1.5 text-xs font-medium ${i === step ? 'text-primary' : i < step ? 'text-green-600' : 'text-muted-foreground'}`}>
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${i === step ? 'bg-primary text-primary-foreground' : i < step ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'}`}>
                                {i < step ? '✓' : i + 1}
                            </div>
                            <span className="hidden sm:block">{s}</span>
                        </div>
                        {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 ${i < step ? 'bg-green-400' : 'bg-muted'}`} />}
                    </React.Fragment>
                ))}
            </div>

            <Card>
                <CardContent className="pt-5 space-y-4">
                    {/* Step 0 — Resignation Details */}
                    {step === 0 && (
                        <>
                            <Alert><AlertDescription className="text-xs">Member resignation is voluntary. Death & Expulsion have separate workflows. The member must have no pending obligations to proceed.</AlertDescription></Alert>
                            <div>
                                <label className="text-sm font-medium">Reason for Resignation *</label>
                                <Textarea className="mt-1" rows={3} value={reason} onChange={e => setReason(e.target.value)} placeholder="State the reason for voluntary resignation..." />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Resignation Letter</label>
                                <div className={`mt-1 border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${letterUploaded ? 'border-green-400 bg-green-50 dark:bg-green-950' : 'border-border hover:border-primary/50'}`} onClick={() => setLetterUploaded(true)}>
                                    {letterUploaded ? (
                                        <div className="flex items-center justify-center gap-2 text-green-600"><CheckCircle className="w-5 h-5" /><span className="text-sm font-medium">resignation_letter.pdf uploaded</span></div>
                                    ) : (
                                        <div className="space-y-1"><Upload className="w-8 h-8 text-muted-foreground mx-auto" /><p className="text-sm text-muted-foreground">Click to upload resignation letter (PDF)</p></div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}

                    {/* Step 1 — Dues Calculation */}
                    {step === 1 && (
                        <>
                            <p className="text-sm font-semibold">Assets</p>
                            <div className="rounded-lg border border-border divide-y divide-border text-sm overflow-hidden">
                                {[['SB Account Balance', memberData.sbBalance], ['FD Balance', memberData.fdBalance], ['Accrued Interest', memberData.accrued], [`Shares (${memberData.shares} × ₹${memberData.shareNominalValue})`, shareValue]].map(([k, v]) => (
                                    <div key={String(k)} className="flex justify-between p-3"><span className="text-muted-foreground">{k}</span><span className="text-green-600 font-medium">{formatCurrency(Number(v))}</span></div>
                                ))}
                                <div className="flex justify-between p-3 bg-green-50 dark:bg-green-950 font-bold"><span>Total Assets</span><span className="text-green-700">{formatCurrency(totalAssets)}</span></div>
                            </div>
                            <p className="text-sm font-semibold mt-2">Liabilities</p>
                            <div className="rounded-lg border border-border divide-y divide-border text-sm overflow-hidden">
                                {[['Loan Outstanding', memberData.loanOutstanding], ['Penal Interest', memberData.penalInterest], ['Other Liabilities', memberData.otherLiabilities]].map(([k, v]) => (
                                    <div key={String(k)} className="flex justify-between p-3"><span className="text-muted-foreground">{k}</span><span className="text-red-500 font-medium">{formatCurrency(Number(v))}</span></div>
                                ))}
                                <div className="flex justify-between p-3 bg-red-50 dark:bg-red-950 font-bold"><span>Total Liabilities</span><span className="text-red-600">{formatCurrency(totalLiabilities)}</span></div>
                            </div>
                            {!canExit && (
                                <Alert className="border-red-200 bg-red-50 dark:bg-red-950">
                                    <AlertTriangle className="h-4 w-4 text-red-600" />
                                    <AlertDescription className="text-red-700 text-sm">Net refund is negative. Member must clear outstanding dues before exit can be processed.</AlertDescription>
                                </Alert>
                            )}
                        </>
                    )}

                    {/* Step 2 — Net Refund Summary */}
                    {step === 2 && (
                        <>
                            <div className={`p-6 rounded-xl text-center border-2 ${canExit ? 'border-green-300 bg-green-50 dark:bg-green-950' : 'border-red-300 bg-red-50 dark:bg-red-950'}`}>
                                <p className="text-sm text-muted-foreground">Net Refund Payable</p>
                                <p className={`text-4xl font-bold mt-2 ${canExit ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(netRefund)}</p>
                                <p className="text-xs text-muted-foreground mt-2">To be credited to member's savings bank account on approval</p>
                            </div>
                            <div className="text-sm space-y-2 text-muted-foreground">
                                <div className="flex justify-between"><span>Total Assets</span><span className="text-green-600 font-medium">{formatCurrency(totalAssets)}</span></div>
                                <div className="flex justify-between"><span>Less: Liabilities</span><span className="text-red-500 font-medium">- {formatCurrency(totalLiabilities)}</span></div>
                                <div className="flex justify-between font-bold text-foreground border-t border-border pt-2"><span>Net Payable</span><span>{formatCurrency(netRefund)}</span></div>
                            </div>
                            <Alert><AlertDescription className="text-xs">GL entries will be auto-posted on final approval: DR Share Capital, DR SB/FD Accounts, CR Cash/Bank. Share ledger will be updated. Member status will be set to RESIGNED.</AlertDescription></Alert>
                        </>
                    )}

                    {/* Step 3 — Approval */}
                    {step === 3 && (
                        <>
                            <Alert><AlertDescription className="text-sm">This application will be routed to <strong>Secretary → President</strong> for approval. Refund will be processed within 30 days of final approval (per bye-laws).</AlertDescription></Alert>
                            <div><label className="text-sm font-medium">Secretary's Note</label><Textarea className="mt-1" rows={2} value={approvalNote} onChange={e => setApprovalNote(e.target.value)} placeholder="Optional note to approvers..." /></div>
                            <div className="p-3 rounded-lg bg-muted/40 text-sm space-y-1 border border-border">
                                <p className="font-semibold">Summary</p>
                                <div className="flex justify-between"><span className="text-muted-foreground">Member</span><span>{memberData.name}</span></div>
                                <div className="flex justify-between"><span className="text-muted-foreground">Resignation Reason</span><span className="truncate max-w-[200px]">{reason}</span></div>
                                <div className="flex justify-between"><span className="text-muted-foreground">Net Refund</span><span className="font-bold text-primary">{formatCurrency(netRefund)}</span></div>
                            </div>
                        </>
                    )}

                    {/* Navigation */}
                    <div className="flex justify-between pt-3 border-t border-border">
                        <Button variant="outline" onClick={() => step > 0 ? setStep(s => s - 1) : router.back()}>
                            <ArrowLeft className="w-4 h-4 mr-2" />{step === 0 ? 'Cancel' : 'Back'}
                        </Button>
                        {step < 3 ? (
                            <Button onClick={() => setStep(s => s + 1)} disabled={step === 0 && (!reason || !letterUploaded) || (step === 1 && !canExit)}>
                                Next <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        ) : (
                            <Button onClick={handleSubmit} disabled={submitting}>
                                {submitting ? 'Submitting...' : 'Submit for Approval'}
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
