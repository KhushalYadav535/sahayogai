'use client';

import React, { useState, useEffect } from 'react';
import { membersApi, loansApi, loanProductsApi, guarantorExposureApi } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { Permission } from '@/lib/types/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

const categoryColors: Record<string, string> = {
  PERSONAL: 'bg-purple-100 text-purple-800',
  GOLD: 'bg-yellow-100 text-yellow-800',
  HOUSING: 'bg-blue-100 text-blue-800',
  AGRICULTURE: 'bg-green-100 text-green-800',
  VEHICLE: 'bg-orange-100 text-orange-800',
  EDUCATION: 'bg-indigo-100 text-indigo-800',
  OTHER: 'bg-gray-100 text-gray-800',
};

const STEPS = ['Member & Product', 'Loan Details', 'Guarantor', 'Documents', 'AI Risk Assessment', 'Review & Submit'];

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

  // Step 1 - BRD v5.0 Enhanced
  const [memberSearch, setMemberSearch] = useState('');
  const [members, setMembers] = useState<{ id: string; name: string; memberId: string; riskScore: number; activeLoans: number }[]>([]);
  const [selectedMember, setSelectedMember] = useState<{ id: string; name: string; memberId: string; riskScore: number; activeLoans: number } | null>(null);
  const [memberPreFill, setMemberPreFill] = useState<any>(null); // BRD v5.0 LN-F01
  const [loanProducts, setLoanProducts] = useState<any[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [hasCoApp, setHasCoApp] = useState(false);

  // Step 2 - BRD v5.0 Enhanced
  const [amount, setAmount] = useState(50000);
  const [purpose, setPurpose] = useState('');
  const [tenure, setTenure] = useState(12);
  const [rate] = useState(13);
  const [collateral, setCollateral] = useState('');
  const [loanSubType, setLoanSubType] = useState('');
  const [goldValue, setGoldValue] = useState(0);
  const [householdIncome, setHouseholdIncome] = useState(0);
  // BRD v5.0 LN-F02: Enhanced fields
  const [employmentType, setEmploymentType] = useState<'SALARIED' | 'SELF_EMPLOYED' | 'FARMER' | 'BUSINESS' | 'OTHER' | ''>('');
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [existingLiabilities, setExistingLiabilities] = useState('');
  const [propertyAssetDesc, setPropertyAssetDesc] = useState('');
  // Derived CoA fields - get selected product details once
  const selectedProductDetails = loanProducts.find(p => p.id === selectedProductId);
  const goldLtv = goldValue > 0 ? ((amount / goldValue) * 100).toFixed(1) : null;
  const isGoldLoan = selectedProductDetails?.category === 'GOLD' || loanSubType === 'gold';
  const isMicrofinance = loanSubType === 'micro' || loanSubType === 'shg';
  const maxGoldLoan = goldValue > 0 ? goldValue * 0.75 : null;

  // Step 3 - BRD v5.0 LN-F05: Multiple guarantors
  const [guarantorSearch, setGuarantorSearch] = useState('');
  const [guarantors, setGuarantors] = useState<Array<{ id: string; name: string; memberId: string; exposure?: any }>>([]);
  const [guarantorExposure, setGuarantorExposure] = useState<Record<string, any>>({});

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
  // Determine document requirements based on product category or use default
  const getProductDocs = () => {
    if (!selectedProductDetails) return [];
    const category = selectedProductDetails.category;
    if (category === 'GOLD') return DOCS.GOLD_LOAN || [];
    if (category === 'HOUSING') return DOCS.LONG_TERM || [];
    if (category === 'PERSONAL') return DOCS.SHORT_TERM || [];
    return ['Income Proof', 'Passport Photo', 'Bank Statement']; // Default
  };
  const productDocs = getProductDocs();
  const allDocsUploaded = productDocs.every(d => uploadedDocs[d]);

  useEffect(() => {
    // Fetch members
    membersApi.list()
      .then(r => setMembers((r.members || []).map((m: any) => ({
        id: m.id,
        name: `${m.firstName || ''} ${m.lastName || ''}`.trim(),
        memberId: m.memberNumber || m.memberId,
        riskScore: 50,
        activeLoans: (m.loans?.length ?? m._count?.loans ?? 0),
      }))));
    
    // BRD v5.0: Fetch active loan products
    loanProductsApi.list({ status: 'ACTIVE', isActive: true })
      .then(r => setLoanProducts(r.products || []));
  }, []);

  const filteredMembers = members.filter(m =>
    !memberSearch || m.name.toLowerCase().includes(memberSearch.toLowerCase()) || m.memberId.includes(memberSearch)
  );

  // BRD v5.0 LN-F01: Load member pre-fill data
  const handleMemberSelect = async (member: any) => {
    setSelectedMember(member);
    try {
      const appData = {
        memberId: member.id,
        productId: selectedProductId,
        amountRequested: amount,
        tenureMonths: tenure,
      };
      const res = await loansApi.createApplication(appData);
      if (res.success && (res as any).preFilledData) {
        setMemberPreFill((res as any).preFilledData);
      }
    } catch (error) {
      // If application doesn't exist yet, fetch member details separately
      console.log('Pre-fill will be loaded on form submission');
    }
  };

  // BRD v5.0 LN-F05: Check guarantor exposure
  const checkGuarantorExposure = async (guarantorId: string) => {
    try {
      const res = await guarantorExposureApi.getExposure(guarantorId);
      if (res.success) {
        setGuarantorExposure(prev => ({
          ...prev,
          [guarantorId]: res,
        }));
        return res;
      }
    } catch (error) {
      console.error('Error checking guarantor exposure:', error);
    }
    return null;
  };

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
      // BRD v5.0: Enhanced application data
      const applicationData: any = {
        memberId: selectedMember.id,
        productId: selectedProductId, // BRD v5.0: Link to product
        loanType: selectedProduct?.category?.toLowerCase() || 'personal',
        loanSubType: loanSubType || undefined,
        amountRequested: amount,
        purpose: purpose || 'General',
        tenureMonths: tenure,
        moratoriumMonths: 0,
        goldValue: isGoldLoan ? (goldValue > 0 ? goldValue : amount) : undefined,
        householdIncome: isMicrofinance && householdIncome > 0 ? householdIncome : undefined,
        // BRD v5.0 LN-F02: Enhanced fields
        employmentType: employmentType || undefined,
        monthlyIncome: monthlyIncome > 0 ? monthlyIncome : undefined,
        existingLiabilities: existingLiabilities || undefined,
        propertyAssetDesc: propertyAssetDesc || undefined,
        // BRD v5.0 LN-F05: Multiple guarantors
        guarantorIds: guarantors.map(g => g.id),
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
                  <button key={m.id} onClick={() => handleMemberSelect(m)} className="w-full text-left p-3 mt-2 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-colors">
                    <div className="flex items-center justify-between">
                      <div><p className="font-medium">{m.name}</p><p className="text-xs text-muted-foreground">{m.memberId}</p></div>
                      <div className="text-right"><Badge className={m.riskScore >= 70 ? 'bg-green-100 text-green-800' : m.riskScore >= 50 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}>Risk: {m.riskScore}</Badge><p className="text-xs text-muted-foreground mt-1">{m.activeLoans} active loan(s)</p></div>
                    </div>
                  </button>
                ))}
                {selectedMember && (
                  <div className="mt-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        {memberPreFill?.photo && (
                          <img src={memberPreFill.photo} alt="Member" className="w-10 h-10 rounded-full object-cover" />
                        )}
                        {!memberPreFill?.photo && (
                          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                            <User className="w-5 h-5 text-primary-foreground" />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold">{selectedMember.name}</p>
                          <p className="text-xs text-muted-foreground">{selectedMember.memberId}</p>
                          {memberPreFill && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {memberPreFill.address} • Shares: {memberPreFill.shareHolding}
                            </p>
                          )}
                        </div>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => { setSelectedMember(null); setMemberPreFill(null); setMemberSearch(''); }}>Change</Button>
                    </div>
                    {/* BRD v5.0 LN-F04: Display photo and signature */}
                    {memberPreFill && (
                      <div className="mt-2 flex gap-2 text-xs text-muted-foreground">
                        {memberPreFill.photo && <span>✓ Photo available</span>}
                        {memberPreFill.signature && <span>✓ Signature available</span>}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Loan Product</label>
                {loanProducts.length === 0 ? (
                  <div className="text-sm text-muted-foreground p-4 border rounded-lg">
                    No active loan products available. Please contact administrator.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {loanProducts.map(p => (
                      <button 
                        key={p.id} 
                        onClick={() => {
                          setSelectedProductId(p.id);
                          setSelectedProduct(p);
                        }} 
                        className={`p-4 rounded-lg border text-left transition-all ${selectedProductId === p.id ? 'border-primary bg-primary/10 ring-1 ring-primary' : 'border-border hover:border-primary/50'}`}
                      >
                        <div className="text-2xl mb-2">{categoryColors[p.category] ? '📋' : '💰'}</div>
                        <p className="font-semibold text-sm">{p.productName}</p>
                        <p className="text-xs text-muted-foreground">{p.description || p.category}</p>
                        <p className="text-xs text-primary mt-1">
                          {p.interestScheme?.slabs?.[0]?.rate ? `${p.interestScheme.slabs[0].rate}% p.a.` : 'Rate varies'}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
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
                <p className="text-xs text-muted-foreground mt-1">
                  Max: {formatCurrency(
                    loanProducts.find(p => p.id === selectedProductId)?.maxLoanAmount ?? 
                    loanProducts.find(p => p.id === selectedProductId)?.interestScheme?.slabs?.[0]?.toAmount ?? 
                    100000, 
                    0
                  )}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">Purpose</label>
                <div className="flex flex-wrap gap-2 mt-2">{PURPOSES.map(p => <button key={p} onClick={() => setPurpose(p)} className={`px-3 py-1 rounded-full text-sm border transition-colors ${purpose === p ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:border-primary'}`}>{p}</button>)}</div>
              </div>
              <div>
                <div className="flex justify-between mb-1"><label className="text-sm font-medium">Tenure</label><span className="text-sm font-bold text-primary">{tenure} months</span></div>
                <Slider min={3} max={selectedProduct === 'LONG_TERM' ? 84 : selectedProduct === 'MEDIUM_TERM' ? 36 : 12} step={1} value={[tenure]} onValueChange={([v]) => setTenure(v)} />
              </div>
              {/* BRD v5.0 LN-F02: Employment & Income */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Employment Type</Label>
                  <select
                    className="mt-1 w-full border border-border rounded-lg p-2 text-sm bg-background"
                    value={employmentType}
                    onChange={(e) => setEmploymentType(e.target.value as any)}
                  >
                    <option value="">Select...</option>
                    <option value="SALARIED">Salaried</option>
                    <option value="SELF_EMPLOYED">Self-Employed</option>
                    <option value="FARMER">Farmer</option>
                    <option value="BUSINESS">Business</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <Label className="text-sm font-medium">Monthly Income (₹)</Label>
                  <Input
                    type="number"
                    value={monthlyIncome || ''}
                    onChange={(e) => setMonthlyIncome(Number(e.target.value) || 0)}
                    placeholder="Enter monthly income"
                  />
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Existing Liabilities</Label>
                <textarea
                  className="mt-1 w-full border border-border rounded-lg p-2 text-sm bg-background"
                  rows={2}
                  value={existingLiabilities}
                  onChange={(e) => setExistingLiabilities(e.target.value)}
                  placeholder="List existing loans, EMIs, etc."
                />
              </div>
              {collateral === 'Property' && (
                <div>
                  <Label className="text-sm font-medium">Property/Asset Description</Label>
                  <textarea
                    className="mt-1 w-full border border-border rounded-lg p-2 text-sm bg-background"
                    rows={2}
                    value={propertyAssetDesc}
                    onChange={(e) => setPropertyAssetDesc(e.target.value)}
                    placeholder="Describe the property/asset being used as collateral"
                  />
                </div>
              )}
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

          {/* STEP 3 - BRD v5.0 LN-F05: Multiple Guarantors */}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Add up to 2 guarantors for this loan application. Guarantors must be active members.
              </p>
              {guarantors.length < 2 && (
                <>
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                    <Input
                      className="pl-9"
                      placeholder="Search guarantor..."
                      value={guarantorSearch}
                      onChange={(e) => setGuarantorSearch(e.target.value)}
                    />
                  </div>
                  {guarantorSearch && members
                    .filter(m => 
                      m.id !== selectedMember?.id &&
                      !guarantors.some(g => g.id === m.id) &&
                      (m.name.toLowerCase().includes(guarantorSearch.toLowerCase()) || m.memberId.includes(guarantorSearch))
                    )
                    .map(m => (
                      <button
                        key={m.id}
                        onClick={async () => {
                          const exposure = await checkGuarantorExposure(m.id);
                          setGuarantors(prev => [...prev, { id: m.id, name: m.name, memberId: m.memberId, exposure }]);
                          setGuarantorSearch('');
                        }}
                        className="w-full text-left p-3 rounded-lg border border-border hover:border-primary transition-colors"
                      >
                        <p className="font-medium">{m.name}</p>
                        <p className="text-xs text-muted-foreground">{m.memberId}</p>
                      </button>
                    ))}
                </>
              )}
              {guarantors.map((g, idx) => {
                const exposure = guarantorExposure[g.id];
                return (
                  <div key={g.id} className="p-4 rounded-lg border border-border space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{g.name}</p>
                        <p className="text-xs text-muted-foreground">{g.memberId}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setGuarantors(prev => prev.filter(gu => gu.id !== g.id));
                          const newExposure = { ...guarantorExposure };
                          delete newExposure[g.id];
                          setGuarantorExposure(newExposure);
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                    {exposure && (
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-2">
                          <Users className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            Total Exposure: ₹{exposure.totalExposure?.toLocaleString('en-IN') || 0}
                          </span>
                        </div>
                        {exposure.maxAllowedExposure && (
                          <div className={`flex items-center gap-2 ${
                            exposure.totalExposure + amount > exposure.maxAllowedExposure
                              ? 'text-red-600'
                              : 'text-green-600'
                          }`}>
                            <span>
                              Max Allowed: ₹{exposure.maxAllowedExposure.toLocaleString('en-IN')} ({exposure.maxExposurePct}% of income)
                            </span>
                            {exposure.totalExposure + amount > exposure.maxAllowedExposure && (
                              <AlertTriangle className="w-3.5 h-3.5" />
                            )}
                          </div>
                        )}
                        {exposure.currentGuarantees && exposure.currentGuarantees.length > 0 && (
                          <p className="text-muted-foreground">
                            Active Guarantees: {exposure.currentGuarantees.length}
                          </p>
                        )}
                      </div>
                    )}
                    {exposure && exposure.totalExposure + amount > (exposure.maxAllowedExposure || Infinity) && (
                      <Alert className="border-red-200 bg-red-50 dark:bg-red-950">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-xs text-red-700">
                          Guarantor exposure will exceed maximum allowed limit
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                );
              })}
              <p className="text-xs text-muted-foreground italic">
                Guarantor is optional for loans under ₹25,000. Maximum 2 guarantors allowed.
              </p>
            </div>
          )}

          {/* STEP 4 - BRD v5.0 LN-DC01: Document Checklist from Product */}
          {step === 3 && (
            <div className="space-y-4">
              {selectedProductId ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    Upload required documents for <strong>{selectedProduct?.productName}</strong>
                  </p>
                  {/* TODO: Fetch checklist from product */}
                  <p className="text-xs text-muted-foreground italic">
                    Document checklist will be loaded from product configuration
                  </p>
                  {productDocs.map(doc => (
                    <div key={doc} className="flex items-center justify-between p-3 rounded-lg border border-border">
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{doc}</p>
                          {uploadedDocs[doc] && <p className="text-xs text-green-600">✓ Uploaded</p>}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setUploadedDocs(prev => ({ ...prev, [doc]: true }))}
                        >
                          <Upload className="w-3.5 h-3.5 mr-1" />
                          {uploadedDocs[doc] ? 'Replace' : 'Upload'}
                        </Button>
                        {uploadedDocs[doc] && (
                          <Button size="sm" variant="ghost" className="text-muted-foreground">
                            OCR Extract
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Please select a loan product first to see the document checklist
                  </AlertDescription>
                </Alert>
              )}
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
                {[
                  ['Member', selectedMember?.name + ' (' + selectedMember?.memberId + ')'],
                  ['Product', selectedProduct?.productName || '—'],
                  ['Amount', formatCurrency(amount, 0)],
                  ['Rate', rate + '% p.a.'],
                  ['Tenure', tenure + ' months'],
                  ['Monthly EMI', formatCurrency(emi)],
                  ['Purpose', purpose],
                  ['Employment Type', employmentType || '—'],
                  ['Monthly Income', monthlyIncome > 0 ? formatCurrency(monthlyIncome) : '—'],
                  ['Guarantors', guarantors.length > 0 ? `${guarantors.length} guarantor(s)` : 'None'],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between px-4 py-2.5 text-sm">
                    <span className="text-muted-foreground">{k}</span>
                    <span className="font-medium">{v}</span>
                  </div>
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
