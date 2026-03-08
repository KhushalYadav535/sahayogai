'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { Permission } from '@/lib/types/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AlertCircle, Calendar, CheckCircle, Eye, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { governanceApi } from '@/lib/api';


const EVENT_TITLES: Record<string, string> = {
  AGM: 'Annual General Meeting',
  NABARD_RETURN: 'NABARD Annual Return Filing',
  TDS_PAYMENT: 'TDS Payment',
  TDS_26Q: 'TDS Return (26Q)',
  AUDIT: 'Annual Statutory Audit',
  BOD_ELECTION: 'BOD Election',
  REGISTRAR_RETURN: 'Registrar Annual Return',
};


const complianceStatusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900',
  IN_PROGRESS: 'bg-blue-100 text-blue-800 dark:bg-blue-900',
  COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900',
  OVERDUE: 'bg-red-100 text-red-800 dark:bg-red-900',
};

export default function GovernancePage() {
  const { hasPermission } = useAuth();
  const router = useRouter();
  const [complianceEvents, setComplianceEvents] = useState<any[]>([]);
  const [agms, setAgms] = useState<any[]>([]);
  const [directors, setDirectors] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      governanceApi.complianceEvents.list({ from: new Date().toISOString().slice(0, 10), to: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10) }),
      governanceApi.agm.list(),
      governanceApi.bod.list(),
    ]).then(([ev, a, b]) => {
      const events = (ev as any).data || (ev as any).events || [];
      const agmList = (a as any).data || (a as any).agms || [];
      const dirList = (b as any).data || (b as any).directors || [];
      setComplianceEvents(events.map((e: any) => ({ ...e, title: EVENT_TITLES[e.eventType] || e.eventType, dueDate: new Date(e.dueDate), currentStatus: (e.status || '').toUpperCase() })));
      setAgms(agmList.map((g: any) => ({ ...g, agmNumber: g.id ? parseInt(g.id.slice(-2), 10) || 1 : 1, year: new Date(g.scheduledDate || 0).getFullYear(), agendaItems: g.agendaItems || [], status: g.status })));
      setDirectors(dirList);
    }).catch(() => {});
  }, []);

  const upcomingDeadlines = complianceEvents
    .filter((e: any) => (e.currentStatus || e.status) !== 'COMPLETED' && e.status !== 'completed')
    .sort((a: any, b: any) => (a.dueDate instanceof Date ? a.dueDate : new Date(a.dueDate)).getTime() - (b.dueDate instanceof Date ? b.dueDate : new Date(b.dueDate)).getTime())
    .slice(0, 5);

  const overdue = complianceEvents.filter((e: any) => {
    const today = new Date();
    const d = e.dueDate instanceof Date ? e.dueDate : new Date(e.dueDate);
    return d < today && e.currentStatus !== 'COMPLETED' && e.status !== 'completed';
  });

  const canEditGovernance = hasPermission(Permission.GOVERNANCE_EDIT);
  const canManageAGM = hasPermission(Permission.AGM_MANAGE);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Society Governance</h1>
          <p className="text-muted-foreground mt-1">
            Board management, AGM, compliance calendar, and resolutions
          </p>
        </div>
        {canManageAGM && (
          <Button className="gap-2" onClick={() => router.push('/dashboard/governance/agm/new')}>
            <Plus className="w-4 h-4" />
            Schedule AGM
          </Button>
        )}
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Compliance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {complianceEvents.filter((e) => e.currentStatus === 'PENDING').length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Items to complete</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Overdue Deadlines
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {overdue.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Requires immediate action</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {complianceEvents.filter((e) => e.currentStatus === 'COMPLETED').length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">This year</p>
          </CardContent>
        </Card>
      </div>

      {/* Overdue alerts */}
      {overdue.length > 0 && (
        <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <CardTitle className="text-red-600">Overdue Compliance Items</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {overdue.map((event) => (
                <div key={event.id} className="text-sm text-red-800 dark:text-red-100">
                  <p className="font-medium">{event.title}</p>
                  <p className="text-xs opacity-75">
                    Due: {event.dueDate.toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabbed view */}
      <Tabs defaultValue="compliance" className="w-full">
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="agm">AGM</TabsTrigger>
          <TabsTrigger value="board">BOD</TabsTrigger>
          <TabsTrigger value="resolutions">Resolutions</TabsTrigger>
          <TabsTrigger value="bylaws">By-laws</TabsTrigger>
          <TabsTrigger value="approvals">Approvals</TabsTrigger>
        </TabsList>

        {/* Compliance Calendar Tab */}
        <TabsContent value="compliance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Calendar</CardTitle>
              <CardDescription>
                Statutory and regulatory compliance schedule
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Responsibility</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {complianceEvents.map((event) => (
                      <TableRow key={event.id}>
                        <TableCell className="font-medium">{event.title}</TableCell>
                        <TableCell className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          {event.dueDate.toLocaleDateString()}
                        </TableCell>
                        <TableCell>{event.responsibleRole}</TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              complianceStatusColors[event.currentStatus || event.status] ||
                              complianceStatusColors.PENDING
                            }`}
                          >
                            {event.currentStatus || event.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Upcoming Deadlines</CardTitle>
              <CardDescription>
                Next 5 compliance deadlines
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingDeadlines.map((event: any) => (
                  <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg border-border">
                    <div>
                      <p className="font-medium text-foreground">{event.title || event.eventType}</p>
                      <p className="text-sm text-muted-foreground">{(event.dueDate instanceof Date ? event.dueDate : new Date(event.dueDate)).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${complianceStatusColors[event.currentStatus || event.status] || complianceStatusColors.PENDING}`}>
                        {event.currentStatus || event.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AGM & Meetings Tab */}
        <TabsContent value="agm" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AGM Schedule</CardTitle>
              <CardDescription>
                Annual General Meetings and board meetings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {agms.map((agm: any) => (
                  <div key={agm.id} className="border rounded-lg p-4 border-border hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-foreground">AGM #{agm.agmNumber || agm.id?.slice(-2) || '1'} — {agm.year || (agm.scheduledDate ? new Date(agm.scheduledDate).getFullYear() : agm.fiscalYear)}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{agm.venue || agm.fiscalYear}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${agm.status === 'conducted' || agm.status === 'minutes_approved' ? 'bg-green-100 text-green-800 dark:bg-green-900' : agm.status === 'scheduled' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900'}`}>
                        {agm.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {(agm.scheduledDate instanceof Date ? agm.scheduledDate : new Date(agm.scheduledDate || 0)).toLocaleDateString()}
                      </div>
                      <div>{(agm.agendaItems?.length || 0)} agenda items</div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/governance/agm/${agm.id}`)}>
                      View Details
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Board Tab */}
        <TabsContent value="board" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Board of Directors</CardTitle>
                  <CardDescription>Current board members and their terms</CardDescription>
                </div>
                <Button onClick={() => router.push('/dashboard/governance/bod')}>
                  Manage BOD
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {directors.length > 0 ? (
                <div className="space-y-3">
                  {directors.map((d: any) => (
                    <div key={d.id} className="flex justify-between items-center p-3 border rounded-lg border-border">
                      <div>
                        <p className="font-medium">{d.name}</p>
                        <p className="text-sm text-muted-foreground">{d.designation} · Term: {new Date(d.termStart).toLocaleDateString()} – {new Date(d.termEnd).toLocaleDateString()}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${d.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>{d.status}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No BOD members. Add directors to get started.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Resolutions Tab */}
        <TabsContent value="resolutions">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Resolutions</CardTitle>
                  <CardDescription>Search and manage all society resolutions</CardDescription>
                </div>
                <Button onClick={() => router.push('/dashboard/governance/resolutions')}>
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Use the "View All" button to access the full resolution repository with search and filters.</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* By-laws Tab */}
        <TabsContent value="bylaws">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>By-law Repository</CardTitle>
                  <CardDescription>Version-controlled document repository</CardDescription>
                </div>
                <Button onClick={() => router.push('/dashboard/governance/bylaws')}>
                  Manage By-laws
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Use the "Manage By-laws" button to upload and manage by-law versions.</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Approvals Tab */}
        <TabsContent value="approvals">
          <Card>
            <CardHeader>
              <CardTitle>Approval System</CardTitle>
              <CardDescription>Maker-checker hierarchy and override tracking</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline" onClick={() => router.push('/dashboard/governance/approvals/thresholds')}>
                  Configure Thresholds
                </Button>
                <Button variant="outline" onClick={() => router.push('/dashboard/governance/approvals/overrides')}>
                  View Overrides
                </Button>
                <Button variant="outline" onClick={() => router.push('/dashboard/governance/meetings/minutes')}>
                  Meeting Minutes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
