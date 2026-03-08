'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Lock, Users, AlertTriangle, Database, FileCheck, Hash, Clock, DollarSign, ArrowRight } from 'lucide-react';
import { riskControlsApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/utils/formatters';
import Link from 'next/link';

export default function RiskControlsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [sessions, setSessions] = useState<any[]>([]);
  const [amlAlerts, setAmlAlerts] = useState<any[]>([]);
  const [passwordExpiry, setPasswordExpiry] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'sessions') {
        const res = await riskControlsApi.sessions.list();
        if (res.success) setSessions(res.sessions || []);
      } else if (activeTab === 'aml') {
        const res = await riskControlsApi.amlAlerts({ status: 'PENDING' });
        if (res.success) setAmlAlerts(res.alerts || []);
      } else if (activeTab === 'password') {
        const res = await riskControlsApi.passwordExpiry();
        if (res.success) setPasswordExpiry(res);
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to load data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleTerminateSession = async (sessionId: string) => {
    try {
      const res = await riskControlsApi.sessions.delete(sessionId);
      if (res.success) {
        toast({ title: 'Success', description: 'Session terminated' });
        fetchData();
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to terminate session', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Shield className="w-8 h-8" />
          Risk & Controls
        </h1>
        <p className="text-muted-foreground mt-1">Internal control framework and risk management</p>
      </div>

      {/* Password Expiry Alert */}
      {passwordExpiry && passwordExpiry.alertLevel !== 'NONE' && (
        <Alert variant={passwordExpiry.alertLevel === 'EXPIRED' ? 'destructive' : 'default'}>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Password expires in {passwordExpiry.daysUntilExpiry} days. Please change your password.
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="aml">AML Alerts</TabsTrigger>
          <TabsTrigger value="password">Password</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{sessions.length}</div>
                <p className="text-xs text-muted-foreground">Currently logged in</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending AML Alerts</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{amlAlerts.length}</div>
                <p className="text-xs text-muted-foreground">Requires review</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Password Status</CardTitle>
                <Lock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {passwordExpiry ? `${passwordExpiry.daysUntilExpiry}d` : '—'}
                </div>
                <p className="text-xs text-muted-foreground">Days until expiry</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Risk Controls Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>Transaction Velocity Checks</span>
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Daily Transaction Limits</span>
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Concurrent Session Control</span>
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Password Rotation</span>
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Data Masking</span>
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>AML Monitoring</span>
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Risk Controls Modules</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link href="/dashboard/risk-controls/sessions">
                  <Card className="hover:bg-accent cursor-pointer transition-colors">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Users className="w-6 h-6 text-primary" />
                          <div>
                            <div className="font-semibold">Session Management</div>
                            <div className="text-sm text-muted-foreground">Manage active sessions</div>
                          </div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>

                <Link href="/dashboard/risk-controls/daily-limits">
                  <Card className="hover:bg-accent cursor-pointer transition-colors">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <DollarSign className="w-6 h-6 text-primary" />
                          <div>
                            <div className="font-semibold">Daily Limits</div>
                            <div className="text-sm text-muted-foreground">Transaction limits tracking</div>
                          </div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>

                <Link href="/dashboard/risk-controls/password">
                  <Card className="hover:bg-accent cursor-pointer transition-colors">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Lock className="w-6 h-6 text-primary" />
                          <div>
                            <div className="font-semibold">Password Management</div>
                            <div className="text-sm text-muted-foreground">Change password & expiry</div>
                          </div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>

                <Link href="/dashboard/risk-controls/aml-alerts">
                  <Card className="hover:bg-accent cursor-pointer transition-colors">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <AlertTriangle className="w-6 h-6 text-primary" />
                          <div>
                            <div className="font-semibold">AML Alerts</div>
                            <div className="text-sm text-muted-foreground">Review AML transactions</div>
                          </div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>

                <Link href="/dashboard/risk-controls/backup-verification">
                  <Card className="hover:bg-accent cursor-pointer transition-colors">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Database className="w-6 h-6 text-primary" />
                          <div>
                            <div className="font-semibold">Backup Verification</div>
                            <div className="text-sm text-muted-foreground">Backup integrity status</div>
                          </div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>

                <Link href="/dashboard/risk-controls/hash-chain">
                  <Card className="hover:bg-accent cursor-pointer transition-colors">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Hash className="w-6 h-6 text-primary" />
                          <div>
                            <div className="font-semibold">Hash Chain Verification</div>
                            <div className="text-sm text-muted-foreground">Audit log immutability</div>
                          </div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>

                <Link href="/dashboard/risk-controls/data-retention">
                  <Card className="hover:bg-accent cursor-pointer transition-colors">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Clock className="w-6 h-6 text-primary" />
                          <div>
                            <div className="font-semibold">Data Retention</div>
                            <div className="text-sm text-muted-foreground">Retention policy tracking</div>
                          </div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Active Sessions</CardTitle>
                <Link href="/dashboard/risk-controls/sessions">
                  <Button variant="outline" size="sm">
                    View All Sessions
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : sessions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No active sessions</div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>IP Address</TableHead>
                        <TableHead>Last Activity</TableHead>
                        <TableHead>Expires</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sessions.slice(0, 5).map((session) => (
                        <TableRow key={session.id}>
                          <TableCell>{session.user?.name || session.user?.email}</TableCell>
                          <TableCell>{session.ipAddress || '—'}</TableCell>
                          <TableCell>{formatDate(session.lastActivityAt)}</TableCell>
                          <TableCell>{formatDate(session.expiresAt)}</TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleTerminateSession(session.id)}
                            >
                              Terminate
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {sessions.length > 5 && (
                    <div className="mt-4 text-center">
                      <Link href="/dashboard/risk-controls/sessions">
                        <Button variant="outline">
                          View All {sessions.length} Sessions
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="aml">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>AML Transaction Alerts</CardTitle>
                <Link href="/dashboard/risk-controls/aml-alerts">
                  <Button variant="outline" size="sm">
                    View All Alerts
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : amlAlerts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No pending AML alerts</div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Member</TableHead>
                        <TableHead>Alert Type</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {amlAlerts.slice(0, 5).map((alert) => (
                        <TableRow key={alert.id}>
                          <TableCell>
                            {alert.member
                              ? `${alert.member.firstName} ${alert.member.lastName}`
                              : '—'}
                          </TableCell>
                          <TableCell>
                            <Badge>{alert.alertType}</Badge>
                          </TableCell>
                          <TableCell>₹{Number(alert.amount).toLocaleString('en-IN')}</TableCell>
                          <TableCell className="max-w-xs truncate">{alert.description}</TableCell>
                          <TableCell>{formatDate(alert.createdAt)}</TableCell>
                          <TableCell>
                            <Badge className={alert.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : ''}>
                              {alert.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {amlAlerts.length > 5 && (
                    <div className="mt-4 text-center">
                      <Link href="/dashboard/risk-controls/aml-alerts">
                        <Button variant="outline">
                          View All {amlAlerts.length} Alerts
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="password">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Password Management</CardTitle>
                <Link href="/dashboard/risk-controls/password">
                  <Button variant="outline" size="sm">
                    Change Password
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {passwordExpiry && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span>Password Changed</span>
                    <span>{formatDate(passwordExpiry.passwordChangedAt)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Days Until Expiry</span>
                    <Badge
                      className={
                        passwordExpiry.alertLevel === 'EXPIRED'
                          ? 'bg-red-100 text-red-800'
                          : passwordExpiry.alertLevel === 'CRITICAL'
                          ? 'bg-orange-100 text-orange-800'
                          : passwordExpiry.alertLevel === 'WARNING'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }
                    >
                      {passwordExpiry.daysUntilExpiry} days
                    </Badge>
                  </div>
                  {passwordExpiry.alertLevel !== 'NONE' && (
                    <Alert variant={passwordExpiry.alertLevel === 'EXPIRED' ? 'destructive' : 'default'}>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        {passwordExpiry.alertLevel === 'EXPIRED'
                          ? 'Your password has expired. Please change it immediately.'
                          : `Your password will expire in ${passwordExpiry.daysUntilExpiry} days. Please change it soon.`}
                      </AlertDescription>
                    </Alert>
                  )}
                  <div className="pt-4">
                    <Link href="/dashboard/risk-controls/password">
                      <Button className="w-full">
                        Go to Password Management
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
