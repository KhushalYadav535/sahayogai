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
import { MemberPortalNav } from '@/components/member-portal-nav';
import { motion } from 'framer-motion';
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
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground animate-pulse">Loading EMI schedule...</p>
        </div>
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
  const progressPct = totalDue > 0 ? Math.min(100, Math.round((totalPaid / totalDue) * 100)) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 pb-24 relative">
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

      <div className="max-w-4xl mx-auto p-4 pt-8 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4"
        >
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="hover:bg-muted/50 rounded-xl">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gradient-primary">EMI Schedule</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Loan #{loan.loanNumber || loan.id}</p>
          </div>
        </motion.div>

        {/* Loan Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="glass border-white/20 dark:border-white/10 shadow-xl overflow-hidden">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-white" />
                  </div>
                  Loan Details
                </span>
                <Badge className={`shadow-sm ${loan.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' : ''}`}>
                  {loan.status}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-muted/20 p-3 rounded-xl border border-border/30">
                  <p className="text-xs text-muted-foreground mb-1 font-medium">Principal Amount</p>
                  <p className="font-bold text-lg">{formatCurrency(Number(loan.principalAmount || loan.disbursedAmount || 0), true)}</p>
                </div>
                <div className="bg-primary/5 p-3 rounded-xl border border-primary/10">
                  <p className="text-xs text-muted-foreground mb-1 font-medium">Outstanding</p>
                  <p className="font-bold text-lg text-primary">{formatCurrency(Number(loan.outstandingPrincipal || 0), true)}</p>
                </div>
                <div className="bg-emerald-50/50 dark:bg-emerald-950/10 p-3 rounded-xl border border-emerald-200/30 dark:border-emerald-800/20">
                  <p className="text-xs text-muted-foreground mb-1 font-medium">Total Paid</p>
                  <p className="font-bold text-lg text-emerald-600">{formatCurrency(totalPaid, true)}</p>
                </div>
                <div className="bg-muted/20 p-3 rounded-xl border border-border/30">
                  <p className="text-xs text-muted-foreground mb-1 font-medium">Total Due</p>
                  <p className="font-bold text-lg">{formatCurrency(totalDue, true)}</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground font-medium">Repayment Progress</span>
                  <span className="font-bold text-primary">{progressPct}%</span>
                </div>
                <div className="h-3 bg-muted/50 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPct}%` }}
                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
                    className="h-full bg-gradient-to-r from-primary to-accent rounded-full shadow-sm"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Schedule Stats */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-3 gap-4"
        >
          <Card className="glass hover-lift border-white/20 dark:border-white/10 shadow-lg">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mx-auto mb-2 shadow-lg shadow-emerald-500/20">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <p className="text-2xl font-bold text-foreground">{paidCount}</p>
                <p className="text-xs text-muted-foreground mt-1 font-medium">Paid EMIs</p>
              </div>
            </CardContent>
          </Card>
          <Card className="glass hover-lift border-white/20 dark:border-white/10 shadow-lg">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center mx-auto mb-2 shadow-lg shadow-amber-500/20">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <p className="text-2xl font-bold text-foreground">{pendingCount}</p>
                <p className="text-xs text-muted-foreground mt-1 font-medium">Pending EMIs</p>
              </div>
            </CardContent>
          </Card>
          <Card className="glass hover-lift border-white/20 dark:border-white/10 shadow-lg">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center mx-auto mb-2 shadow-lg shadow-red-500/20 ${overdueCount > 0 ? 'animate-pulse' : ''}`}>
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
                <p className="text-2xl font-bold text-foreground">{overdueCount}</p>
                <p className="text-xs text-muted-foreground mt-1 font-medium">Overdue EMIs</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* EMI Schedule Table */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="glass border-white/20 dark:border-white/10 shadow-xl overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="w-1 h-5 bg-gradient-to-b from-primary to-primary/50 rounded-full" />
                EMI Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/20">
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
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                          No EMI schedule available
                        </TableCell>
                      </TableRow>
                    ) : (
                      schedule.map((emi: any) => {
                        const dueDate = new Date(emi.dueDate);
                        const isOverdue = emi.status === 'overdue' || (dueDate < new Date() && emi.status !== 'paid');
                        return (
                          <TableRow key={emi.id} className={`transition-colors ${isOverdue ? 'bg-red-50/50 dark:bg-red-950/10' : 'hover:bg-muted/20'}`}>
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
                            <TableCell className="text-right text-emerald-600 font-medium">
                              {formatCurrency(Number(emi.paidAmount || 0), true)}
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={`shadow-sm ${emi.status === 'paid'
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                                    : emi.status === 'overdue' || isOverdue
                                      ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                      : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                                  }`}
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
        </motion.div>

        {/* Overdue Alert */}
        {overdueCount > 0 && (
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
            <Alert variant="destructive" className="glass border-red-300/50 dark:border-red-800/50">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You have {overdueCount} overdue EMI{overdueCount > 1 ? 's' : ''}. Please pay immediately to avoid penalties.
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </div>

      <MemberPortalNav />
    </div>
  );
}
