"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { complianceApi } from "@/lib/api";
import { CheckCircle, AlertTriangle, Clock, FileText, Download, TrendingUp, Users, Shield } from "lucide-react";
import Link from "next/link";

export default function ComplianceDashboardPage() {
  const { toast } = useToast();
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const res = await complianceApi.dashboard();
      if (res.success) {
        setDashboard(res.dashboard);
      }
    } catch (err) {
      console.error("Failed to load dashboard:", err);
      toast({ title: "Error", description: "Failed to load compliance dashboard", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!dashboard) {
    return <div className="text-center py-12">Failed to load dashboard</div>;
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "OK":
      case "COMPLIANT":
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />OK</Badge>;
      case "DUE":
      case "PENDING":
        return <Badge className="bg-yellow-500"><Clock className="w-3 h-3 mr-1" />Due</Badge>;
      case "ALERT":
      case "NON_COMPLIANT":
        return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />Alert</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Compliance Dashboard</h1>
        <p className="text-muted-foreground mt-2">Real-time compliance status and regulatory reporting overview</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">NABARD Report</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              {getStatusBadge(dashboard.nabard.status)}
              <span className="text-xs text-muted-foreground">Due: {dashboard.nabard.dueDate}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Registrar Return</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              {getStatusBadge(dashboard.registrar.status)}
              <span className="text-xs text-muted-foreground">Due: {dashboard.registrar.dueDate}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">TDS Filing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              {getStatusBadge(dashboard.tds.status)}
              <span className="text-xs text-muted-foreground">Next: {dashboard.tds.nextDue}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">STR Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              {getStatusBadge(dashboard.str.status)}
              <span className="text-xs text-muted-foreground">{dashboard.str.pendingCount} pending</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Section */}
      {(dashboard.kyc.pendingCount > 0 || dashboard.aml.alertCount > 0) && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              {dashboard.kyc.pendingCount > 0 && (
                <p>⚠️ {dashboard.kyc.pendingCount} members have pending KYC verification</p>
              )}
              {dashboard.aml.alertCount > 0 && (
                <p>⚠️ {dashboard.aml.alertCount} AML alerts require review</p>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Compliance Events */}
      {dashboard.complianceEvents && dashboard.complianceEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Upcoming Compliance Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {dashboard.complianceEvents.map((event: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <p className="font-medium text-sm">{event.title || event.name}</p>
                    <p className="text-xs text-muted-foreground">Due: {new Date(event.dueDate).toLocaleDateString()}</p>
                  </div>
                  <Badge variant={event.status === "OVERDUE" ? "destructive" : "outline"}>{event.status}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Generate compliance reports</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            <Link href="/dashboard/compliance/nabard-report">
              <Button variant="outline" className="w-full">
                <FileText className="w-4 h-4 mr-2" />
                NABARD Report
              </Button>
            </Link>
            <Link href="/dashboard/compliance/registrar-return">
              <Button variant="outline" className="w-full">
                <FileText className="w-4 h-4 mr-2" />
                Registrar Return
              </Button>
            </Link>
            <Link href="/dashboard/compliance/tds-26q">
              <Button variant="outline" className="w-full">
                <FileText className="w-4 h-4 mr-2" />
                TDS 26Q
              </Button>
            </Link>
            <Link href="/dashboard/compliance/str">
              <Button variant="outline" className="w-full">
                <Shield className="w-4 h-4 mr-2" />
                STR Report
              </Button>
            </Link>
            <Link href="/dashboard/compliance/reports">
              <Button variant="outline" className="w-full">
                <FileText className="w-4 h-4 mr-2" />
                All Reports
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
