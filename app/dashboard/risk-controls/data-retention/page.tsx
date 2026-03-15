'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, RefreshCw, Archive, Trash2, Database } from 'lucide-react';
import { riskControlsApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/utils/formatters';

export default function DataRetentionPage() {
  const { toast } = useToast();
  const [retention, setRetention] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchRetention();
  }, [categoryFilter, statusFilter]);

  const fetchRetention = async () => {
    setLoading(true);
    try {
      const res = await riskControlsApi.dataRetention({
        category: categoryFilter || undefined,
        status: statusFilter || undefined,
      });
      if (res.success) {
        setRetention(res.retention || []);
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to load data retention records', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      ACTIVE: 'bg-green-100 text-green-800',
      ARCHIVED: 'bg-blue-100 text-blue-800',
      PURGED: 'bg-gray-100 text-gray-800',
    };
    return <Badge className={colors[status] || 'bg-gray-100 text-gray-800'}>{status}</Badge>;
  };

  const getCategoryBadge = (category: string) => {
    return <Badge variant="outline">{category}</Badge>;
  };

  const activeCount = retention.filter(r => r.status === 'ACTIVE').length;
  const archivedCount = retention.filter(r => r.status === 'ARCHIVED').length;
  const purgedCount = retention.filter(r => r.status === 'PURGED').length;
  const dueForArchive = retention.filter(r => {
    if (r.status !== 'ACTIVE') return false;
    const retentionUntil = new Date(r.retentionUntil);
    return retentionUntil <= new Date();
  }).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Clock className="w-8 h-8" />
          Data Retention Policy
        </h1>
        <p className="text-muted-foreground mt-1">Monitor data retention and archival status</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Records</CardTitle>
            <Database className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCount}</div>
            <p className="text-xs text-muted-foreground">In active storage</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Archived</CardTitle>
            <Archive className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{archivedCount}</div>
            <p className="text-xs text-muted-foreground">Moved to archive</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Purged</CardTitle>
            <Trash2 className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{purgedCount}</div>
            <p className="text-xs text-muted-foreground">Permanently deleted</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Due for Archive</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dueForArchive}</div>
            <p className="text-xs text-muted-foreground">Ready to archive</p>
          </CardContent>
        </Card>
      </div>

      {dueForArchive > 0 && (
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertDescription>
            {dueForArchive} record(s) are due for archival based on retention policy. Archive job will process these automatically.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Data Retention Records</CardTitle>
            <div className="flex items-center gap-2">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="TRANSACTION">Transaction</SelectItem>
                  <SelectItem value="AUDIT_LOG">Audit Log</SelectItem>
                  <SelectItem value="KYC_AML">KYC/AML</SelectItem>
                  <SelectItem value="AI_DECISION">AI Decision</SelectItem>
                  <SelectItem value="MEMBER">Member</SelectItem>
                  <SelectItem value="COMMUNICATION">Communication</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="ARCHIVED">Archived</SelectItem>
                  <SelectItem value="PURGED">Purged</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={fetchRetention} variant="outline" size="sm" disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading retention records...</div>
          ) : retention.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No retention records found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Record ID</TableHead>
                  <TableHead>Retention Until</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Archived At</TableHead>
                  <TableHead>Purged At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {retention.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{getCategoryBadge(record.dataCategory)}</TableCell>
                    <TableCell className="font-mono text-xs">{record.recordId}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {formatDate(record.retentionUntil)}
                        {new Date(record.retentionUntil) <= new Date() && record.status === 'ACTIVE' && (
                          <Badge className="bg-orange-100 text-orange-800">Due</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(record.status)}</TableCell>
                    <TableCell>{record.archivedAt ? formatDate(record.archivedAt) : '—'}</TableCell>
                    <TableCell>{record.purgedAt ? formatDate(record.purgedAt) : '—'}</TableCell>
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
