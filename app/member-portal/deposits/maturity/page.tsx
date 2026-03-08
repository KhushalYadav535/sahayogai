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
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const overdueDeposits = deposits.filter(d => d.isOverdue);
  const upcomingDeposits = deposits.filter(d => !d.isOverdue);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 p-4 pb-20 pt-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">FDR Maturity Tracker</h1>
              <p className="text-muted-foreground text-sm">Track your upcoming deposit maturities</p>
            </div>
          </div>
          <Select value={String(daysFilter)} onValueChange={(v) => setDaysFilter(Number(v))}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Next 7 days</SelectItem>
              <SelectItem value="30">Next 30 days</SelectItem>
              <SelectItem value="60">Next 60 days</SelectItem>
              <SelectItem value="90">Next 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-sm mb-1">Total Maturity Value</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(
                      deposits.reduce((sum, d) => sum + Number(d.maturityAmount || 0), 0),
                      true
                    )}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 opacity-80" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm mb-1">Upcoming Maturities</p>
                  <p className="text-2xl font-bold">{upcomingDeposits.length}</p>
                </div>
                <Calendar className="w-8 h-8 opacity-80" />
              </div>
            </CardContent>
          </Card>
          <Card className={`bg-gradient-to-br ${overdueDeposits.length > 0 ? 'from-red-500 to-red-600' : 'from-amber-500 to-amber-600'} text-white`}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm mb-1">Overdue</p>
                  <p className="text-2xl font-bold">{overdueDeposits.length}</p>
                </div>
                <AlertTriangle className="w-8 h-8 opacity-80" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Overdue Alert */}
        {overdueDeposits.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              You have {overdueDeposits.length} deposit{overdueDeposits.length > 1 ? 's' : ''} that have matured. Please contact your society to renew or withdraw.
            </AlertDescription>
          </Alert>
        )}

        {/* Deposits List */}
        {deposits.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Clock className="w-12 h-12 text-muted-foreground mb-4 opacity-20" />
              <p className="text-muted-foreground font-medium">No deposits maturing in the next {daysFilter} days</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {deposits.map((deposit) => (
              <Card
                key={deposit.id}
                className={`overflow-hidden transition-all hover:shadow-md ${
                  deposit.isOverdue ? 'border-red-300 ring-1 ring-red-300/50' : ''
                }`}
              >
                <CardHeader className="bg-muted/20 pb-4 border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                        {deposit.depositType === 'fd' ? 'Fixed Deposit' : deposit.depositType === 'rd' ? 'Recurring Deposit' : 'MIS'}
                      </p>
                      <CardTitle className="text-lg">#{deposit.depositNumber || deposit.id.slice(0, 10).toUpperCase()}</CardTitle>
                    </div>
                    <Badge
                      className={
                        deposit.isOverdue
                          ? 'bg-red-100 text-red-800'
                          : deposit.daysUntilMaturity <= 7
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }
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
                    <div>
                      <p className="text-xs text-muted-foreground mb-1 font-medium">Principal Amount</p>
                      <p className="font-bold text-lg">{formatCurrency(Number(deposit.amount || 0), true)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1 font-medium">Maturity Amount</p>
                      <p className="font-bold text-lg text-emerald-600">{formatCurrency(Number(deposit.maturityAmount || 0), true)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1 font-medium">Interest Rate</p>
                      <p className="font-medium">{deposit.interestRate}% <span className="text-muted-foreground text-[10px]">p.a.</span></p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1 font-medium">Maturity Date</p>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <p className="font-medium">{formatDate(new Date(deposit.maturityDate))}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
