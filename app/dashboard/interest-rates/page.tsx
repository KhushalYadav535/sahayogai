"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { UserRole } from "@/lib/types/auth";
import { interestApi, getToken } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Eye, Edit, CheckCircle, XCircle, Clock, AlertCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface InterestScheme {
    id: string;
    schemeCode: string;
    schemeName: string;
    productType: "SB" | "FDR" | "RD" | "Loan";
    interestMethod: string;
    compoundingFreq: string;
    slabApplicationMethod: "FLAT" | "MARGINAL";
    effectiveFromDate: string;
    effectiveToDate?: string;
    status: "DRAFT" | "PENDING_APPROVAL" | "ACTIVE" | "SUPERSEDED" | "DEACTIVATED";
    slabs?: InterestSchemeSlab[];
}

interface InterestSchemeSlab {
    id: string;
    minAmount?: number;
    maxAmount?: number;
    minTenureDays?: number;
    maxTenureDays?: number;
    rate: number;
}

export default function InterestRatesPage() {
    const { user } = useAuth();
    const [schemes, setSchemes] = useState<InterestScheme[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedScheme, setSelectedScheme] = useState<InterestScheme | null>(null);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("all");

    // Form state
    const [formData, setFormData] = useState({
        schemeCode: "",
        schemeName: "",
        productType: "SB" as "SB" | "FDR" | "RD" | "Loan",
        interestMethod: "SIMPLE",
        compoundingFreq: "MONTHLY",
        slabApplicationMethod: "FLAT" as "FLAT" | "MARGINAL",
        effectiveFromDate: "",
        reason: "",
    });

    // Slab form state
    const [slabs, setSlabs] = useState<Omit<InterestSchemeSlab, "id">[]>([]);
    const [editingSlabIndex, setEditingSlabIndex] = useState<number | null>(null);

    useEffect(() => {
        fetchSchemes();
    }, []);

    const fetchSchemes = async () => {
        try {
            const token = getToken();
            const response = await interestApi.schemes.list(token || undefined);
            if (response.success) {
                setSchemes(response.schemes || []);
            }
        } catch (err) {
            console.error("Error fetching schemes:", err);
            toast.error("Failed to load interest schemes");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateScheme = async () => {
        if (!formData.schemeCode || !formData.schemeName || !formData.effectiveFromDate) {
            toast.error("Please fill all required fields");
            return;
        }

        if (slabs.length === 0) {
            toast.error("Please add at least one rate slab");
            return;
        }
        // IMP-04: FDR scheme must have minimum 3 tenure bands
        if (formData.productType === "FDR" && slabs.length < 3) {
            toast.error("FDR schemes require at least 3 tenure bands (e.g. 1–12, 12–36, 36–60 months)");
            return;
        }

        // Validate date is not in the past
        const selectedDate = new Date(formData.effectiveFromDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (selectedDate < today) {
            toast.error("Effective from date must be today or in the future");
            return;
        }

        try {
            const token = getToken();
            const response = await interestApi.schemes.create({
                schemeCode: formData.schemeCode,
                schemeName: formData.schemeName,
                productType: formData.productType,
                interestMethod: formData.interestMethod,
                compoundingFreq: formData.compoundingFreq,
                slabApplicationMethod: formData.slabApplicationMethod,
                effectiveFromDate: formData.effectiveFromDate,
                slabs: slabs.map((slab) => ({
                    minAmount: slab.minAmount,
                    maxAmount: slab.maxAmount,
                    minTenureDays: slab.minTenureDays,
                    maxTenureDays: slab.maxTenureDays,
                    rate: slab.rate,
                })),
            }, token || undefined);

            if (response.success) {
                toast.success("Interest scheme created successfully");
                setIsCreateDialogOpen(false);
                setFormData({
                    schemeCode: "",
                    schemeName: "",
                    productType: "SB",
                    interestMethod: "SIMPLE",
                    compoundingFreq: "MONTHLY",
                    slabApplicationMethod: "FLAT",
                    effectiveFromDate: "",
                    reason: "",
                });
                setSlabs([]);
                fetchSchemes();
            }
        } catch (err: any) {
            // Show detailed error message from backend
            const errorMsg = err.message || (err.errors && Array.isArray(err.errors) 
                ? err.errors.map((e: any) => `${e.path?.join('.') || 'field'}: ${e.message}`).join('; ')
                : "Failed to create interest scheme");
            toast.error(errorMsg);
            console.error("Create scheme error:", err);
        }
    };

    const handleSubmitForApproval = async (schemeId: string) => {
        try {
            const token = getToken();
            const response = await interestApi.schemes.submit(schemeId, token || undefined);
            if (response.success) {
                toast.success("Scheme submitted for approval");
                fetchSchemes();
            }
        } catch (err: any) {
            toast.error(err.message || "Failed to submit scheme");
        }
    };

    const handleApprove = async (schemeId: string) => {
        try {
            const token = getToken();
            const response = await interestApi.schemes.approve(schemeId, token || undefined);
            if (response.success) {
                toast.success("Scheme approved successfully");
                fetchSchemes();
            }
        } catch (err: any) {
            toast.error(err.message || "Failed to approve scheme");
        }
    };

    const handleReject = async (schemeId: string, rejectionReason: string) => {
        try {
            const token = getToken();
            const response = await interestApi.schemes.reject(
                schemeId,
                { rejectionReason },
                token || undefined
            );
            if (response.success) {
                toast.success("Scheme rejected");
                fetchSchemes();
            }
        } catch (err: any) {
            toast.error(err.message || "Failed to reject scheme");
        }
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
            DRAFT: "outline",
            PENDING_APPROVAL: "secondary",
            ACTIVE: "default",
            SUPERSEDED: "outline",
            DEACTIVATED: "destructive",
        };
        const colors: Record<string, string> = {
            DRAFT: "bg-gray-100 text-gray-800",
            PENDING_APPROVAL: "bg-amber-100 text-amber-800",
            ACTIVE: "bg-green-100 text-green-800",
            SUPERSEDED: "bg-blue-100 text-blue-800",
            DEACTIVATED: "bg-red-100 text-red-800",
        };
        return (
            <Badge className={colors[status] || "bg-gray-100 text-gray-800"}>
                {status.replace("_", " ")}
            </Badge>
        );
    };

    const filteredSchemes = schemes.filter((scheme) => {
        if (activeTab === "all") return true;
        if (activeTab === "pending") return scheme.status === "PENDING_APPROVAL";
        if (activeTab === "active") return scheme.status === "ACTIVE";
        if (activeTab === "draft") return scheme.status === "DRAFT";
        return true;
    });

    if (loading) {
        return <div className="p-6">Loading...</div>;
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Interest Rate Management</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage interest rate schemes for SB, FDR, RD, and Loans
                    </p>
                </div>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Scheme
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Create Interest Rate Scheme</DialogTitle>
                            <DialogDescription>
                                Create a new interest rate scheme. It will require approval before
                                activation.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Scheme Code *</Label>
                                    <Input
                                        value={formData.schemeCode}
                                        onChange={(e) =>
                                            setFormData({ ...formData, schemeCode: e.target.value })
                                        }
                                        placeholder="e.g., SB_2025_Q1"
                                    />
                                </div>
                                <div>
                                    <Label>Scheme Name *</Label>
                                    <Input
                                        value={formData.schemeName}
                                        onChange={(e) =>
                                            setFormData({ ...formData, schemeName: e.target.value })
                                        }
                                        placeholder="e.g., Savings Bank Q1 2025"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Product Type *</Label>
                                    <Select
                                        value={formData.productType}
                                        onValueChange={(value: any) =>
                                            setFormData({ ...formData, productType: value })
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="SB">Savings Bank</SelectItem>
                                            <SelectItem value="FDR">Fixed Deposit</SelectItem>
                                            <SelectItem value="RD">Recurring Deposit</SelectItem>
                                            <SelectItem value="Loan">Loan</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Slab Application Method *</Label>
                                    <Select
                                        value={formData.slabApplicationMethod}
                                        onValueChange={(value: any) =>
                                            setFormData({
                                                ...formData,
                                                slabApplicationMethod: value,
                                            })
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="FLAT">Flat Rate</SelectItem>
                                            <SelectItem value="MARGINAL">Marginal Rate</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div>
                                <Label>Effective From Date *</Label>
                                <Input
                                    type="date"
                                    value={formData.effectiveFromDate}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            effectiveFromDate: e.target.value,
                                        })
                                    }
                                />
                            </div>
                            <div>
                                <Label>Reason for Change *</Label>
                                <Textarea
                                    value={formData.reason}
                                    onChange={(e) =>
                                        setFormData({ ...formData, reason: e.target.value })
                                    }
                                    placeholder="Explain the reason for this interest rate scheme..."
                                    rows={3}
                                />
                            </div>

                            {/* Slab Configuration */}
                            <div className="space-y-4 border-t pt-4">
                                <div className="flex items-center justify-between">
                                    <Label className="text-base font-semibold">Rate Slabs</Label>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setSlabs([
                                                ...slabs,
                                                {
                                                    minAmount: formData.productType === "SB" ? 0 : undefined,
                                                    maxAmount: undefined,
                                                    minTenureDays: formData.productType !== "SB" ? 0 : undefined,
                                                    maxTenureDays: undefined,
                                                    rate: 0,
                                                },
                                            ]);
                                        }}
                                    >
                                        <Plus className="mr-2 h-4 w-4" />
                                        Add Slab
                                    </Button>
                                </div>

                                {slabs.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-4">
                                        No slabs added. Click "Add Slab" to configure rate slabs.
                                    </p>
                                ) : (
                                    <div className="space-y-3">
                                        {slabs.map((slab, index) => (
                                            <Card key={index} className="p-4">
                                                <div className="grid grid-cols-12 gap-2 items-end">
                                                    {formData.productType === "SB" ? (
                                                        <>
                                                            <div className="col-span-5">
                                                                <Label className="text-xs">Min Amount (₹)</Label>
                                                                <Input
                                                                    type="number"
                                                                    value={slab.minAmount || ""}
                                                                    onChange={(e) => {
                                                                        const newSlabs = [...slabs];
                                                                        newSlabs[index].minAmount = parseFloat(e.target.value) || 0;
                                                                        setSlabs(newSlabs);
                                                                    }}
                                                                    placeholder="0"
                                                                />
                                                            </div>
                                                            <div className="col-span-5">
                                                                <Label className="text-xs">Max Amount (₹)</Label>
                                                                <Input
                                                                    type="number"
                                                                    value={slab.maxAmount || ""}
                                                                    onChange={(e) => {
                                                                        const newSlabs = [...slabs];
                                                                        newSlabs[index].maxAmount = parseFloat(e.target.value) || undefined;
                                                                        setSlabs(newSlabs);
                                                                    }}
                                                                    placeholder="No limit"
                                                                />
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <div className="col-span-5">
                                                                <Label className="text-xs">Min Tenure (Days)</Label>
                                                                <Input
                                                                    type="number"
                                                                    value={slab.minTenureDays || ""}
                                                                    onChange={(e) => {
                                                                        const newSlabs = [...slabs];
                                                                        newSlabs[index].minTenureDays = parseInt(e.target.value) || 0;
                                                                        setSlabs(newSlabs);
                                                                    }}
                                                                    placeholder="0"
                                                                />
                                                            </div>
                                                            <div className="col-span-5">
                                                                <Label className="text-xs">Max Tenure (Days)</Label>
                                                                <Input
                                                                    type="number"
                                                                    value={slab.maxTenureDays || ""}
                                                                    onChange={(e) => {
                                                                        const newSlabs = [...slabs];
                                                                        newSlabs[index].maxTenureDays = parseInt(e.target.value) || undefined;
                                                                        setSlabs(newSlabs);
                                                                    }}
                                                                    placeholder="No limit"
                                                                />
                                                            </div>
                                                        </>
                                                    )}
                                                    <div className="col-span-2">
                                                        <Label className="text-xs">Rate (%)</Label>
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            value={slab.rate}
                                                            onChange={(e) => {
                                                                const newSlabs = [...slabs];
                                                                newSlabs[index].rate = parseFloat(e.target.value) || 0;
                                                                setSlabs(newSlabs);
                                                            }}
                                                            placeholder="0.00"
                                                        />
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => {
                                                            setSlabs(slabs.filter((_, i) => i !== index));
                                                        }}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-red-600" />
                                                    </Button>
                                                </div>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setIsCreateDialogOpen(false);
                                        setSlabs([]);
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button onClick={handleCreateScheme}>Create Scheme</Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Interest Rate Schemes</CardTitle>
                    <CardDescription>
                        View and manage all interest rate schemes. Use tabs to filter by status.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList>
                            <TabsTrigger value="all">All</TabsTrigger>
                            <TabsTrigger value="pending">Pending Approval</TabsTrigger>
                            <TabsTrigger value="active">Active</TabsTrigger>
                            <TabsTrigger value="draft">Draft</TabsTrigger>
                        </TabsList>
                        <TabsContent value={activeTab} className="mt-4">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Scheme Code</TableHead>
                                        <TableHead>Scheme Name</TableHead>
                                        <TableHead>Product Type</TableHead>
                                        <TableHead>Slab Method</TableHead>
                                        <TableHead>Effective From</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredSchemes.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-8">
                                                No schemes found
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredSchemes.map((scheme) => (
                                            <TableRow key={scheme.id}>
                                                <TableCell className="font-medium">
                                                    {scheme.schemeCode}
                                                </TableCell>
                                                <TableCell>{scheme.schemeName}</TableCell>
                                                <TableCell>{scheme.productType}</TableCell>
                                                <TableCell>{scheme.slabApplicationMethod}</TableCell>
                                                <TableCell>
                                                    {new Date(scheme.effectiveFromDate).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell>{getStatusBadge(scheme.status)}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => {
                                                                setSelectedScheme(scheme);
                                                                setIsViewDialogOpen(true);
                                                            }}
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                        {scheme.status === "DRAFT" && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() =>
                                                                    handleSubmitForApproval(scheme.id)
                                                                }
                                                            >
                                                                Submit
                                                            </Button>
                                                        )}
                                                        {scheme.status === "PENDING_APPROVAL" &&
                                                            (user?.role === UserRole.SOCIETY_ADMIN ||
                                                                user?.role === UserRole.PRESIDENT) && (
                                                                <>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() =>
                                                                            handleApprove(scheme.id)
                                                                        }
                                                                    >
                                                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => {
                                                                            const reason = prompt(
                                                                                "Rejection reason:"
                                                                            );
                                                                            if (reason) {
                                                                                handleReject(
                                                                                    scheme.id,
                                                                                    reason
                                                                                );
                                                                            }
                                                                        }}
                                                                    >
                                                                        <XCircle className="h-4 w-4 text-red-600" />
                                                                    </Button>
                                                                </>
                                                            )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            {/* View Scheme Dialog */}
            <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {selectedScheme?.schemeCode} - {selectedScheme?.schemeName}
                        </DialogTitle>
                        <DialogDescription>Scheme details and rate slabs</DialogDescription>
                    </DialogHeader>
                    {selectedScheme && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-sm font-medium">Product Type</Label>
                                    <p className="text-sm">{selectedScheme.productType}</p>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium">Slab Method</Label>
                                    <p className="text-sm">{selectedScheme.slabApplicationMethod}</p>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium">Effective From</Label>
                                    <p className="text-sm">
                                        {new Date(selectedScheme.effectiveFromDate).toLocaleDateString()}
                                    </p>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium">Status</Label>
                                    <div className="mt-1">{getStatusBadge(selectedScheme.status)}</div>
                                </div>
                            </div>
                            {selectedScheme.slabs && selectedScheme.slabs.length > 0 && (
                                <div>
                                    <Label className="text-sm font-medium mb-2 block">
                                        Rate Slabs
                                    </Label>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Min Amount</TableHead>
                                                <TableHead>Max Amount</TableHead>
                                                <TableHead>Min Tenure (Days)</TableHead>
                                                <TableHead>Max Tenure (Days)</TableHead>
                                                <TableHead>Rate (%)</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {selectedScheme.slabs.map((slab) => (
                                                <TableRow key={slab.id}>
                                                    <TableCell>
                                                        {slab.minAmount
                                                            ? `₹${slab.minAmount.toLocaleString()}`
                                                            : "-"}
                                                    </TableCell>
                                                    <TableCell>
                                                        {slab.maxAmount
                                                            ? `₹${slab.maxAmount.toLocaleString()}`
                                                            : "-"}
                                                    </TableCell>
                                                    <TableCell>
                                                        {slab.minTenureDays || "-"}
                                                    </TableCell>
                                                    <TableCell>
                                                        {slab.maxTenureDays || "-"}
                                                    </TableCell>
                                                    <TableCell className="font-medium">
                                                        {slab.rate}%
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
