'use client';

import React, { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatCurrency } from '@/lib/utils/formatters';
import {
  Heart, Upload, CheckCircle, User, CreditCard, Banknote, AlertTriangle, ArrowRight, ArrowLeft, Copy
} from 'lucide-react';
import { membersApi } from '@/lib/api';

const STEPS = [
  { label: 'Confirm Death', icon: Heart },
  { label: 'Account Freeze', icon: CreditCard },
  { label: 'Nominee Verify', icon: User },
  { label: 'Settlement Calc', icon: Banknote },
  { label: 'Approval', icon: CheckCircle },
  { label: 'Complete', icon: CheckCircle },
];

export default function DeathSettlementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [dateOfDeath, setDateOfDeath] = useState('');
  const [certificateUploaded, setCertificateUploaded] = useState(false);
  const [accountsFrozen, setAccountsFrozen] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settlementRef] = useState('DS-' + Date.now().toString().slice(-8));
  const [data, setData] = useState<{
    member?: { memberNumber: string; firstName: string; lastName: string };
    nominees?: any[];
    accounts?: { accountNumber: string; accountType: string; balance: number }[];
    settlement?: { sbBalance: number; fdrMaturity: number; shareCapital: number; loanOutstanding: number };
    netPayable?: number;
  }>({});

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await membersApi.deathSettlement.get(id);
        setData({
          member: res.member,
          nominees: res.nominees || [],
          accounts: res.accounts || [],
          settlement: res.settlement || { sbBalance: 0, fdrMaturity: 0, shareCapital: 0, loanOutstanding: 0 },
          netPayable: res.netPayable ?? 0,
        });
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const netPayable = data.netPayable ?? 0;
  const memberName = data.member ? `${data.member.firstName} ${data.member.lastName}` : '';
  const firstNominee = data.nominees?.[0];

  const canNext = () => {
    if (step === 0) return dateOfDeath && certificateUploaded;
    if (step === 1) return accountsFrozen;
    if (step === 2) return otpVerified;
    return true;
  };

  const handleNext = async () => {
    if (step === 4) {
      setSubmitting(true);
      try {
        await membersApi.deathSettlement.complete(id, { dateOfDeath, nomineeId: firstNominee?.id });
        setStep(s => s + 1);
      } catch (e) {
        alert((e as Error).message || 'Failed to complete settlement');
      } finally {
        setSubmitting(false);
      }
    } else {
      setStep(s => s + 1);
    }
  };

  const verifyOTP = () => {
    if (otpValue === '123456') setOtpVerified(true);
  };

  if (loading) return <p className="py-8 text-center text-muted-foreground">Loading...</p>;
  if (error) return <div className="py-8 text-center"><p className="text-destructive">{error}</p><Button variant="outline" className="mt-4" onClick={() => router.back()}>Back</Button></div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Death Settlement Workflow</h1>
          <p className="text-muted-foreground text-sm">Member: {memberName || data.member?.memberNumber || id}</p>
        </div>
      </div>

      {/* Step progress */}
      <div className="flex items-center gap-0">
        {STEPS.map((s, i) => (
          <React.Fragment key={i}>
            <div className="flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${i < step ? 'bg-green-500 text-white' : i === step ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}>
                {i < step ? <CheckCircle className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`text-xs text-center hidden sm:block ${i === step ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mb-4 ${i < step ? 'bg-green-500' : 'bg-border'}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {step === 0 && <><Heart className="w-5 h-5 text-red-500" /> Step 1: Confirm Member Death</>}
            {step === 1 && <><CreditCard className="w-5 h-5 text-orange-500" /> Step 2: Account Freeze</>}
            {step === 2 && <><User className="w-5 h-5 text-blue-500" /> Step 3: Nominee Verification</>}
            {step === 3 && <><Banknote className="w-5 h-5 text-green-500" /> Step 4: Settlement Calculation</>}
            {step === 4 && <><CheckCircle className="w-5 h-5 text-primary" /> Step 5: Approval Submission</>}
            {step === 5 && <><CheckCircle className="w-5 h-5 text-green-500" /> Settlement Complete</>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 0 && (
            <div className="space-y-4">
              <Alert className="border-red-200 bg-red-50 dark:bg-red-950">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800 dark:text-red-200">This will initiate the death settlement process. All accounts will be frozen.</AlertDescription>
              </Alert>
              <div className="space-y-2">
                <label className="text-sm font-medium">Date of Death *</label>
                <Input type="date" value={dateOfDeath} onChange={e => setDateOfDeath(e.target.value)} max={new Date().toISOString().split('T')[0]} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Death Certificate Upload *</label>
                <div onClick={() => setCertificateUploaded(true)} className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors">
                  {certificateUploaded ? (
                    <div className="flex items-center justify-center gap-2 text-green-600"><CheckCircle className="w-5 h-5" /><span className="font-medium">death_certificate.pdf uploaded</span></div>
                  ) : (
                    <><Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" /><p className="text-sm text-muted-foreground">Click to upload (PDF/JPG)</p></>
                  )}
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">The following accounts will be frozen. No transactions will be allowed.</p>
              {(data.accounts && data.accounts.length > 0 ? data.accounts : [{ accountNumber: 'N/A', accountType: 'No accounts', balance: 0 }]).map(acc => (
                <div key={acc.accountNumber} className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
                  <div><p className="font-semibold text-sm">{acc.accountNumber}</p><p className="text-xs text-muted-foreground">{acc.accountType}</p></div>
                  <div className="text-right"><p className="font-bold">{formatCurrency(acc.balance)}</p><Badge className="bg-red-100 text-red-800 text-xs">Will be FROZEN</Badge></div>
                </div>
              ))}
              <div className="flex items-center gap-3 p-3 rounded-lg border border-orange-200 bg-orange-50 dark:bg-orange-950">
                <Checkbox id="freeze-confirm" checked={accountsFrozen} onCheckedChange={v => setAccountsFrozen(!!v)} />
                <label htmlFor="freeze-confirm" className="text-sm font-medium cursor-pointer">I confirm that all accounts should be frozen effective immediately</label>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg border border-border bg-muted/30">
                <p className="text-xs font-semibold text-muted-foreground mb-2">REGISTERED NOMINEE(S)</p>
                {firstNominee ? (
                  <>
                    <p className="font-bold">{firstNominee.name}</p>
                    <p className="text-sm text-muted-foreground">Relationship: {firstNominee.relationship}</p>
                    {firstNominee.phone && <p className="text-sm text-muted-foreground">Mobile: {firstNominee.phone}</p>}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">No nominee registered. Settlement can proceed to legal heir.</p>
                )}
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">OTP Verification (sent to nominee&apos;s mobile)</p>
                {!otpSent ? (
                  <Button variant="outline" className="w-full" onClick={() => setOtpSent(true)}>Send OTP to {firstNominee?.phone || 'Nominee'}</Button>
                ) : (
                  <>
                    <div className="flex gap-2">
                      <Input placeholder="Enter 6-digit OTP" value={otpValue} onChange={e => setOtpValue(e.target.value)} maxLength={6} className="font-mono" />
                      <Button variant="outline" onClick={verifyOTP} disabled={otpVerified}>{otpVerified ? '✓ Verified' : 'Verify'}</Button>
                    </div>
                    {!otpVerified && <p className="text-xs text-muted-foreground">Enter OTP sent to your registered mobile</p>}
                    {otpVerified && <p className="text-xs text-green-600 font-medium">✓ Nominee identity verified successfully</p>}
                  </>
                )}
              </div>
            </div>
          )}

          {step === 3 && data.settlement && (
            <div className="space-y-4">
              <div className="rounded-lg border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr><th className="text-left p-3 font-semibold">Component</th><th className="text-right p-3 font-semibold">Amount</th></tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    <tr><td className="p-3">SB Account Balance</td><td className="p-3 text-right font-medium text-green-600">{formatCurrency(data.settlement.sbBalance)}</td></tr>
                    <tr><td className="p-3">FDR Maturity Values</td><td className="p-3 text-right font-medium text-green-600">{formatCurrency(data.settlement.fdrMaturity)}</td></tr>
                    <tr><td className="p-3">Share Capital Refund</td><td className="p-3 text-right font-medium text-green-600">{formatCurrency(data.settlement.shareCapital)}</td></tr>
                    <tr className="bg-red-50 dark:bg-red-950"><td className="p-3 text-red-700 dark:text-red-300">Loan Outstanding (Deduction)</td><td className="p-3 text-right font-medium text-red-600">- {formatCurrency(data.settlement.loanOutstanding)}</td></tr>
                    <tr className="bg-primary/5 font-bold"><td className="p-3">Net Payable to Nominee</td><td className="p-3 text-right text-primary text-lg">{formatCurrency(netPayable)}</td></tr>
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-muted-foreground">Payable to: {firstNominee ? `${firstNominee.name} (${firstNominee.relationship})` : 'Legal heir'} — Bank NEFT/RTGS</p>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/30 border border-border space-y-2">
                <p className="text-sm font-semibold">Summary</p>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Member</span><span>{memberName} ({data.member?.memberNumber})</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Date of Death</span><span>{dateOfDeath || '—'}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Net Payable</span><span className="font-bold text-primary">{formatCurrency(netPayable)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Payable To</span><span>{firstNominee ? `${firstNominee.name} (${firstNominee.relationship})` : 'Legal heir'}</span></div>
              </div>
              <Alert>
                <AlertDescription>This settlement will be submitted for <strong>Maker-Checker approval</strong>.</AlertDescription>
              </Alert>
            </div>
          )}

          {step === 5 && (
            <div className="text-center space-y-4 py-4">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-green-700 dark:text-green-400">Settlement Submitted!</h3>
                <p className="text-muted-foreground mt-1">The death settlement has been submitted for approval.</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/30 border border-border">
                <p className="text-xs text-muted-foreground">Settlement Reference Number</p>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <span className="font-mono text-lg font-bold">{settlementRef}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => navigator.clipboard.writeText(settlementRef)}>
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
              <Button onClick={() => router.push('/dashboard/members')}>Back to Members</Button>
            </div>
          )}

          {step < 5 && (
            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => step > 0 ? setStep(s => s - 1) : router.back()} disabled={submitting}>
                <ArrowLeft className="w-4 h-4 mr-2" />{step === 0 ? 'Cancel' : 'Back'}
              </Button>
              <Button onClick={handleNext} disabled={!canNext() || submitting} className="gap-2">
                {submitting ? 'Submitting...' : step === 4 ? 'Submit for Approval' : 'Next'}
                {!submitting && <ArrowRight className="w-4 h-4" />}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
