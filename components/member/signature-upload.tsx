"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Upload, X, CheckCircle, PenTool } from "lucide-react";
import { toast } from "sonner";
import { getToken } from "@/lib/api";

interface SignatureUploadProps {
    memberId: string;
    onUploadComplete?: (signatureId: string) => void;
    mode?: "upload" | "pad";
}

export function SignatureUpload({
    memberId,
    onUploadComplete,
    mode = "upload",
}: SignatureUploadProps) {
    const [preview, setPreview] = useState<string | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [isDrawing, setIsDrawing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [showPad, setShowPad] = useState(mode === "pad");

    useEffect(() => {
        if (showPad && canvasRef.current) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext("2d");
            if (ctx) {
                ctx.strokeStyle = "#000";
                ctx.lineWidth = 2;
                ctx.lineCap = "round";
                ctx.lineJoin = "round";
            }
        }
    }, [showPad]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        if (!selectedFile.type.startsWith("image/")) {
            toast.error("Please select an image file");
            return;
        }

        if (selectedFile.size > 2 * 1024 * 1024) {
            toast.error("Image size must be less than 2MB");
            return;
        }

        setFile(selectedFile);
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result as string);
        };
        reader.readAsDataURL(selectedFile);
    };

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        setIsDrawing(true);
        const rect = canvas.getBoundingClientRect();
        const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
        const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

        ctx.beginPath();
        ctx.moveTo(x, y);
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (!isDrawing || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
        const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const clearPad = () => {
        if (!canvasRef.current) return;
        const ctx = canvasRef.current.getContext("2d");
        if (ctx) {
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
    };

    const captureSignature = () => {
        if (!canvasRef.current) return;
        canvasRef.current.toBlob((blob) => {
            if (blob) {
                // Check ink coverage
                const ctx = canvasRef.current!.getContext("2d");
                if (ctx) {
                    const imageData = ctx.getImageData(
                        0,
                        0,
                        canvasRef.current!.width,
                        canvasRef.current!.height
                    );
                    const pixels = imageData.data;
                    let filledPixels = 0;
                    for (let i = 0; i < pixels.length; i += 4) {
                        if (pixels[i] < 250 || pixels[i + 1] < 250 || pixels[i + 2] < 250) {
                            filledPixels++;
                        }
                    }
                    const coverage = (filledPixels / (pixels.length / 4)) * 100;

                    if (coverage < 1) {
                        toast.error("Signature appears blank. Please draw your signature.");
                        return;
                    }

                    const signatureFile = new File([blob], "signature.png", {
                        type: "image/png",
                    });
                    setFile(signatureFile);
                    setPreview(canvasRef.current!.toDataURL());
                    setShowPad(false);
                }
            }
        }, "image/png");
    };

    const handleUpload = async () => {
        if (!file) {
            toast.error("Please upload or draw a signature");
            return;
        }

        setUploading(true);
        try {
            const token = getToken();
            const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";
            const formData = new FormData();
            formData.append("signature", file);
            formData.append("purposeCode", "ONBOARDING");

            const response = await fetch(`${API_BASE}/members/${memberId}/signature`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token || ""}`,
                },
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();
                toast.success("Signature uploaded successfully. Awaiting approval.");
                setFile(null);
                setPreview(null);
                if (onUploadComplete) {
                    onUploadComplete(data.signatureId);
                }
            } else {
                const error = await response.json();
                toast.error(error.message || "Failed to upload signature");
            }
        } catch (err) {
            toast.error("Failed to upload signature");
        } finally {
            setUploading(false);
        }
    };

    return (
        <Card>
            <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Member Signature</Label>
                    <div className="flex gap-2">
                        {!showPad && (
                            <>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <Upload className="mr-2 h-4 w-4" />
                                    Upload
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => setShowPad(true)}>
                                    <PenTool className="mr-2 h-4 w-4" />
                                    Draw
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                />

                {showPad && (
                    <div className="space-y-4">
                        <div className="border-2 border-dashed rounded-lg p-4 bg-white">
                            <canvas
                                ref={canvasRef}
                                width={600}
                                height={200}
                                className="w-full border rounded cursor-crosshair touch-none"
                                onMouseDown={startDrawing}
                                onMouseMove={draw}
                                onMouseUp={stopDrawing}
                                onMouseLeave={stopDrawing}
                                onTouchStart={startDrawing}
                                onTouchMove={draw}
                                onTouchEnd={stopDrawing}
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={captureSignature} className="flex-1">
                                Save Signature
                            </Button>
                            <Button variant="outline" onClick={clearPad}>
                                Clear
                            </Button>
                            <Button variant="outline" onClick={() => setShowPad(false)}>
                                Cancel
                            </Button>
                        </div>
                    </div>
                )}

                {preview && !showPad && (
                    <div className="space-y-4">
                        <div className="relative">
                            <img
                                src={preview}
                                alt="Signature Preview"
                                className="w-full rounded-lg border bg-white p-4"
                                style={{ maxHeight: "200px", objectFit: "contain" }}
                            />
                            <Button
                                variant="ghost"
                                size="sm"
                                className="absolute top-2 right-2"
                                onClick={() => {
                                    setPreview(null);
                                    setFile(null);
                                }}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                onClick={handleUpload}
                                disabled={uploading}
                                className="flex-1"
                            >
                                {uploading ? "Uploading..." : "Upload Signature"}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setPreview(null);
                                    setFile(null);
                                }}
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                )}

                {!preview && !showPad && (
                    <div className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground">
                        <PenTool className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No signature selected</p>
                        <p className="text-sm mt-1">
                            Click Upload or Draw to add a member signature
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
