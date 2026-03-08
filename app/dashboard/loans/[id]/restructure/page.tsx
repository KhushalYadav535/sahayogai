'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loansApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function LoanRestructurePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const [loan, setLoan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    newTenureMonths: '',
    newEmiAmount: '',
    moratoriumExtensionMonths: '',
    bodResolutionRef: '',
    remarks: '',
  });

  useEffect(() => {
    loansApi.get(params.id).then(res => {
      if (res.success && res.loan) {
        setLoan(res.loan);
        setFormData(prev => ({
          ...prev,
          newTenureMonths: String(res.loan.tenureMonths),
        }));
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload: any = {
        bodResolutionRef: formData.bodResolutionRef,
      };
      if (formData.newTenureMonths) payload.newTenureMonths = parseInt(formData.newTenureMonths);
      if (formData.newEmiAmount) payload.newEmiAmount = parseFloat(formData.newEmiAmount);
      if (formData.moratoriumExtensionMonths) payload.moratoriumExtensionMonths = parseInt(formData.moratoriumExtensionMonths);
      if (formData.remarks) payload.remarks = formData.remarks;

      const res = await loansApi.restructure(params.id, payload);
      if (res.success) {
        toast({ title: 'Success', description: 'Loan restructured successfully' });
        setTimeout(() => router.push(`/dashboard/loans/${params.id}`), 1500);
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to restructure loan', variant: 'destructive' });
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

  const maxRestructures = 3;
  const canRestructure = (loan.restructureCount || 0) < maxRestructures;

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
          <h1 className="text-3xl font-bold">Restructure Loan</h1>
          <p className="text-muted-foreground mt-1">Revise repayment schedule for loan {loan.loanNumber}</p>
        </div>
      </div>

      {!canRestructure && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">
            Maximum restructuring limit ({maxRestructures}) reached. Current count: {loan.restructureCount || 0}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Restructuring Details</CardTitle>
          <CardDescription>
            Current: {loan.tenureMonths} months tenure, {loan.moratoriumMonths || 0} months moratorium
            {loan.restructureCount > 0 && ` (Restructured ${loan.restructureCount} time${loan.restructureCount > 1 ? 's' : ''})`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
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
                <Label>New EMI Amount (₹)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.newEmiAmount}
                  onChange={(e) => setFormData({ ...formData, newEmiAmount: e.target.value })}
                  placeholder="Optional - auto-calculated if not provided"
                />
              </div>
              <div>
                <Label>Moratorium Extension (Months)</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.moratoriumExtensionMonths}
                  onChange={(e) => setFormData({ ...formData, moratoriumExtensionMonths: e.target.value })}
                  placeholder="Additional months"
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
                  placeholder="Reason for restructuring"
                />
              </div>
            </div>
            <Alert>
              <AlertDescription>
                Restructuring will archive the current EMI schedule and generate a new one. 
                This action requires committee approval and will be flagged for NABARD reporting.
              </AlertDescription>
            </Alert>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting || !canRestructure}>
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Restructure Loan'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
