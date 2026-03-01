// Member status lifecycle as per BRD
export enum MemberStatus {
  PENDING = 'PENDING', // Application submitted, awaiting approval
  ACTIVE = 'ACTIVE', // Approved and active member
  SUSPENDED = 'SUSPENDED', // Temporarily suspended
  INACTIVE = 'INACTIVE', // Left the society
  DORMANT = 'DORMANT', // No activity for configured months
  DECEASED = 'DECEASED', // Member passed away
}

export enum MemberCategory {
  REGULAR = 'REGULAR',
  NOMINAL = 'NOMINAL',
  ASSOCIATE = 'ASSOCIATE',
  STAFF = 'STAFF',
  DIRECTOR = 'DIRECTOR',
}

export enum KYCStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  FAILED = 'FAILED',
  EXPIRED = 'EXPIRED',
}

export enum KYCMode {
  AADHAAR_OTP = 'AADHAAR_OTP',
  MANUAL = 'MANUAL',
}

export interface Member {
  id: string;
  memberId: string; // Auto-generated member number
  tenantId: string;
  
  // Demographics
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: 'M' | 'F' | 'O';
  mobileNumber: string;
  email?: string;
  
  // Address
  permanentAddress: string;
  correspondenceAddress?: string;
  city: string;
  state: string;
  pincode: string;
  
  // Identity
  aadhaarTokenRef?: string; // Tokenized, never plain text
  panNumber?: string;
  
  // Occupation & Income
  occupation: string;
  incomeRange: string;
  
  // Membership details
  status: MemberStatus;
  category: MemberCategory;
  joinDate: Date;
  sharesHeld: number;
  totalShareAmount: number;
  
  // KYC
  kycStatus: KYCStatus;
  kycMode: KYCMode;
  kycVerifiedDate?: Date;
  kycVerifiedBy?: string;
  
  // Nominees
  nominees: Nominee[];
  
  // System fields
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
  isDeleted: boolean;
  deletedAt?: Date;
}

export interface Nominee {
  id: string;
  memberId: string;
  name: string;
  relationship: string;
  dateOfBirth: Date;
  allocationPercentage: number;
  aadhaarTokenRef?: string;
  mobileNumber: string;
  address: string;
  createdAt: Date;
}

export interface MemberLedgerEntry {
  id: string;
  memberId: string;
  tenantId: string;
  transactionDate: Date;
  transactionType: 'DEPOSIT' | 'WITHDRAWAL' | 'INTEREST' | 'SHARE_ISSUANCE' | 'DIVIDEND' | 'LOAN_DISBURSEMENT' | 'LOAN_REPAYMENT' | 'FEE';
  amount: number;
  description: string;
  relatedAccountId?: string;
  relatedLoanId?: string;
  balance: number;
  createdAt: Date;
}

export interface MemberRegistrationForm {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'M' | 'F' | 'O';
  mobileNumber: string;
  email?: string;
  permanentAddress: string;
  correspondenceAddress?: string;
  city: string;
  state: string;
  pincode: string;
  aadhaarNumber?: string;
  panNumber?: string;
  occupation: string;
  incomeRange: string;
  category: MemberCategory;
  initialShares: number;
}

export interface KYCVerificationRequest {
  memberId: string;
  verificationMode: KYCMode;
  aadhaarOTP?: string;
  documentUploads?: {
    documentType: string;
    documentUrl: string;
  }[];
}
