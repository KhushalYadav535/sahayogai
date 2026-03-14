'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { Permission } from '@/lib/types/auth';
import { MemberRegistrationForm, MemberCategory } from '@/lib/types/member';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Camera, Upload, X, PenTool } from 'lucide-react';
import { getToken } from '@/lib/api';

export default function MemberRegistrationPage() {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<MemberRegistrationForm>>({
    gender: 'M',
    category: MemberCategory.REGULAR,
    initialShares: 5,
  });
  
  // Photo and signature state
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const photoCanvasRef = useRef<HTMLCanvasElement>(null);
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null);

  if (!hasPermission(Permission.MEMBER_CREATE)) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-destructive">You don't have permission to register members</p>
      </div>
    );
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Photo upload handlers
  const handlePhotoFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Error',
        description: 'Please select an image file',
        variant: 'destructive',
      });
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Error',
        description: 'Image size must be less than 5MB',
        variant: 'destructive',
      });
      return;
    }
    
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setShowCamera(true);
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to access camera',
        variant: 'destructive',
      });
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && photoCanvasRef.current) {
      const canvas = photoCanvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
            setPhotoFile(file);
            setPhotoPreview(canvas.toDataURL());
            setShowCamera(false);
            if (video.srcObject) {
              const stream = video.srcObject as MediaStream;
              stream.getTracks().forEach(track => track.stop());
            }
          }
        }, 'image/jpeg', 0.9);
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setShowCamera(false);
  };

  // Signature upload handlers
  const handleSignatureFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Error',
        description: 'Please select an image file',
        variant: 'destructive',
      });
      return;
    }
    
    setSignatureFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setSignaturePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const startSignaturePad = () => {
    setShowSignaturePad(true);
    if (signatureCanvasRef.current) {
      const canvas = signatureCanvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  };

  const handleSignatureDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!showSignaturePad) return;
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const captureSignature = () => {
    if (signatureCanvasRef.current) {
      signatureCanvasRef.current.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'signature.png', { type: 'image/png' });
          setSignatureFile(file);
          setSignaturePreview(signatureCanvasRef.current!.toDataURL());
          setShowSignaturePad(false);
        }
      }, 'image/png');
    }
  };

  const clearSignature = () => {
    if (signatureCanvasRef.current) {
      const ctx = signatureCanvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, signatureCanvasRef.current.width, signatureCanvasRef.current.height);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate required fields
      if (
        !formData.firstName ||
        !formData.lastName ||
        !formData.dateOfBirth ||
        !formData.mobileNumber ||
        !formData.permanentAddress ||
        !formData.city ||
        !formData.state ||
        !formData.pincode ||
        !formData.occupation ||
        !formData.incomeRange
      ) {
        toast({
          title: 'Validation Error',
          description: 'Please fill in all required fields',
          variant: 'destructive',
        });
        setIsSubmitting(false);
        return;
      }

      const { membersApi } = await import('@/lib/api');
      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender?.toLowerCase() === 'm' ? 'male' : formData.gender?.toLowerCase() === 'f' ? 'female' : 'other',
        phone: formData.mobileNumber,
        email: formData.email,
        address: formData.permanentAddress,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        district: formData.city,
        occupation: formData.occupation,
      };
      await membersApi.create(payload);
      toast({
        title: 'Success',
        description: 'Member registered successfully',
      });
      router.push('/dashboard/members');
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to register member',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Register New Member</h1>
        <p className="text-muted-foreground mt-1">
          Complete member information and KYC details
        </p>
      </div>

      {/* Registration form */}
      <Card>
        <CardHeader>
          <CardTitle>Member Information</CardTitle>
          <CardDescription>Enter member's personal and demographic details</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Personal Information</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    placeholder="First name"
                    value={formData.firstName || ''}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    placeholder="Last name"
                    value={formData.lastName || ''}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                  <Input
                    id="dateOfBirth"
                    name="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth || ''}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender *</Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) => handleSelectChange('gender', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="M">Male</SelectItem>
                      <SelectItem value="F">Female</SelectItem>
                      <SelectItem value="O">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-semibold text-foreground">Contact Information</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="mobileNumber">Mobile Number *</Label>
                  <Input
                    id="mobileNumber"
                    name="mobileNumber"
                    placeholder="+91-xxxxxxxxxx"
                    value={formData.mobileNumber || ''}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email (Optional)</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="email@example.com"
                    value={formData.email || ''}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-semibold text-foreground">Address</h3>
              
              <div className="space-y-2">
                <Label htmlFor="permanentAddress">Permanent Address *</Label>
                <Input
                  id="permanentAddress"
                  name="permanentAddress"
                  placeholder="Street address"
                  value={formData.permanentAddress || ''}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    name="city"
                    placeholder="City"
                    value={formData.city || ''}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    name="state"
                    placeholder="State"
                    value={formData.state || ''}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pincode">Pincode *</Label>
                  <Input
                    id="pincode"
                    name="pincode"
                    placeholder="PIN code"
                    value={formData.pincode || ''}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            {/* Occupation & Income */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-semibold text-foreground">Occupation & Income</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="occupation">Occupation *</Label>
                  <Input
                    id="occupation"
                    name="occupation"
                    placeholder="Occupation"
                    value={formData.occupation || ''}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="incomeRange">Income Range *</Label>
                  <Input
                    id="incomeRange"
                    name="incomeRange"
                    placeholder="e.g., 2-5 Lakhs"
                    value={formData.incomeRange || ''}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            {/* Membership Details */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-semibold text-foreground">Membership Details</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Member Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => handleSelectChange('category', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={MemberCategory.REGULAR}>Regular</SelectItem>
                      <SelectItem value={MemberCategory.NOMINAL}>Nominal</SelectItem>
                      <SelectItem value={MemberCategory.ASSOCIATE}>Associate</SelectItem>
                      <SelectItem value={MemberCategory.STAFF}>Staff</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="initialShares">Initial Shares *</Label>
                  <Input
                    id="initialShares"
                    name="initialShares"
                    type="number"
                    value={formData.initialShares || 5}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            {/* Photo Upload */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-semibold text-foreground">Member Photograph</h3>
              
              <div className="space-y-4">
                {photoPreview ? (
                  <div className="relative inline-block">
                    <img
                      src={photoPreview}
                      alt="Photo preview"
                      className="w-32 h-32 object-cover rounded-lg border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-0 right-0"
                      onClick={() => {
                        setPhotoPreview(null);
                        setPhotoFile(null);
                        if (photoInputRef.current) photoInputRef.current.value = '';
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : showCamera ? (
                  <div className="space-y-2">
                    <video
                      ref={videoRef}
                      autoPlay
                      className="w-full max-w-md rounded-lg border"
                    />
                    <div className="flex gap-2">
                      <Button type="button" onClick={capturePhoto}>
                        Capture Photo
                      </Button>
                      <Button type="button" variant="outline" onClick={stopCamera}>
                        Cancel
                      </Button>
                    </div>
                    <canvas ref={photoCanvasRef} className="hidden" />
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => photoInputRef.current?.click()}
                      disabled={isSubmitting}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Photo
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={startCamera}
                      disabled={isSubmitting}
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Take Photo
                    </Button>
                  </div>
                )}
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoFileSelect}
                  className="hidden"
                />
              </div>
            </div>

            {/* Signature Upload */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-semibold text-foreground">Member Signature</h3>
              
              <div className="space-y-4">
                {signaturePreview ? (
                  <div className="relative inline-block">
                    <img
                      src={signaturePreview}
                      alt="Signature preview"
                      className="w-64 h-32 object-contain rounded-lg border bg-white"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-0 right-0"
                      onClick={() => {
                        setSignaturePreview(null);
                        setSignatureFile(null);
                        if (signatureInputRef.current) signatureInputRef.current.value = '';
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : showSignaturePad ? (
                  <div className="space-y-2">
                    <canvas
                      ref={signatureCanvasRef}
                      width={600}
                      height={200}
                      className="border rounded-lg cursor-crosshair bg-white"
                      onMouseDown={(e) => {
                        if (signatureCanvasRef.current) {
                          const rect = signatureCanvasRef.current.getBoundingClientRect();
                          const ctx = signatureCanvasRef.current.getContext('2d');
                          if (ctx) {
                            ctx.beginPath();
                            ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
                          }
                        }
                      }}
                      onMouseMove={handleSignatureDraw}
                      onMouseUp={() => {
                        if (signatureCanvasRef.current) {
                          const ctx = signatureCanvasRef.current.getContext('2d');
                          if (ctx) {
                            ctx.beginPath();
                          }
                        }
                      }}
                    />
                    <div className="flex gap-2">
                      <Button type="button" onClick={captureSignature}>
                        Save Signature
                      </Button>
                      <Button type="button" variant="outline" onClick={clearSignature}>
                        Clear
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setShowSignaturePad(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => signatureInputRef.current?.click()}
                      disabled={isSubmitting}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Signature
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={startSignaturePad}
                      disabled={isSubmitting}
                    >
                      <PenTool className="h-4 w-4 mr-2" />
                      Draw Signature
                    </Button>
                  </div>
                )}
                <input
                  ref={signatureInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleSignatureFileSelect}
                  className="hidden"
                />
              </div>
            </div>

            {/* Form actions */}
            <div className="flex gap-2 pt-4 border-t">
              <Button
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Registering...' : 'Register Member'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
