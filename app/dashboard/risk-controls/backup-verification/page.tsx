'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Database, RefreshCw, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { riskControlsApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/utils/formatters';

export default function BackupVerificationPage() {
  const { toast } = useToast();
  const [verifications, setVerifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [daysFilter, setDaysFilter] = useState(7);

  useEffect(() => {
    fetchVerifications();
  }, [daysFilter]);

  const fetchVerifications = async () => {
    setLoading(true);
    try {
      const res = await riskControlsApi.backupVerification({ days: daysFilter });
      if (res.success) {
        setVerifications(res.verifications || []);
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to load backup verifications', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const successCount = verifications.filter(v => v.status === 'SUCCESS').length;
  const failedCount = verifications.filter(v => v.status === 'FAILED').length;
  const successRate = verifications.length > 0 ? (successCount / verifications.length) * 100 : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Database className="w-8 h-8" />
          Backup Verification
        </h1>
        <p className="text-muted-foreground mt-1">Monitor daily backup integrity verification status</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Verifications</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{verifications.length}</div>
            <p className="text-xs text-muted-foreground">Last {daysFilter} days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Successful</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{successCount}</div>
            <p className="text-xs text-muted-foreground">Backups verified</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{failedCount}</div>
            <p className="text-xs text-muted-foreground">Verification failures</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Verification accuracy</p>
          </CardContent>
        </Card>
      </div>

      {failedCount > 0 && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            {failedCount} backup verification(s) failed in the last {daysFilter} days. Please investigate immediately.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Verification History</CardTitle>
            <div className="flex items-center gap-2">
              <Select value={daysFilter.toString()} onValueChange={(v) => setDaysFilter(Number(v))}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={fetchVerifications} variant="outline" size="sm" disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading verifications...</div>
          ) : verifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No verification records found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Backup Date</TableHead>
                  <TableHead>Verification Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Live DB Rows</TableHead>
                  <TableHead>Backup Rows</TableHead>
                  <TableHead>Verified By</TableHead>
                  <TableHead>Error</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {verifications.map((verification) => (
                  <TableRow key={verification.id}>
                    <TableCell>{formatDate(verification.backupDate)}</TableCell>
                    <TableCell>{formatDate(verification.verificationDate)}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          verification.status === 'SUCCESS'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }
                      >
                        {verification.status === 'SUCCESS' ? (
                          <>
                            <CheckCircle className="w-3 h-3 mr-1" />
                            SUCCESS
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 mr-1" />
                            FAILED
                          </>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {verification.rowCountLive
                        ? verification.rowCountLive.toLocaleString('en-IN')
                        : '—'}
                    </TableCell>
                    <TableCell>
                      {verification.rowCountBackup
                        ? verification.rowCountBackup.toLocaleString('en-IN')
                        : '—'}
                    </TableCell>
                    <TableCell>{verification.verifiedBy || 'System'}</TableCell>
                    <TableCell className="max-w-xs truncate text-red-600">
                      {verification.errorMessage || '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
