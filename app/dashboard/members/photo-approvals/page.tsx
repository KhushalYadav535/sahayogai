"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { getToken } from "@/lib/api";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, XCircle, Eye } from "lucide-react";
import { toast } from "sonner";

interface PhotoApproval {
    id: string;
    memberId: string;
    memberName?: string;
    memberNumber?: string;
    purposeCode?: string;
    captureMode?: string;
    status: string;
    submittedAt?: string;
    makerName?: string;
    imageUrl?: string;
    createdAt: string;
}

interface SignatureApproval {
    id: string;
    memberId: string;
    memberName?: string;
    memberNumber?: string;
    status: string;
    submittedAt?: string;
    makerName?: string;
    imageUrl?: string;
    createdAt: string;
}

export default function PhotoApprovalsPage() {
    const { user } = useAuth();
    const [photos, setPhotos] = useState<PhotoApproval[]>([]);
    const [signatures, setSignatures] = useState<SignatureApproval[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPhoto, setSelectedPhoto] = useState<PhotoApproval | SignatureApproval | null>(null);
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
    const [rejectionReason, setRejectionReason] = useState("");
    const [activeTab, setActiveTab] = useState("photos");

    useEffect(() => {
        fetchPendingPhotos();
        fetchPendingSignatures();
    }, []);

    const fetchPendingPhotos = async () => {
        try {
            const token = getToken();
            const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";
            const response = await fetch(`${API_BASE}/members/photos/pending`, {
                headers: {
                    Authorization: `Bearer ${token || ""}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setPhotos(data.photos || []);
            } else {
                toast.error("Failed to load pending photos");
            }
        } catch (err) {
            console.error("Error fetching pending photos:", err);
            toast.error("Failed to load pending photos");
        } finally {
            setLoading(false);
        }
    };

    const fetchPendingSignatures = async () => {
        try {
            const token = getToken();
            const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";
            const response = await fetch(`${API_BASE}/members/signatures/pending`, {
                headers: {
                    Authorization: `Bearer ${token || ""}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setSignatures(data.signatures || []);
            }
        } catch (err) {
            console.error("Error fetching pending signatures:", err);
        }
    };

    const handleApprove = async (docId: string, memberId: string) => {
        try {
            const token = getToken();
            const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";
            const endpoint = activeTab === "photos" 
                ? `/members/${memberId}/photo/${docId}/approve`
                : `/members/${memberId}/signature/${docId}/approve`;
            const response = await fetch(`${API_BASE}${endpoint}`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token || ""}`,
                },
            });

            if (response.ok) {
                toast.success(`${activeTab === "photos" ? "Photo" : "Signature"} approved successfully`);
                if (activeTab === "photos") fetchPendingPhotos();
                else fetchPendingSignatures();
            } else {
                const error = await response.json().catch(() => ({}));
                toast.error(error.message || `Failed to approve ${activeTab === "photos" ? "photo" : "signature"}`);
            }
        } catch (err: any) {
            toast.error(err.message || `Failed to approve ${activeTab === "photos" ? "photo" : "signature"}`);
        }
    };

    const handleReject = async (docId: string, memberId: string) => {
        if (!rejectionReason.trim()) {
            toast.error("Please provide a rejection reason");
            return;
        }

        try {
            const token = getToken();
            const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";
            const endpoint = activeTab === "photos" 
                ? `/members/${memberId}/photo/${docId}/reject`
                : `/members/${memberId}/signature/${docId}/reject`;
            const response = await fetch(`${API_BASE}${endpoint}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token || ""}`,
                },
                body: JSON.stringify({ rejectionReason }),
            });

            if (response.ok) {
                toast.success(`${activeTab === "photos" ? "Photo" : "Signature"} rejected`);
                setRejectionReason("");
                setIsViewDialogOpen(false);
                if (activeTab === "photos") fetchPendingPhotos();
                else fetchPendingSignatures();
            } else {
                toast.error(`Failed to reject ${activeTab === "photos" ? "photo" : "signature"}`);
            }
        } catch (err) {
            toast.error(`Failed to reject ${activeTab === "photos" ? "photo" : "signature"}`);
        }
    };

    const getStatusBadge = (status: string) => {
        const colors: Record<string, string> = {
            DRAFT: "bg-gray-100 text-gray-800",
            PENDING_APPROVAL: "bg-amber-100 text-amber-800",
            APPROVED: "bg-green-100 text-green-800",
            REJECTED: "bg-red-100 text-red-800",
        };
        return (
            <Badge className={colors[status] || "bg-gray-100 text-gray-800"}>
                {status.replace("_", " ")}
            </Badge>
        );
    };

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Document Approval Queue</h1>
                <p className="text-muted-foreground mt-1">
                    Review and approve member documents
                </p>
            </div>

            <Tabs defaultValue="photos" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4">
                    <TabsTrigger value="photos">Photos</TabsTrigger>
                    <TabsTrigger value="signatures">Signatures</TabsTrigger>
                </TabsList>
                <TabsContent value="photos">
                    <Card>
                        <CardHeader>
                            <CardTitle>Pending Photos</CardTitle>
                            <CardDescription>
                                {photos.length} photo{photos.length !== 1 ? "s" : ""} awaiting approval
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="text-center py-8">Loading...</div>
                            ) : photos.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    No pending photo approvals
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Member</TableHead>
                                            <TableHead>Purpose</TableHead>
                                            <TableHead>Capture Mode</TableHead>
                                            <TableHead>Uploaded By</TableHead>
                                            <TableHead>Submitted At</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {photos.map((photo) => (
                                            <TableRow key={photo.id}>
                                                <TableCell>
                                                    <div>
                                                        <div className="font-medium">
                                                            {photo.memberName || "Unknown"}
                                                        </div>
                                                        <div className="text-sm text-muted-foreground">
                                                            {photo.memberNumber}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{photo.purposeCode}</TableCell>
                                                <TableCell>{photo.captureMode}</TableCell>
                                                <TableCell>{photo.makerName || "System"}</TableCell>
                                                <TableCell>
                                                    {photo.submittedAt
                                                        ? new Date(photo.submittedAt).toLocaleDateString()
                                                        : "-"}
                                                </TableCell>
                                                <TableCell>{getStatusBadge(photo.status)}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => {
                                                                setSelectedPhoto(photo);
                                                                setIsViewDialogOpen(true);
                                                            }}
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleApprove(photo.id, photo.memberId)}
                                                        >
                                                            <CheckCircle className="h-4 w-4 text-green-600" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => {
                                                                setSelectedPhoto(photo);
                                                                setIsViewDialogOpen(true);
                                                            }}
                                                        >
                                                            <XCircle className="h-4 w-4 text-red-600" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="signatures">
                    <Card>
                        <CardHeader>
                            <CardTitle>Pending Signatures</CardTitle>
                            <CardDescription>
                                {signatures.length} signature{signatures.length !== 1 ? "s" : ""} awaiting approval
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="text-center py-8">Loading...</div>
                            ) : signatures.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    No pending signature approvals
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Member</TableHead>
                                            <TableHead>Uploaded By</TableHead>
                                            <TableHead>Submitted At</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {signatures.map((sig) => (
                                            <TableRow key={sig.id}>
                                                <TableCell>
                                                    <div>
                                                        <div className="font-medium">
                                                            {sig.memberName || "Unknown"}
                                                        </div>
                                                        <div className="text-sm text-muted-foreground">
                                                            {sig.memberNumber}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{sig.makerName || "System"}</TableCell>
                                                <TableCell>
                                                    {sig.submittedAt
                                                        ? new Date(sig.submittedAt).toLocaleDateString()
                                                        : "-"}
                                                </TableCell>
                                                <TableCell>{getStatusBadge(sig.status)}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => {
                                                                setSelectedPhoto(sig);
                                                                setIsViewDialogOpen(true);
                                                            }}
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleApprove(sig.id, sig.memberId)}
                                                        >
                                                            <CheckCircle className="h-4 w-4 text-green-600" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => {
                                                                setSelectedPhoto(sig);
                                                                setIsViewDialogOpen(true);
                                                            }}
                                                        >
                                                            <XCircle className="h-4 w-4 text-red-600" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* View Dialog */}
            <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Review {activeTab === "photos" ? "Photo" : "Signature"}</DialogTitle>
                        <DialogDescription>
                            Member: {selectedPhoto?.memberName} ({selectedPhoto?.memberNumber})
                        </DialogDescription>
                    </DialogHeader>

                    {selectedPhoto && (
                        <div className="space-y-6">
                            <div className="flex justify-center border rounded-lg p-4 bg-muted/20">
                                <img
                                    src={selectedPhoto.imageUrl}
                                    alt={activeTab === "photos" ? "Member Photo" : "Member Signature"}
                                    className="max-h-[400px] object-contain rounded"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                            selectedPhoto.memberName || "Member"
                                        )}&size=400`;
                                    }}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-muted-foreground block">Uploaded By</span>
                                    <span className="font-medium">{selectedPhoto.makerName || "System"}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground block">Submitted At</span>
                                    <span className="font-medium">
                                        {selectedPhoto.submittedAt
                                            ? new Date(selectedPhoto.submittedAt).toLocaleString()
                                            : "-"}
                                    </span>
                                </div>
                                {activeTab === "photos" && (
                                    <>
                                        <div>
                                            <span className="text-muted-foreground block">Purpose</span>
                                            <span className="font-medium">{(selectedPhoto as PhotoApproval).purposeCode}</span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground block">Capture Mode</span>
                                            <span className="font-medium">{(selectedPhoto as PhotoApproval).captureMode}</span>
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="space-y-2 border-t pt-4">
                                <Label>Rejection Reason (if rejecting)</Label>
                                <Textarea
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    placeholder="Please provide a reason if rejecting this document..."
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2 border-t">
                                <Button
                                    variant="outline"
                                    onClick={() => handleReject(selectedPhoto.id, selectedPhoto.memberId)}
                                >
                                    Reject
                                </Button>
                                <Button
                                    onClick={() => {
                                        handleApprove(selectedPhoto.id, selectedPhoto.memberId);
                                        setIsViewDialogOpen(false);
                                    }}
                                >
                                    Approve
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}