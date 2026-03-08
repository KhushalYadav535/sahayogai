'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { meApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import { ArrowLeft, CheckCircle, AlertTriangle, Calendar, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { use } from 'react';

interface LoanSchedulePageProps {
  params: Promise<{ id: string }>;
}

export default function LoanSchedulePage({ params }: LoanSchedulePageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { id: loanId } = use(params);
  const [loading, setLoading] = useState(true);
  const [loan, setLoan] = useState<any>(null);
  const [schedule, setSchedule] = useState<any[]>([]);

  useEffect(() => {
    async function loadSchedule() {
      try {
        const res = await meApi.loanSchedule(loanId);
        if (res.success && res.loan) {
          setLoan(res.loan);
          setSchedule(res.loan.emiSchedule || []);
        } else {
          toast({ title: "Error", description: "Loan not found", variant: "destructive" });
          router.push('/portal/loans');
        }
      } catch (err) {
        console.error("Failed to load loan schedule", err);
        toast({ title: "Error", description: "Failed to load loan schedule", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    }
    loadSchedule();
  }, [loanId, router, toast]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!loan) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loan not found</p>
      </div>
    );
  }

  const paidCount = schedule.filter(e => e.status === 'paid').length;
  const pendingCount = schedule.filter(e => e.status === 'pending').length;
  const overdueCount = schedule.filter(e => e.status === 'overdue').length;
  const totalPaid = schedule.filter(e => e.status === 'paid').reduce((sum, e) => sum + Number(e.paidAmount || 0), 0);
  const totalDue = schedule.reduce((sum, e) => sum + Number(e.totalEmi || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 p-4 pb-20 pt-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">EMI Schedule</h1>
            <p className="text-muted-foreground text-sm">Loan #{loan.loanNumber || loan.id}</p>
          </div>
        </div>

        {/* Loan Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Loan Details</span>
              <Badge className={loan.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : ''}>
                {loan.status}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Principal Amount</p>
                <p className="font-bold text-lg">{formatCurrency(Number(loan.principalAmount || loan.disbursedAmount || 0), true)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Outstanding</p>
                <p className="font-bold text-lg text-primary">{formatCurrency(Number(loan.outstandingPrincipal || 0), true)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Total Paid</p>
                <p className="font-bold text-lg text-emerald-600">{formatCurrency(totalPaid, true)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Total Due</p>
                <p className="font-bold text-lg">{formatCurrency(totalDue, true)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Schedule Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-emerald-50 border-emerald-200">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-emerald-700">{paidCount}</p>
                <p className="text-xs text-emerald-600 mt-1">Paid EMIs</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-amber-700">{pendingCount}</p>
                <p className="text-xs text-amber-600 mt-1">Pending EMIs</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-red-50 border-red-200">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-red-700">{overdueCount}</p>
                <p className="text-xs text-red-600 mt-1">Overdue EMIs</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* EMI Schedule Table */}
        <Card>
          <CardHeader>
            <CardTitle>EMI Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="text-right">Principal</TableHead>
                    <TableHead className="text-right">Interest</TableHead>
                    <TableHead className="text-right">Total EMI</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedule.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No EMI schedule available
                      </TableCell>
                    </TableRow>
                  ) : (
                    schedule.map((emi: any) => {
                      const dueDate = new Date(emi.dueDate);
                      const isOverdue = emi.status === 'overdue' || (dueDate < new Date() && emi.status !== 'paid');
                      return (
                        <TableRow key={emi.id} className={isOverdue ? 'bg-red-50 dark:bg-red-950/20' : ''}>
                          <TableCell className="font-medium">{emi.installmentNo}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              {formatDate(dueDate)}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{formatCurrency(Number(emi.principal || 0), true)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(Number(emi.interest || 0), true)}</TableCell>
                          <TableCell className="text-right font-semibold">{formatCurrency(Number(emi.totalEmi || 0), true)}</TableCell>
                          <TableCell className="text-right text-emerald-600">
                            {formatCurrency(Number(emi.paidAmount || 0), true)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={
                                emi.status === 'paid'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : emi.status === 'overdue' || isOverdue
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-amber-100 text-amber-800'
                              }
                            >
                              {emi.status === 'paid' ? (
                                <><CheckCircle className="w-3 h-3 mr-1" /> Paid</>
                              ) : isOverdue ? (
                                <><AlertTriangle className="w-3 h-3 mr-1" /> Overdue</>
                              ) : (
                                'Pending'
                              )}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Overdue Alert */}
        {overdueCount > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              You have {overdueCount} overdue EMI{overdueCount > 1 ? 's' : ''}. Please pay immediately to avoid penalties.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
