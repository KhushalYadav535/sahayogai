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
  const [disbursementMode, setDisbursementMode] = useState<'CASH' | 'BANK_TRANSFER' | 'CHEQUE' | 'NEFT' | 'RTGS' | 'UPI'>('BANK_TRANSFER');
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
      const body: any = {
        disbursementMode,
        amount: disbursementAmount,
      };
      if (disbursementMode !== 'CASH' && disbursementMode !== 'CHEQUE') {
        body.bankAccountDetails = bankAccountDetails;
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

      {/* Pre-Disbursement Check */}
      {preCheck && (
        <Card>
          <CardHeader>
            <CardTitle>Pre-Disbursement Checklist</CardTitle>
            <CardDescription>
              {preCheck.ready
                ? 'All conditions met. Ready for disbursement.'
                : 'Some conditions are not met. Please review.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {preCheck.conditions?.map((condition: any, idx: number) => (
                <div
                  key={idx}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    condition.met
                      ? 'border-green-200 bg-green-50 dark:bg-green-950'
                      : 'border-red-200 bg-red-50 dark:bg-red-950'
                  }`}
                >
                  {condition.met ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium">{condition.description}</p>
                    {condition.details && (
                      <p className="text-xs text-muted-foreground mt-1">{condition.details}</p>
                    )}
                  </div>
                </div>
              ))}
              {preCheck.blockingItems && preCheck.blockingItems.length > 0 && (
                <Alert className="border-red-200 bg-red-50 dark:bg-red-950">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription>
                    <p className="font-semibold text-red-800 mb-2">Blocking Items:</p>
                    <ul className="list-disc list-inside text-sm text-red-700">
                      {preCheck.blockingItems.map((item: any, idx: number) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
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
                <div className="flex gap-4">
                  <Button onClick={() => setIsDisburseDialogOpen(true)}>
                    Initiate Disbursement (Maker)
                  </Button>
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
              <Select value={disbursementMode} onValueChange={(value: any) => setDisbursementMode(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                  <SelectItem value="CHEQUE">Cheque</SelectItem>
                  <SelectItem value="NEFT">NEFT</SelectItem>
                  <SelectItem value="RTGS">RTGS</SelectItem>
                  <SelectItem value="UPI">UPI</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(disbursementMode === 'BANK_TRANSFER' || disbursementMode === 'NEFT' || disbursementMode === 'RTGS' || disbursementMode === 'UPI') && (
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
