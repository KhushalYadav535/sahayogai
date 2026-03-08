'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { governanceApi, membersApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, FileText, CheckCircle, Clock, AlertCircle, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function MeetingMinutesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [minutes, setMinutes] = useState<any[]>([]);
  const [agms, setAgms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAgm, setSelectedAgm] = useState('');
  const [formData, setFormData] = useState({
    meetingType: 'AGM',
    meetingDate: '',
    attendees: [] as any[],
    agenda: [] as any[],
    decisions: [] as string[],
    actionItems: [] as any[],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [agmRes, membersRes] = await Promise.all([
        governanceApi.agm.list(),
        membersApi.list(),
      ]);
      setAgms((agmRes as any).data || []);
      
      // Initialize attendees from members
      const members = (membersRes as any).members || [];
      setFormData(prev => ({
        ...prev,
        attendees: members.map((m: any) => ({
          memberId: m.id,
          name: `${m.firstName} ${m.lastName}`,
          role: '',
          present: false,
        })),
      }));
    } catch (e) {
      toast({ title: 'Error', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const addAgendaItem = () => {
    setFormData(prev => ({
      ...prev,
      agenda: [...prev.agenda, { id: Date.now().toString(), title: '', description: '', decisions: '' }],
    }));
  };

  const updateAgendaItem = (id: string, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      agenda: prev.agenda.map(item => item.id === id ? { ...item, [field]: value } : item),
    }));
  };

  const addActionItem = () => {
    setFormData(prev => ({
      ...prev,
      actionItems: [...prev.actionItems, {
        id: Date.now().toString(),
        description: '',
        responsible: '',
        dueDate: '',
        status: 'OPEN',
      }],
    }));
  };

  const updateActionItem = (id: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      actionItems: prev.actionItems.map(item => item.id === id ? { ...item, [field]: value } : item),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await governanceApi.minutes.create(selectedAgm, {
        ...formData,
        meetingDate: new Date(formData.meetingDate).toISOString(),
      });
      toast({ title: 'Success', description: 'Meeting minutes created successfully' });
      setDialogOpen(false);
      loadMinutes();
    } catch (e) {
      toast({ title: 'Error', description: (e as Error).message, variant: 'destructive' });
    }
  };

  const loadMinutes = async () => {
    // Load minutes for all meetings
    // This is a simplified version - in production, you'd load for specific meetings
  };

  const finalizeMinutes = async (minutesId: string) => {
    try {
      await governanceApi.minutes.finalize(minutesId);
      toast({ title: 'Success', description: 'Minutes finalized with SHA-256 hash' });
      loadMinutes();
    } catch (e) {
      toast({ title: 'Error', description: (e as Error).message, variant: 'destructive' });
    }
  };

  const updateActionItemStatus = async (minutesId: string, itemId: string, status: string) => {
    try {
      await governanceApi.minutes.updateActionItem(minutesId, itemId, { status });
      toast({ title: 'Success', description: 'Action item updated' });
      loadMinutes();
    } catch (e) {
      toast({ title: 'Error', description: (e as Error).message, variant: 'destructive' });
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      OPEN: 'bg-blue-100 text-blue-800',
      IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
      COMPLETED: 'bg-green-100 text-green-800',
      OVERDUE: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Meeting Minutes</h1>
          <p className="text-muted-foreground mt-1">Create and manage meeting minutes with action items</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Minutes
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Meeting Minutes</DialogTitle>
              <DialogDescription>Record meeting agenda, decisions, and action items</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Meeting Type *</Label>
                  <select
                    value={formData.meetingType}
                    onChange={(e) => setFormData({ ...formData, meetingType: e.target.value })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    required
                  >
                    <option value="AGM">AGM</option>
                    <option value="BOARD">Board Meeting</option>
                    <option value="COMMITTEE">Committee Meeting</option>
                  </select>
                </div>
                <div>
                  <Label>Meeting Date *</Label>
                  <Input
                    type="date"
                    value={formData.meetingDate}
                    onChange={(e) => setFormData({ ...formData, meetingDate: e.target.value })}
                    required
                  />
                </div>
                {formData.meetingType === 'AGM' && (
                  <div className="col-span-2">
                    <Label>Select AGM</Label>
                    <select
                      value={selectedAgm}
                      onChange={(e) => setSelectedAgm(e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      required
                    >
                      <option value="">Select AGM</option>
                      {agms.map(a => (
                        <option key={a.id} value={a.id}>
                          AGM {a.fiscalYear} - {new Date(a.scheduledDate).toLocaleDateString()}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Agenda Items</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addAgendaItem}>
                    <Plus className="w-3 h-3 mr-1" />
                    Add Item
                  </Button>
                </div>
                <div className="space-y-2">
                  {formData.agenda.map((item) => (
                    <div key={item.id} className="p-3 border rounded-lg">
                      <Input
                        placeholder="Agenda title"
                        value={item.title}
                        onChange={(e) => updateAgendaItem(item.id, 'title', e.target.value)}
                        className="mb-2"
                      />
                      <Textarea
                        placeholder="Description"
                        value={item.description}
                        onChange={(e) => updateAgendaItem(item.id, 'description', e.target.value)}
                        rows={2}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Action Items</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addActionItem}>
                    <Plus className="w-3 h-3 mr-1" />
                    Add Action Item
                  </Button>
                </div>
                <div className="space-y-2">
                  {formData.actionItems.map((item) => (
                    <div key={item.id} className="p-3 border rounded-lg grid grid-cols-3 gap-2">
                      <Input
                        placeholder="Description"
                        value={item.description}
                        onChange={(e) => updateActionItem(item.id, 'description', e.target.value)}
                      />
                      <Input
                        placeholder="Responsible"
                        value={item.responsible}
                        onChange={(e) => updateActionItem(item.id, 'responsible', e.target.value)}
                      />
                      <Input
                        type="date"
                        value={item.dueDate}
                        onChange={(e) => updateActionItem(item.id, 'dueDate', e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Minutes</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Meeting Minutes</CardTitle>
          <CardDescription>All meeting minutes with action item tracking</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : minutes.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No minutes created yet</p>
          ) : (
            <div className="space-y-4">
              {minutes.map((m) => (
                <Card key={m.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{m.meetingType} Meeting</CardTitle>
                        <CardDescription>{new Date(m.meetingDate).toLocaleDateString()}</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        {m.minutesType === 'DRAFT' && (
                          <Button size="sm" onClick={() => finalizeMinutes(m.id)}>
                            <Lock className="w-4 h-4 mr-2" />
                            Finalize
                          </Button>
                        )}
                        {m.minutesType === 'FINALIZED' && (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Finalized
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {m.actionItems && Array.isArray(m.actionItems) && m.actionItems.length > 0 && (
                      <div className="mt-4">
                        <h4 className="font-semibold mb-2">Action Items</h4>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Description</TableHead>
                              <TableHead>Responsible</TableHead>
                              <TableHead>Due Date</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {m.actionItems.map((item: any) => (
                              <TableRow key={item.id}>
                                <TableCell>{item.description}</TableCell>
                                <TableCell>{item.responsible}</TableCell>
                                <TableCell>{new Date(item.dueDate).toLocaleDateString()}</TableCell>
                                <TableCell>
                                  <Badge className={getStatusColor(item.status)}>{item.status}</Badge>
                                </TableCell>
                                <TableCell>
                                  {m.minutesType === 'DRAFT' && (
                                    <select
                                      value={item.status}
                                      onChange={(e) => updateActionItemStatus(m.id, item.id, e.target.value)}
                                      className="text-xs rounded border px-2 py-1"
                                    >
                                      <option value="OPEN">Open</option>
                                      <option value="IN_PROGRESS">In Progress</option>
                                      <option value="COMPLETED">Completed</option>
                                      <option value="OVERDUE">Overdue</option>
                                    </select>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
