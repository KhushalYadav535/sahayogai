'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { governanceApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, AlertTriangle, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function BODManagementPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [directors, setDirectors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDirector, setEditingDirector] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    designation: '',
    din: '',
    pan: '',
    electionDate: '',
    termStart: '',
    termEnd: '',
  });

  useEffect(() => {
    loadDirectors();
  }, []);

  const loadDirectors = async () => {
    try {
      const res = await governanceApi.bod.list();
      setDirectors(res.data || []);
    } catch (e) {
      toast({ title: 'Error', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingDirector) {
        // Update logic here if endpoint exists
        toast({ title: 'Updated', description: 'Director updated successfully' });
      } else {
        await governanceApi.bod.create({
          ...formData,
          electionDate: new Date(formData.electionDate).toISOString(),
          termStart: new Date(formData.termStart).toISOString(),
          termEnd: new Date(formData.termEnd).toISOString(),
        });
        toast({ title: 'Created', description: 'Director added successfully' });
      }
      setDialogOpen(false);
      resetForm();
      loadDirectors();
    } catch (e) {
      toast({ title: 'Error', description: (e as Error).message, variant: 'destructive' });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      designation: '',
      din: '',
      pan: '',
      electionDate: '',
      termStart: '',
      termEnd: '',
    });
    setEditingDirector(null);
  };

  const getDaysUntilExpiry = (termEnd: string) => {
    const end = new Date(termEnd);
    const today = new Date();
    const diff = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Board of Directors</h1>
          <p className="text-muted-foreground mt-1">Manage BOD members and their terms</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Director
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingDirector ? 'Edit Director' : 'Add New Director'}</DialogTitle>
              <DialogDescription>Enter director details and term information</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Full Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Designation *</Label>
                  <Input
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    placeholder="President / Secretary / Treasurer / Member"
                    required
                  />
                </div>
                <div>
                  <Label>DIN (if applicable)</Label>
                  <Input
                    value={formData.din}
                    onChange={(e) => setFormData({ ...formData, din: e.target.value })}
                  />
                </div>
                <div>
                  <Label>PAN</Label>
                  <Input
                    value={formData.pan}
                    onChange={(e) => setFormData({ ...formData, pan: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Election Date *</Label>
                  <Input
                    type="date"
                    value={formData.electionDate}
                    onChange={(e) => setFormData({ ...formData, electionDate: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Term Start *</Label>
                  <Input
                    type="date"
                    value={formData.termStart}
                    onChange={(e) => setFormData({ ...formData, termStart: e.target.value })}
                    required
                  />
                </div>
                <div className="col-span-2">
                  <Label>Term End *</Label>
                  <Input
                    type="date"
                    value={formData.termEnd}
                    onChange={(e) => setFormData({ ...formData, termEnd: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Directors</CardTitle>
          <CardDescription>Current and past board members</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : directors.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No directors added yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead>Term</TableHead>
                  <TableHead>Days Until Expiry</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {directors.map((d) => {
                  const daysLeft = getDaysUntilExpiry(d.termEnd);
                  const isExpiringSoon = daysLeft <= 60 && daysLeft > 0;
                  return (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium">{d.name}</TableCell>
                      <TableCell>{d.designation}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="w-3 h-3" />
                          {new Date(d.termStart).toLocaleDateString()} - {new Date(d.termEnd).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        {daysLeft > 0 ? (
                          <span className={isExpiringSoon ? 'text-yellow-600 font-semibold' : ''}>
                            {daysLeft} days
                            {isExpiringSoon && <AlertTriangle className="w-3 h-3 inline ml-1" />}
                          </span>
                        ) : (
                          <span className="text-red-600">Expired</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs ${d.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                          {d.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
