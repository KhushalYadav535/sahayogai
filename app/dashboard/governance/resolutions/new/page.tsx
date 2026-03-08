'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { governanceApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function NewResolutionPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [agms, setAgms] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    agmId: '',
    referenceNo: '',
    date: new Date().toISOString().split('T')[0],
    meetingType: 'BOD',
    status: 'PASSED',
    subject: '',
    description: '',
    documentPath: '',
  });

  useEffect(() => {
    // Load AGMs for dropdown
    governanceApi.agm.list().then(res => {
      if (res.success && res.data) {
        setAgms((res.data || []).filter((a: any) => a.status === 'scheduled' || a.status === 'conducted'));
      }
    }).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload: any = {
        referenceNo: formData.referenceNo,
        date: formData.date,
        meetingType: formData.meetingType,
        status: formData.status,
        subject: formData.subject,
      };
      if (formData.agmId) payload.agmId = formData.agmId;
      if (formData.description) payload.description = formData.description;
      if (formData.documentPath) payload.documentPath = formData.documentPath;

      const res = await governanceApi.resolutions.create(payload);
      if (res.success) {
        toast({
          title: 'Success',
          description: 'Resolution created successfully',
        });
        setTimeout(() => router.push('/dashboard/governance/resolutions'), 1500);
      }
    } catch (e: any) {
      toast({
        title: 'Error',
        description: e.message || 'Failed to create resolution',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/governance/resolutions">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">New Resolution</h1>
          <p className="text-muted-foreground mt-1">Create a new resolution for AGM, BOD, or Committee meeting</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resolution Details</CardTitle>
          <CardDescription>Enter all required information for the resolution</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Reference Number *</Label>
                <Input
                  value={formData.referenceNo}
                  onChange={(e) => setFormData({ ...formData, referenceNo: e.target.value })}
                  placeholder="RES-2024-001"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">Unique resolution reference number</p>
              </div>
              <div>
                <Label>Date *</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Meeting Type *</Label>
                <select
                  value={formData.meetingType}
                  onChange={(e) => setFormData({ ...formData, meetingType: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                >
                  <option value="AGM">AGM</option>
                  <option value="BOD">Board of Directors</option>
                  <option value="COMMITTEE">Committee</option>
                </select>
              </div>
              <div>
                <Label>Status *</Label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                >
                  <option value="PASSED">Passed</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="DEFERRED">Deferred</option>
                </select>
              </div>
              {formData.meetingType === 'AGM' && (
                <div className="col-span-2">
                  <Label>AGM (Optional)</Label>
                  <select
                    value={formData.agmId}
                    onChange={(e) => setFormData({ ...formData, agmId: e.target.value })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Select AGM</option>
                    {agms.map((agm) => (
                      <option key={agm.id} value={agm.id}>
                        {agm.fiscalYear} - {new Date(agm.scheduledDate).toLocaleDateString()}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="col-span-2">
                <Label>Subject *</Label>
                <Input
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="e.g., Approval of Annual Budget for FY 2024-25"
                  required
                />
              </div>
              <div className="col-span-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed description of the resolution..."
                  rows={4}
                />
              </div>
              <div className="col-span-2">
                <Label>Document Path/URL</Label>
                <Input
                  value={formData.documentPath}
                  onChange={(e) => setFormData({ ...formData, documentPath: e.target.value })}
                  placeholder="/documents/resolutions/RES-2024-001.pdf"
                />
                <p className="text-xs text-muted-foreground mt-1">Path to uploaded resolution document</p>
              </div>
            </div>
            <Alert>
              <AlertDescription>
                Ensure the reference number is unique and follows your organization's naming convention.
              </AlertDescription>
            </Alert>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Resolution'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
