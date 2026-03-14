"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { interestApi, getToken } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Filter, Calendar } from "lucide-react";
import { toast } from "sonner";

interface AuditRecord {
    id: string;
    schemeCode: string;
    schemeName: string;
    changeType: "CREATED" | "MODIFIED" | "DEACTIVATED";
    oldParameters: any;
    newParameters: any;
    changedBy: string;
    changedByName?: string;
    approvedBy?: string;
    approvedByName?: string;
    changeDate: string;
    effectiveDate: string;
    approvalDate?: string;
    rejectionReason?: string;
    rateDeltaPct?: number;
}

export default function InterestSchemeAuditTrailPage() {
    const { user } = useAuth();
    const [auditRecords, setAuditRecords] = useState<AuditRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        schemeCode: "",
        changeType: "all",
        fromDate: "",
        toDate: "",
    });

    useEffect(() => {
        fetchAuditTrail();
    }, [filters]);

    const fetchAuditTrail = async () => {
        try {
            setLoading(true);
            const token = getToken();
            const response = await interestApi.schemes.audit(
                {
                    schemeCode: filters.schemeCode || undefined,
                    changeType: filters.changeType !== "all" ? filters.changeType : undefined,
                    fromDate: filters.fromDate || undefined,
                    toDate: filters.toDate || undefined,
                },
                token || undefined
            );

            if (response.success) {
                setAuditRecords(response.records || []);
            }
        } catch (err: any) {
            console.error("Error fetching audit trail:", err);
            toast.error(err.message || "Failed to load audit trail");
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async (format: "pdf" | "excel") => {
        try {
            const token = getToken();
            const response = await interestApi.schemes.exportAudit(
                {
                    schemeCode: filters.schemeCode || undefined,
                    changeType: filters.changeType !== "all" ? filters.changeType : undefined,
                    fromDate: filters.fromDate || undefined,
                    toDate: filters.toDate || undefined,
                    format,
                },
                token || undefined
            );

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `interest-scheme-audit-${new Date().toISOString()}.${format === "pdf" ? "pdf" : "xlsx"}`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                toast.success(`Audit trail exported as ${format.toUpperCase()}`);
            } else {
                toast.error("Failed to export audit trail");
            }
        } catch (err: any) {
            toast.error(err.message || "Failed to export audit trail");
        }
    };

    const getChangeTypeBadge = (type: string) => {
        const colors: Record<string, string> = {
            CREATED: "bg-green-100 text-green-800",
            MODIFIED: "bg-blue-100 text-blue-800",
            DEACTIVATED: "bg-red-100 text-red-800",
        };
        return (
            <Badge className={colors[type] || "bg-gray-100 text-gray-800"}>
                {type}
            </Badge>
        );
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Interest Scheme Audit Trail</h1>
                    <p className="text-muted-foreground mt-1">
                        Complete history of all interest rate scheme changes
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => handleExport("excel")}>
                        <Download className="mr-2 h-4 w-4" />
                        Export Excel
                    </Button>
                    <Button variant="outline" onClick={() => handleExport("pdf")}>
                        <Download className="mr-2 h-4 w-4" />
                        Export PDF
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Filters</CardTitle>
                    <CardDescription>Filter audit records by scheme, type, or date range</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-4 gap-4">
                        <div>
                            <Label>Scheme Code</Label>
                            <Input
                                value={filters.schemeCode}
                                onChange={(e) =>
                                    setFilters({ ...filters, schemeCode: e.target.value })
                                }
                                placeholder="Filter by scheme code"
                            />
                        </div>
                        <div>
                            <Label>Change Type</Label>
                            <Select
                                value={filters.changeType}
                                onValueChange={(value) =>
                                    setFilters({ ...filters, changeType: value })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    <SelectItem value="CREATED">Created</SelectItem>
                                    <SelectItem value="MODIFIED">Modified</SelectItem>
                                    <SelectItem value="DEACTIVATED">Deactivated</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>From Date</Label>
                            <Input
                                type="date"
                                value={filters.fromDate}
                                onChange={(e) =>
                                    setFilters({ ...filters, fromDate: e.target.value })
                                }
                            />
                        </div>
                        <div>
                            <Label>To Date</Label>
                            <Input
                                type="date"
                                value={filters.toDate}
                                onChange={(e) =>
                                    setFilters({ ...filters, toDate: e.target.value })
                                }
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Audit Records</CardTitle>
                    <CardDescription>
                        {auditRecords.length} record{auditRecords.length !== 1 ? "s" : ""} found
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-8">Loading...</div>
                    ) : auditRecords.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No audit records found
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Scheme</TableHead>
                                    <TableHead>Change Type</TableHead>
                                    <TableHead>Changed By</TableHead>
                                    <TableHead>Approved By</TableHead>
                                    <TableHead>Rate Delta</TableHead>
                                    <TableHead>Effective Date</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {auditRecords.map((record) => (
                                    <TableRow key={record.id}>
                                        <TableCell>
                                            {new Date(record.changeDate).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <div className="font-medium">{record.schemeCode}</div>
                                                <div className="text-sm text-muted-foreground">
                                                    {record.schemeName}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>{getChangeTypeBadge(record.changeType)}</TableCell>
                                        <TableCell>
                                            {record.changedByName || record.changedBy}
                                        </TableCell>
                                        <TableCell>
                                            {record.approvedByName || record.approvedBy || "-"}
                                        </TableCell>
                                        <TableCell>
                                            {record.rateDeltaPct !== null && record.rateDeltaPct !== undefined
                                                ? `${record.rateDeltaPct > 0 ? "+" : ""}${record.rateDeltaPct.toFixed(2)}%`
                                                : "-"}
                                        </TableCell>
                                        <TableCell>
                                            {new Date(record.effectiveDate).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    // Show details dialog
                                                    toast.info("View details functionality would show full parameter comparison");
                                                }}
                                            >
                                                View Details
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
