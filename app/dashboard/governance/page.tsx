'use client';

import React, { useState } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { Permission } from '@/lib/types/auth';
import { ComplianceEvent, AGM, AGMStatus } from '@/lib/types/governance';
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

// Mock compliance events
const mockComplianceEvents: ComplianceEvent[] = [
  {
    id: '1',
    tenantId: 'default',
    eventType: 'AGM',
    title: 'Annual General Meeting',
    dueDate: new Date('2024-12-31'),
    description: 'Annual General Meeting for FY 2024',
    responsibleRole: 'SECRETARY',
    currentStatus: 'IN_PROGRESS',
    alertSchedule: { t30Days: true, t15Days: true, t7Days: true, t1Day: true },
    regulatoryReference: 'Cooperative Act Sec 70',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-11-20'),
  },
  {
    id: '2',
    tenantId: 'default',
    eventType: 'NABARD_RETURN',
    title: 'NABARD Annual Return Filing',
    dueDate: new Date('2025-01-31'),
    description: 'Submit annual return to NABARD',
    responsibleRole: 'ACCOUNTANT',
    currentStatus: 'PENDING',
    alertSchedule: { t30Days: true, t15Days: true, t7Days: true, t1Day: true },
    regulatoryReference: 'NABARD Guidelines',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-11-20'),
  },
  {
    id: '3',
    tenantId: 'default',
    eventType: 'AUDIT',
    title: 'Annual Statutory Audit',
    dueDate: new Date('2025-03-31'),
    description: 'Completion of statutory audit for FY 2024-25',
    responsibleRole: 'AUDITOR',
    currentStatus: 'PENDING',
    alertSchedule: { t30Days: true, t15Days: true, t7Days: true, t1Day: true },
    regulatoryReference: 'Cooperative Act Section 81',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-11-20'),
  },
];

// Mock AGMs
const mockAGMs: AGM[] = [
  {
    id: '1',
    agmNumber: 25,
    year: 2024,
    tenantId: 'default',
    scheduledDate: new Date('2024-12-15'),
    venue: 'Community Hall, Nagpur',
    status: AGMStatus.IN_PROGRESS,
    agendaItems: [
      {
        id: '1',
        agmId: '1',
        sequence: 1,
        title: 'Approval of Annual Report',
        description: 'Review and approval of annual report for FY 2024',
        proposedBy: 'President',
        status: 'DISCUSSED',
        createdAt: new Date('2024-11-01'),
      },
      {
        id: '2',
        agmId: '1',
        sequence: 2,
        title: 'Dividend Declaration',
        description: 'Approve dividend distribution to members',
        proposedBy: 'Finance Committee',
        status: 'PENDING',
        createdAt: new Date('2024-11-01'),
      },
    ],
    attendees: [],
    notices: {
      noticeSentDate: new Date('2024-11-15'),
      noticePeriodDays: 30,
    },
    minutesGenerated: false,
    createdAt: new Date('2024-11-01'),
    updatedAt: new Date('2024-11-20'),
  },
];

const complianceStatusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900',
  IN_PROGRESS: 'bg-blue-100 text-blue-800 dark:bg-blue-900',
  COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900',
  OVERDUE: 'bg-red-100 text-red-800 dark:bg-red-900',
};

export default function GovernancePage() {
  const { hasPermission } = useAuth();
  const router = useRouter();
  const [complianceEvents] = useState(mockComplianceEvents);
  const [agms] = useState(mockAGMs);

  const upcomingDeadlines = complianceEvents
    .filter((e) => e.currentStatus !== 'COMPLETED')
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
    .slice(0, 5);

  const overdue = complianceEvents.filter((e) => {
    const today = new Date();
    return e.dueDate < today && e.currentStatus !== 'COMPLETED';
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
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="compliance">Compliance Calendar</TabsTrigger>
          <TabsTrigger value="agm">AGM & Meetings</TabsTrigger>
          <TabsTrigger value="board">Board & Directors</TabsTrigger>
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
                              complianceStatusColors[event.currentStatus] ||
                              complianceStatusColors.PENDING
                            }`}
                          >
                            {event.currentStatus}
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
                {upcomingDeadlines.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-3 border rounded-lg border-border"
                  >
                    <div>
                      <p className="font-medium text-foreground">{event.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {event.dueDate.toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          complianceStatusColors[event.currentStatus] ||
                          complianceStatusColors.PENDING
                        }`}
                      >
                        {event.currentStatus}
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
                {agms.map((agm) => (
                  <div
                    key={agm.id}
                    className="border rounded-lg p-4 border-border hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-foreground">
                          AGM #{agm.agmNumber} - {agm.year}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">{agm.venue}</p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          agm.status === AGMStatus.COMPLETED
                            ? 'bg-green-100 text-green-800 dark:bg-green-900'
                            : agm.status === AGMStatus.IN_PROGRESS
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900'
                        }`}
                      >
                        {agm.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {agm.scheduledDate.toLocaleDateString()}
                      </div>
                      <div>{agm.agendaItems.length} agenda items</div>
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
              <CardTitle>Board of Directors</CardTitle>
              <CardDescription>
                Current board members and their terms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <p>Board management features coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
