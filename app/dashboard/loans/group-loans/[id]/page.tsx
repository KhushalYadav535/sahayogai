'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loansApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Loader2, CheckCircle, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils/formatters';

export default function GroupLoanDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const [groupLoan, setGroupLoan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [disburseOpen, setDisburseOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    interestRate: '',
    tenureMonths: '',
  });

  useEffect(() => {
    loansApi.listGroupLoans().then(res => {
      if (res.success) {
        const found = res.groupLoans?.find((gl: any) => gl.id === params.id);
        setGroupLoan(found);
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, [params.id]);

  const handleDisburse = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await loansApi.disburseGroupLoan(params.id, {
        interestRate: parseFloat(formData.interestRate),
        tenureMonths: parseInt(formData.tenureMonths),
      });
      if (res.success) {
        toast({ title: 'Success', description: res.message });
        setDisburseOpen(false);
        setTimeout(() => router.push('/dashboard/loans/group-loans'), 2000);
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to disburse', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  if (!groupLoan) {
    return <div className="flex items-center justify-center min-h-[400px]"><p>Group loan not found</p></div>;
  }

  const totalDisbursed = groupLoan.loans?.reduce((sum: number, l: any) => sum + Number(l.outstandingPrincipal || 0), 0) || 0;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/loans/group-loans">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">{groupLoan.groupName}</h1>
          <p className="text-muted-foreground mt-1">Group Code: {groupLoan.groupCode}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Loan Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{Number(groupLoan.totalLoanAmount).toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{groupLoan.members?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Disbursed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₹{totalDisbursed.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Group Members</span>
            {groupLoan.status === 'active' && groupLoan.loans?.length === 0 && (
              <Button onClick={() => setDisburseOpen(true)}>
                <TrendingUp className="w-4 h-4 mr-2" />
                Disburse Loans
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Member Number</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Loan Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groupLoan.members?.map((gm: any) => (
                <TableRow key={gm.id}>
                  <TableCell>
                    {gm.member ? `${gm.member.firstName} ${gm.member.lastName}` : 'N/A'}
                  </TableCell>
                  <TableCell className="font-mono">{gm.member?.memberNumber || '-'}</TableCell>
                  <TableCell>
                    <Badge>{gm.role || 'MEMBER'}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    ₹{Number(gm.individualLoanAmount).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge className={gm.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                      {gm.isActive ? 'Active' : 'Exited'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {groupLoan.loans && groupLoan.loans.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Disbursed Loans</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Loan Number</TableHead>
                  <TableHead className="text-right">Outstanding</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groupLoan.loans.map((loan: any) => (
                  <TableRow key={loan.loanNumber}>
                    <TableCell className="font-mono">{loan.loanNumber}</TableCell>
                    <TableCell className="text-right">
                      ₹{Number(loan.outstandingPrincipal || 0).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge className={loan.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                        {loan.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => router.push(`/dashboard/loans/${loan.id}`)}>
                        View Loan
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={disburseOpen} onOpenChange={setDisburseOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disburse Group Loans</DialogTitle>
            <DialogDescription>
              Create and disburse individual loans for all group members
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleDisburse} className="space-y-4">
            <div>
              <Label>Interest Rate (%) *</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formData.interestRate}
                onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Tenure (Months) *</Label>
              <Input
                type="number"
                min="1"
                max="60"
                value={formData.tenureMonths}
                onChange={(e) => setFormData({ ...formData, tenureMonths: e.target.value })}
                required
              />
            </div>
            <Alert>
              <AlertDescription className="text-xs">
                This will create individual loans for all {groupLoan.members?.length || 0} members with the specified interest rate and tenure.
                Each member will get their allocated loan amount as per the group loan structure.
              </AlertDescription>
            </Alert>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDisburseOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Disbursing...
                  </>
                ) : (
                  'Disburse All Loans'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
