"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { complianceApi } from "@/lib/api";
import { Download, Users, AlertTriangle } from "lucide-react";
import { formatCurrency } from "@/lib/utils/formatters";

export default function MemberDueReportPage() {
  const { toast } = useToast();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    loadReport();
  }, [statusFilter]);

  const loadReport = async () => {
    setLoading(true);
    try {
      const res = await complianceApi.memberDueReport({ status: statusFilter !== "all" ? statusFilter : undefined });
      if (res.success) {
        setReport(res.report);
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to load report", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!report) return;
    const csv = [
      ["Member Number", "Name", "Phone", "Total Loan Dues", "Total Outstanding", "Overdue Loans", "Status"],
      ...report.records.map((r: any) => [
        r.memberNumber,
        r.name,
        r.phone,
        r.totalLoanDues,
        r.totalOutstanding,
        r.overdueLoans,
        r.status,
      ]),
    ].map((row) => row.join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `member-due-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "OVERDUE":
        return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />Overdue</Badge>;
      case "ACTIVE":
        return <Badge className="bg-blue-500">Active</Badge>;
      case "CLEAR":
        return <Badge className="bg-green-500">Clear</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Member Due Report</h1>
          <p className="text-muted-foreground mt-2">Track member loan dues and outstanding amounts</p>
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Members</SelectItem>
              <SelectItem value="OVERDUE">Overdue Only</SelectItem>
              <SelectItem value="ACTIVE">Active Loans</SelectItem>
              <SelectItem value="CLEAR">Clear</SelectItem>
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
              Member Due Summary
            </CardTitle>
            <CardDescription>
              Total Members: {report.totalMembers} | Overdue: {report.overdueCount}
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
                    <TableHead className="text-right">Loan Dues</TableHead>
                    <TableHead className="text-right">Outstanding</TableHead>
                    <TableHead className="text-right">Overdue Loans</TableHead>
                    <TableHead className="text-right">Active Loans</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.records.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground">
                        No records found
                      </TableCell>
                    </TableRow>
                  ) : (
                    report.records.map((record: any) => (
                      <TableRow key={record.memberId}>
                        <TableCell className="font-mono">{record.memberNumber}</TableCell>
                        <TableCell>{record.name}</TableCell>
                        <TableCell>{record.phone || "N/A"}</TableCell>
                        <TableCell className="text-right font-semibold">{formatCurrency(record.totalLoanDues)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(record.totalOutstanding)}</TableCell>
                        <TableCell className="text-right">{record.overdueLoans}</TableCell>
                        <TableCell className="text-right">{record.activeLoans}</TableCell>
                        <TableCell>{getStatusBadge(record.status)}</TableCell>
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
