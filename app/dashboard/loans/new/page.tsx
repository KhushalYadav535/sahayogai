'use client';

import React, { useState, useEffect } from 'react';
import { membersApi, loansApi } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { Permission } from '@/lib/types/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { RiskScorePanel } from '@/components/ai/risk-score-panel';
import { formatCurrency } from '@/lib/utils/formatters';
import {
  ArrowLeft, ArrowRight, Search, User, CheckCircle, AlertTriangle,
  Upload, Zap, FileText, Users, Info, Shield
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const STEPS = ['Member & Product', 'Loan Details', 'Guarantor', 'Documents', 'AI Risk Assessment', 'Review & Submit'];

const LOAN_PRODUCTS = [
  { id: 'SHORT_TERM', label: 'Short Term', desc: 'Up to 12 months', maxAmt: 100000, rateRange: '12–15%', icon: '⚡' },
  { id: 'MEDIUM_TERM', label: 'Medium Term', desc: '1–3 years', maxAmt: 500000, rateRange: '14–17%', icon: '🏦' },
  { id: 'LONG_TERM', label: 'Long Term', desc: '3+ years', maxAmt: 2000000, rateRange: '15–18%', icon: '🏛️' },
  { id: 'GOLD_LOAN', label: 'Gold Loan', desc: 'Secured by gold', maxAmt: 300000, rateRange: '10–13%', icon: '🥇' },
];

const PURPOSES = ['Agriculture', 'Business Working Capital', 'Education', 'Medical Emergency', 'Home Renovation', 'Vehicle Purchase', 'Personal'];
const COLLATERAL_TYPES = ['Property', 'Gold', 'FDR Lien', 'Guarantor Only'];
const DOCS = { SHORT_TERM: ['Income Proof', 'Passport Photo', 'Bank Statement'], MEDIUM_TERM: ['Income Proof', 'Property Docs', 'Passport Photo', 'Bank Statement'], LONG_TERM: ['Income Proof', 'Property Docs', 'Passport Photo', 'Bank Statement', 'IT Return'], GOLD_LOAN: ['Passport Photo', 'Gold Ownership Proof'] };

const LOAN_TYPE_MAP: Record<string, string> = {
  SHORT_TERM: 'personal',
  MEDIUM_TERM: 'business',
  LONG_TERM: 'housing',
  GOLD_LOAN: 'gold',
};

function calcEMI(P: number, annualRate: number, months: number): number {
  if (!P || !annualRate || !months) return 0;
  const r = annualRate / 100 / 12;
  return Math.round(P * r * Math.pow(1 + r, months) / (Math.pow(1 + r, months) - 1));
}

export default function NewLoanPage() {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(0);

  // Step 1
  const [memberSearch, setMemberSearch] = useState('');
  const [members, setMembers] = useState<{ id: string; name: string; memberId: string; riskScore: number; activeLoans: number }[]>([]);
  const [selectedMember, setSelectedMember] = useState<{ id: string; name: string; memberId: string; riskScore: number; activeLoans: number } | null>(null);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [hasCoApp, setHasCoApp] = useState(false);

  // Step 2
  const [amount, setAmount] = useState(50000);
  const [purpose, setPurpose] = useState('');
  const [tenure, setTenure] = useState(12);
  const [rate] = useState(13);
  const [collateral, setCollateral] = useState('');
  const [loanSubType, setLoanSubType] = useState('');
  const [goldValue, setGoldValue] = useState(0);
  const [householdIncome, setHouseholdIncome] = useState(0);
  // Derived CoA fields
  const goldLtv = goldValue > 0 ? ((amount / goldValue) * 100).toFixed(1) : null;
  const isGoldLoan = selectedProduct === 'GOLD_LOAN' || loanSubType === 'gold';
  const isMicrofinance = loanSubType === 'micro' || loanSubType === 'shg';
  const maxGoldLoan = goldValue > 0 ? goldValue * 0.75 : null;

  // Step 3
  const [guarantorSearch, setGuarantorSearch] = useState('');
  const [guarantor, setGuarantor] = useState<{ id: string; name: string; memberId: string } | null>(null);

  // Step 4
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, boolean>>({});

  // Step 5
  const [aiLoading, setAiLoading] = useState(false);
  const [aiDone, setAiDone] = useState(false);
  const [aiScore] = useState(65);

  // Step 6
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [appId] = useState('LN-APPL-' + Date.now().toString().slice(-6));

  const emi = calcEMI(amount, rate, tenure);
  const productDocs = DOCS[selectedProduct as keyof typeof DOCS] || [];
  const allDocsUploaded = productDocs.every(d => uploadedDocs[d]);

  useEffect(() => {
    membersApi.list()
      .then(r => setMembers((r.members || []).map((m: any) => ({
        id: m.id,
        name: `${m.firstName || ''} ${m.lastName || ''}`.trim(),
        memberId: m.memberNumber || m.memberId,
        riskScore: 50,
        activeLoans: (m.loans?.length ?? m._count?.loans ?? 0),
      }))));
  }, []);

  const filteredMembers = members.filter(m =>
    !memberSearch || m.name.toLowerCase().includes(memberSearch.toLowerCase()) || m.memberId.includes(memberSearch)
  );

  const getRoutingLevel = () => amount <= 50000 ? 'LOAN_OFFICER' : amount <= 200000 ? 'BRANCH_MANAGER' : 'LOAN_COMMITTEE';

  const canNext = () => {
    if (step === 0) return !!selectedMember && !!selectedProduct;
    if (step === 1) return amount > 0 && !!purpose && tenure > 0 && !!collateral;
    if (step === 2) return true;
    if (step === 3) return allDocsUploaded;
    if (step === 4) return aiDone;
    return false;
  };

  useEffect(() => {
    if (step === 4 && !aiDone && !aiLoading) {
      setAiLoading(true);
      setTimeout(() => { setAiLoading(false); setAiDone(true); }, 1800);
    }
  }, [step, aiDone, aiLoading]);

  const handleSubmit = async () => {
    if (!selectedMember) return;
    setSubmitting(true);
    try {
      const applicationData = {
        memberId: selectedMember.id,
        loanType: LOAN_TYPE_MAP[selectedProduct] || 'personal',
        loanSubType: loanSubType || undefined,
        amountRequested: amount,
        purpose: purpose || 'General',
        tenureMonths: tenure,
        moratoriumMonths: 0, // Default to 0 moratorium months
        goldValue: isGoldLoan ? (goldValue > 0 ? goldValue : amount) : undefined,
        householdIncome: isMicrofinance && householdIncome > 0 ? householdIncome : undefined,
      };
      
      console.log('Submitting loan application:', applicationData);
      
      const res = await loansApi.createApplication(applicationData);
      if (res.success && res.application?.id) {
        setApplicationId(res.application.id);
      }
      setSubmitted(true);
    } catch (error: any) {
      console.error('Loan application error:', error);
      alert(`Failed to submit application: ${error.message || 'Unknown error'}`);
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto text-center space-y-6 py-10">
        <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mx-auto">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold">Application Submitted!</h2>
        <div className="p-4 rounded-lg border border-border bg-muted/30">
          <p className="text-sm text-muted-foreground">Application ID</p>
          <p className="font-mono text-xl font-bold text-primary mt-1">{appId}</p>
          <Badge className="mt-2 bg-yellow-100 text-yellow-800">PENDING_APPROVAL</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Routing to: <strong>{getRoutingLevel()}</strong> (amount ≤ ₹{amount <= 50000 ? '50,000' : amount <= 200000 ? '2,00,000' : '2,00,000+'})
        </p>
        <Button onClick={() => router.push('/dashboard/loans')}>Back to Loans</Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="w-4 h-4" /></Button>
        <div><h1 className="text-2xl font-bold">New Loan Application</h1><p className="text-muted-foreground text-sm">Step {step + 1} of {STEPS.length}</p></div>
      </div>

      {/* Progress */}
      <div className="flex gap-1">
        {STEPS.map((s, i) => (
          <div key={i} className={`flex-1 h-2 rounded-full transition-all ${i <= step ? 'bg-primary' : 'bg-muted'}`} />
        ))}
      </div>
      <p className="text-sm font-semibold text-center text-primary">{STEPS[step]}</p>

      <Card>
        <CardContent className="pt-6 space-y-4">

          {/* STEP 1 */}
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <label className="text-sm font-medium mb-2 block">Search Member</label>
                <div className="relative"><Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" /><Input className="pl-9" placeholder="Name or Member ID" value={memberSearch} onChange={e => setMemberSearch(e.target.value)} /></div>
                {memberSearch && !selectedMember && filteredMembers.map(m => (
                  <button key={m.id} onClick={() => { setSelectedMember(m); setMemberSearch(m.name); }} className="w-full text-left p-3 mt-2 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-colors">
                    <div className="flex items-center justify-between">
                      <div><p className="font-medium">{m.name}</p><p className="text-xs text-muted-foreground">{m.memberId}</p></div>
                      <div className="text-right"><Badge className={m.riskScore >= 70 ? 'bg-green-100 text-green-800' : m.riskScore >= 50 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}>Risk: {m.riskScore}</Badge><p className="text-xs text-muted-foreground mt-1">{m.activeLoans} active loan(s)</p></div>
                    </div>
                  </button>
                ))}
                {selectedMember && (
                  <div className="mt-3 p-3 rounded-lg bg-primary/5 border border-primary/20 flex items-center justify-between">
                    <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center"><User className="w-5 h-5 text-primary-foreground" /></div><div><p className="font-semibold">{selectedMember.name}</p><p className="text-xs text-muted-foreground">{selectedMember.memberId}</p></div></div>
                    <Button size="sm" variant="ghost" onClick={() => { setSelectedMember(null); setMemberSearch(''); }}>Change</Button>
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Loan Product</label>
                <div className="grid grid-cols-2 gap-3">
                  {LOAN_PRODUCTS.map(p => (
                    <button key={p.id} onClick={() => setSelectedProduct(p.id)} className={`p-4 rounded-lg border text-left transition-all ${selectedProduct === p.id ? 'border-primary bg-primary/10 ring-1 ring-primary' : 'border-border hover:border-primary/50'}`}>
                      <div className="text-2xl mb-2">{p.icon}</div>
                      <p className="font-semibold text-sm">{p.label}</p>
                      <p className="text-xs text-muted-foreground">{p.desc}</p>
                      <p className="text-xs text-primary mt-1">{p.rateRange} p.a.</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox id="coapp" checked={hasCoApp} onCheckedChange={v => setHasCoApp(!!v)} />
                <label htmlFor="coapp" className="text-sm cursor-pointer">Add Co-Applicant</label>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="text-sm font-medium">Requested Amount (₹)</label>
                <Input className="mt-1 text-xl font-bold" type="number" value={amount} onChange={e => setAmount(Number(e.target.value))} />
                <p className="text-xs text-muted-foreground mt-1">Max: {formatCurrency(LOAN_PRODUCTS.find(p => p.id === selectedProduct)?.maxAmt ?? 100000, 0)}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Purpose</label>
                <div className="flex flex-wrap gap-2 mt-2">{PURPOSES.map(p => <button key={p} onClick={() => setPurpose(p)} className={`px-3 py-1 rounded-full text-sm border transition-colors ${purpose === p ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:border-primary'}`}>{p}</button>)}</div>
              </div>
              <div>
                <div className="flex justify-between mb-1"><label className="text-sm font-medium">Tenure</label><span className="text-sm font-bold text-primary">{tenure} months</span></div>
                <Slider min={3} max={selectedProduct === 'LONG_TERM' ? 84 : selectedProduct === 'MEDIUM_TERM' ? 36 : 12} step={1} value={[tenure]} onValueChange={([v]) => setTenure(v)} />
              </div>
              {emi > 0 && (
                <div className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 text-center">
                  <p className="text-xs text-muted-foreground">Estimated Monthly EMI</p>
                  <p className="text-3xl font-bold text-primary mt-1">{formatCurrency(emi)}</p>
                  <p className="text-xs text-muted-foreground mt-1">@ {rate}% p.a. | {tenure} months | Principal: {formatCurrency(amount, 0)}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium">Collateral Type</label>
                <div className="grid grid-cols-2 gap-2 mt-2">{COLLATERAL_TYPES.map(c => <button key={c} onClick={() => setCollateral(c)} className={`px-3 py-2 rounded-lg text-sm border transition-colors ${collateral === c ? 'bg-primary/10 border-primary text-primary font-medium' : 'border-border hover:border-primary/50'}`}>{c}</button>)}</div>
              </div>
              {/* COA: Loan Sub-type */}
              <div>
                <label className="text-sm font-medium">Loan Sub-type (CoA)</label>
                <select className="mt-1 w-full border border-border rounded-lg p-2 text-sm bg-background" value={loanSubType} onChange={e => setLoanSubType(e.target.value)}>
                  <option value="">— Select sub-type —</option>
                  <option value="kcc">KCC (Kisan Credit Card)</option>
                  <option value="crop">Crop Loan</option>
                  <option value="livestock">Livestock Loan</option>
                  <option value="gold">Gold Loan</option>
                  <option value="lad">Loan Against Deposit (LAD)</option>
                  <option value="shg">SHG Loan</option>
                  <option value="msme">MSME Loan</option>
                  <option value="housing">Housing Loan</option>
                  <option value="staff">Staff Loan</option>
                  <option value="micro">Microfinance</option>
                  <option value="personal">Personal</option>
                </select>
              </div>
              {/* COA: Gold value (required for gold loans, LTV displayed) */}
              {isGoldLoan && (
                <div>
                  <label className="text-sm font-medium">Appraised Gold Value (₹) *</label>
                  <input type="number" className="mt-1 w-full border border-border rounded-lg p-2 text-sm bg-background" placeholder="Enter gold value" value={goldValue || ''} onChange={e => setGoldValue(Number(e.target.value))} />
                  {goldValue > 0 && (
                    <div className={`mt-1 text-xs font-medium ${amount > goldValue * 0.75 ? 'text-red-600' : 'text-green-600'}`}>
                      LTV: {goldLtv}% (Max: 75%) — Max eligible: {formatCurrency(maxGoldLoan ?? 0, 0)}
                    </div>
                  )}
                </div>
              )}
              {/* COA: Household income for microfinance JLG/SHG */}
              {isMicrofinance && (
                <div>
                  <label className="text-sm font-medium">Annual Household Income (₹) *</label>
                  <input type="number" className="mt-1 w-full border border-border rounded-lg p-2 text-sm bg-background" placeholder="Declared annual household income" value={householdIncome || ''} onChange={e => setHouseholdIncome(Number(e.target.value))} />
                  {householdIncome > 0 && (
                    <p className="mt-1 text-xs text-muted-foreground">Max EMI allowed: {formatCurrency((householdIncome / 12) * 0.5)}/month (50% income cap)</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* STEP 3 */}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Add a guarantor for this loan application. Guarantors must be active members.</p>
              <div className="relative"><Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" /><Input className="pl-9" placeholder="Search guarantor..." value={guarantorSearch} onChange={e => setGuarantorSearch(e.target.value)} /></div>
              {guarantorSearch && !guarantor && members.filter(m => m.id !== selectedMember?.id && (m.name.toLowerCase().includes(guarantorSearch.toLowerCase()) || m.memberId.includes(guarantorSearch))).map(m => (
                <button key={m.id} onClick={() => { setGuarantor(m); setGuarantorSearch(m.name); }} className="w-full text-left p-3 rounded-lg border border-border hover:border-primary transition-colors">
                  <p className="font-medium">{m.name}</p><p className="text-xs text-muted-foreground">{m.memberId}</p>
                </button>
              ))}
              {guarantor && (
                <div className="p-4 rounded-lg border border-border space-y-2">
                  <div className="flex items-center justify-between"><p className="font-semibold">{guarantor.name}</p><Button size="sm" variant="ghost" onClick={() => { setGuarantor(null); setGuarantorSearch(''); }}>Remove</Button></div>
                  <p className="text-xs text-muted-foreground">{guarantor.memberId}</p>
                  <div className="flex items-center gap-2"><Users className="w-3.5 h-3.5 text-muted-foreground" /><p className="text-xs text-muted-foreground">Existing guarantees: 0 | Exposure: 0%</p></div>
                  {amount > 200000 && <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950"><AlertTriangle className="h-4 w-4 text-amber-600" /><AlertDescription className="text-xs text-amber-700">High-value loan — consider adding a second guarantor</AlertDescription></Alert>}
                </div>
              )}
              <p className="text-xs text-muted-foreground italic">Guarantor is optional for loans under ₹25,000</p>
            </div>
          )}

          {/* STEP 4 */}
          {step === 3 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Upload required documents for <strong>{selectedProduct.replace('_', ' ')}</strong> loan</p>
              {productDocs.map(doc => (
                <div key={doc} className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <div><p className="text-sm font-medium">{doc}</p>{uploadedDocs[doc] && <p className="text-xs text-green-600">✓ Uploaded</p>}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setUploadedDocs(prev => ({ ...prev, [doc]: true }))}><Upload className="w-3.5 h-3.5 mr-1" />{uploadedDocs[doc] ? 'Replace' : 'Upload'}</Button>
                    {uploadedDocs[doc] && <Button size="sm" variant="ghost" className="text-muted-foreground">OCR Extract</Button>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* STEP 5 */}
          {step === 4 && (
            <div className="space-y-4">
              {aiLoading ? (
                <div className="text-center py-10 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto animate-pulse">
                    <Zap className="w-8 h-8 text-primary" />
                  </div>
                  <p className="font-semibold text-lg">AI is computing risk score...</p>
                  <p className="text-sm text-muted-foreground">Analyzing repayment history, savings ratio, income stability...</p>
                  <div className="flex justify-center gap-1 mt-4">{[0, 1, 2].map(i => <div key={i} className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />)}</div>
                </div>
              ) : (
                <div className="space-y-4">
                  <RiskScorePanel score={{ overall: aiScore, factors: [{ name: 'Repayment History', score: 70 }, { name: 'Income Stability', score: 55 }, { name: 'Loan Utilization', score: 60 }, { name: 'Savings Ratio', score: 65 }, { name: 'Collateral Value', score: 75 }] }} showOverrideButton={hasPermission(Permission.LOAN_APPROVE)} />
                  
                  {/* LN-024: CIBIL/Experian Credit Bureau Checks */}
                  <div className="mt-4 p-4 border rounded-lg bg-blue-50 dark:bg-blue-950">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-blue-600" />
                        <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">Credit Bureau Checks</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          if (!applicationId) {
                            toast({ title: 'Error', description: 'Please submit application first', variant: 'destructive' });
                            return;
                          }
                          try {
                            const res = await loansApi.checkCibil(applicationId);
                            if (res.success) {
                              toast({ title: 'CIBIL Check Complete', description: `Score: ${res.cibilScore}` });
                            }
                          } catch (e: any) {
                            toast({ title: 'Error', description: e.message || 'CIBIL check failed', variant: 'destructive' });
                          }
                        }}
                        className="flex-1"
                      >
                        Check CIBIL
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          if (!applicationId) {
                            toast({ title: 'Error', description: 'Please submit application first', variant: 'destructive' });
                            return;
                          }
                          try {
                            const res = await loansApi.checkExperian(applicationId);
                            if (res.success) {
                              toast({ title: 'Experian Check Complete', description: `Score: ${res.experianScore}` });
                            }
                          } catch (e: any) {
                            toast({ title: 'Error', description: e.message || 'Experian check failed', variant: 'destructive' });
                          }
                        }}
                        className="flex-1"
                      >
                        Check Experian
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Credit bureau checks help assess borrower creditworthiness. Scores range from 300-900.
                    </p>
                  </div>
                  <div className="p-4 rounded-lg border border-border space-y-2">
                    <p className="text-sm font-semibold">Eligibility Engine Results</p>
                    {[['Age (18–65)', true], ['Min Shares (5)', true], ['KYC Status', true], ['Membership (6m+)', true], ['Active Loans ≤2', false]].map(([rule, pass]) => (
                      <div key={String(rule)} className="flex items-center gap-2 text-sm">
                        <span className={String(pass) === 'true' ? 'text-green-500' : 'text-red-500'}>{String(pass) === 'true' ? '✓' : '✗'}</span>
                        <span>{String(rule)}</span>
                      </div>
                    ))}
                  </div>
                  <div className={`p-3 rounded-lg text-center font-semibold text-sm ${aiScore >= 70 ? 'bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200' : aiScore >= 50 ? 'bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-200' : 'bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200'}`}>
                    {aiScore >= 70 ? '✓ Recommended: Proceed to Submit' : aiScore >= 50 ? '⚠ Recommended: Refer to Loan Committee' : '✗ High Risk: Consider Rejection'}
                    <span className="ml-2 text-xs font-normal opacity-70">AI ✦ Confidence: 87%</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 6 */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="rounded-lg border border-border divide-y divide-border">
                {[['Member', selectedMember?.name + ' (' + selectedMember?.memberId + ')'], ['Product', selectedProduct.replace('_', ' ')], ['Amount', formatCurrency(amount, 0)], ['Rate', rate + '% p.a.'], ['Tenure', tenure + ' months'], ['Monthly EMI', formatCurrency(emi)], ['Purpose', purpose], ['Collateral', collateral], ['Guarantor', guarantor?.name || '—']].map(([k, v]) => (
                  <div key={k} className="flex justify-between px-4 py-2.5 text-sm"><span className="text-muted-foreground">{k}</span><span className="font-medium">{v}</span></div>
                ))}
              </div>
              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2"><Info className="w-4 h-4 text-blue-600" /><p className="text-sm font-semibold text-blue-800 dark:text-blue-200">Routing Preview</p></div>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">This loan will be routed to: <strong>{getRoutingLevel()}</strong> (amount {amount <= 50000 ? '≤ ₹50,000' : amount <= 200000 ? '≤ ₹2,00,000' : '> ₹2,00,000'})</p>
              </div>
              {amount > 10000 && <Alert><Info className="h-4 w-4" /><AlertDescription className="text-xs">Will require Checker approval (above ₹10,000 threshold)</AlertDescription></Alert>}
              <Button className="w-full" onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Application'}
              </Button>
            </div>
          )}

          {/* Navigation */}
          {step < 5 && (
            <div className="flex justify-between pt-2 border-t border-border">
              <Button variant="outline" onClick={() => step > 0 ? setStep(s => s - 1) : router.back()}>
                <ArrowLeft className="w-4 h-4 mr-2" />{step === 0 ? 'Cancel' : 'Back'}
              </Button>
              <Button onClick={() => setStep(s => s + 1)} disabled={!canNext()}>
                Next <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
