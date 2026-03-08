"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { complianceApi } from "@/lib/api";
import { Download, FileText } from "lucide-react";
import { formatCurrency } from "@/lib/utils/formatters";

export default function LoanScheduleReportPage() {
  const { toast } = useToast();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedLoan, setSelectedLoan] = useState<string | null>(null);

  useEffect(() => {
    loadReport();
  }, [statusFilter]);

  const loadReport = async () => {
    setLoading(true);
    try {
      const res = await complianceApi.loanScheduleReport({ status: statusFilter !== "all" ? statusFilter : undefined });
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
    toast({ title: "Info", description: "PDF/Excel download would be implemented here" });
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Loan Schedule Report</h1>
          <p className="text-muted-foreground mt-2">View EMI schedules for all loans</p>
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Loans</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
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
              <FileText className="w-5 h-5" />
              Loan Schedule Report
            </CardTitle>
            <CardDescription>Total Loans: {report.totalLoans}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {report.records.map((loan: any) => (
                <Card key={loan.loanId} className="border">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base">{loan.loanNumber}</CardTitle>
                        <CardDescription>
                          {loan.member.name} ({loan.member.memberNumber}) | Amount: {formatCurrency(loan.loanAmount)} | EMI: {formatCurrency(loan.emiAmount)}
                        </CardDescription>
                      </div>
                      <Badge variant={loan.status === "active" ? "default" : loan.status === "overdue" ? "destructive" : "secondary"}>{loan.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="max-h-[300px] overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>EMI #</TableHead>
                            <TableHead>Due Date</TableHead>
                            <TableHead className="text-right">Principal</TableHead>
                            <TableHead className="text-right">Interest</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Paid Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {loan.schedule.map((emi: any) => (
                            <TableRow key={emi.emiNumber}>
                              <TableCell>{emi.emiNumber}</TableCell>
                              <TableCell>{new Date(emi.dueDate).toLocaleDateString()}</TableCell>
                              <TableCell className="text-right">{formatCurrency(emi.principalAmount)}</TableCell>
                              <TableCell className="text-right">{formatCurrency(emi.interestAmount)}</TableCell>
                              <TableCell className="text-right font-medium">{formatCurrency(emi.totalAmount)}</TableCell>
                              <TableCell>
                                <Badge variant={emi.status === "paid" ? "default" : "outline"}>{emi.status}</Badge>
                              </TableCell>
                              <TableCell>{emi.paidDate ? new Date(emi.paidDate).toLocaleDateString() : "-"}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
