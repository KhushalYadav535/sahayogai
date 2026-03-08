'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Users, RefreshCw, LogOut, Search, AlertTriangle } from 'lucide-react';
import { riskControlsApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/utils/formatters';

export default function SessionsPage() {
  const { toast } = useToast();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchUserId, setSearchUserId] = useState('');
  const [terminating, setTerminating] = useState<string | null>(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await riskControlsApi.sessions.list(searchUserId ? { userId: searchUserId } : undefined);
      if (res.success) {
        setSessions(res.sessions || []);
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to load sessions', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleTerminate = async (sessionId: string) => {
    if (!confirm('Are you sure you want to terminate this session?')) return;
    
    setTerminating(sessionId);
    try {
      const res = await riskControlsApi.sessions.delete(sessionId);
      if (res.success) {
        toast({ title: 'Success', description: 'Session terminated successfully' });
        fetchSessions();
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to terminate session', variant: 'destructive' });
    } finally {
      setTerminating(null);
    }
  };

  const activeSessions = sessions.filter(s => new Date(s.expiresAt) > new Date());
  const expiredSessions = sessions.filter(s => new Date(s.expiresAt) <= new Date());

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Users className="w-8 h-8" />
          Session Management
        </h1>
        <p className="text-muted-foreground mt-1">Manage active user sessions and concurrent logins</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Active Sessions</CardTitle>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Filter by User ID"
                  value={searchUserId}
                  onChange={(e) => setSearchUserId(e.target.value)}
                  className="w-48"
                />
                <Button onClick={fetchSessions} variant="outline" size="sm">
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </Button>
              </div>
              <Button onClick={fetchSessions} variant="outline" size="sm" disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading sessions...</div>
          ) : activeSessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No active sessions</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>User Agent</TableHead>
                  <TableHead>Last Activity</TableHead>
                  <TableHead>Expires At</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeSessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell className="font-medium">{session.user?.name || '—'}</TableCell>
                    <TableCell>{session.user?.email || '—'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{session.user?.role || '—'}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{session.ipAddress || '—'}</TableCell>
                    <TableCell className="max-w-xs truncate text-xs">
                      {session.userAgent || '—'}
                    </TableCell>
                    <TableCell>{formatDate(session.lastActivityAt)}</TableCell>
                    <TableCell>{formatDate(session.expiresAt)}</TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleTerminate(session.id)}
                        disabled={terminating === session.id}
                      >
                        {terminating === session.id ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <LogOut className="w-4 h-4 mr-1" />
                            Terminate
                          </>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {expiredSessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Expired Sessions ({expiredSessions.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {expiredSessions.length} expired session(s) found. These will be automatically cleaned up.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Session Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-2xl font-bold">{activeSessions.length}</div>
              <div className="text-sm text-muted-foreground">Active Sessions</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{expiredSessions.length}</div>
              <div className="text-sm text-muted-foreground">Expired Sessions</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{sessions.length}</div>
              <div className="text-sm text-muted-foreground">Total Sessions</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
