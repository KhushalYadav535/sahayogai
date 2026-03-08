'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { sbApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function BulkDividendPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    dividendRate: '',
    resolutionRef: '',
    fiscalYear: new Date().getFullYear() + '-' + String(new Date().getFullYear() + 1).slice(-2),
  });
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    try {
      const res = await sbApi.bulkDividendCredit({
        dividendRate: parseFloat(formData.dividendRate),
        resolutionRef: formData.resolutionRef,
        fiscalYear: formData.fiscalYear,
      });
      setResult(res);
      toast({
        title: 'Success',
        description: `Dividend credited to ${res.totalCredited} accounts. ${res.totalFailed} failed.`,
      });
    } catch (e) {
      toast({ title: 'Error', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/accounts">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Bulk Dividend Credit</h1>
          <p className="text-muted-foreground mt-1">Credit declared dividend to all eligible member SB accounts</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dividend Declaration</CardTitle>
          <CardDescription>Enter dividend rate and resolution reference</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Dividend Rate (%) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.dividendRate}
                  onChange={(e) => setFormData({ ...formData, dividendRate: e.target.value })}
                  placeholder="e.g., 8.5"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">Percentage of share face value (₹100)</p>
              </div>
              <div>
                <Label>Fiscal Year *</Label>
                <Input
                  value={formData.fiscalYear}
                  onChange={(e) => setFormData({ ...formData, fiscalYear: e.target.value })}
                  placeholder="2024-25"
                  required
                />
              </div>
              <div className="col-span-2">
                <Label>BOD Resolution Reference *</Label>
                <Input
                  value={formData.resolutionRef}
                  onChange={(e) => setFormData({ ...formData, resolutionRef: e.target.value })}
                  placeholder="RES-2024-001"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">Reference number of the resolution declaring dividend</p>
              </div>
            </div>
            <Alert>
              <AlertDescription>
                This will credit dividend to all active members with shares and active SB accounts. 
                Each member will receive: (Shares × ₹100 × Dividend Rate %).
              </AlertDescription>
            </Alert>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={processing}>
                {processing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Credit Dividend'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Processing Results</CardTitle>
            <CardDescription>
              {result.totalCredited} accounts credited successfully, {result.totalFailed} failed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {result.results && result.results.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Successful Credits ({result.results.length})
                </h3>
                <div className="max-h-60 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Member ID</TableHead>
                        <TableHead>Shares</TableHead>
                        <TableHead className="text-right">Dividend Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.results.slice(0, 20).map((r: any, idx: number) => (
                        <TableRow key={idx}>
                          <TableCell className="font-mono">{r.memberId}</TableCell>
                          <TableCell>{r.shares}</TableCell>
                          <TableCell className="text-right font-semibold">₹{r.dividendAmount.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {result.results.length > 20 && (
                    <p className="text-xs text-muted-foreground mt-2">Showing first 20 of {result.results.length} results</p>
                  )}
                </div>
              </div>
            )}

            {result.errors && result.errors.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-600" />
                  Errors ({result.errors.length})
                </h3>
                <div className="max-h-60 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Member ID</TableHead>
                        <TableHead>Error</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.errors.map((e: any, idx: number) => (
                        <TableRow key={idx}>
                          <TableCell className="font-mono">{e.memberId}</TableCell>
                          <TableCell className="text-red-600">{e.error}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
