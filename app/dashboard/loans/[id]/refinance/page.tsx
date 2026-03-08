'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loansApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function LoanRefinancePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const [loan, setLoan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    newLoanAmount: '',
    newInterestRate: '',
    newTenureMonths: '',
    bodResolutionRef: '',
    remarks: '',
  });

  useEffect(() => {
    loansApi.get(params.id).then(res => {
      if (res.success && res.loan) {
        setLoan(res.loan);
        const outstanding = Number(res.loan.outstandingPrincipal) + Number(res.loan.outstandingInterest || 0);
        setFormData(prev => ({
          ...prev,
          newLoanAmount: String(outstanding),
          newInterestRate: String(res.loan.interestRate),
          newTenureMonths: String(res.loan.tenureMonths),
        }));
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await loansApi.refinance(params.id, {
        newLoanAmount: parseFloat(formData.newLoanAmount),
        newInterestRate: parseFloat(formData.newInterestRate),
        newTenureMonths: parseInt(formData.newTenureMonths),
        bodResolutionRef: formData.bodResolutionRef,
        remarks: formData.remarks,
      });
      if (res.success) {
        toast({ title: 'Success', description: `Loan refinanced. New loan: ${res.newLoan.loanNumber}` });
        setTimeout(() => router.push(`/dashboard/loans/${res.newLoan.id}`), 2000);
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to refinance loan', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  if (!loan) {
    return <div className="flex items-center justify-center min-h-[400px]"><p>Loan not found</p></div>;
  }

  const outstanding = Number(loan.outstandingPrincipal) + Number(loan.outstandingInterest || 0) + Number(loan.outstandingPenal || 0);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/loans/${params.id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Refinance Loan</h1>
          <p className="text-muted-foreground mt-1">Create new loan to replace loan {loan.loanNumber}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Refinance Details</CardTitle>
          <CardDescription>
            Current loan outstanding: ₹{outstanding.toLocaleString()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>New Loan Amount (₹) *</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.newLoanAmount}
                  onChange={(e) => setFormData({ ...formData, newLoanAmount: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>New Interest Rate (%) *</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.newInterestRate}
                  onChange={(e) => setFormData({ ...formData, newInterestRate: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>New Tenure (Months) *</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.newTenureMonths}
                  onChange={(e) => setFormData({ ...formData, newTenureMonths: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>BOD Resolution Reference *</Label>
                <Input
                  value={formData.bodResolutionRef}
                  onChange={(e) => setFormData({ ...formData, bodResolutionRef: e.target.value })}
                  placeholder="RES-2024-001"
                  required
                />
              </div>
              <div className="col-span-2">
                <Label>Remarks</Label>
                <Input
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  placeholder="Reason for refinance"
                />
              </div>
            </div>
            <Alert>
              <AlertDescription>
                This will create a new loan and close the existing one. Pre-closure charges will be applied to the old loan.
                The old and new loans will be linked for reporting purposes.
              </AlertDescription>
            </Alert>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Refinance Loan'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
