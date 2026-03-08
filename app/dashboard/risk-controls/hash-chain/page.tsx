'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Hash, RefreshCw, CheckCircle, XCircle, Search } from 'lucide-react';
import { riskControlsApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/utils/formatters';

export default function HashChainPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [hashChain, setHashChain] = useState<any>(null);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const handleVerify = async () => {
    setLoading(true);
    try {
      const res = await riskControlsApi.auditLogHashChain({
        from: fromDate || undefined,
        to: toDate || undefined,
      });
      if (res.success) {
        setHashChain(res);
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to verify hash chain', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Hash className="w-8 h-8" />
          Audit Log Hash Chain Verification
        </h1>
        <p className="text-muted-foreground mt-1">Verify audit log immutability using cryptographic hash chain</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Verification Parameters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fromDate">From Date</Label>
              <Input
                id="fromDate"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="toDate">To Date</Label>
              <Input
                id="toDate"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
          </div>
          <Button onClick={handleVerify} disabled={loading} className="w-full">
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                Verify Hash Chain
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {hashChain && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Logs</CardTitle>
                <Hash className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{hashChain.totalLogs}</div>
                <p className="text-xs text-muted-foreground">Audit log entries</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Hash Chain Length</CardTitle>
                <Hash className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{hashChain.hashChainLength}</div>
                <p className="text-xs text-muted-foreground">Verified entries</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Chain Integrity</CardTitle>
                {hashChain.allValid ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {hashChain.allValid ? 'Valid' : 'Invalid'}
                </div>
                <p className="text-xs text-muted-foreground">Hash chain status</p>
              </CardContent>
            </Card>
          </div>

          {hashChain.allValid ? (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                All audit log entries in the hash chain are valid. No tampering detected.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                Hash chain verification failed. Some audit log entries may have been tampered with. Immediate investigation required.
              </AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Hash Chain Details</CardTitle>
            </CardHeader>
            <CardContent>
              {hashChain.hashChain.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No hash chain entries found</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Audit Log ID</TableHead>
                      <TableHead>Hash</TableHead>
                      <TableHead>Valid</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {hashChain.hashChain.map((entry: any, idx: number) => (
                      <TableRow key={entry.auditLogId}>
                        <TableCell className="font-mono text-xs">{entry.auditLogId}</TableCell>
                        <TableCell className="font-mono text-xs max-w-md truncate">
                          {entry.hash}
                        </TableCell>
                        <TableCell>
                          {entry.isValid ? (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Valid
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800">
                              <XCircle className="w-3 h-3 mr-1" />
                              Invalid
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
