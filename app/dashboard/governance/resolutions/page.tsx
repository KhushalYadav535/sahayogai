'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { governanceApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ResolutionsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [resolutions, setResolutions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [meetingTypeFilter, setMeetingTypeFilter] = useState('');

  useEffect(() => {
    loadResolutions();
  }, [statusFilter, meetingTypeFilter]);

  const loadResolutions = async () => {
    try {
      const res = await governanceApi.resolutions.list({
        search: searchTerm || undefined,
        status: statusFilter || undefined,
        meetingType: meetingTypeFilter || undefined,
      });
      setResolutions(res.data || []);
    } catch (e) {
      toast({ title: 'Error', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadResolutions();
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PASSED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
      DEFERRED: 'bg-yellow-100 text-yellow-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Resolutions Repository</h1>
          <p className="text-muted-foreground mt-1">Search and manage all society resolutions</p>
        </div>
        <Button onClick={() => router.push('/dashboard/governance/resolutions/new')}>
          <Plus className="w-4 h-4 mr-2" />
          New Resolution
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by reference, subject, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">All Status</option>
                <option value="PASSED">Passed</option>
                <option value="REJECTED">Rejected</option>
                <option value="DEFERRED">Deferred</option>
              </select>
            </div>
            <div>
              <select
                value={meetingTypeFilter}
                onChange={(e) => setMeetingTypeFilter(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">All Meeting Types</option>
                <option value="AGM">AGM</option>
                <option value="BOD">BOD</option>
                <option value="COMMITTEE">Committee</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resolutions</CardTitle>
          <CardDescription>Total: {resolutions.length} resolutions</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : resolutions.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No resolutions found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference No</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Meeting Type</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resolutions.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium font-mono">{r.referenceNo}</TableCell>
                    <TableCell>{new Date(r.date).toLocaleDateString()}</TableCell>
                    <TableCell>{r.meetingType}</TableCell>
                    <TableCell className="max-w-md truncate">{r.subject}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(r.status)}>{r.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => router.push(`/dashboard/governance/resolutions/${r.id}`)}>
                        <FileText className="w-4 h-4" />
                      </Button>
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
