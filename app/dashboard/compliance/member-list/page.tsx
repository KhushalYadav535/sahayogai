"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { complianceApi } from "@/lib/api";
import { Download, Users } from "lucide-react";
import { formatCurrency } from "@/lib/utils/formatters";

export default function MemberListPage() {
  const { toast } = useToast();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [format, setFormat] = useState<string>("EXCEL");

  useEffect(() => {
    loadReport();
  }, [statusFilter, format]);

  const loadReport = async () => {
    setLoading(true);
    try {
      const res = await complianceApi.memberList({ status: statusFilter !== "all" ? statusFilter : undefined, format });
      if (res.success) {
        setReport(res.report);
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to load member list", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!report) return;
    const csv = [
      ["Member Number", "Name", "Phone", "Email", "Join Date", "Status", "KYC Status", "Share Capital"],
      ...report.records.map((r: any) => [
        r.memberNumber,
        r.name,
        r.phone,
        r.email,
        r.joinDate,
        r.status,
        r.kycStatus,
        r.shareCapital,
      ]),
    ].map((row) => row.join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `member-list-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Member List</h1>
          <p className="text-muted-foreground mt-2">Export member list with details</p>
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="resigned">Resigned</SelectItem>
            </SelectContent>
          </Select>
          <Select value={format} onValueChange={setFormat}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="EXCEL">Excel</SelectItem>
              <SelectItem value="CSV">CSV</SelectItem>
            </SelectContent>
          </Select>
          {report && (
            <Button onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          )}
        </div>
      </div>

      {report && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Member List Export
            </CardTitle>
            <CardDescription>
              Format: {report.format} | Total Members: {report.totalMembers}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-[600px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member Number</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Join Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>KYC Status</TableHead>
                    <TableHead className="text-right">Share Capital</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.records.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground">
                        No members found
                      </TableCell>
                    </TableRow>
                  ) : (
                    report.records.map((record: any) => (
                      <TableRow key={record.memberNumber}>
                        <TableCell className="font-mono">{record.memberNumber}</TableCell>
                        <TableCell>{record.name}</TableCell>
                        <TableCell>{record.phone}</TableCell>
                        <TableCell>{record.email}</TableCell>
                        <TableCell>{record.joinDate}</TableCell>
                        <TableCell>
                          <Badge variant={record.status === "active" ? "default" : "secondary"}>{record.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={record.kycStatus === "verified" ? "default" : "outline"}>{record.kycStatus}</Badge>
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(record.shareCapital)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
