'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatDate } from '@/lib/utils/formatters';
import { Bell, AlertTriangle, CheckCircle, Clock, RefreshCw, Loader2 } from 'lucide-react';
import { aiApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export default function ComplianceAlertsPage() {
  const { toast } = useToast();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const res = await aiApi.complianceAlerts();
      if (res.success) {
        setAlerts(res.alerts || []);
      }
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to load compliance alerts', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const severityColors: Record<string, string> = {
    CRITICAL: 'bg-red-100 text-red-800 dark:bg-red-900',
    HIGH: 'bg-orange-100 text-orange-800 dark:bg-orange-900',
    MEDIUM: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900',
    LOW: 'bg-blue-100 text-blue-800 dark:bg-blue-900',
  };

  const criticalAlerts = alerts.filter(a => a.severity === 'CRITICAL');
  const highAlerts = alerts.filter(a => a.severity === 'HIGH');
  const mediumAlerts = alerts.filter(a => a.severity === 'MEDIUM');
  const lowAlerts = alerts.filter(a => a.severity === 'LOW');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bell className="w-8 h-8" />
            Compliance Monitoring Alerts
          </h1>
          <p className="text-muted-foreground mt-1">AI-powered proactive compliance deadline alerts</p>
        </div>
        <Button variant="outline" onClick={fetchAlerts} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-red-600">{criticalAlerts.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Critical</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-orange-600">{highAlerts.length}</div>
            <p className="text-xs text-muted-foreground mt-1">High</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-yellow-600">{mediumAlerts.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Medium</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-blue-600">{lowAlerts.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Low</p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts List */}
      <Card>
        <CardHeader>
          <CardTitle>Active Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : alerts.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-4" />
              <p className="text-muted-foreground">No active compliance alerts</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <Alert
                  key={alert.id}
                  className={`border-l-4 ${
                    alert.severity === 'CRITICAL'
                      ? 'border-l-red-500 bg-red-50 dark:bg-red-950'
                      : alert.severity === 'HIGH'
                      ? 'border-l-orange-500 bg-orange-50 dark:bg-orange-950'
                      : alert.severity === 'MEDIUM'
                      ? 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950'
                      : 'border-l-blue-500 bg-blue-50 dark:bg-blue-950'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <AlertTriangle className="w-5 h-5 mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold">{alert.title}</p>
                          <Badge className={severityColors[alert.severity]}>
                            {alert.severity}
                          </Badge>
                          {alert.daysRemaining !== undefined && (
                            <Badge variant="outline" className="text-xs">
                              {alert.daysRemaining > 0 ? `${alert.daysRemaining} days remaining` : 'OVERDUE'}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{alert.description}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Due: {formatDate(alert.dueDate)}
                          </span>
                          <span>Type: {alert.type}</span>
                        </div>
                      </div>
                    </div>
                    {!alert.acknowledged && (
                      <Button size="sm" variant="outline">
                        Acknowledge
                      </Button>
                    )}
                  </div>
                </Alert>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
