'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RiskScorePanel } from '@/components/ai/risk-score-panel';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { AlertTriangle, CheckCircle, Loader, Upload } from 'lucide-react';

type Step = 'member' | 'details' | 'guarantor' | 'documents' | 'assessment' | 'review' | 'success';

const steps: { id: Step; label: string }[] = [
  { id: 'member', label: 'Member & Product' },
  { id: 'details', label: 'Loan Details' },
  { id: 'guarantor', label: 'Guarantor' },
  { id: 'documents', label: 'Documents' },
  { id: 'assessment', label: 'AI Assessment' },
  { id: 'review', label: 'Review' },
  { id: 'success', label: 'Success' },
];

const mockMembers = [
  { id: '1', name: 'Rajesh Kumar', memberId: 'MEM-2024-001', riskScore: 45, activeLoans: 1 },
  { id: '2', name: 'Priya Sharma', memberId: 'MEM-2024-002', riskScore: 35, activeLoans: 0 },
];

export default function NewLoanPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>('member');
  const [selectedMember, setSelectedMember] = useState('');
  const [loanProduct, setLoanProduct] = useState('');
  const [coApplicant, setCoApplicant] = useState(false);
  const [loanAmount, setLoanAmount] = useState('');
  const [tenure, setTenure] = useState([12]);
  const [collateralType, setCollateralType] = useState('');
  const [guarantor, setGuarantor] = useState('');
  const [documentsUploaded, setDocumentsUploaded] = useState(0);
  const [showAssessment, setShowAssessment] = useState(false);
  const [applicationId, setApplicationId] = useState('');

  const calculateEMI = (amount: number, rate: number, months: number) => {
    const monthlyRate = rate / 12 / 100;
    const emi = (amount * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
    return Math.round(emi);
  };

  const selectedMemberData = mockMembers.find((m) => m.id === selectedMember);
  const amount = parseInt(loanAmount) || 0;
  const rateMap: Record<string, number> = { SHORT_TERM: 12, MEDIUM_TERM: 10, LONG_TERM: 9, GOLD_LOAN: 8 };
  const rate = rateMap[loanProduct] || 0;
  const emi = calculateEMI(amount, rate, tenure[0]);

  const handleNext = () => {
    const stepOrder: Step[] = ['member', 'details', 'guarantor', 'documents', 'assessment', 'review', 'success'];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex < stepOrder.length - 1) {
      setCurrentStep(stepOrder[currentIndex + 1]);
    }
  };

  const handlePrevious = () => {
    const stepOrder: Step[] = ['member', 'details', 'guarantor', 'documents', 'assessment', 'review', 'success'];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1]);
    }
  };

  const handleSubmit = () => {
    setApplicationId('LN-2024-00156');
    setCurrentStep('success');
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">New Loan Application</h1>
        <p className="text-muted-foreground mt-1">Multi-step loan application with AI assessment</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2">
        {steps.map((step, idx) => (
          <React.Fragment key={step.id}>
            <button
              onClick={() => setCurrentStep(step.id)}
              className={`px-3 py-2 rounded-lg whitespace-nowrap text-sm font-medium transition-all ${
                currentStep === step.id
                  ? 'bg-primary text-white'
                  : steps.findIndex((s) => s.id === currentStep) > idx
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {step.label}
            </button>
            {idx < steps.length - 1 && <div className="w-1 h-1 rounded-full bg-gray-300" />}
          </React.Fragment>
        ))}
      </div>

      {/* Step Content */}
      <div className="space-y-6">
        {currentStep === 'member' && (
          <Card>
            <CardHeader>
              <CardTitle>Step 1: Member & Product Selection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="mb-3 block">Select Member *</Label>
                <div className="grid gap-3">
                  {mockMembers.map((member) => (
                    <button
                      key={member.id}
                      onClick={() => setSelectedMember(member.id)}
                      className={`p-4 rounded-lg border text-left transition-all ${
                        selectedMember === member.id ? 'border-primary bg-primary/5' : 'border-input'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{member.name}</p>
                          <p className="text-sm text-muted-foreground">{member.memberId}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className="mb-1">Risk Score: {member.riskScore}</Badge>
                          <p className="text-xs text-muted-foreground">{member.activeLoans} active loan(s)</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {selectedMemberData && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="font-semibold text-blue-900 mb-2">Selected Member</p>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-blue-700">Name</p>
                      <p className="font-semibold text-blue-900">{selectedMemberData.name}</p>
                    </div>
                    <div>
                      <p className="text-blue-700">Risk Score</p>
                      <p className="font-semibold text-blue-900">{selectedMemberData.riskScore}/100</p>
                    </div>
                    <div>
                      <p className="text-blue-700">Active Loans</p>
                      <p className="font-semibold text-blue-900">{selectedMemberData.activeLoans}</p>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <Label className="mb-3 block">Loan Product *</Label>
                <div className="grid grid-cols-2 gap-3">
                  {['SHORT_TERM', 'MEDIUM_TERM', 'LONG_TERM', 'GOLD_LOAN'].map((product) => (
                    <button
                      key={product}
                      onClick={() => setLoanProduct(product)}
                      className={`p-4 rounded-lg border text-left ${
                        loanProduct === product ? 'border-primary bg-primary/5' : 'border-input'
                      }`}
                    >
                      <p className="font-semibold text-sm">{product.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-muted-foreground">Rate: {rateMap[product]}%</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox checked={coApplicant} onCheckedChange={(checked) => setCoApplicant(checked as boolean)} />
                <Label>Add Co-applicant</Label>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
                <Button onClick={handleNext} disabled={!selectedMember || !loanProduct} className="ml-auto">
                  Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 'details' && (
          <Card>
            <CardHeader>
              <CardTitle>Step 2: Loan Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="amount">Requested Amount (₹) *</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="50000"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(e.target.value)}
                />
              </div>

              <div>
                <Label className="mb-3 block">Tenure: {tenure[0]} months</Label>
                <Slider value={tenure} onValueChange={setTenure} min={6} max={60} step={1} />
              </div>

              {amount > 0 && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 space-y-2">
                  <p className="font-semibold text-blue-900">EMI Calculation</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-blue-700">Loan Amount</p>
                      <p className="font-semibold">₹{amount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-blue-700">Interest Rate</p>
                      <p className="font-semibold">{rate}% p.a.</p>
                    </div>
                    <div>
                      <p className="text-blue-700">Tenure</p>
                      <p className="font-semibold">{tenure[0]} months</p>
                    </div>
                    <div>
                      <p className="text-blue-700">Expected EMI</p>
                      <p className="font-semibold text-lg">₹{emi.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <Label className="mb-3 block">Collateral Type *</Label>
                <Select value={collateralType} onValueChange={setCollateralType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PROPERTY">Property</SelectItem>
                    <SelectItem value="GOLD">Gold</SelectItem>
                    <SelectItem value="FDR_LIEN">FDR Lien</SelectItem>
                    <SelectItem value="GUARANTOR_ONLY">Guarantor Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={handlePrevious}>Previous</Button>
                <Button onClick={handleNext} disabled={!loanAmount || !collateralType} className="ml-auto">
                  Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 'guarantor' && (
          <Card>
            <CardHeader>
              <CardTitle>Step 3: Guarantor</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="mb-3 block">Select Guarantor Member *</Label>
                <div className="grid gap-3">
                  {mockMembers
                    .filter((m) => m.id !== selectedMember)
                    .map((member) => (
                      <button
                        key={member.id}
                        onClick={() => setGuarantor(member.id)}
                        className={`p-4 rounded-lg border text-left ${
                          guarantor === member.id ? 'border-primary bg-primary/5' : 'border-input'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold">{member.name}</p>
                            <p className="text-sm text-muted-foreground">{member.memberId}</p>
                          </div>
                          <Badge variant="outline">Exposure: {member.activeLoans * 40}%</Badge>
                        </div>
                      </button>
                    ))}
                </div>
              </div>

              <Alert className="border-amber-200 bg-amber-50">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  Guarantor exposure check: Ensure total exposure does not exceed 50%
                </AlertDescription>
              </Alert>

              <div className="flex gap-2">
                <Button variant="outline" onClick={handlePrevious}>Previous</Button>
                <Button onClick={handleNext} disabled={!guarantor} className="ml-auto">
                  Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 'documents' && (
          <Card>
            <CardHeader>
              <CardTitle>Step 4: Documents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                {['Income Proof', 'Property Docs', 'Passport Photo', 'Bank Statement'].map((doc) => (
                  <div key={doc} className="p-4 border rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Upload className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{doc}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDocumentsUploaded(d => Math.min(d + 1, 4))}
                    >
                      {documentsUploaded > 0 ? '✓ Uploaded' : 'Upload'}
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={handlePrevious}>Previous</Button>
                <Button onClick={handleNext} disabled={documentsUploaded < 4} className="ml-auto">
                  Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 'assessment' && (
          <Card>
            <CardHeader>
              <CardTitle>Step 5: AI Risk Assessment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {!showAssessment ? (
                <div className="text-center py-12">
                  <Loader className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
                  <p className="text-lg font-semibold">AI is computing risk score...</p>
                  <p className="text-sm text-muted-foreground mt-2">Please wait while we analyze your application</p>
                  <Button className="mt-6" onClick={() => setShowAssessment(true)}>
                    Continue
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  <RiskScorePanel
                    score={{
                      overall: 62,
                      factors: [
                        { name: 'Age', score: 70 },
                        { name: 'Shares Held', score: 65 },
                        { name: 'KYC Status', score: 100 },
                        { name: 'Membership Duration', score: 60 },
                        { name: 'Active Loans', score: 40 },
                      ],
                    }}
                  />

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Eligibility Engine Results</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span>Age: 44 years (eligible)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span>Shares held: 10 shares (eligible)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span>KYC Status: VERIFIED (eligible)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span>Membership: 2+ years (eligible)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                        <span>Active Loans: 1 existing (limit: 1)</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Alert className="border-green-200 bg-green-50">
                    <AlertDescription className="text-green-800">
                      AI Recommendation: APPROVE - Score 62/100 (AMBER - Medium Risk)
                    </AlertDescription>
                  </Alert>

                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handlePrevious}>Previous</Button>
                    <Button onClick={handleNext} className="ml-auto">
                      Proceed to Submit
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {currentStep === 'review' && (
          <Card>
            <CardHeader>
              <CardTitle>Step 6: Review & Submit</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-semibold">Application Summary</h4>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Member</span>
                    <span className="font-semibold">{selectedMemberData?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Loan Product</span>
                    <span className="font-semibold">{loanProduct?.replace(/_/g, ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Loan Amount</span>
                    <span className="font-semibold">₹{loanAmount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Rate</span>
                    <span className="font-semibold">{rate}% p.a.</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tenure</span>
                    <span className="font-semibold">{tenure[0]} months</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span>Expected EMI</span>
                    <span className="font-bold">₹{emi.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <Alert>
                <AlertDescription className="text-sm">
                  This loan will be routed to: LOAN_OFFICER (approval limit: ₹50,000)
                </AlertDescription>
              </Alert>

              <div className="flex gap-2">
                <Button variant="outline" onClick={handlePrevious}>Previous</Button>
                <Button onClick={handleSubmit} className="ml-auto">
                  Submit Application
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 'success' && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-900">
                <CheckCircle className="w-6 h-6" />
                Application Submitted Successfully
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-white p-6 rounded-lg border border-green-200">
                <p className="text-sm text-muted-foreground mb-1">Application Reference</p>
                <p className="text-2xl font-bold">{applicationId}</p>
              </div>

              <div className="space-y-3 text-sm">
                <h4 className="font-semibold">Next Steps</h4>
                <ul className="space-y-2">
                  <li className="flex gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Application submitted to Loan Officer approval queue</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-amber-600">→</span>
                    <span>Pending approval (typically 2-3 business days)</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-blue-600">→</span>
                    <span>You will receive notification upon approval/rejection</span>
                  </li>
                </ul>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="w-full" onClick={() => router.push('/dashboard/loans')}>
                  View All Loans
                </Button>
                <Button className="w-full" onClick={() => router.push('/dashboard')}>
                  Go to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
