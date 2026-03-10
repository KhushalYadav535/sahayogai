'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { meApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import { ArrowLeft, Calendar, TrendingUp, AlertTriangle, Loader2, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { MemberPortalNav } from '@/components/member-portal-nav';
import { motion } from 'framer-motion';

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

export default function MaturityTrackerPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [daysFilter, setDaysFilter] = useState(30);
  const [deposits, setDeposits] = useState<any[]>([]);

  useEffect(() => {
    loadMaturityTracker();
  }, [daysFilter]);

  const loadMaturityTracker = async () => {
    try {
      setLoading(true);
      const res = await meApi.maturityTracker(daysFilter);
      if (res.success) {
        setDeposits(res.deposits || []);
      }
    } catch (err) {
      console.error("Failed to load maturity tracker", err);
      toast({ title: "Error", description: "Failed to load maturity tracker", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground animate-pulse">Loading maturities...</p>
        </div>
      </div>
    );
  }

  const overdueDeposits = deposits.filter(d => d.isOverdue);
  const upcomingDeposits = deposits.filter(d => !d.isOverdue);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 pb-24 relative">
      {/* Decorative */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

      <div className="max-w-4xl mx-auto p-4 pt-8 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="hover:bg-muted/50 rounded-xl">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gradient-primary">FDR Maturity Tracker</h1>
              <p className="text-muted-foreground text-sm mt-0.5">Track your upcoming deposit maturities</p>
            </div>
          </div>
          <Select value={String(daysFilter)} onValueChange={(v) => setDaysFilter(Number(v))}>
            <SelectTrigger className="w-40 glass border-white/20 dark:border-white/10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Next 7 days</SelectItem>
              <SelectItem value="30">Next 30 days</SelectItem>
              <SelectItem value="60">Next 60 days</SelectItem>
              <SelectItem value="90">Next 90 days</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>

        {/* Summary Cards */}
        <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div variants={fadeUp}>
            <Card className="glass hover-lift border-white/20 dark:border-white/10 shadow-lg overflow-hidden">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm mb-1 font-medium">Total Maturity Value</p>
                    <p className="text-2xl font-bold text-foreground">
                      {formatCurrency(
                        deposits.reduce((sum, d) => sum + Number(d.maturityAmount || 0), 0),
                        true
                      )}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={fadeUp}>
            <Card className="glass hover-lift border-white/20 dark:border-white/10 shadow-lg overflow-hidden">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm mb-1 font-medium">Upcoming Maturities</p>
                    <p className="text-2xl font-bold text-foreground">{upcomingDeposits.length}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={fadeUp}>
            <Card className={`glass hover-lift border-white/20 dark:border-white/10 shadow-lg overflow-hidden ${overdueDeposits.length > 0 ? 'ring-1 ring-red-300/50' : ''}`}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm mb-1 font-medium">Overdue</p>
                    <p className="text-2xl font-bold text-foreground">{overdueDeposits.length}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${overdueDeposits.length > 0 ? 'from-red-500 to-red-600 shadow-red-500/20 animate-pulse' : 'from-amber-500 to-amber-600 shadow-amber-500/20'} flex items-center justify-center shadow-lg`}>
                    <AlertTriangle className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Overdue Alert */}
        {overdueDeposits.length > 0 && (
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
            <Alert variant="destructive" className="glass border-red-300/50 dark:border-red-800/50">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You have {overdueDeposits.length} deposit{overdueDeposits.length > 1 ? 's' : ''} that have matured. Please contact your society to renew or withdraw.
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        {/* Deposits List */}
        {deposits.length === 0 ? (
          <Card className="glass border-white/20 dark:border-white/10">
            <CardContent className="flex flex-col items-center justify-center py-14">
              <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                <Clock className="w-8 h-8 text-muted-foreground opacity-30" />
              </div>
              <p className="text-muted-foreground font-medium">No deposits maturing in the next {daysFilter} days</p>
            </CardContent>
          </Card>
        ) : (
          <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
            {deposits.map((deposit) => (
              <motion.div key={deposit.id} variants={fadeUp}>
                <Card
                  className={`glass hover-lift overflow-hidden border-white/20 dark:border-white/10 shadow-lg transition-all ${deposit.isOverdue ? 'ring-1 ring-red-300/50 border-l-4 border-l-red-500' : 'border-l-4 border-l-emerald-500'
                    }`}
                >
                  <CardHeader className="bg-muted/10 pb-4 border-b border-border/30">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                          {deposit.depositType === 'fd' ? 'Fixed Deposit' : deposit.depositType === 'rd' ? 'Recurring Deposit' : 'MIS'}
                        </p>
                        <CardTitle className="text-lg">#{deposit.depositNumber || deposit.id.slice(0, 10).toUpperCase()}</CardTitle>
                      </div>
                      <Badge
                        className={`shadow-sm ${deposit.isOverdue
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 animate-pulse'
                            : deposit.daysUntilMaturity <= 7
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                          }`}
                      >
                        {deposit.isOverdue ? (
                          'OVERDUE'
                        ) : deposit.daysUntilMaturity === 0 ? (
                          'MATURES TODAY'
                        ) : deposit.daysUntilMaturity === 1 ? (
                          'MATURES TOMORROW'
                        ) : (
                          `${deposit.daysUntilMaturity} days left`
                        )}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-5">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-muted/20 p-3 rounded-xl border border-border/30">
                        <p className="text-xs text-muted-foreground mb-1 font-medium">Principal Amount</p>
                        <p className="font-bold text-lg">{formatCurrency(Number(deposit.amount || 0), true)}</p>
                      </div>
                      <div className="bg-emerald-50/50 dark:bg-emerald-950/10 p-3 rounded-xl border border-emerald-200/30 dark:border-emerald-800/20">
                        <p className="text-xs text-muted-foreground mb-1 font-medium">Maturity Amount</p>
                        <p className="font-bold text-lg text-emerald-600">{formatCurrency(Number(deposit.maturityAmount || 0), true)}</p>
                      </div>
                      <div className="bg-muted/20 p-3 rounded-xl border border-border/30">
                        <p className="text-xs text-muted-foreground mb-1 font-medium">Interest Rate</p>
                        <p className="font-medium">{deposit.interestRate}% <span className="text-muted-foreground text-[10px]">p.a.</span></p>
                      </div>
                      <div className="bg-muted/20 p-3 rounded-xl border border-border/30">
                        <p className="text-xs text-muted-foreground mb-1 font-medium">Maturity Date</p>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <p className="font-medium">{formatDate(new Date(deposit.maturityDate))}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      <MemberPortalNav />
    </div>
  );
}
