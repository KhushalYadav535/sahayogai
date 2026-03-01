'use client';

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ArrowRight, CheckCircle, Clock, AlertTriangle, Lock, Zap } from 'lucide-react';

type Step = 'death' | 'freeze' | 'nominee' | 'settlement' | 'approval' | 'success';

const steps: { id: Step; label: string; icon: React.ReactNode }[] = [
  { id: 'death', label: 'Confirm Death', icon: <AlertTriangle className="w-4 h-4" /> },
  { id: 'freeze', label: 'Freeze Accounts', icon: <Lock className="w-4 h-4" /> },
  { id: 'nominee', label: 'Verify Nominee', icon: <CheckCircle className="w-4 h-4" /> },
  { id: 'settlement', label: 'Calculate Settlement', icon: <Zap className="w-4 h-4" /> },
  { id: 'approval', label: 'Send Approval', icon: <Clock className="w-4 h-4" /> },
  { id: 'success', label: 'Settlement Complete', icon: <CheckCircle className="w-4 h-4" /> },
];

export default function DeathSettlementPage() {
  const router = useRouter();
  const params = useParams();
  const [currentStep, setCurrentStep] = useState<Step>('death');
  const [deathDate, setDeathDate] = useState('');
  const [deathCertificate, setDeathCertificate] = useState(false);
  const [accountsToFreeze, setAccountsToFreeze] = useState([
    { accountNo: 'SB-001234', name: 'Savings Account', balance: 25000, checked: true },
    { accountNo: 'SB-001235', name: 'Savings - Minor', balance: 5000, checked: true },
  ]);
  const [nomineeVerified, setNomineeVerified] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [settlementRef, setSettlementRef] = useState('');

  const handleFreezeToggle = (accountNo: string) => {
    setAccountsToFreeze(
      accountsToFreeze.map((acc) =>
        acc.accountNo === accountNo ? { ...acc, checked: !acc.checked } : acc
      )
    );
  };

  const handleNextStep = () => {
    const stepOrder: Step[] = ['death', 'freeze', 'nominee', 'settlement', 'approval', 'success'];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex < stepOrder.length - 1) {
      setCurrentStep(stepOrder[currentIndex + 1]);
    }
  };

  const handlePreviousStep = () => {
    const stepOrder: Step[] = ['death', 'freeze', 'nominee', 'settlement', 'approval', 'success'];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1]);
    }
  };

  const handleSubmitForApproval = () => {
    setSettlementRef('DS-2024-00156');
    setCurrentStep('success');
  };

  const getStepStatus = (stepId: Step) => {
    const order = ['death', 'freeze', 'nominee', 'settlement', 'approval', 'success'];
    const current = order.indexOf(currentStep);
    const step = order.indexOf(stepId);

    if (step < current) return 'completed';
    if (step === current) return 'active';
    return 'pending';
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Death Settlement Workflow</h1>
        <p className="text-muted-foreground mt-2">Process member death and distribute settlement amount to nominee</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4">
        {steps.map((step, idx) => (
          <React.Fragment key={step.id}>
            <button
              onClick={() => setCurrentStep(step.id)}
              disabled={getStepStatus(step.id) === 'pending'}
              className={`flex flex-col items-center gap-2 p-3 rounded-lg transition-all ${
                getStepStatus(step.id) === 'active'
                  ? 'bg-primary text-white'
                  : getStepStatus(step.id) === 'completed'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-400'
              } ${getStepStatus(step.id) !== 'pending' ? 'cursor-pointer' : 'cursor-not-allowed'}`}
            >
              {step.icon}
              <span className="text-xs font-medium whitespace-nowrap">{step.label}</span>
            </button>
            {idx < steps.length - 1 && (
              <ArrowRight className={`w-4 h-4 ${getStepStatus(steps[idx + 1].id) !== 'pending' ? 'text-primary' : 'text-gray-300'}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step Content */}
      <div className="space-y-6">
        {currentStep === 'death' && (
          <Card>
            <CardHeader>
              <CardTitle>Step 1: Confirm Member Death</CardTitle>
              <CardDescription>Record the date of death and upload death certificate</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="death-date">Date of Death *</Label>
                <Input
                  id="death-date"
                  type="date"
                  value={deathDate}
                  onChange={(e) => setDeathDate(e.target.value)}
                />
              </div>

              <div className="space-y-3">
                <Label>Death Certificate *</Label>
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <Button variant="outline">Upload Death Certificate (PDF/Image)</Button>
                  <p className="text-xs text-muted-foreground mt-2">Max file size: 5MB</p>
                  {deathCertificate && (
                    <div className="mt-4 p-3 bg-green-50 rounded-lg">
                      <p className="text-sm text-green-800 font-medium">✓ Death Certificate uploaded</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
                <Button disabled={!deathDate || !deathCertificate} onClick={handleNextStep}>
                  Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 'freeze' && (
          <Card>
            <CardHeader>
              <CardTitle>Step 2: Freeze All Accounts</CardTitle>
              <CardDescription>Select which accounts to freeze to prevent unauthorized access</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert className="border-amber-200 bg-amber-50">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  All accounts will be frozen to prevent unauthorized transactions. Nominee can only withdraw funds after settlement.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                {accountsToFreeze.map((account) => (
                  <div key={account.accountNo} className="flex items-center gap-4 p-4 border rounded-lg">
                    <Checkbox
                      checked={account.checked}
                      onCheckedChange={() => handleFreezeToggle(account.accountNo)}
                    />
                    <div className="flex-1">
                      <p className="font-semibold">{account.name}</p>
                      <p className="text-sm text-muted-foreground">{account.accountNo}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">₹{account.balance.toLocaleString()}</p>
                      <Badge variant="outline" className="bg-red-50 text-red-800 border-red-200">FREEZE</Badge>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <Label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox id="confirm-freeze" />
                  <span className="text-sm">I confirm that all selected accounts should be frozen</span>
                </Label>
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={handlePreviousStep}>Previous</Button>
                <Button onClick={handleNextStep}>Continue</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 'nominee' && (
          <Card>
            <CardHeader>
              <CardTitle>Step 3: Verify Nominee</CardTitle>
              <CardDescription>Verify nominee details and KYC status before settlement</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-4">Nominee Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-blue-700">Name</p>
                    <p className="font-semibold text-blue-900">Shweta Kumar</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-blue-700">Relationship</p>
                    <p className="font-semibold text-blue-900">Spouse</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-blue-700">Mobile</p>
                    <p className="font-semibold text-blue-900">+91-9876543211</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-blue-700">KYC Status</p>
                    <Badge className="bg-green-100 text-green-800 border-0">VERIFIED</Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold">OTP Verification</h4>
                <p className="text-sm text-muted-foreground">OTP sent to nominee mobile: +91-9876543211</p>
                <div className="flex gap-2">
                  <Input placeholder="Enter OTP" maxLength={6} />
                  <Button variant="outline">Resend</Button>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={nomineeVerified}
                    onCheckedChange={(checked) => setNomineeVerified(checked as boolean)}
                  />
                  <span className="text-sm">Nominee verified and approved for settlement</span>
                </Label>
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={handlePreviousStep}>Previous</Button>
                <Button disabled={!nomineeVerified} onClick={handleNextStep}>Continue</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 'settlement' && (
          <Card>
            <CardHeader>
              <CardTitle>Step 4: Settlement Calculation</CardTitle>
              <CardDescription>Review settlement amount to be paid to nominee</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Component</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Savings Account Balance (SB-001234)</TableCell>
                    <TableCell className="text-right">₹25,000</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Savings Account Balance (SB-001235)</TableCell>
                    <TableCell className="text-right">₹5,000</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>FDR Maturity Value</TableCell>
                    <TableCell className="text-right">₹10,500</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Share Capital Refund</TableCell>
                    <TableCell className="text-right">₹1,000</TableCell>
                  </TableRow>
                  <TableRow className="bg-yellow-50">
                    <TableCell className="font-semibold">Less: Outstanding Loan</TableCell>
                    <TableCell className="text-right font-semibold">-₹32,500</TableCell>
                  </TableRow>
                  <TableRow className="bg-green-50">
                    <TableCell className="font-semibold">Net Payable to Nominee</TableCell>
                    <TableCell className="text-right font-semibold text-green-800">₹9,000</TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              <Alert>
                <AlertDescription>
                  The outstanding loan will be deducted from the settlement amount. If settlement is less than outstanding, nominee will not be required to pay the difference.
                </AlertDescription>
              </Alert>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={handlePreviousStep}>Previous</Button>
                <Button onClick={handleNextStep}>Continue to Approval</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 'approval' && (
          <Card>
            <CardHeader>
              <CardTitle>Step 5: Submit for Approval</CardTitle>
              <CardDescription>This settlement will be routed to Society Admin for maker-checker approval</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert className="border-blue-200 bg-blue-50">
                <AlertDescription className="text-blue-800">
                  Settlement amount ₹9,000 requires Maker-Checker approval. This is a critical transaction that will be reviewed by authorized officers.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any relevant notes for approval..."
                  rows={4}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={handlePreviousStep}>Previous</Button>
                <AlertDialog>
                  <Button onClick={() => setShowConfirmation(true)}>Submit for Approval</Button>
                </AlertDialog>
              </div>

              {showConfirmation && (
                <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
                  <AlertDialogContent>
                    <AlertDialogTitle>Confirm Settlement Submission</AlertDialogTitle>
                    <AlertDialogDescription>
                      You are about to submit this death settlement for approval. This action will trigger maker-checker workflow.
                      The settlement reference number will be generated upon submission.
                    </AlertDialogDescription>
                    <div className="flex gap-2 justify-end mt-4">
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleSubmitForApproval}>Confirm & Submit</AlertDialogAction>
                    </div>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </CardContent>
          </Card>
        )}

        {currentStep === 'success' && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-900 flex items-center gap-2">
                <CheckCircle className="w-6 h-6" />
                Settlement Submitted Successfully
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-6 bg-white rounded-lg border border-green-200">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Settlement Reference</p>
                    <p className="text-2xl font-bold">{settlementRef}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                    <Badge className="bg-blue-100 text-blue-800 border-0 text-base mt-2">PENDING_APPROVAL</Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold">Next Steps</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Settlement submitted to approval queue</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-amber-600">→</span>
                    <span>Waiting for Society Admin approval (Checker)</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-blue-600">→</span>
                    <span>Once approved, nominee will receive settlement amount</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-blue-600">→</span>
                    <span>You will receive notification upon approval/rejection</span>
                  </li>
                </ul>
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => router.push(`/dashboard/members/${params.id}`)}>
                  View Member Profile
                </Button>
                <Button onClick={() => router.push('/dashboard/approvals')}>
                  View Approvals Queue
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
