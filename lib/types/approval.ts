export enum ApprovalType {
  LOAN_APPROVAL = 'LOAN_APPROVAL',
  JOURNAL_ENTRY = 'JOURNAL_ENTRY',
  MEMBER_KYC = 'MEMBER_KYC',
  DEPOSIT_CREATION = 'DEPOSIT_CREATION',
  ACCOUNT_OPERATION = 'ACCOUNT_OPERATION',
  STATUS_CHANGE = 'STATUS_CHANGE',
  INTEREST_POSTING = 'INTEREST_POSTING',
  NOMINEE_CHANGE = 'NOMINEE_CHANGE',
}

export enum ApprovalStatus {
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  ESCALATED = 'ESCALATED',
}

export interface ApprovalItem {
  id: string
  type: ApprovalType | string
  status: ApprovalStatus
  description: string
  makerName: string
  makerRole: string
  amount?: number
  createdAt: Date
  slaDeadline: Date
  entityId: string
  entityType: string
  source?: 'voucher' | 'loan_application'
  diffData?: Record<string, any>
  comments?: string
  rejectionReason?: string
}

export interface ApprovalAction {
  type: 'APPROVE' | 'REJECT' | 'ESCALATE'
  comments: string
  reason?: string
  escalateTo?: string
  timestamp: Date
  checkerName: string
}
