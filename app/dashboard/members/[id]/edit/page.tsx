'use client';

import React, { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { Permission } from '@/lib/types/auth';
import { MemberCategory } from '@/lib/types/member';
import { membersApi } from '@/lib/api';
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
import { ArrowLeft } from 'lucide-react';

export default function MemberEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { hasPermission } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<Partial<Record<string, string>>>({
    gender: 'M',
    category: MemberCategory.REGULAR,
  });

  useEffect(() => {
    if (!id) return;
    membersApi
      .get(id)
      .then((res) => {
        const m = res.member;
        if (m) {
          setFormData({
            firstName: m.firstName || '',
            lastName: m.lastName || '',
            dateOfBirth: m.dateOfBirth ? m.dateOfBirth.slice(0, 10) : '',
            gender: m.gender?.toUpperCase()?.startsWith('M') ? 'M' : m.gender?.toUpperCase()?.startsWith('F') ? 'F' : 'O',
            mobileNumber: m.phone || m.mobileNumber || '',
            email: m.email || '',
            permanentAddress: m.address || m.permanentAddress || '',
            city: m.district || m.city || '',
            state: m.state || '',
            pincode: m.pincode || '',
            occupation: m.occupation || '',
            incomeRange: m.incomeRange || '',
            category: (m.category || MemberCategory.REGULAR) as string,
          });
        }
      })
      .catch(() => toast({ title: 'Error', description: 'Member not found', variant: 'destructive' }))
      .finally(() => setLoading(false));
  }, [id, toast]);

  if (!hasPermission(Permission.MEMBER_EDIT)) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-destructive">You don&apos;t have permission to edit members</p>
      </div>
    );
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setIsSubmitting(true);
    try {
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
        incomeRange: formData.incomeRange,
        category: formData.category,
      };
      await membersApi.update(id, payload);
      toast({ title: 'Success', description: 'Member updated successfully' });
      router.push(`/dashboard/members/${id}`);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update member',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground">Loading member...</p>
      </div>
    );
  }

  if (!id) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-destructive">Invalid member</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Edit Member</h1>
          <p className="text-muted-foreground text-sm">Update member information</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Member Information</CardTitle>
          <CardDescription>Edit personal and demographic details</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
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
                  <Label htmlFor="incomeRange">Income Range</Label>
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

            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-semibold text-foreground">Membership</h3>
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
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/dashboard/members/${id}`)}
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
