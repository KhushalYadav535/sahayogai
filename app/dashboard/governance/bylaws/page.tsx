'use client';

import React, { useState, useEffect } from 'react';
import { governanceApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Upload, FileText, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function BylawsPage() {
  const { toast } = useToast();
  const [bylaws, setBylaws] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    documentPath: '',
    resolutionRef: '',
    effectiveDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    loadBylaws();
  }, []);

  const loadBylaws = async () => {
    try {
      const res = await governanceApi.bylaws.list();
      setBylaws(res.data || []);
    } catch (e) {
      toast({ title: 'Error', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await governanceApi.bylaws.create({
        ...formData,
        effectiveDate: new Date(formData.effectiveDate).toISOString(),
      });
      toast({ title: 'Success', description: 'By-law uploaded successfully' });
      setDialogOpen(false);
      setFormData({
        title: '',
        documentPath: '',
        resolutionRef: '',
        effectiveDate: new Date().toISOString().split('T')[0],
      });
      loadBylaws();
    } catch (e) {
      toast({ title: 'Error', description: (e as Error).message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">By-law Repository</h1>
          <p className="text-muted-foreground mt-1">Version-controlled document repository for society by-laws</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Upload By-law
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload New By-law Version</DialogTitle>
              <DialogDescription>Upload a new version of by-laws with BOD resolution reference</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Title *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Society By-laws 2024"
                  required
                />
              </div>
              <div>
                <Label>Document Path/URL *</Label>
                <Input
                  value={formData.documentPath}
                  onChange={(e) => setFormData({ ...formData, documentPath: e.target.value })}
                  placeholder="/documents/bylaws/2024.pdf"
                  required
                />
              </div>
              <div>
                <Label>BOD Resolution Reference</Label>
                <Input
                  value={formData.resolutionRef}
                  onChange={(e) => setFormData({ ...formData, resolutionRef: e.target.value })}
                  placeholder="RES-2024-001"
                />
              </div>
              <div>
                <Label>Effective Date *</Label>
                <Input
                  type="date"
                  value={formData.effectiveDate}
                  onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>By-law Versions</CardTitle>
          <CardDescription>All versions of society by-laws with version history</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : bylaws.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No by-laws uploaded yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Version</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Effective Date</TableHead>
                  <TableHead>Resolution Ref</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bylaws.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">v{b.version}</TableCell>
                    <TableCell>{b.title}</TableCell>
                    <TableCell>{new Date(b.effectiveDate).toLocaleDateString()}</TableCell>
                    <TableCell className="font-mono text-sm">{b.resolutionRef || '-'}</TableCell>
                    <TableCell>
                      <Badge className={b.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}>
                        {b.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <Download className="w-4 h-4" />
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
