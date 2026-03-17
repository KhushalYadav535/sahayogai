'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loanDisbursementApi, loansApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, CheckCircle, XCircle, AlertTriangle, Loader2, FileText, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { toast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils/formatters';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

export default function LoanDisbursementPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [application, setApplication] = useState<any>(null);
  const [loan, setLoan] = useState<any>(null);
  const [preCheck, setPreCheck] = useState<any>(null);
  const [voucher, setVoucher] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [disbursing, setDisbursing] = useState(false);
  const [approving, setApproving] = useState(false);
  const [isDisburseDialogOpen, setIsDisburseDialogOpen] = useState(false);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [disbursementMode, setDisbursementMode] = useState<'CASH' | 'NEFT' | 'RTGS' | 'INTERNAL_TRANSFER' | 'DEMAND_DRAFT'>('NEFT');
  const [bankAccountDetails, setBankAccountDetails] = useState({
    accountNumber: '',
    ifscCode: '',
    bankName: '',
    accountHolderName: '',
  });
  const [signatureVerified, setSignatureVerified] = useState(false);
  const [disbursementAmount, setDisbursementAmount] = useState(0);

  useEffect(() => {
    params.then(p => {
      setApplicationId(p.id);
      fetchData(p.id);
    });
  }, [params]);

  // IMP-15: Auto RTGS when amount >= ₹2 lakh
  useEffect(() => {
    if (disbursementAmount >= 200000) setDisbursementMode('RTGS');
  }, [disbursementAmount]);

  const fetchData = async (id: string) => {
    try {
      setLoading(true);
      const [appRes, checkRes] = await Promise.all([
        loansApi.getApplication(id),
        loanDisbursementApi.preDisbursementCheck(id).catch(() => ({ success: false })),
      ]);

      if (appRes.success) {
        setApplication(appRes.application);
        if (appRes.application.loanId) {
          fetchLoan(appRes.application.loanId);
        }
      }

      if (checkRes.success) {
        setPreCheck(checkRes);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchLoan = async (loanId: string) => {
    try {
      const res = await loansApi.get(loanId);
      if (res.success) {
        setLoan(res.loan);
        setDisbursementAmount(res.loan.sanctionedAmount || res.loan.amountRequested);
        fetchVoucher(loanId);
      }
    } catch (error: any) {
      console.error('Error fetching loan:', error);
    }
  };

  const fetchVoucher = async (loanId: string) => {
    try {
      const res = await loanDisbursementApi.getVoucher(loanId);
      if (res.success) {
        setVoucher(res.voucher);
      }
    } catch (error: any) {
      console.error('Error fetching voucher:', error);
    }
  };

  const handleCreateAccount = async () => {
    if (!application) return;
    try {
      const res = await loanDisbursementApi.createAccount(application.id, {
        sanctionedAmount: application.sanctionedAmount || application.amountRequested,
        interestRate: application.interestRate || 13,
        tenureMonths: application.tenureMonths || 12,
      });
      if (res.success) {
        toast({
          title: 'Success',
          description: 'Loan account created successfully',
        });
        fetchData(application.id);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create loan account',
        variant: 'destructive',
      });
    }
  };

  const handleDisburse = async () => {
    if (!loan) return;
    setDisbursing(true);
    try {
      const mode = disbursementAmount >= 200000 ? 'RTGS' : disbursementMode;
      const body: any = {
        disbursementMode: mode,
        amount: disbursementAmount,
      };
      if (mode === 'NEFT' || mode === 'RTGS') {
        body.bankAccountDetails = {
          accountNumber: bankAccountDetails.accountNumber,
          ifsc: bankAccountDetails.ifscCode,
          bankName: bankAccountDetails.bankName,
        };
      }

      const res = await loanDisbursementApi.disburse(loan.id, body);
      if (res.success) {
        toast({
          title: 'Success',
          description: res.message || 'Disbursement initiated',
        });
        setIsDisburseDialogOpen(false);
        fetchLoan(loan.id);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to initiate disbursement',
        variant: 'destructive',
      });
    } finally {
      setDisbursing(false);
    }
  };

  const handleApproveDisbursement = async () => {
    if (!loan) return;
    setApproving(true);
    try {
      const res = await loanDisbursementApi.approveDisbursement(loan.id, {
        signatureVerified,
      });
      if (res.success) {
        toast({
          title: 'Success',
          description: res.message || 'Disbursement approved',
        });
        setIsApproveDialogOpen(false);
        fetchLoan(loan.id);
        fetchVoucher(loan.id);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to approve disbursement',
        variant: 'destructive',
      });
    } finally {
      setApproving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/loans/applications/${applicationId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Loan Disbursement</h1>
          <p className="text-muted-foreground">Application ID: {applicationId}</p>
        </div>
      </div>

      {/* IMP-05: Pre-Disbursement 6-Gate Checklist — UI enforcement with action prompts */}
      {preCheck && (
        <Card>
          <CardHeader>
            <CardTitle>Pre-Disbursement Checklist (6 Gates)</CardTitle>
            <CardDescription>
              {preCheck.ready
                ? 'All 6 gates are green. Ready for disbursement.'
                : `${preCheck.conditions?.filter((c: any) => c.status === 'FAIL').length ?? 0} gate(s) remaining — resolve to enable Disburse button`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {preCheck.conditions?.map((condition: any, idx: number) => {
                const passed = condition.status === 'PASS';
                const actionPrompt: Record<number, { text: string; link?: string }> = {
                  1: { text: 'Document Tracker — verify mandatory documents', link: `/dashboard/loans/applications/${applicationId}/documents` },
                  2: { text: 'Ensure sanction letter is acknowledged by member' },
                  3: { text: 'Collateral — add/verify gold or property registration', link: `/dashboard/loans/applications/${applicationId}/collateral` },
                  4: { text: 'Insurance — collect premium if product requires' },
                  5: { text: 'Maker submits first; Checker approves' },
                  6: { text: 'Create Loan Account & EMI Schedule above' },
                };
                const prompt = actionPrompt[condition.id];
                return (
                  <div
                    key={idx}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${
                      passed ? 'border-green-200 bg-green-50 dark:bg-green-950/30' : 'border-red-200 bg-red-50 dark:bg-red-950/30'
                    }`}
                  >
                    {passed ? (
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{condition.name}</p>
                      {condition.details && (
                        <p className="text-xs text-muted-foreground mt-0.5">{condition.details}</p>
                      )}
                      {!passed && prompt && (
                        <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                          → {prompt.link ? (
                            <Link href={prompt.link} className="underline hover:text-amber-800">
                              {prompt.text}. Click to resolve.
                            </Link>
                          ) : prompt.text}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loan Account Creation */}
      {application && !loan && application.status === 'SANCTIONED' && (
        <Card>
          <CardHeader>
            <CardTitle>Create Loan Account</CardTitle>
            <CardDescription>
              Create loan account and EMI schedule before disbursement
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-muted-foreground">Sanctioned Amount</Label>
                  <p className="font-semibold text-lg">
                    {formatCurrency(application.sanctionedAmount || application.amountRequested)}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Interest Rate</Label>
                  <p className="font-semibold text-lg">{application.interestRate || 13}%</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Tenure</Label>
                  <p className="font-semibold text-lg">{application.tenureMonths || 12} months</p>
                </div>
              </div>
              <Button onClick={handleCreateAccount} className="w-full">
                Create Loan Account & EMI Schedule
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* BRD v5.0 LN-DIS07: Tranche Disbursement (for housing/project loans) */}
      {loan && (application?.product?.category === 'HOUSING' || application?.product?.category === 'OTHER') && (
        <Card>
          <CardHeader>
            <CardTitle>Tranche Disbursement Schedule</CardTitle>
            <CardDescription>
              Configure multiple disbursement tranches for housing/project loans
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Housing and project loans can be disbursed in multiple tranches based on project milestones.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  // TODO: Open tranche schedule dialog
                  toast({
                    title: 'Info',
                    description: 'Tranche schedule configuration coming soon',
                  });
                }}
              >
                Configure Tranche Schedule
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Disbursement Actions */}
      {loan && loan.status === 'SANCTIONED' && (
        <Card>
          <CardHeader>
            <CardTitle>Disbursement Actions</CardTitle>
            <CardDescription>
              Loan Account: {loan.loanAccountNumber || loan.id}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Loan Amount</Label>
                  <p className="font-semibold text-lg">{formatCurrency(loan.sanctionedAmount || loan.principalAmount)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <Badge className={
                    loan.status === 'DISBURSED' ? 'bg-green-100 text-green-800' :
                    loan.status === 'SANCTIONED' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }>
                    {loan.status}
                  </Badge>
                </div>
              </div>
              {loan.status === 'SANCTIONED' && (
                <div className="flex flex-col gap-2">
                  {!preCheck?.ready ? (
                    <Button disabled variant="secondary">
                      {preCheck?.conditions?.filter((c: any) => c.status === 'FAIL').length ?? 0} gate(s) remaining — resolve checklist to enable
                    </Button>
                  ) : (
                    <Button onClick={() => setIsDisburseDialogOpen(true)}>
                      Initiate Disbursement (Maker)
                    </Button>
                  )}
                </div>
              )}
              {loan.status === 'PENDING_DISBURSEMENT' && (
                <div className="flex gap-4">
                  <Button onClick={() => setIsApproveDialogOpen(true)} variant="default">
                    Approve Disbursement (Checker)
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Disbursement Voucher */}
      {voucher && (
        <Card>
          <CardHeader>
            <CardTitle>Disbursement Voucher</CardTitle>
            <CardDescription>Voucher ID: {voucher.voucherNumber}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Voucher Number</Label>
                  <p className="font-mono font-semibold">{voucher.voucherNumber}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Date</Label>
                  <p>{new Date(voucher.voucherDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Disbursement Mode</Label>
                  <p>{voucher.disbursementMode}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Amount</Label>
                  <p className="font-semibold">{formatCurrency(voucher.disbursementAmount)}</p>
                </div>
              </div>
              {voucher.glEntries && voucher.glEntries.length > 0 && (
                <div>
                  <Label className="text-muted-foreground mb-2 block">GL Entries</Label>
                  <div className="space-y-2">
                    {voucher.glEntries.map((entry: any, idx: number) => (
                      <div key={idx} className="flex justify-between p-2 rounded border">
                        <span>{entry.glName} ({entry.glCode})</span>
                        <span className={entry.debit > 0 ? 'text-red-600' : 'text-green-600'}>
                          {entry.debit > 0 ? `Dr. ${formatCurrency(entry.debit)}` : `Cr. ${formatCurrency(entry.credit)}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Disburse Dialog */}
      <Dialog open={isDisburseDialogOpen} onOpenChange={setIsDisburseDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Initiate Disbursement</DialogTitle>
            <DialogDescription>
              Loan Account: {loan?.loanAccountNumber || loan?.id}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* IMP-06: GL treatment reference per mode */}
            <div className="p-3 rounded-lg bg-muted/50 text-xs space-y-1">
              <p className="font-semibold">GL Treatment Reference:</p>
              <p>• Cash: Dr Loan A/c · Cr Cash on Hand</p>
              <p>• NEFT: Dr Loan A/c · Cr NEFT Clearing A/c</p>
              <p>• RTGS: Dr Loan A/c · Cr RTGS Clearing A/c</p>
              <p>• Internal: Dr Loan A/c · Cr Member SB A/c</p>
              <p>• DD: Dr Loan A/c · Cr DD Payable A/c</p>
            </div>
            <div>
              <Label>Disbursement Amount</Label>
              <Input
                type="number"
                value={disbursementAmount}
                onChange={(e) => setDisbursementAmount(Number(e.target.value))}
              />
            </div>
            <div>
              <Label>Disbursement Mode *</Label>
              <Select
                value={disbursementAmount >= 200000 ? 'RTGS' : disbursementMode}
                onValueChange={(value: any) => {
                  if (disbursementAmount >= 200000) {
                    setDisbursementMode('RTGS');
                    return;
                  }
                  setDisbursementMode(value);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="NEFT" disabled={disbursementAmount >= 200000}>NEFT {disbursementAmount >= 200000 ? '(not available for ≥ ₹2 lakh)' : ''}</SelectItem>
                  <SelectItem value="RTGS">RTGS {disbursementAmount >= 200000 ? '(mandatory for ≥ ₹2 lakh)' : ''}</SelectItem>
                  <SelectItem value="INTERNAL_TRANSFER" disabled={disbursementAmount >= 200000}>Internal Transfer (to member SB)</SelectItem>
                  <SelectItem value="DEMAND_DRAFT">Demand Draft</SelectItem>
                </SelectContent>
              </Select>
              {disbursementAmount >= 200000 && (
                <p className="text-xs text-amber-600 mt-1">NEFT not available for amounts ≥ ₹2,00,000. RTGS is mandatory.</p>
              )}
            </div>
            {(disbursementMode === 'NEFT' || disbursementMode === 'RTGS') && (
              <div className="space-y-4 border-t pt-4">
                <div>
                  <Label>Account Number *</Label>
                  <Input
                    value={bankAccountDetails.accountNumber}
                    onChange={(e) => setBankAccountDetails({ ...bankAccountDetails, accountNumber: e.target.value })}
                  />
                </div>
                <div>
                  <Label>IFSC Code *</Label>
                  <Input
                    value={bankAccountDetails.ifscCode}
                    onChange={(e) => setBankAccountDetails({ ...bankAccountDetails, ifscCode: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Bank Name</Label>
                  <Input
                    value={bankAccountDetails.bankName}
                    onChange={(e) => setBankAccountDetails({ ...bankAccountDetails, bankName: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Account Holder Name</Label>
                  <Input
                    value={bankAccountDetails.accountHolderName}
                    onChange={(e) => setBankAccountDetails({ ...bankAccountDetails, accountHolderName: e.target.value })}
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDisburseDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleDisburse} disabled={disbursing}>
              {disbursing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Initiate Disbursement'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Disbursement Dialog */}
      <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Disbursement</DialogTitle>
            <DialogDescription>
              Review disbursement details before approval
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="signature"
                checked={signatureVerified}
                onCheckedChange={(checked) => setSignatureVerified(checked === true)}
              />
              <Label htmlFor="signature" className="cursor-pointer">
                Member signature verified
              </Label>
            </div>
            <Alert>
              <AlertDescription>
                This will post GL entries and complete the disbursement process.
                Please ensure all pre-disbursement conditions are met.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApproveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleApproveDisbursement} disabled={approving || !signatureVerified}>
              {approving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Approving...
                </>
              ) : (
                'Approve & Disburse'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
