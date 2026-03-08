'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { governanceApi, membersApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Send, Users, FileText, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function AGMDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [agm, setAgm] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [sendingNotice, setSendingNotice] = useState(false);

  useEffect(() => {
    if (params.id) {
      loadAGM();
      loadMembers();
    }
  }, [params.id]);

  const loadAGM = async () => {
    try {
      const res = await governanceApi.agm.list();
      const found = (res.data || []).find((a: any) => a.id === params.id);
      if (found) {
        setAgm(found);
        setAttendance((found.attendance as any[]) || []);
      }
    } catch (e) {
      toast({ title: 'Error', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const loadMembers = async () => {
    try {
      const res = await membersApi.list();
      const memberList = res.members || [];
      setMembers(memberList);
      
      // Initialize attendance if not set
      if (attendance.length === 0 && memberList.length > 0) {
        setAttendance(memberList.map((m: any) => ({
          memberId: m.id,
          memberName: `${m.firstName} ${m.lastName}`,
          present: false,
        })));
      }
    } catch (e) {
      toast({ title: 'Error', description: (e as Error).message, variant: 'destructive' });
    }
  };

  const handleAttendanceChange = (memberId: string, present: boolean) => {
    setAttendance(attendance.map(a => 
      a.memberId === memberId ? { ...a, present } : a
    ));
  };

  const saveAttendance = async () => {
    setSavingAttendance(true);
    try {
      await governanceApi.agm.recordAttendance(params.id as string, { attendance });
      toast({ title: 'Success', description: 'Attendance recorded successfully' });
      loadAGM();
    } catch (e) {
      toast({ title: 'Error', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setSavingAttendance(false);
    }
  };

  const sendNotice = async () => {
    setSendingNotice(true);
    try {
      await governanceApi.agm.sendNotice(params.id as string);
      toast({ title: 'Success', description: 'AGM notice dispatched to all members' });
      loadAGM();
    } catch (e) {
      toast({ title: 'Error', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setSendingNotice(false);
    }
  };

  if (loading || !agm) {
    return <div className="p-6">Loading...</div>;
  }

  const presentCount = attendance.filter(a => a.present).length;
  const totalCount = attendance.length;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/governance">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">AGM Details</h1>
          <p className="text-muted-foreground mt-1">Fiscal Year: {agm.fiscalYear}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Scheduled Date</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{new Date(agm.scheduledDate).toLocaleDateString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className={agm.status === 'conducted' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}>
              {agm.status}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{presentCount} / {totalCount}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2">
        {agm.status === 'scheduled' && (
          <Button onClick={sendNotice} disabled={sendingNotice}>
            <Send className="w-4 h-4 mr-2" />
            {sendingNotice ? 'Sending...' : 'Send Notice to Members'}
          </Button>
        )}
        {agm.status === 'notice_sent' && (
          <Button onClick={saveAttendance} disabled={savingAttendance}>
            <Users className="w-4 h-4 mr-2" />
            {savingAttendance ? 'Saving...' : 'Save Attendance'}
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Agenda Items</CardTitle>
        </CardHeader>
        <CardContent>
          {agm.agendaItems && Array.isArray(agm.agendaItems) && agm.agendaItems.length > 0 ? (
            <div className="space-y-2">
              {agm.agendaItems.map((item: any, idx: number) => (
                <div key={idx} className="p-3 border rounded-lg">
                  <p className="font-medium">{item.title || item}</p>
                  {item.description && <p className="text-sm text-muted-foreground mt-1">{item.description}</p>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No agenda items added</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Attendance Recording</CardTitle>
          <CardDescription>Mark members as present or absent</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Member Name</TableHead>
                <TableHead>Member ID</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendance.map((a) => (
                <TableRow key={a.memberId}>
                  <TableCell>
                    <Checkbox
                      checked={a.present}
                      onCheckedChange={(checked) => handleAttendanceChange(a.memberId, checked === true)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{a.memberName}</TableCell>
                  <TableCell className="font-mono text-sm">{a.memberId}</TableCell>
                  <TableCell>
                    {a.present ? (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Present
                      </Badge>
                    ) : (
                      <Badge variant="outline">Absent</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
