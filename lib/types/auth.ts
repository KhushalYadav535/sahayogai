// User roles as per BRD
export enum UserRole {
  PLATFORM_ADMIN = 'PLATFORM_ADMIN',
  SOCIETY_ADMIN = 'SOCIETY_ADMIN',
  PRESIDENT = 'PRESIDENT',
  SECRETARY = 'SECRETARY',
  ACCOUNTANT = 'ACCOUNTANT', // Maker
  SENIOR_ACCOUNTANT = 'SENIOR_ACCOUNTANT', // Checker
  LOAN_OFFICER = 'LOAN_OFFICER',
  COMPLIANCE_OFFICER = 'COMPLIANCE_OFFICER',
  AUDITOR = 'AUDITOR',
  MEMBER = 'MEMBER',
}

// Permission categories
export enum Permission {
  // Member Management
  MEMBER_VIEW = 'member:view',
  MEMBER_CREATE = 'member:create',
  MEMBER_EDIT = 'member:edit',
  MEMBER_KYC = 'member:kyc',
  MEMBER_DELETE = 'member:delete',

  // Loans
  LOAN_VIEW = 'loan:view',
  LOAN_CREATE = 'loan:create',
  LOAN_APPROVE = 'loan:approve',
  LOAN_DISBURSE = 'loan:disburse',
  LOAN_REPAY = 'loan:repay',

  // Savings & Deposits
  ACCOUNT_VIEW = 'account:view',
  ACCOUNT_CREATE = 'account:create',
  ACCOUNT_DEPOSIT = 'account:deposit',
  ACCOUNT_WITHDRAW = 'account:withdraw',
  DEPOSIT_VIEW = 'deposit:view',
  DEPOSIT_CREATE = 'deposit:create',

  // Financial Accounting
  GL_VIEW = 'gl:view',
  GL_ENTRY_CREATE = 'gl:entry_create',
  GL_ENTRY_APPROVE = 'gl:entry_approve',

  // Governance
  GOVERNANCE_VIEW = 'governance:view',
  GOVERNANCE_EDIT = 'governance:edit',
  AGM_MANAGE = 'agm:manage',

  // Compliance
  COMPLIANCE_VIEW = 'compliance:view',
  COMPLIANCE_EDIT = 'compliance:edit',
  STR_GENERATE = 'str:generate',

  // Reports
  REPORT_VIEW = 'report:view',
  REPORT_EXPORT = 'report:export',

  // System
  USER_MANAGE = 'user:manage',
  TENANT_MANAGE = 'tenant:manage',
  CONFIG_MANAGE = 'config:manage',
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  tenantId: string;
  permissions: Permission[];
  mfaEnabled: boolean;
  mfaMethod?: 'TOTP' | 'SMS';
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthSession {
  user: User;
  token: string;
  refreshToken: string;
  expiresAt: Date;
  tenantId: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  tenantId?: string;
  otp?: string; // For MFA
}

export interface SignupData {
  email: string;
  name: string;
  password: string;
  tenantId?: string;
}

// Role-to-permissions mapping (BRD-aligned)
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.PLATFORM_ADMIN]: [
    Permission.TENANT_MANAGE,
    Permission.USER_MANAGE,
    Permission.CONFIG_MANAGE,
    Permission.REPORT_VIEW,
  ],
  [UserRole.SOCIETY_ADMIN]: [
    Permission.USER_MANAGE,
    Permission.MEMBER_VIEW,
    Permission.MEMBER_CREATE,
    Permission.MEMBER_EDIT,
    Permission.ACCOUNT_VIEW,
    Permission.ACCOUNT_CREATE,
    Permission.ACCOUNT_DEPOSIT,
    Permission.ACCOUNT_WITHDRAW,
    Permission.LOAN_VIEW,
    Permission.LOAN_CREATE,
    Permission.LOAN_APPROVE,
    Permission.LOAN_DISBURSE,
    Permission.DEPOSIT_VIEW,
    Permission.DEPOSIT_CREATE,
    Permission.GL_VIEW,
    Permission.GL_ENTRY_CREATE,
    Permission.GL_ENTRY_APPROVE,
    Permission.GOVERNANCE_VIEW,
    Permission.GOVERNANCE_EDIT,
    Permission.COMPLIANCE_VIEW,
    Permission.COMPLIANCE_EDIT,
    Permission.REPORT_VIEW,
    Permission.REPORT_EXPORT,
    Permission.CONFIG_MANAGE,
  ],
  [UserRole.PRESIDENT]: [
    Permission.MEMBER_VIEW,
    Permission.ACCOUNT_VIEW,
    Permission.LOAN_VIEW,
    Permission.LOAN_APPROVE,
    Permission.DEPOSIT_VIEW,
    Permission.GL_VIEW,
    Permission.GOVERNANCE_VIEW,
    Permission.GOVERNANCE_EDIT,
    Permission.AGM_MANAGE,
    Permission.COMPLIANCE_VIEW,
    Permission.REPORT_VIEW,
    Permission.REPORT_EXPORT,
  ],
  [UserRole.SECRETARY]: [
    Permission.MEMBER_VIEW,
    Permission.MEMBER_CREATE,
    Permission.MEMBER_EDIT,
    Permission.MEMBER_KYC,
    Permission.ACCOUNT_VIEW,
    Permission.ACCOUNT_CREATE,
    Permission.DEPOSIT_VIEW,
    Permission.DEPOSIT_CREATE,
    Permission.GOVERNANCE_VIEW,
    Permission.GOVERNANCE_EDIT,
    Permission.AGM_MANAGE,
    Permission.COMPLIANCE_VIEW,
    Permission.REPORT_VIEW,
  ],
  [UserRole.ACCOUNTANT]: [
    Permission.MEMBER_VIEW,
    Permission.ACCOUNT_VIEW,
    Permission.ACCOUNT_CREATE,
    Permission.ACCOUNT_DEPOSIT,
    Permission.ACCOUNT_WITHDRAW,
    Permission.LOAN_VIEW,
    Permission.LOAN_DISBURSE,
    Permission.LOAN_REPAY,
    Permission.DEPOSIT_VIEW,
    Permission.DEPOSIT_CREATE,
    Permission.GL_VIEW,
    Permission.GL_ENTRY_CREATE,
    Permission.REPORT_VIEW,
    Permission.REPORT_EXPORT,
  ],
  [UserRole.SENIOR_ACCOUNTANT]: [
    Permission.MEMBER_VIEW,
    Permission.ACCOUNT_VIEW,
    Permission.ACCOUNT_CREATE,
    Permission.ACCOUNT_DEPOSIT,
    Permission.ACCOUNT_WITHDRAW,
    Permission.LOAN_VIEW,
    Permission.DEPOSIT_VIEW,
    Permission.DEPOSIT_CREATE,
    Permission.GL_VIEW,
    Permission.GL_ENTRY_CREATE,
    Permission.GL_ENTRY_APPROVE,
    Permission.REPORT_VIEW,
    Permission.REPORT_EXPORT,
  ],
  [UserRole.LOAN_OFFICER]: [
    Permission.MEMBER_VIEW,
    Permission.ACCOUNT_VIEW,
    Permission.DEPOSIT_VIEW,
    Permission.LOAN_VIEW,
    Permission.LOAN_CREATE,
    Permission.LOAN_APPROVE,
    Permission.LOAN_DISBURSE,
    Permission.LOAN_REPAY,
    Permission.REPORT_VIEW,
  ],
  [UserRole.COMPLIANCE_OFFICER]: [
    Permission.MEMBER_VIEW,
    Permission.ACCOUNT_VIEW,
    Permission.LOAN_VIEW,
    Permission.DEPOSIT_VIEW,
    Permission.COMPLIANCE_VIEW,
    Permission.COMPLIANCE_EDIT,
    Permission.STR_GENERATE,
    Permission.REPORT_VIEW,
    Permission.REPORT_EXPORT,
  ],
  [UserRole.AUDITOR]: [
    Permission.MEMBER_VIEW,
    Permission.ACCOUNT_VIEW,
    Permission.LOAN_VIEW,
    Permission.DEPOSIT_VIEW,
    Permission.GL_VIEW,
    Permission.COMPLIANCE_VIEW,
    Permission.REPORT_VIEW,
    Permission.REPORT_EXPORT,
  ],
  [UserRole.MEMBER]: [
    Permission.MEMBER_VIEW,  // Own account only
    Permission.ACCOUNT_VIEW, // Own accounts only
    Permission.REPORT_VIEW,  // Own statements
  ],
};
