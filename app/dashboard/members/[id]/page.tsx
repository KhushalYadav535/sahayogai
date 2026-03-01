'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { Permission, UserRole } from '@/lib/types/auth';
import { Member, MemberStatus, MemberCategory, KYCStatus } from '@/lib/types/member';
import { RiskScorePanel } from '@/components/ai/risk-score-panel';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { AlertTriangle, Calendar, MapPin, FileText, User, Edit, Pause, LogOut, Heart, Download, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface MemberDetailPageProps {
  params: {
    id: string;
  };
}

// Mock member data - in real app, fetch from API
const mockMember: Member = {
  id: '1',
  memberId: 'MEM-202401-0001',
  tenantId: 'default',
  firstName: 'Rajesh',
  lastName: 'Kumar',
  dateOfBirth: new Date('1980-01-15'),
  gender: 'M',
  mobileNumber: '+91-9876543210',
  email: 'rajesh@example.com',
  permanentAddress: '123 Main Street, Near Market, Nagpur',
  correspondenceAddress: '123 Main Street, Near Market, Nagpur',
  city: 'Nagpur',
  state: 'Maharashtra',
  pincode: '440001',
  occupation: 'Farmer',
  incomeRange: '2-5 Lakhs',
  status: MemberStatus.ACTIVE,
  category: MemberCategory.REGULAR,
  joinDate: new Date('2023-01-10'),
  sharesHeld: 10,
  totalShareAmount: 1000,
  aadhaar: '1234567890123456',
  pan: 'AAAPL5055K',
  kycStatus: KYCStatus.VERIFIED,
  kycMode: 'AADHAAR_OTP' as any,
  kycVerifiedDate: new Date('2023-01-10'),
  kycExpiryDate: new Date('2025-01-10'),
  nominees: [
    {
      name: 'Shweta Kumar',
      relationship: 'Spouse',
      mobileNumber: '+91-9876543211',
      aadhaar: '1234567890123457',
    },
  ],
  jointHolders: [
    {
      name: 'Sharma Kumar',
      memberId: 'MEM-202401-0002',
      role: 'JOINT' as any,
    },
  ],
  createdAt: new Date('2023-01-10'),
  updatedAt: new Date('2024-11-15'),
  createdBy: 'admin',
  updatedBy: 'admin',
  isDeleted: false,
};

const mockDocuments = [
  {
    type: 'Aadhaar (Front)',
    uploadDate: new Date('2023-01-10'),
    status: 'VERIFIED' as const,
    verifiedBy: 'Admin User',
    verifiedOn: new Date('2023-01-10'),
  },
  {
    type: 'Aadhaar (Back)',
    uploadDate: new Date('2023-01-10'),
    status: 'VERIFIED' as const,
    verifiedBy: 'Admin User',
    verifiedOn: new Date('2023-01-10'),
  },
  {
    type: 'PAN Card',
    uploadDate: new Date('2023-01-10'),
    status: 'VERIFIED' as const,
    verifiedBy: 'Admin User',
    verifiedOn: new Date('2023-01-10'),
  },
  {
    type: 'Photo',
    uploadDate: new Date('2023-01-10'),
    status: 'VERIFIED' as const,
    verifiedBy: 'Admin User',
    verifiedOn: new Date('2023-01-10'),
  },
];

const mockAccounts = [
  {
    accountNo: 'SB-001234',
    type: 'Savings',
    balance: 25000,
    status: 'ACTIVE',
    openedDate: new Date('2023-01-10'),
  },
  {
    accountNo: 'SB-001235',
    type: 'Savings - Minor',
    balance: 5000,
    status: 'ACTIVE',
    openedDate: new Date('2024-05-20'),
  },
];

const mockLoans = [
  {
    loanId: 'LN-2024-00001',
    type: 'Short Term',
    amount: 50000,
    outstanding: 32500,
    status: 'ACTIVE',
    nextEmiDate: new Date('2024-12-15'),
  },
];

const mockAuditTrail = [
  {
    event: 'Member Created',
    user: 'Admin User',
    role: 'SOCIETY_ADMIN',
    timestamp: new Date('2023-01-10'),
    ip: '192.168.1.1',
  },
  {
    event: 'KYC Verified',
    user: 'Secretary Officer',
    role: 'SECRETARY',
    timestamp: new Date('2023-01-10'),
    ip: '192.168.1.2',
  },
  {
    event: 'Status Changed to ACTIVE',
    user: 'Admin User',
    role: 'SOCIETY_ADMIN',
    timestamp: new Date('2023-01-11'),
    ip: '192.168.1.1',
  },
];

const getStatusColor = (status: MemberStatus) => {
  const colors: Record<MemberStatus, string> = {
    [MemberStatus.PENDING]: 'bg-blue-100 text-blue-800',
    [MemberStatus.ACTIVE]: 'bg-green-100 text-green-800',
    [MemberStatus.SUSPENDED]: 'bg-yellow-100 text-yellow-800',
    [MemberStatus.INACTIVE]: 'bg-gray-100 text-gray-800',
    [MemberStatus.DORMANT]: 'bg-orange-100 text-orange-800',
    [MemberStatus.DECEASED]: 'bg-red-100 text-red-800',
  };
  return colors[status];
};

const getKYCStatusColor = (status: KYCStatus) => {
  const colors: Record<KYCStatus, string> = {
    [KYCStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
    [KYCStatus.VERIFIED]: 'bg-green-100 text-green-800',
    [KYCStatus.FAILED]: 'bg-red-100 text-red-800',
    [KYCStatus.EXPIRED]: 'bg-orange-100 text-orange-800',
  };
  return colors[status];
};

export default function MemberDetailPage({ params }: MemberDetailPageProps) {
  const router = useRouter();
  const { user, hasPermission } = useAuth();
  const [member] = useState<Member>(mockMember);
  const [activeTab, setActiveTab] = useState('overview');

  const age = member.dateOfBirth ? new Date().getFullYear() - new Date(member.dateOfBirth).getFullYear() : 0;
  const daysUntilKYCExpiry = member.kycExpiryDate ? Math.ceil((new Date(member.kycExpiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0;
  const showKYCAlert = daysUntilKYCExpiry > 0 && daysUntilKYCExpiry <= 30;

  return (
    <div className="space-y-6 p-6">
      {/* Header with profile */}
      <div className="flex items-start justify-between">
        <div className="space-y-4 flex-1">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <User className="w-10 h-10 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold">{member.firstName} {member.lastName}</h1>
              <p className="text-muted-foreground">{member.memberId}</p>
              <div className="flex gap-2 mt-2 flex-wrap">
                <Badge className={getStatusColor(member.status)}>{member.status}</Badge>
                <Badge variant="outline">{member.category}</Badge>
              </div>
            </div>
          </div>
        </div>

        {hasPermission(Permission.MEMBER_EDIT) && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/members/${member.id}/edit`)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
            {member.status === MemberStatus.ACTIVE && (
              <>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Pause className="w-4 h-4 mr-2" />
                      Suspend
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogTitle>Suspend Member</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to suspend {member.firstName}? They will lose access to their accounts.
                    </AlertDialogDescription>
                    <AlertDialogAction>Confirm</AlertDialogAction>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                  </AlertDialogContent>
                </AlertDialog>
                <Link href={`/dashboard/members/${member.id}/death-settlement`}>
                  <Button variant="outline" size="sm">
                    <Heart className="w-4 h-4 mr-2" />
                    Death Settlement
                  </Button>
                </Link>
              </>
            )}
          </div>
        )}
      </div>

      {/* KYC Expiry Alert */}
      {showKYCAlert && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            KYC expires on {member.kycExpiryDate?.toLocaleDateString()} — Initiate Re-validation
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="kyc">KYC Documents</TabsTrigger>
          <TabsTrigger value="accounts">Accounts</TabsTrigger>
          <TabsTrigger value="loans">Loans</TabsTrigger>
          <TabsTrigger value="deposits">Deposits</TabsTrigger>
          <TabsTrigger value="risk">AI Risk</TabsTrigger>
          <TabsTrigger value="audit">Audit Trail</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Date of Birth</p>
                    <p className="font-semibold">{member.dateOfBirth?.toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Age</p>
                    <p className="font-semibold">{age} years</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Gender</p>
                    <p className="font-semibold">{member.gender === 'M' ? 'Male' : member.gender === 'F' ? 'Female' : 'Other'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Occupation</p>
                    <p className="font-semibold">{member.occupation}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Mobile</p>
                  <p className="font-semibold">{member.mobileNumber}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Email</p>
                  <p className="font-semibold">{member.email}</p>
                </div>
              </CardContent>
            </Card>

            {/* Identity Docs */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Identity Documents</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Aadhaar</p>
                  <p className="font-semibold font-mono">XXXX-XXXX-{member.aadhaar?.slice(-4)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">PAN</p>
                  <p className="font-semibold font-mono">XXXXX{member.pan?.slice(-5)}</p>
                </div>
              </CardContent>
            </Card>

            {/* Membership */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Membership Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Join Date</p>
                  <p className="font-semibold">{member.joinDate?.toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Shares Held</p>
                  <p className="font-semibold">{member.sharesHeld} @ ₹100/share = ₹{member.totalShareAmount}</p>
                </div>
              </CardContent>
            </Card>

            {/* Address */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Address Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Permanent Address</p>
                  <p className="font-semibold">{member.permanentAddress}</p>
                  <p className="text-sm text-muted-foreground">{member.city}, {member.state} {member.pincode}</p>
                </div>
                {member.correspondenceAddress && member.correspondenceAddress !== member.permanentAddress && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Correspondence Address</p>
                    <p className="font-semibold">{member.correspondenceAddress}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Nominee */}
            {member.nominees && member.nominees.length > 0 && (
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg">Nominee Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {member.nominees.map((nominee, idx) => (
                    <div key={idx} className="pb-4 border-b last:border-0">
                      <p className="text-xs font-medium text-muted-foreground">Nominee {idx + 1}</p>
                      <p className="font-semibold">{nominee.name}</p>
                      <p className="text-sm text-muted-foreground">Relationship: {nominee.relationship}</p>
                      <p className="text-sm text-muted-foreground">Mobile: {nominee.mobileNumber}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* KYC Documents Tab */}
        <TabsContent value="kyc" className="space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold">KYC Mode: {member.kycMode}</h3>
                <Badge className={getKYCStatusColor(member.kycStatus)} className="mt-2">
                  {member.kycStatus}
                </Badge>
              </div>
              <Button variant="outline">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Re-initiate eKYC
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mockDocuments.map((doc, idx) => (
                <Card key={idx}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold">{doc.type}</p>
                        <p className="text-sm text-muted-foreground">Uploaded: {doc.uploadDate.toLocaleDateString()}</p>
                        <Badge variant="outline" className="mt-2 bg-green-50 text-green-800 border-green-200">
                          ✓ {doc.status}
                        </Badge>
                      </div>
                      <Download className="w-4 h-4 text-muted-foreground cursor-pointer" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-3">Verified by {doc.verifiedBy}</p>
                    <p className="text-xs text-muted-foreground">on {doc.verifiedOn.toLocaleDateString()}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* KYC History Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">KYC History</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <Clock className="w-4 h-4 text-muted-foreground mt-1 flex-shrink-0" />
                  <div className="space-y-3 flex-1">
                    <div>
                      <p className="font-semibold">Initial KYC Verification</p>
                      <p className="text-sm text-muted-foreground">Completed on {member.kycVerifiedDate?.toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="font-semibold">Next KYC Re-validation Due</p>
                      <p className="text-sm text-muted-foreground">On {member.kycExpiryDate?.toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Accounts Tab */}
        <TabsContent value="accounts">
          <Card>
            <CardHeader>
              <CardTitle>Savings Accounts</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account No</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Opened Date</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockAccounts.map((account) => (
                    <TableRow key={account.accountNo}>
                      <TableCell className="font-semibold">{account.accountNo}</TableCell>
                      <TableCell>{account.type}</TableCell>
                      <TableCell className="text-right font-semibold">₹{account.balance.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-green-50 text-green-800">
                          {account.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(account.openedDate).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Link href={`/dashboard/accounts/${account.accountNo}`}>
                          <Button variant="ghost" size="sm">View</Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Loans Tab */}
        <TabsContent value="loans">
          <Card>
            <CardHeader>
              <CardTitle>Loans</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Loan ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Outstanding</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Next EMI Date</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockLoans.map((loan) => (
                    <TableRow key={loan.loanId}>
                      <TableCell className="font-semibold">{loan.loanId}</TableCell>
                      <TableCell>{loan.type}</TableCell>
                      <TableCell className="text-right">₹{loan.amount.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-semibold">₹{loan.outstanding.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-green-50 text-green-800">
                          {loan.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(loan.nextEmiDate).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Link href={`/dashboard/loans/${loan.loanId}`}>
                          <Button variant="ghost" size="sm">View</Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Deposits Tab */}
        <TabsContent value="deposits">
          <Card>
            <CardHeader>
              <CardTitle>Deposits</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">No deposits found.</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Risk Score Tab */}
        <TabsContent value="risk" className="space-y-6">
          <RiskScorePanel
            score={{
              overall: 45,
              factors: [
                { name: 'Repayment History', score: 40 },
                { name: 'Income Stability', score: 50 },
                { name: 'Loan Utilization', score: 35 },
                { name: 'Savings Ratio', score: 55 },
                { name: 'Collateral Value', score: 45 },
              ],
            }}
            showOverrideButton={hasPermission(Permission.LOAN_APPROVE)}
          />

          <Card>
            <CardHeader>
              <CardTitle>Score History</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Risk score history chart would appear here.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Human Overrides</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">No overrides recorded.</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Trail Tab */}
        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle>Audit Trail</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockAuditTrail.map((entry, idx) => (
                  <div key={idx} className="flex gap-4 pb-4 border-b last:border-0">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold">{entry.event}</p>
                      <p className="text-sm text-muted-foreground">
                        By {entry.user} ({entry.role}) • {new Date(entry.timestamp).toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">IP: {entry.ip}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
