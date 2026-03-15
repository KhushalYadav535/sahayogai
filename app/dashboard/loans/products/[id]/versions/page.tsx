'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loanProductsApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { ArrowLeft, GitCompare, Loader2, Eye } from 'lucide-react';
import Link from 'next/link';
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  PENDING_APPROVAL: 'bg-yellow-100 text-yellow-800',
  ACTIVE: 'bg-green-100 text-green-800',
  SUPERSEDED: 'bg-blue-100 text-blue-800',
  DEACTIVATED: 'bg-red-100 text-red-800',
};

export default function LoanProductVersionsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [productId, setProductId] = useState<string | null>(null);
  const [product, setProduct] = useState<any>(null);
  const [versions, setVersions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [comparison, setComparison] = useState<any>(null);
  const [isCompareDialogOpen, setIsCompareDialogOpen] = useState(false);
  const [version1, setVersion1] = useState('');
  const [version2, setVersion2] = useState('');

  useEffect(() => {
    params.then(p => {
      setProductId(p.id);
      fetchData(p.id);
    });
  }, [params]);

  const fetchData = async (id: string) => {
    try {
      setLoading(true);
      const [productRes, versionsRes] = await Promise.all([
        loanProductsApi.get(id),
        loanProductsApi.versions(id),
      ]);

      if (productRes.success) {
        setProduct(productRes.product);
      }

      if (versionsRes.success) {
        setVersions(versionsRes.versions || []);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load version history',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCompare = async () => {
    if (!productId || !version1 || !version2) return;
    try {
      const response = await loanProductsApi.compare(productId, version1, version2);
      if (response.success) {
        setComparison(response.comparison);
        setIsCompareDialogOpen(true);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to compare versions',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/loans/products/${productId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Version History</h1>
          <p className="text-muted-foreground">
            {product?.productName} ({product?.productCode})
          </p>
        </div>
      </div>

      {/* Compare Versions */}
      <Card>
        <CardHeader>
          <CardTitle>Compare Versions</CardTitle>
          <CardDescription>Select two versions to compare side-by-side</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Version 1</label>
              <Select value={version1} onValueChange={setVersion1}>
                <SelectTrigger>
                  <SelectValue placeholder="Select version" />
                </SelectTrigger>
                <SelectContent>
                  {versions.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      Version {v.version} - {v.status} ({new Date(v.createdAt).toLocaleDateString()})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Version 2</label>
              <Select value={version2} onValueChange={setVersion2}>
                <SelectTrigger>
                  <SelectValue placeholder="Select version" />
                </SelectTrigger>
                <SelectContent>
                  {versions.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      Version {v.version} - {v.status} ({new Date(v.createdAt).toLocaleDateString()})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleCompare} disabled={!version1 || !version2 || version1 === version2}>
              <GitCompare className="w-4 h-4 mr-2" />
              Compare
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Versions List */}
      <Card>
        <CardHeader>
          <CardTitle>All Versions ({versions.length})</CardTitle>
          <CardDescription>Complete version history of this loan product</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Version</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Approved</TableHead>
                <TableHead>Maker</TableHead>
                <TableHead>Checker</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {versions.map((version) => (
                <TableRow key={version.id}>
                  <TableCell className="font-mono font-medium">v{version.version}</TableCell>
                  <TableCell>
                    <Badge className={statusColors[version.status] || statusColors.DRAFT}>
                      {version.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(version.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {version.approvedAt ? new Date(version.approvedAt).toLocaleDateString() : '-'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {version.makerId ? `User ${version.makerId.slice(-6)}` : '-'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {version.checkerId ? `User ${version.checkerId.slice(-6)}` : '-'}
                  </TableCell>
                  <TableCell>
                    <Link href={`/dashboard/loans/products/${version.id}`}>
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Comparison Dialog */}
      <Dialog open={isCompareDialogOpen} onOpenChange={setIsCompareDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Version Comparison</DialogTitle>
            <DialogDescription>
              Side-by-side comparison of selected versions
            </DialogDescription>
          </DialogHeader>
          {comparison && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Version {comparison.version1?.version}</h3>
                  <div className="space-y-2 text-sm">
                    {Object.entries(comparison.version1 || {}).map(([key, value]: [string, any]) => (
                      key !== 'id' && key !== 'version' && (
                        <div key={key}>
                          <span className="font-medium">{key}:</span> {String(value)}
                        </div>
                      )
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Version {comparison.version2?.version}</h3>
                  <div className="space-y-2 text-sm">
                    {Object.entries(comparison.version2 || {}).map(([key, value]: [string, any]) => (
                      key !== 'id' && key !== 'version' && (
                        <div key={key}>
                          <span className="font-medium">{key}:</span> {String(value)}
                        </div>
                      )
                    ))}
                  </div>
                </div>
              </div>
              {comparison.changes && comparison.changes.length > 0 && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-2">Changes Detected ({comparison.changes.length})</h3>
                  <div className="space-y-2">
                    {comparison.changes.map((change: any, idx: number) => (
                      <div key={idx} className="p-2 bg-yellow-50 dark:bg-yellow-950 rounded">
                        <span className="font-medium">{change.field}:</span>{' '}
                        <span className="text-red-600">{String(change.oldValue)}</span> →{' '}
                        <span className="text-green-600">{String(change.newValue)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
