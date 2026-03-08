'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatDate } from '@/lib/utils/formatters';
import { Bot, RefreshCw, Loader2, AlertTriangle, CheckCircle, BarChart3 } from 'lucide-react';
import { aiApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function AIModelsPage() {
  const { toast } = useToast();
  const [models, setModels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rollbackOpen, setRollbackOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<any>(null);
  const [targetVersion, setTargetVersion] = useState('');
  const [rollingBack, setRollingBack] = useState(false);
  const [performanceOpen, setPerformanceOpen] = useState(false);
  const [performanceModelId, setPerformanceModelId] = useState<string | null>(null);
  const [performancePeriod, setPerformancePeriod] = useState('7d');
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [performanceLoading, setPerformanceLoading] = useState(false);

  const fetchModels = async () => {
    setLoading(true);
    try {
      const res = await aiApi.models.list();
      if (res.success) {
        setModels(res.models || []);
      }
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to load models', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  const handleRollback = async () => {
    if (!selectedModel || !targetVersion) return;
    setRollingBack(true);
    try {
      const res = await aiApi.models.rollback({
        modelId: selectedModel.modelId,
        targetVersion,
      });
      if (res.success) {
        toast({ title: 'Success', description: res.message });
        setRollbackOpen(false);
        setSelectedModel(null);
        setTargetVersion('');
        fetchModels();
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Rollback failed', variant: 'destructive' });
    } finally {
      setRollingBack(false);
    }
  };

  const fetchPerformance = async (modelId: string, period: string = '7d') => {
    setPerformanceLoading(true);
    try {
      const res = await aiApi.models.performance(modelId, { period });
      if (res.success) {
        setPerformanceData(res);
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to load performance data', variant: 'destructive' });
    } finally {
      setPerformanceLoading(false);
    }
  };

  const handleViewPerformance = (modelId: string) => {
    setPerformanceModelId(modelId);
    setPerformanceOpen(true);
    fetchPerformance(modelId, performancePeriod);
  };

  const groupedModels = models.reduce((acc: Record<string, any[]>, model) => {
    if (!acc[model.modelId]) acc[model.modelId] = [];
    acc[model.modelId].push(model);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bot className="w-8 h-8" />
            AI Model Versioning & Rollback
          </h1>
          <p className="text-muted-foreground mt-1">Manage AI model versions and rollback capabilities</p>
        </div>
        <Button variant="outline" onClick={fetchModels} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : Object.keys(groupedModels).length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No AI models registered</p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(groupedModels).map(([modelId, versions]) => (
          <Card key={modelId}>
            <CardHeader>
              <CardTitle>{modelId.replace(/_/g, ' ').toUpperCase()}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Version</TableHead>
                    <TableHead>Algorithm</TableHead>
                    <TableHead>Training Date</TableHead>
                    <TableHead>Training Metrics</TableHead>
                    <TableHead>Deployed</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                    <TableHead>Performance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {versions.map((model) => (
                    <TableRow key={model.id}>
                      <TableCell className="font-mono">{model.version}</TableCell>
                      <TableCell>{model.algorithm}</TableCell>
                      <TableCell>{formatDate(model.trainingDate)}</TableCell>
                      <TableCell>
                        {model.performanceMetrics ? (
                          <div className="text-xs">
                            F1: {model.performanceMetrics.f1?.toFixed(2) || 'N/A'} | AUC: {model.performanceMetrics.auc?.toFixed(2) || 'N/A'}
                          </div>
                        ) : (
                          'N/A'
                        )}
                      </TableCell>
                      <TableCell>{formatDate(model.deployedAt)}</TableCell>
                      <TableCell>
                        <Badge className={model.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {model.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {!model.isActive && (
                          <Dialog open={rollbackOpen && selectedModel?.id === model.id} onOpenChange={setRollbackOpen}>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedModel(model);
                                  setTargetVersion(model.version);
                                }}
                              >
                                Rollback
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Rollback Model</DialogTitle>
                                <DialogDescription>
                                  Rollback {modelId} to version {model.version}?
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label>Target Version</Label>
                                  <Input value={targetVersion} onChange={(e) => setTargetVersion(e.target.value)} />
                                </div>
                                <Alert>
                                  <AlertTriangle className="h-4 w-4" />
                                  <AlertDescription className="text-xs">
                                    This will deactivate the current version and activate version {model.version}. Tenants will be notified.
                                  </AlertDescription>
                                </Alert>
                                <div className="flex justify-end gap-2">
                                  <Button variant="outline" onClick={() => setRollbackOpen(false)}>
                                    Cancel
                                  </Button>
                                  <Button onClick={handleRollback} disabled={rollingBack}>
                                    {rollingBack ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                    Confirm Rollback
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleViewPerformance(modelId)}
                        >
                          <BarChart3 className="w-4 h-4 mr-1" />
                          View Performance
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))
      )}

      {/* Performance Monitoring Dialog */}
      <Dialog open={performanceOpen} onOpenChange={setPerformanceOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Model Performance Monitoring</DialogTitle>
            <DialogDescription>
              Performance metrics for {performanceModelId?.replace(/_/g, ' ').toUpperCase()}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Label>Period</Label>
              <Select value={performancePeriod} onValueChange={(v) => {
                setPerformancePeriod(v);
                if (performanceModelId) fetchPerformance(performanceModelId, v);
              }}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="all">All time</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {performanceLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : performanceData ? (
              <>
                {/* Alerts */}
                {performanceData.alerts && performanceData.alerts.length > 0 && (
                  <div className="space-y-2">
                    {performanceData.alerts.map((alert: any, idx: number) => (
                      <Alert key={idx} variant={alert.severity === 'HIGH' ? 'destructive' : 'default'}>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>{alert.message}</AlertDescription>
                      </Alert>
                    ))}
                  </div>
                )}

                {/* Summary Cards */}
                <div className="grid grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-sm text-muted-foreground">Total Invocations</div>
                      <div className="text-2xl font-bold">{performanceData.summary.totalInvocations.toLocaleString()}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-sm text-muted-foreground">Active Version</div>
                      <div className="text-2xl font-bold">{performanceData.activeVersion}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-sm text-muted-foreground">Versions</div>
                      <div className="text-2xl font-bold">{performanceData.summary.totalVersions}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-sm text-muted-foreground">Active Invocations</div>
                      <div className="text-2xl font-bold">{performanceData.summary.activeVersionInvocations.toLocaleString()}</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Version Metrics Table */}
                <Card>
                  <CardHeader>
                    <CardTitle>Version Performance Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Version</TableHead>
                          <TableHead>Invocations</TableHead>
                          <TableHead>Success Rate</TableHead>
                          <TableHead>Error Rate</TableHead>
                          <TableHead>Avg Latency</TableHead>
                          <TableHead>P99 Latency</TableHead>
                          <TableHead>Avg Confidence</TableHead>
                          <TableHead>Override Rate</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {performanceData.versionMetrics.map((vm: any) => (
                          <TableRow key={vm.version}>
                            <TableCell className="font-mono">{vm.version}</TableCell>
                            <TableCell>{vm.totalInvocations.toLocaleString()}</TableCell>
                            <TableCell>
                              <Badge className={vm.successRate >= 90 ? 'bg-green-100 text-green-800' : vm.successRate >= 70 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}>
                                {vm.successRate.toFixed(1)}%
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={vm.errorRate < 5 ? 'bg-green-100 text-green-800' : vm.errorRate < 10 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}>
                                {vm.errorRate.toFixed(1)}%
                              </Badge>
                            </TableCell>
                            <TableCell>{vm.avgLatencyMs.toFixed(0)}ms</TableCell>
                            <TableCell>
                              <Badge className={vm.p99LatencyMs < 2000 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                                {vm.p99LatencyMs.toFixed(0)}ms
                              </Badge>
                            </TableCell>
                            <TableCell>{(vm.avgConfidence * 100).toFixed(1)}%</TableCell>
                            <TableCell>
                              <Badge className={vm.overrideRate < 30 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                                {vm.overrideRate.toFixed(1)}%
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                {/* Time Series Chart */}
                {performanceData.timeSeries && performanceData.timeSeries.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Daily Performance Trends</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={performanceData.timeSeries}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis yAxisId="left" />
                          <YAxis yAxisId="right" orientation="right" />
                          <Tooltip />
                          <Legend />
                          <Line yAxisId="left" type="monotone" dataKey="invocations" stroke="#8884d8" name="Invocations" />
                          <Line yAxisId="left" type="monotone" dataKey="errors" stroke="#ff7300" name="Errors" />
                          <Line yAxisId="right" type="monotone" dataKey="avgLatency" stroke="#82ca9d" name="Avg Latency (ms)" />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">No performance data available</div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
