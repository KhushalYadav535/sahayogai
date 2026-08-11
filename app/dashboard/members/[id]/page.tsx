'use client';

import React, { use, useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { membersApi, sbApi, loansApi, loanSanctionApi } from '@/lib/api';
import { Permission, UserRole } from '@/lib/types/auth';
import { Member, MemberStatus, MemberCategory, KYCStatus } from '@/lib/types/member';
import { RiskScorePanel } from '@/components/ai/risk-score-panel';
import { MaskedField, maskAadhaar, maskPAN, maskMobile } from '@/components/risk-controls/masked-field';
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
import { AlertTriangle, Calendar, MapPin, FileText, User, Edit, Pause, LogOut, Heart, Download, Clock, CheckCircle, AlertCircle, Ban, RefreshCw, Share2, Users, FileCheck, Camera } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

interface MemberDetailPageProps {
  params: Promise<{ id: string }>;
}

function mapApiMember(m: any): Member {
  return {
    id: m.id,
    memberId: m.memberNumber || m.memberId,
    tenantId: m.tenantId,
    firstName: m.firstName,
    lastName: m.lastName,
    dateOfBirth: m.dateOfBirth ? new Date(m.dateOfBirth) : new Date(),
    gender: (m.gender === 'male' || m.gender === 'M' ? 'M' : m.gender === 'female' || m.gender === 'F' ? 'F' : 'O') as 'M' | 'F' | 'O',
    mobileNumber: m.phone || '',
    email: m.email || '',
    permanentAddress: m.address || '',
    correspondenceAddress: m.address || '',
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
    aadhaar: m.aadhaarNumber || '',
    pan: m.panNumber || '',
    kycStatus: (m.kycStatus?.toUpperCase() || 'PENDING') as KYCStatus,
    kycMode: 'AADHAAR_OTP' as any,
    kycVerifiedDate: m.kycVerifiedAt ? new Date(m.kycVerifiedAt) : undefined,
    kycExpiryDate: undefined,
    nominees: (m.nominees || []).map((n: any) => ({ name: n.name, relationship: n.relationship, mobileNumber: n.phone || '', aadhaar: '' })),
    jointHolders: [],
    createdAt: m.createdAt ? new Date(m.createdAt) : new Date(),
    updatedAt: m.updatedAt ? new Date(m.updatedAt) : new Date(),
    createdBy: 'admin',
    updatedBy: 'admin',
    isDeleted: false,
  };
}

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
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const { user, hasPermission } = useAuth();
  const [member, setMember] = useState<Member | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isUploadingSignature, setIsUploadingSignature] = useState(false);
  const [accounts, setAccounts] = useState<{ id?: string; accountNo: string; type: string; balance: number; status: string; openedDate: Date }[]>([]);
  const [loans, setLoans] = useState<{ loanId: string; type: string; amount: number; outstanding: number; status: string; nextEmiDate?: Date }[]>([]);
  const [pendingApplications, setPendingApplications] = useState<any[]>([]);
  const [documents, setDocuments] = useState<{ type: string; uploadDate: Date; status: string; verifiedBy: string; verifiedOn: Date }[]>([]);
  const [auditTrail, setAuditTrail] = useState<{ event: string; user: string; role: string; timestamp: Date; ip: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [kycReinitiating, setKycReinitiating] = useState(false);
  const [ledger, setLedger] = useState<any[]>([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);

  useEffect(() => {
    if (!id) return;

    membersApi.getPhoto(id).then(res => {
      if (res.success && res.photoUrl) setPhotoUrl(res.photoUrl);
    }).catch(() => { /* ignore 404 if no photo */ });
    
    membersApi.getSignature(id).then(res => {
      if (res.success && res.signatureUrl) setSignatureUrl(res.signatureUrl);
    }).catch(() => { /* ignore 404 */ });

    Promise.all([
      membersApi.get(id),
      sbApi.list({ memberId: id }),
      loansApi.list({ memberId: id }),
      loansApi.applications({ memberId: id }).catch(() => ({ applications: [] })),
    ]).then(([memRes, sbRes, loanRes, appRes]) => {
      // Handle potential API errors
      if (!sbRes || !sbRes.success) {
        console.error("SB API error:", sbRes);
        setAccounts([]);
      }
      if (memRes.member) setMember(mapApiMember(memRes.member));
      
      let accountsArray: any[] = [];
      if (sbRes) {
        if (sbRes.success && Array.isArray(sbRes.accounts)) {
          accountsArray = sbRes.accounts;
        } else if (Array.isArray(sbRes)) {
          accountsArray = sbRes;
        } else if (sbRes.data && Array.isArray(sbRes.data)) {
          accountsArray = sbRes.data;
        } else if (sbRes.data && Array.isArray(sbRes.data.accounts)) {
          accountsArray = sbRes.data.accounts;
        } else if (Array.isArray(sbRes.accounts)) {
          accountsArray = sbRes.accounts;
        }
      }
      
      console.log("SB Accounts API Response:", sbRes);
      console.log("Extracted accounts array:", accountsArray);
      
      // Ensure id field is properly extracted from API response
      // Backend now supports lookup by both id (UUID) and accountNumber
      const mappedAccounts = accountsArray.map((a: any) => {
        // Use database id if available, otherwise fallback to accountNumber (backend supports both)
        const accountId = a.id || a.accountId || a.accountNumber;
        if (!accountId) {
          console.error("Account missing id, accountId, and accountNumber:", a);
        }
        // Only include accounts with valid IDs
        if (!accountId) {
          console.error("Skipping account without ID:", a);
          return null;
        }
        
        const mapped = {
          id: accountId, // Account ID for API calls - can be UUID or accountNumber
          accountNo: a.accountNumber || a.accountNo || 'N/A',
          type: a.accountType || 'Savings',
          balance: Number(a.balance) || 0,
          status: (a.status || 'active').toUpperCase(),
          openedDate: a.openedAt ? new Date(a.openedAt) : new Date(),
        };
        console.log("Mapped account:", mapped);
        return mapped;
      });
      
      // Filter out null values (accounts without IDs)
      const validAccounts = mappedAccounts.filter((a): a is NonNullable<typeof a> => a !== null);
      console.log("Setting accounts:", validAccounts);
      setAccounts(validAccounts);
      
      setLoans((loanRes.loans || []).map((l: any) => ({
        loanId: l.loanNumber || l.id,
        type: l.loanType || 'Short Term',
        amount: Number(l.principalAmount || l.amount) || 0,
        outstanding: Number(l.outstandingPrincipal || l.outstanding) || 0,
        status: (l.status || 'active').toUpperCase(),
        nextEmiDate: l.emiSchedule?.[0]?.dueDate ? new Date(l.emiSchedule[0].dueDate) : undefined,
      })));
      // Pending applications awaiting acknowledgement
      const pendingApps = (appRes.applications || []).filter((a: any) =>
        a.status === 'SANCTIONED'
      );
      setPendingApplications(pendingApps);
      const docs = [];
      if (memRes.member?.photos && memRes.member.photos.length > 0) {
        const photo = memRes.member.photos[0];
        docs.push({
          type: "Member Photo",
          status: photo.status,
          uploadDate: photo.submittedAt ? new Date(photo.submittedAt) : new Date(),
          verifiedBy: photo.status === "ACTIVE" ? "Checker" : "-",
          verifiedOn: photo.approvedAt ? new Date(photo.approvedAt) : null,
        });
      }
      if (memRes.member?.signatures && memRes.member.signatures.length > 0) {
        const sig = memRes.member.signatures[0];
        docs.push({
          type: "Member Signature",
          status: sig.status,
          uploadDate: sig.submittedAt ? new Date(sig.submittedAt) : new Date(),
          verifiedBy: sig.status === "ACTIVE" ? "Checker" : "-",
          verifiedOn: sig.approvedAt ? new Date(sig.approvedAt) : null,
        });
      }
      setDocuments(docs);
      setAuditTrail([]);
    }).catch((err) => {
      console.error("Error loading member data:", err);
      setMember(null);
      setAccounts([]);
      setLoans([]);
      toast({
        title: "Error",
        description: "Failed to load member data",
        variant: "destructive",
      });
    }).finally(() => setLoading(false));
  }, [id]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;
    setIsUploadingPhoto(true);
    try {
      await membersApi.uploadPhoto(id, file);
      const res = await membersApi.getPhoto(id);
      if (res.success && res.photoUrl) setPhotoUrl(res.photoUrl);
      toast({ title: "Success", description: "Photo updated successfully" });
    } catch (err) {
      toast({ title: "Error", description: "Failed to upload photo", variant: "destructive" });
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;
    setIsUploadingSignature(true);
    try {
      await membersApi.uploadSignature(id, file);
      const res = await membersApi.getSignature(id);
      if (res.success && res.signatureUrl) setSignatureUrl(res.signatureUrl);
      toast({ title: "Success", description: "Signature updated successfully" });
    } catch (err) {
      toast({ title: "Error", description: "Failed to upload signature", variant: "destructive" });
    } finally {
      setIsUploadingSignature(false);
    }
  };


  if (!id || loading || !member) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground">{!id ? 'Invalid member' : loading ? 'Loading...' : 'Member not found'}</p>
      </div>
    );
  }

  const age = member.dateOfBirth ? new Date().getFullYear() - new Date(member.dateOfBirth).getFullYear() : 0;
  const daysUntilKYCExpiry = member.kycExpiryDate ? Math.ceil((new Date(member.kycExpiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0;
  const showKYCAlert = daysUntilKYCExpiry > 0 && daysUntilKYCExpiry <= 30;

  return (
    <div className="space-y-6 p-6">
      {/* Header with profile */}
      <div className="flex items-start justify-between">
        <div className="space-y-4 flex-1">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                <img 
                  src={photoUrl || "/placeholder-user.jpg"} 
                  alt="Member Profile" 
                  className="w-full h-full object-cover" 
                />
              </div>
              {hasPermission(Permission.MEMBER_EDIT) && (
                <>
                  <Button 
                    variant="secondary" 
                    size="icon" 
                    className="absolute bottom-0 right-0 w-6 h-6 rounded-full shadow-sm"
                    onClick={() => photoInputRef.current?.click()}
                    disabled={isUploadingPhoto}
                  >
                    <Camera className="w-3 h-3" />
                  </Button>
                  <input 
                    type="file" 
                    ref={photoInputRef} 
                    className="hidden" 
                    accept="image/jpeg,image/png" 
                    onChange={handlePhotoUpload} 
                  />
                </>
              )}
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
            <Button variant="outline" size="sm" onClick={async () => {
              try {
                const html = await membersApi.getCertificate(id);
                const blob = new Blob([html], { type: 'text/html' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Membership_Certificate_${member.memberId}.html`;
                a.click();
                URL.revokeObjectURL(url);
                toast({ title: 'Certificate Downloaded', description: 'Membership certificate downloaded successfully.' });
              } catch (e) {
                toast({ title: 'Error', description: (e as Error).message, variant: 'destructive' });
              }
            }}>
              <FileCheck className="w-4 h-4 mr-2" />
              Certificate
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
                    <AlertDialogAction onClick={async () => {
                      try {
                        await membersApi.suspend(id, { reasonCode: 'MANUAL_SUSPENSION', remarks: 'Suspended by admin' });
                        toast({ title: 'Member Suspended', description: `${member.firstName} has been suspended.` });
                        const res = await membersApi.get(id);
                        if (res.member) setMember(mapApiMember(res.member));
                      } catch (e) {
                        toast({ title: 'Error', description: (e as Error).message, variant: 'destructive' });
                      }
                    }}>Confirm</AlertDialogAction>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                  </AlertDialogContent>
                </AlertDialog>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Ban className="w-4 h-4 mr-2" />
                      Blacklist
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogTitle>Blacklist Member</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to blacklist {member.firstName}? This action is irreversible.
                    </AlertDialogDescription>
                    <AlertDialogAction onClick={async () => {
                      try {
                        await membersApi.blacklist(id, { reasonCode: 'MANUAL_BLACKLIST', remarks: 'Blacklisted by admin' });
                        toast({ title: 'Member Blacklisted', description: `${member.firstName} has been blacklisted.` });
                        const res = await membersApi.get(id);
                        if (res.member) setMember(mapApiMember(res.member));
                      } catch (e) {
                        toast({ title: 'Error', description: (e as Error).message, variant: 'destructive' });
                      }
                    }}>Confirm</AlertDialogAction>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                  </AlertDialogContent>
                </AlertDialog>
                <Link href={`/dashboard/members/${member.id}/form15`}>
                  <Button variant="outline" size="sm">
                    <FileText className="w-4 h-4 mr-2" />
                    Form 15G/15H
                  </Button>
                </Link>
                <Link href={`/dashboard/members/${member.id}/death-settlement`}>
                  <Button variant="outline" size="sm">
                    <Heart className="w-4 h-4 mr-2" />
                    Death Settlement
                  </Button>
                </Link>
              </>
            )}
            {member.status === MemberStatus.SUSPENDED && (
              <Button variant="outline" size="sm" onClick={async () => {
                try {
                  await membersApi.reactivate(id);
                  toast({ title: 'Member Reactivated', description: `${member.firstName} has been reactivated.` });
                  const res = await membersApi.get(id);
                  if (res.member) setMember(mapApiMember(res.member));
                } catch (e) {
                  toast({ title: 'Error', description: (e as Error).message, variant: 'destructive' });
                }
              }}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Reactivate
              </Button>
            )}
          </div>
        )}
      </div>

      {/* KYC Expiry Alert */}
      {showKYCAlert && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            KYC expires on {member.kycExpiryDate?.toLocaleDateString()} â€” Initiate Re-validation
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="kyc">KYC Documents</TabsTrigger>
          <TabsTrigger value="accounts">Accounts</TabsTrigger>
          <TabsTrigger value="loans">Loans</TabsTrigger>
          <TabsTrigger value="deposits">Deposits</TabsTrigger>
          <TabsTrigger value="ledger">Ledger</TabsTrigger>
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

            {/* Signature */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg">Signature</CardTitle>
                {hasPermission(Permission.MEMBER_EDIT) && (
                  <>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => signatureInputRef.current?.click()}
                      disabled={isUploadingSignature}
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      {signatureUrl ? "Update Signature" : "Upload Signature"}
                    </Button>
                    <input 
                      type="file" 
                      ref={signatureInputRef} 
                      className="hidden" 
                      accept="image/jpeg,image/png" 
                      onChange={handleSignatureUpload} 
                    />
                  </>
                )}
              </CardHeader>
              <CardContent>
                {signatureUrl ? (
                  <div className="w-full max-w-[200px] h-20 border rounded overflow-hidden flex items-center justify-center bg-white">
                    <img src={signatureUrl} alt="Signature" className="max-w-full max-h-full" />
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No signature uploaded</p>
                )}
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
                  <MaskedField
                    value={member.mobileNumber}
                    field="mobile"
                    entityType="Member"
                    entityId={member.id}
                    maskedDisplay={maskMobile(member.mobileNumber)}
                    className="font-semibold"
                  />
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
                  <MaskedField
                    value={member.aadhaar}
                    field="aadhaar"
                    entityType="Member"
                    entityId={member.id}
                    maskedDisplay={maskAadhaar(member.aadhaar)}
                    className="font-semibold"
                  />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">PAN</p>
                  <MaskedField
                    value={member.pan}
                    field="pan"
                    entityType="Member"
                    entityId={member.id}
                    maskedDisplay={maskPAN(member.pan)}
                    className="font-semibold"
                  />
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
                  <p className="font-semibold">{member.sharesHeld} @ â‚¹100/share = â‚¹{member.totalShareAmount}</p>
                </div>
                {hasPermission(Permission.MEMBER_EDIT) && (
                  <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => {
                    const targetId = prompt('Enter target member ID for share transfer:');
                    const shares = prompt('Enter number of shares to transfer:');
                    const resolutionRef = prompt('Enter BOD resolution reference:');
                    if (targetId && shares && resolutionRef) {
                      membersApi.transferShares(id, {
                        targetMemberId: targetId,
                        shares: parseInt(shares),
                        faceValue: 100,
                        resolutionRef,
                      }).then(() => {
                        toast({ title: 'Share Transfer Initiated', description: 'Transfer recorded (pending BOD approval).' });
                      }).catch((e) => {
                        toast({ title: 'Error', description: (e as Error).message, variant: 'destructive' });
                      });
                    }
                  }}>
                    <Share2 className="w-4 h-4 mr-2" />
                    Transfer Shares
                  </Button>
                )}
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

            {/* Joint Membership */}
            {member.jointHolders && member.jointHolders.length > 0 && (
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Joint Membership
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {member.jointHolders.map((joint, idx) => (
                    <div key={idx} className="pb-4 border-b last:border-0">
                      <p className="text-xs font-medium text-muted-foreground">Joint Holder {idx + 1}</p>
                      <p className="font-semibold">{joint.name}</p>
                      <p className="text-sm text-muted-foreground">Mode: EITHER_OR_SURVIVOR</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

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
              <div className="flex gap-2">
                {member.kycStatus === 'PENDING' && (
                  <Button
                    variant="default"
                    disabled={kycReinitiating}
                    onClick={async () => {
                      if (!id) return;
                      setKycReinitiating(true);
                      try {
                        await membersApi.kyc.verify(id, { status: 'verified' });
                        toast({ title: 'KYC Verified', description: 'Member KYC has been verified successfully.' });
                        const res = await membersApi.get(id);
                        if (res.member) setMember(mapApiMember(res.member));
                      } catch (e) {
                        toast({ title: 'Error', description: (e as Error).message, variant: 'destructive' });
                      } finally {
                        setKycReinitiating(false);
                      }
                    }}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Verify KYC
                  </Button>
                )}
                <Button
                  variant="outline"
                  disabled={kycReinitiating}
                  onClick={async () => {
                    if (!id) return;
                    setKycReinitiating(true);
                    try {
                      await membersApi.kyc.reinitiate(id);
                      toast({ title: 'eKYC Re-initiated', description: 'Member KYC status reset to pending. Member must complete verification.' });
                      const res = await membersApi.get(id);
                      if (res.member) setMember(mapApiMember(res.member));
                    } catch (e) {
                      toast({ title: 'Error', description: (e as Error).message, variant: 'destructive' });
                    } finally {
                      setKycReinitiating(false);
                    }
                  }}
                >
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  {kycReinitiating ? 'Re-initiating...' : 'Re-initiate eKYC'}
                </Button>
                <Button
                  variant="outline"
                  disabled={kycReinitiating}
                  onClick={async () => {
                    if (!id) return;
                    setKycReinitiating(true);
                    try {
                      await membersApi.revalidateKyc(id);
                      toast({ title: 'KYC Re-validation Initiated', description: 'KYC re-validation workflow started. Member must complete verification.' });
                      const res = await membersApi.get(id);
                      if (res.member) setMember(mapApiMember(res.member));
                    } catch (e) {
                      toast({ title: 'Error', description: (e as Error).message, variant: 'destructive' });
                    } finally {
                      setKycReinitiating(false);
                    }
                  }}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Re-validate KYC
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {documents.length === 0 ? (
                <div className="col-span-full py-4 text-center text-muted-foreground border border-dashed rounded-lg">
                  No documents found
                </div>
              ) : documents.map((doc, idx) => (
                <Card key={idx}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold">{doc.type}</p>
                        <p className="text-sm text-muted-foreground">Uploaded: {doc.uploadDate.toLocaleDateString()}</p>
                        <Badge 
                          variant="outline" 
                          className={`mt-2 ${
                            doc.status === 'ACTIVE' 
                              ? 'bg-green-50 text-green-800 border-green-200' 
                              : doc.status === 'PENDING_APPROVAL'
                              ? 'bg-yellow-50 text-yellow-800 border-yellow-200'
                              : 'bg-red-50 text-red-800 border-red-200'
                          }`}
                        >
                          {doc.status === 'ACTIVE' ? 'âœ“ ' : ''}{doc.status}
                        </Badge>
                      </div>
                      <Download className="w-4 h-4 text-muted-foreground cursor-pointer" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-3">Verified by {doc.verifiedBy}</p>
                    <p className="text-xs text-muted-foreground">on {doc.verifiedOn ? doc.verifiedOn.toLocaleDateString() : '-'}</p>
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
                  {accounts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No savings accounts found
                      </TableCell>
                    </TableRow>
                  ) : (
                    accounts.map((account, index) => {
                      // Debug: Log each account before rendering
                      console.log(`Account ${index}:`, account);
                      
                      const accountId = account.id || account.accountNo;
                      
                      if (!accountId || accountId === 'undefined' || accountId === 'N/A') {
                        console.error(`Account ${index} has invalid ID:`, account);
                        return (
                          <TableRow key={`${account.accountNo}-${index}`}>
                            <TableCell className="font-semibold">{account.accountNo}</TableCell>
                            <TableCell>{account.type}</TableCell>
                            <TableCell className="text-right font-semibold">â‚¹{account.balance.toLocaleString()}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-green-50 text-green-800">
                                {account.status}
                              </Badge>
                            </TableCell>
                            <TableCell>{new Date(account.openedDate).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                disabled
                                onClick={() => {
                                  toast({
                                    title: "Error",
                                    description: `Account ID not available for ${account.accountNo}`,
                                    variant: "destructive",
                                  });
                                }}
                              >
                                View (Error)
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      }
                      
                      return (
                        <TableRow key={accountId}>
                          <TableCell className="font-semibold">{account.accountNo}</TableCell>
                          <TableCell>{account.type}</TableCell>
                          <TableCell className="text-right font-semibold">â‚¹{account.balance.toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-green-50 text-green-800">
                              {account.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{new Date(account.openedDate).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Link href={`/dashboard/accounts/${encodeURIComponent(accountId)}`}>
                              <Button variant="ghost" size="sm">View</Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Loans Tab */}
        <TabsContent value="loans">
          {/* Pending Sanction Acknowledgement Section */}
          {pendingApplications.length > 0 && (
            <Card className="mb-4 border-amber-200 bg-amber-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-amber-800 flex items-center gap-2">
                  <span>⏳</span> Sanction Acknowledgement Pending
                </CardTitle>
                <CardDescription className="text-amber-700">
                  नीचे दिए गए लोन को member का sign-off चाहिए। Acknowledge करने के बाद Disbursement हो सकेगा।
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pendingApplications.map((app: any) => (
                    <div key={app.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-amber-200">
                      <div>
                        <p className="font-semibold text-sm">Application #{app.id.slice(-8)}</p>
                        <p className="text-xs text-muted-foreground">
                          {app.loanType?.toUpperCase()} • ₹{Number(app.amountRequested).toLocaleString('en-IN')} • {app.tenureMonths} months
                        </p>
                        <Badge className="mt-1 bg-amber-100 text-amber-800 border-amber-300" variant="outline">
                          SANCTIONED — Awaiting Member Acknowledgement
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={async () => {
                          try {
                            const res = await loanSanctionApi.acknowledgeSanction(app.id, {});
                            if (res.success) {
                              toast({ title: 'Success', description: 'Sanction acknowledged! Disbursement can now proceed.' });
                              setPendingApplications(prev => prev.filter(a => a.id !== app.id));
                            }
                          } catch (err: any) {
                            toast({ title: 'Error', description: err.message || 'Failed to acknowledge', variant: 'destructive' });
                          }
                        }}
                      >
                        ✅ Acknowledge Sanction
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
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
                  {loans.map((loan) => (
                    <TableRow key={loan.loanId}>
                      <TableCell className="font-semibold">{loan.loanId}</TableCell>
                      <TableCell>{loan.type}</TableCell>
                      <TableCell className="text-right">â‚¹{loan.amount.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-semibold">â‚¹{loan.outstanding.toLocaleString()}</TableCell>
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

        {/* Ledger Tab */}
        <TabsContent value="ledger">
          <Card>
            <CardHeader>
              <CardTitle>Member Ledger</CardTitle>
              <CardDescription>Complete transaction history across all accounts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex gap-2">
                <Button variant="outline" size="sm" onClick={async () => {
                  setLedgerLoading(true);
                  try {
                    const res = await membersApi.getLedger(id);
                    setLedger(res.ledger || []);
                  } catch (e) {
                    toast({ title: 'Error', description: (e as Error).message, variant: 'destructive' });
                  } finally {
                    setLedgerLoading(false);
                  }
                }}>
                  {ledgerLoading ? 'Loading...' : 'Load Ledger'}
                </Button>
                <Button variant="outline" size="sm" onClick={() => {
                  const csv = [
                    ['Date', 'Type', 'Transaction Type', 'Description', 'Debit', 'Credit', 'Balance'].join(','),
                    ...ledger.map(e => [
                      new Date(e.date).toLocaleDateString(),
                      e.type,
                      e.transactionType || '',
                      `"${(e.description || '').replace(/"/g, '""')}"`,
                      e.debit || 0,
                      e.credit || 0,
                      e.balance || '',
                    ].join(',')),
                  ].join('\n');
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `Member_Ledger_${member.memberId}.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}>
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Debit</TableHead>
                    <TableHead className="text-right">Credit</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ledger.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        {ledgerLoading ? 'Loading...' : 'Click "Load Ledger" to view transactions'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    ledger.map((entry, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{new Date(entry.date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{entry.type}</Badge>
                        </TableCell>
                        <TableCell className="max-w-md truncate">{entry.description}</TableCell>
                        <TableCell className="text-right">{entry.debit ? `â‚¹${entry.debit.toLocaleString()}` : '-'}</TableCell>
                        <TableCell className="text-right">{entry.credit ? `â‚¹${entry.credit.toLocaleString()}` : '-'}</TableCell>
                        <TableCell className="text-right">{entry.balance ? `â‚¹${entry.balance.toLocaleString()}` : '-'}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
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
                {auditTrail.map((entry, idx) => (
                  <div key={idx} className="flex gap-4 pb-4 border-b last:border-0">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold">{entry.event}</p>
                      <p className="text-sm text-muted-foreground">
                        By {entry.user} ({entry.role}) â€¢ {new Date(entry.timestamp).toLocaleString()}
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
