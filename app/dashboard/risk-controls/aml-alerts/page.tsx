'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw, Eye, CheckCircle, XCircle, FileText } from 'lucide-react';
import { riskControlsApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/utils/formatters';

export default function AmlAlertsPage() {
  const { toast } = useToast();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<'REVIEWED' | 'DISMISSED' | 'STR_GENERATED'>('REVIEWED');
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewing, setReviewing] = useState(false);

  useEffect(() => {
    fetchAlerts();
  }, [statusFilter]);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const res = await riskControlsApi.amlAlerts({ status: statusFilter });
      if (res.success) {
        setAlerts(res.alerts || []);
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to load AML alerts', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async () => {
    if (!selectedAlert) return;
    
    setReviewing(true);
    try {
      const res = await riskControlsApi.reviewAmlAlert(selectedAlert.id, {
        action: reviewAction,
        notes: reviewNotes,
      });
      if (res.success) {
        toast({ title: 'Success', description: 'Alert reviewed successfully' });
        setReviewDialogOpen(false);
        setSelectedAlert(null);
        setReviewNotes('');
        fetchAlerts();
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to review alert', variant: 'destructive' });
    } finally {
      setReviewing(false);
    }
  };

  const getAlertTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      CTR: 'bg-blue-100 text-blue-800',
      STRUCTURING: 'bg-orange-100 text-orange-800',
      PEP: 'bg-purple-100 text-purple-800',
      UNUSUAL_PATTERN: 'bg-red-100 text-red-800',
    };
    return <Badge className={colors[type] || 'bg-gray-100 text-gray-800'}>{type}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      REVIEWED: 'bg-blue-100 text-blue-800',
      DISMISSED: 'bg-gray-100 text-gray-800',
      STR_GENERATED: 'bg-green-100 text-green-800',
    };
    return <Badge className={colors[status] || 'bg-gray-100 text-gray-800'}>{status}</Badge>;
  };

  const pendingCount = alerts.filter(a => a.status === 'PENDING').length;
  const criticalAlerts = alerts.filter(a => a.alertType === 'CTR' || a.alertType === 'STRUCTURING');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <AlertTriangle className="w-8 h-8" />
          AML Transaction Alerts
        </h1>
        <p className="text-muted-foreground mt-1">Review and manage Anti-Money Laundering alerts</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">Requires review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{criticalAlerts.length}</div>
            <p className="text-xs text-muted-foreground">CTR / Structuring</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alerts.length}</div>
            <p className="text-xs text-muted-foreground">All statuses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">STR Generated</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {alerts.filter(a => a.strGenerated).length}
            </div>
            <p className="text-xs text-muted-foreground">Suspicious Transaction Reports</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>AML Alerts</CardTitle>
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="REVIEWED">Reviewed</SelectItem>
                  <SelectItem value="DISMISSED">Dismissed</SelectItem>
                  <SelectItem value="STR_GENERATED">STR Generated</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={fetchAlerts} variant="outline" size="sm" disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading alerts...</div>
          ) : alerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No alerts found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Alert Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alerts.map((alert) => (
                  <TableRow key={alert.id}>
                    <TableCell>
                      {alert.member
                        ? `${alert.member.firstName} ${alert.member.lastName} (${alert.member.memberNumber || 'N/A'})`
                        : '—'}
                    </TableCell>
                    <TableCell>{getAlertTypeBadge(alert.alertType)}</TableCell>
                    <TableCell className="font-semibold">
                      ₹{Number(alert.amount).toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{alert.description}</TableCell>
                    <TableCell>{formatDate(alert.createdAt)}</TableCell>
                    <TableCell>{getStatusBadge(alert.status)}</TableCell>
                    <TableCell>
                      {alert.status === 'PENDING' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedAlert(alert);
                            setReviewDialogOpen(true);
                          }}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Review
                        </Button>
                      )}
                      {alert.status !== 'PENDING' && alert.reviewedAt && (
                        <div className="text-xs text-muted-foreground">
                          Reviewed: {formatDate(alert.reviewedAt)}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review AML Alert</DialogTitle>
            <DialogDescription>
              Review and take action on this AML alert
            </DialogDescription>
          </DialogHeader>
          {selectedAlert && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Member</Label>
                  <div className="font-semibold">
                    {selectedAlert.member
                      ? `${selectedAlert.member.firstName} ${selectedAlert.member.lastName}`
                      : '—'}
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Amount</Label>
                  <div className="font-semibold">
                    ₹{Number(selectedAlert.amount).toLocaleString('en-IN')}
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Alert Type</Label>
                  <div>{getAlertTypeBadge(selectedAlert.alertType)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Created</Label>
                  <div>{formatDate(selectedAlert.createdAt)}</div>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Description</Label>
                <div className="p-3 bg-muted rounded-md">{selectedAlert.description}</div>
              </div>
              <div>
                <Label htmlFor="reviewAction">Action</Label>
                <Select value={reviewAction} onValueChange={(v: any) => setReviewAction(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="REVIEWED">Reviewed</SelectItem>
                    <SelectItem value="DISMISSED">Dismissed</SelectItem>
                    <SelectItem value="STR_GENERATED">Generate STR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="reviewNotes">Notes (Optional)</Label>
                <Textarea
                  id="reviewNotes"
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Add review notes..."
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleReview} disabled={reviewing}>
                  {reviewing ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Submit Review
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
