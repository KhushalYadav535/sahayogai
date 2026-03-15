'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { approvalsApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import { toast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils/formatters';

export default function ApprovalComparisonPage({ params }: { params: Promise<{ id: string; source: string }> }) {
  const router = useRouter();
  const [comparison, setComparison] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    params.then(p => {
      fetchComparison(p.id, p.source);
    });
  }, [params]);

  const fetchComparison = async (id: string, source: string) => {
    try {
      setLoading(true);
      const response = await approvalsApi.getComparison(id, source);
      if (response.success) {
        setComparison(response.comparison);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load comparison',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!comparison) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No comparison data available</p>
        <Link href="/dashboard/approvals">
          <Button variant="outline" className="mt-4">
            Back to Approvals
          </Button>
        </Link>
      </div>
    );
  }

  const renderFieldValue = (value: any) => {
    if (value === null || value === undefined) return <span className="text-muted-foreground italic">Not set</span>;
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'number') return formatCurrency(value);
    return String(value);
  };

  const isChanged = (field: string) => {
    return comparison.changes?.some((c: any) => c.field === field);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/approvals">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Side-by-Side Comparison</h1>
          <p className="text-muted-foreground">Review changes before approval</p>
        </div>
      </div>

      {/* Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle>Parameter Comparison</CardTitle>
          <CardDescription>
            Current (Active) values on the left, Proposed values on the right
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-semibold">Field</th>
                  <th className="text-left p-3 font-semibold bg-blue-50 dark:bg-blue-950">Current (Active)</th>
                  <th className="text-left p-3 font-semibold bg-green-50 dark:bg-green-950">Proposed</th>
                </tr>
              </thead>
              <tbody>
                {comparison.changes?.map((change: any, idx: number) => (
                  <tr key={idx} className="border-b hover:bg-muted/50">
                    <td className="p-3 font-medium">
                      {change.field.replace(/([A-Z])/g, ' $1').trim()}
                      {isChanged(change.field) && (
                        <Badge className="ml-2 bg-yellow-100 text-yellow-800">Changed</Badge>
                      )}
                    </td>
                    <td className={`p-3 ${isChanged(change.field) ? 'bg-red-50 dark:bg-red-950' : ''}`}>
                      {renderFieldValue(change.current)}
                    </td>
                    <td className={`p-3 ${isChanged(change.field) ? 'bg-green-50 dark:bg-green-950' : ''}`}>
                      {renderFieldValue(change.proposed)}
                    </td>
                  </tr>
                ))}
                {(!comparison.changes || comparison.changes.length === 0) && (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-muted-foreground">
                      {comparison.current ? 'No changes detected' : 'New item - no current version'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Changes</p>
              <p className="text-2xl font-bold">{comparison.changes?.length || 0}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge className={
                comparison.proposed?.status === 'PENDING_APPROVAL' 
                  ? 'bg-yellow-100 text-yellow-800' 
                  : 'bg-gray-100 text-gray-800'
              }>
                {comparison.proposed?.status || 'Pending'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
