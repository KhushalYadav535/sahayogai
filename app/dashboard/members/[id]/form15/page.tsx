'use client';

import React, { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, FileText, CheckCircle, Info } from 'lucide-react';
import { membersApi } from '@/lib/api';

function getCurrentFY(): string {
  const d = new Date();
  const startYear = d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1;
  return `${startYear}-04`;
}

export default function Form15Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [form15, setForm15] = useState<{ status?: string; fy?: string } | null>(null);
  const [member, setMember] = useState<any>(null);
  const [formType, setFormType] = useState<'15G' | '15H'>('15G');
  const [fy, setFy] = useState(getCurrentFY());
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const [f15, m] = await Promise.all([
          membersApi.form15.get(id),
          membersApi.get(id),
        ]);
        setForm15(f15.form15);
        setMember(m.member);
      } catch {
        setForm15(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const age = member?.dateOfBirth
    ? Math.floor((Date.now() - new Date(member.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : 0;
  const use15H = age >= 60;

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await membersApi.form15.submit(id, { formType: use15H ? '15H' : '15G', fy });
      setForm15({ status: 'EXEMPT', fy });
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p className="py-8 text-center text-muted-foreground">Loading...</p>;

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="w-4 h-4" /></Button>
        <div>
          <h1 className="text-2xl font-bold">Form 15G / 15H — TDS Exemption</h1>
          <p className="text-muted-foreground text-sm">Member: {member ? `${member.firstName} ${member.lastName}` : id}</p>
        </div>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription className="text-sm">
          Form 15G (under 60) or 15H (senior citizens) exempts FDR interest from TDS if total income is below taxable limit. Exemption resets each FY — member must re-submit.
        </AlertDescription>
      </Alert>

      {form15?.status === 'EXEMPT' ? (
        <Card className="border-green-200 bg-green-50 dark:bg-green-950">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
              <CheckCircle className="w-5 h-5" />
              <span className="font-semibold">TDS Exempt for FY {form15.fy}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">Member has submitted Form {use15H ? '15H' : '15G'}. No TDS will be deducted on interest income until next FY.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5" /> Submit Exemption Form</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-sm font-medium">Applicable Form</p>
              <p className="text-sm text-muted-foreground">Age: {age} years → {use15H ? 'Form 15H (Senior Citizen)' : 'Form 15G'}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Financial Year (YYYY-MM)</label>
              <Input className="mt-1" value={fy} onChange={e => setFy(e.target.value)} placeholder="2024-04" />
            </div>
            <Button className="w-full" onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Submitting...' : `Submit Form ${use15H ? '15H' : '15G'}`}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
