// Savings Account status
export enum SavingsAccountStatus {
  ACTIVE = 'ACTIVE',
  DORMANT = 'DORMANT',
  FROZEN = 'FROZEN',
  CLOSED = 'CLOSED',
}

// Deposit types as per BRD
export enum DepositType {
  FDR = 'FDR', // Fixed Deposit Receipt
  RD = 'RD', // Recurring Deposit
  MIS = 'MIS', // Monthly Interest Scheme
}

export enum DepositStatus {
  ACTIVE = 'ACTIVE',
  MATURED = 'MATURED',
  PREMATURELY_CLOSED = 'PREMATURELY_CLOSED',
  RENEWAL_PENDING = 'RENEWAL_PENDING',
}

export interface SavingsAccount {
  id: string;
  accountNumber: string; // Generated per format metadata
  memberId: string;
  tenantId: string;
  
  status: SavingsAccountStatus;
  openingDate: Date;
  closingDate?: Date;
  
  // Balance
  currentBalance: number;
  minBalance: number;
  
  // Interest
  interestRate: number; // Annual %
  interestAccrued: number;
  lastInterestCreditDate?: Date;
  
  // Features
  isDormant: boolean;
  lastTransactionDate?: Date;
  
  // System fields
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
  isDeleted: boolean;
}

export interface SavingsTransaction {
  id: string;
  accountNumber: string;
  tenantId: string;
  transactionType: 'DEPOSIT' | 'WITHDRAWAL' | 'INTEREST_CREDIT' | 'CHARGE';
  amount: number;
  transactionDate: Date;
  balanceBefore: number;
  balanceAfter: number;
  narration: string;
  referenceNumber: string;
  status: 'POSTED' | 'PENDING' | 'REVERSED';
  createdAt: Date;
  createdBy: string;
}

export interface FixedDeposit {
  id: string;
  depositId: string; // DEP-YYYY-######
  memberId: string;
  tenantId: string;
  
  // Deposit details
  depositType: DepositType.FDR;
  principalAmount: number;
  interestRate: number; // Annual %
  tenure: number; // In months
  
  // Dates
  openingDate: Date;
  maturityDate: Date;
  createdDate: Date;
  
  // Interest
  totalInterest: number;
  maturityAmount: number;
  interestFrequency: 'MONTHLY' | 'QUARTERLY' | 'HALF_YEARLY' | 'ANNUALLY' | 'AT_MATURITY';
  interestAccrued: number;
  interestPaid: number;
  
  // Status
  status: DepositStatus;
  isRenewed: boolean;
  renewalCount: number;
  
  // TDS (Tax Deducted at Source)
  isTDSApplicable: boolean;
  tdsAmount?: number;
  panProvided: boolean;
  
  // Senior citizen benefit
  isSeniorCitizen: boolean;
  seniorCitizenPremium?: number;
  
  // Premature closure
  prematureClosureDate?: Date;
  prematurePenalty?: number;
  
  // System fields
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

export interface RecurringDeposit {
  id: string;
  depositId: string; // RD-YYYY-######
  memberId: string;
  tenantId: string;
  
  // RD details
  depositType: DepositType.RD;
  monthlyAmount: number;
  interestRate: number; // Annual %
  tenure: number; // In months
  
  // Dates
  startDate: Date;
  maturityDate: Date;
  
  // Tracking
  totalInstallmentsDue: number;
  totalInstallmentsPaid: number;
  totalAmountDeposited: number;
  totalInterest: number;
  maturityAmount: number;
  
  // Status
  status: DepositStatus;
  lastInstallmentDate?: Date;
  missedInstallments: number;
  
  // System fields
  createdAt: Date;
  updatedAt: Date;
}

export interface DepositTransaction {
  id: string;
  depositId: string;
  memberId: string;
  tenantId: string;
  transactionType: 'DEPOSIT' | 'INTEREST_CREDIT' | 'PREMATURE_CLOSURE' | 'MATURITY';
  amount: number;
  transactionDate: Date;
  narration: string;
  status: 'POSTED' | 'PENDING';
  createdAt: Date;
}

export interface InterestCalculation {
  id: string;
  accountOrDepositId: string;
  tenantId: string;
  interestPeriod: string; // e.g., "2024-Q1"
  principalAmount: number;
  rate: number;
  days: number;
  interestAmount: number;
  calculatedDate: Date;
  creditDate?: Date;
  status: 'CALCULATED' | 'POSTED' | 'REVERSED';
  createdAt: Date;
}

export interface SweepTransaction {
  id: string;
  memberId: string;
  savingsAccountId: string;
  depositAccountId: string;
  transactionType: 'SWEEP_IN' | 'SWEEP_OUT';
  amount: number;
  transactionDate: Date;
  reason: string;
  createdAt: Date;
}
