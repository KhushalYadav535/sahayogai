'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DollarSign, RefreshCw, AlertTriangle, TrendingUp } from 'lucide-react';
import { riskControlsApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/utils/formatters';

export default function DailyLimitsPage() {
  const { toast } = useToast();
  const [limits, setLimits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterUserId, setFilterUserId] = useState('');
  const [filterAccountId, setFilterAccountId] = useState('');

  useEffect(() => {
    fetchLimits();
  }, []);

  const fetchLimits = async () => {
    setLoading(true);
    try {
      const res = await riskControlsApi.dailyLimits(
        {
          userId: filterUserId || undefined,
          accountId: filterAccountId || undefined,
        }
      );
      if (res.success) {
        setLimits(res.limits || []);
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to load daily limits', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const getUsagePercentage = (used: number, limit: number) => {
    return limit > 0 ? (used / limit) * 100 : 0;
  };

  const getStatusBadge = (percentage: number) => {
    if (percentage >= 100) return <Badge className="bg-red-100 text-red-800">Exceeded</Badge>;
    if (percentage >= 80) return <Badge className="bg-orange-100 text-orange-800">Warning</Badge>;
    if (percentage >= 50) return <Badge className="bg-yellow-100 text-yellow-800">Moderate</Badge>;
    return <Badge className="bg-green-100 text-green-800">Normal</Badge>;
  };

  const todayLimits = limits.filter(l => {
    const limitDate = new Date(l.date);
    const today = new Date();
    return limitDate.toDateString() === today.toDateString();
  });

  const totalUsed = todayLimits.reduce((sum, l) => sum + Number(l.amountUsed), 0);
  const totalLimit = todayLimits.reduce((sum, l) => sum + Number(l.limitAmount), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <DollarSign className="w-8 h-8" />
          Daily Transaction Limits
        </h1>
        <p className="text-muted-foreground mt-1">Monitor and manage daily transaction limits</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Used Today</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalUsed.toLocaleString('en-IN')}</div>
            <p className="text-xs text-muted-foreground">of ₹{totalLimit.toLocaleString('en-IN')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Remaining</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{Math.max(0, totalLimit - totalUsed).toLocaleString('en-IN')}</div>
            <p className="text-xs text-muted-foreground">
              {getUsagePercentage(totalUsed, totalLimit).toFixed(1)}% used
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Limits</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayLimits.length}</div>
            <p className="text-xs text-muted-foreground">Tracked today</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Daily Limit Records</CardTitle>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Filter by User ID"
                value={filterUserId}
                onChange={(e) => setFilterUserId(e.target.value)}
                className="w-48"
              />
              <Input
                placeholder="Filter by Account ID"
                value={filterAccountId}
                onChange={(e) => setFilterAccountId(e.target.value)}
                className="w-48"
              />
              <Button onClick={fetchLimits} variant="outline" size="sm" disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading limits...</div>
          ) : limits.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No daily limit records found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>User ID</TableHead>
                  <TableHead>Account ID</TableHead>
                  <TableHead>Limit Type</TableHead>
                  <TableHead>Limit Amount</TableHead>
                  <TableHead>Amount Used</TableHead>
                  <TableHead>Remaining</TableHead>
                  <TableHead>Usage %</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {limits.map((limit) => {
                  const used = Number(limit.amountUsed);
                  const limitAmount = Number(limit.limitAmount);
                  const remaining = limitAmount - used;
                  const percentage = getUsagePercentage(used, limitAmount);
                  
                  return (
                    <TableRow key={limit.id}>
                      <TableCell>{formatDate(limit.date)}</TableCell>
                      <TableCell className="font-mono text-xs">{limit.userId || '—'}</TableCell>
                      <TableCell className="font-mono text-xs">{limit.accountId || '—'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{limit.limitType}</Badge>
                      </TableCell>
                      <TableCell>₹{limitAmount.toLocaleString('en-IN')}</TableCell>
                      <TableCell>₹{used.toLocaleString('en-IN')}</TableCell>
                      <TableCell>
                        <span className={remaining < 0 ? 'text-red-600 font-semibold' : ''}>
                          ₹{Math.max(0, remaining).toLocaleString('en-IN')}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                percentage >= 100
                                  ? 'bg-red-600'
                                  : percentage >= 80
                                  ? 'bg-orange-500'
                                  : percentage >= 50
                                  ? 'bg-yellow-500'
                                  : 'bg-green-500'
                              }`}
                              style={{ width: `${Math.min(100, percentage)}%` }}
                            />
                          </div>
                          <span className="text-xs">{percentage.toFixed(1)}%</span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(percentage)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {limits.some(l => {
        const used = Number(l.amountUsed);
        const limitAmount = Number(l.limitAmount);
        return getUsagePercentage(used, limitAmount) >= 80;
      }) && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Some daily limits are approaching or have exceeded their thresholds. Review transactions to ensure compliance.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
