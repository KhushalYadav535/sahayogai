"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Camera, Upload, X, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { getToken } from "@/lib/api";

interface PhotoUploadProps {
    memberId: string;
    onUploadComplete?: (photoId: string) => void;
    mode?: "upload" | "camera";
}

export function PhotoUpload({ memberId, onUploadComplete, mode = "upload" }: PhotoUploadProps) {
    const [preview, setPreview] = useState<string | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [showCamera, setShowCamera] = useState(mode === "camera");

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        // Validate file type
        if (!selectedFile.type.startsWith("image/")) {
            toast.error("Please select an image file");
            return;
        }

        // Validate file size (max 5MB)
        if (selectedFile.size > 5 * 1024 * 1024) {
            toast.error("Image size must be less than 5MB");
            return;
        }

        setFile(selectedFile);
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result as string);
        };
        reader.readAsDataURL(selectedFile);
    };

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "user" },
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            setShowCamera(true);
        } catch (err) {
            toast.error("Failed to access camera");
            console.error(err);
        }
    };

    const capturePhoto = () => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
            ctx.drawImage(video, 0, 0);
            canvas.toBlob((blob) => {
                if (blob) {
                    const capturedFile = new File([blob], "captured-photo.jpg", {
                        type: "image/jpeg",
                    });
                    setFile(capturedFile);
                    setPreview(canvas.toDataURL());
                    stopCamera();
                }
            }, "image/jpeg", 0.9);
        }
    };

    const stopCamera = () => {
        if (videoRef.current?.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach((track) => track.stop());
        }
        setShowCamera(false);
    };

    const handleUpload = async () => {
        if (!file) {
            toast.error("Please select or capture a photo");
            return;
        }

        setUploading(true);
        try {
            const token = getToken();
            const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";
            const formData = new FormData();
            formData.append("photo", file);
            formData.append("purposeCode", "ONBOARDING");

            const response = await fetch(`${API_BASE}/members/${memberId}/photo`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token || ""}`,
                },
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();
                toast.success("Photo uploaded successfully. Awaiting approval.");
                setFile(null);
                setPreview(null);
                if (onUploadComplete) {
                    onUploadComplete(data.photoId);
                }
            } else {
                const error = await response.json();
                toast.error(error.message || "Failed to upload photo");
            }
        } catch (err) {
            toast.error("Failed to upload photo");
        } finally {
            setUploading(false);
        }
    };

    return (
        <Card>
            <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Member Photograph</Label>
                    <div className="flex gap-2">
                        {!showCamera && (
                            <>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <Upload className="mr-2 h-4 w-4" />
                                    Upload
                                </Button>
                                <Button variant="outline" size="sm" onClick={startCamera}>
                                    <Camera className="mr-2 h-4 w-4" />
                                    Camera
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

                {showCamera && (
                    <div className="space-y-4">
                        <div className="relative">
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                className="w-full rounded-lg"
                                style={{ maxHeight: "400px" }}
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={capturePhoto} className="flex-1">
                                Capture Photo
                            </Button>
                            <Button variant="outline" onClick={stopCamera}>
                                Cancel
                            </Button>
                        </div>
                    </div>
                )}

                {preview && !showCamera && (
                    <div className="space-y-4">
                        <div className="relative">
                            <img
                                src={preview}
                                alt="Preview"
                                className="w-full rounded-lg border"
                                style={{ maxHeight: "400px", objectFit: "contain" }}
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
                                {uploading ? "Uploading..." : "Upload Photo"}
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

                {!preview && !showCamera && (
                    <div className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground">
                        <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No photo selected</p>
                        <p className="text-sm mt-1">
                            Click Upload or Camera to add a member photograph
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
