"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { getToken } from "@/lib/api";

interface SignatureVerificationProps {
    memberId: string;
    memberName?: string;
    onVerified: () => void;
    onCancel: () => void;
    transactionType: string;
    amount: number;
}

export function SignatureVerification({
    memberId,
    memberName,
    onVerified,
    onCancel,
    transactionType,
    amount,
}: SignatureVerificationProps) {
    const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [verified, setVerified] = useState(false);

    useEffect(() => {
        fetchSignature();
    }, [memberId]);

    const fetchSignature = async () => {
        try {
            const token = getToken();
            const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";
            const response = await fetch(`${API_BASE}/members/${memberId}/signature/current`, {
                headers: {
                    Authorization: `Bearer ${token || ""}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setSignatureUrl(data.signatureUrl || null);
            }
        } catch (err) {
            console.error("Error fetching signature:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = () => {
        setVerified(true);
        toast.success("Signature verified");
        setTimeout(() => {
            onVerified();
        }, 500);
    };

    const handleMismatch = () => {
        toast.error("Signature mismatch detected. Transaction cancelled.");
        onCancel();
    };

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader>
                <CardTitle>Signature Verification</CardTitle>
                <CardDescription>
                    Verify member signature for {transactionType}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Member:</span>
                        <span className="text-sm">{memberName || "Unknown"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Amount:</span>
                        <span className="text-sm font-semibold">₹{amount.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Transaction:</span>
                        <Badge variant="outline">{transactionType}</Badge>
                    </div>
                </div>

                <div className="border-2 border-dashed rounded-lg p-4 bg-white min-h-[150px] flex items-center justify-center">
                    {loading ? (
                        <div className="text-muted-foreground">Loading signature...</div>
                    ) : signatureUrl ? (
                        <img
                            src={signatureUrl}
                            alt="Member Signature"
                            className="max-w-full max-h-[120px] object-contain"
                        />
                    ) : (
                        <div className="text-muted-foreground text-center">
                            <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No signature on record</p>
                        </div>
                    )}
                </div>

                <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                        Compare the signature above with the physical signature provided by the
                        member.
                    </p>
                </div>

                <div className="flex gap-2">
                    <Button variant="outline" onClick={onCancel} className="flex-1">
                        <X className="mr-2 h-4 w-4" />
                        Cancel
                    </Button>
                    <Button
                        variant="outline"
                        onClick={handleMismatch}
                        className="flex-1"
                    >
                        <AlertCircle className="mr-2 h-4 w-4" />
                        Mismatch
                    </Button>
                    <Button onClick={handleVerify} className="flex-1" disabled={verified}>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        {verified ? "Verified" : "Verify"}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
