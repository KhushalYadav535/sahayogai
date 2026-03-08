'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { membersApi } from '@/lib/api';
import { Permission, UserRole } from '@/lib/types/auth';
import { Member, MemberStatus, MemberCategory } from '@/lib/types/member';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Search, FileText, Eye, Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

function mapApiMember(m: any): Member {
  return {
    id: m.id,
    memberId: m.memberNumber || m.memberId,
    tenantId: m.tenantId,
    firstName: m.firstName,
    lastName: m.lastName,
    dateOfBirth: m.dateOfBirth ? new Date(m.dateOfBirth) : new Date(),
    gender: (m.gender === 'male' ? 'M' : m.gender === 'female' ? 'F' : 'O') as 'M' | 'F' | 'O',
    mobileNumber: m.phone || '',
    email: m.email,
    permanentAddress: m.address || '',
    city: m.district || '',
    state: m.state || '',
    pincode: m.pincode || '',
    occupation: m.occupation || '',
    incomeRange: '',
    status: (m.status?.toUpperCase() || 'ACTIVE') as MemberStatus,
    category: MemberCategory.REGULAR,
    joinDate: m.joinDate ? new Date(m.joinDate) : new Date(),
    sharesHeld: 0,
    totalShareAmount: 0,
    kycStatus: (m.kycStatus?.toUpperCase() || 'PENDING') as any,
    kycMode: 'AADHAAR_OTP' as any,
    kycVerifiedDate: m.kycVerifiedAt ? new Date(m.kycVerifiedAt) : undefined,
    nominees: [],
    createdAt: m.createdAt ? new Date(m.createdAt) : new Date(),
    updatedAt: m.updatedAt ? new Date(m.updatedAt) : new Date(),
    createdBy: 'admin',
    updatedBy: 'admin',
    isDeleted: false,
  };
}

const statusColors: Record<MemberStatus, string> = {
  [MemberStatus.ACTIVE]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
  [MemberStatus.PENDING]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
  [MemberStatus.SUSPENDED]: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
  [MemberStatus.INACTIVE]: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100',
  [MemberStatus.DORMANT]: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
  [MemberStatus.DECEASED]: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100',
};

export default function MembersPage() {
  const { hasPermission } = useAuth();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    membersApi.list()
      .then(r => setMembers((r.members || []).map(mapApiMember)))
      .catch(() => setMembers([]))
      .finally(() => setLoading(false));
  }, []);

  const filteredMembers = members.filter(
    (member) =>
      !searchTerm ||
      member.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (member.memberId && member.memberId.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (member.mobileNumber && member.mobileNumber.includes(searchTerm))
  );

  const canCreate = hasPermission(Permission.MEMBER_CREATE);
  const canEdit = hasPermission(Permission.MEMBER_EDIT);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Members</h1>
          <p className="text-muted-foreground mt-1">
            Manage member registration, KYC, and status lifecycle
          </p>
        </div>
        <div className="flex gap-2">
          {canCreate && (
            <>
              <Button className="gap-2" onClick={() => router.push('/dashboard/members/register')}>
                <Plus className="w-4 h-4" />
                Register New Member
              </Button>
              <Link href="/dashboard/members/bulk-import">
                <Button variant="outline" className="gap-2">
                  <Upload className="w-4 h-4" />
                  Bulk Import
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Search and filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Search Members</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Search className="w-5 h-5 text-muted-foreground absolute mt-2.5 ml-3 pointer-events-none" />
            <Input
              placeholder="Search by name, member ID, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Members table */}
      <Card>
        <CardHeader>
          <CardTitle>Member List</CardTitle>
          <CardDescription>
            Total members: {filteredMembers.length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && <p className="text-sm text-muted-foreground py-4">Loading members...</p>}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Shares</TableHead>
                  <TableHead>Join Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{member.memberId}</TableCell>
                    <TableCell>
                      {member.firstName} {member.lastName}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{member.mobileNumber}</p>
                        <p className="text-muted-foreground text-xs">{member.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{member.category}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColors[member.status]}`}>
                        {member.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">{member.sharesHeld}</TableCell>
                    <TableCell className="text-sm">
                      {member.joinDate.toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Link href={`/dashboard/members/${member.id}`}>
                          <Button variant="ghost" size="sm" className="gap-1">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                        {canEdit && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/dashboard/members/${member.id}/edit`)}
                          >
                            <FileText className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
