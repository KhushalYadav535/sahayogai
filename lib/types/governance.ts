// Board of Directors
export interface Director {
  id: string;
  tenantId: string;
  name: string;
  designation: string;
  din?: string; // Director Identification Number
  pan: string;
  electionDate: Date;
  termStart: Date;
  termEnd: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Committee types
export enum CommitteeType {
  LOAN_COMMITTEE = 'LOAN_COMMITTEE',
  AUDIT_COMMITTEE = 'AUDIT_COMMITTEE',
  AGM_COMMITTEE = 'AGM_COMMITTEE',
  FINANCE_COMMITTEE = 'FINANCE_COMMITTEE',
}

export interface Committee {
  id: string;
  tenantId: string;
  name: string;
  type: CommitteeType;
  mandate: string;
  memberIds: string[]; // Director IDs
  quorumRequired: number;
  meetingFrequency: string; // e.g., "Quarterly"
  createdAt: Date;
  updatedAt: Date;
}

// AGM Management
export enum AGMStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface AGM {
  id: string;
  agmNumber: number;
  year: number;
  tenantId: string;
  scheduledDate: Date;
  venue: string;
  status: AGMStatus;
  agendaItems: AgendaItem[];
  attendees: AGMAttendee[];
  notices: {
    noticeSentDate: Date;
    noticePeriodDays: number;
  };
  votingResults?: VotingResult[];
  minutesGenerated: boolean;
  minutesLink?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AgendaItem {
  id: string;
  agmId: string;
  sequence: number;
  title: string;
  description: string;
  proposedBy: string;
  secondedBy?: string;
  status: 'PENDING' | 'DISCUSSED' | 'RESOLVED' | 'DEFERRED';
  resolutionId?: string;
  createdAt: Date;
}

export interface AGMAttendee {
  id: string;
  agmId: string;
  memberId: string;
  attendanceStatus: 'PRESENT' | 'ABSENT' | 'PROXY';
  proxyFor?: string; // Member ID if proxy
  createdAt: Date;
}

export interface VotingResult {
  id: string;
  agmId: string;
  agendaItemId: string;
  resolutionId?: string;
  votesFor: number;
  votesAgainst: number;
  votesAbstain: number;
  result: 'PASSED' | 'REJECTED' | 'DEFERRED';
  createdAt: Date;
}

// Resolution Management
export interface Resolution {
  id: string;
  referenceNumber: string; // RES-2024-001
  tenantId: string;
  meetingType: 'BOARD' | 'AGM' | 'COMMITTEE';
  meetingId: string;
  date: Date;
  subject: string;
  description: string;
  proposedBy: string;
  secondedBy?: string;
  status: 'PASSED' | 'REJECTED' | 'DEFERRED';
  votesFor?: number;
  votesAgainst?: number;
  actionItems: ActionItem[];
  attachments: {
    fileName: string;
    fileUrl: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ActionItem {
  id: string;
  resolutionId: string;
  description: string;
  assignedTo: string; // User/Role
  dueDate: Date;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';
  completionDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Compliance Calendar
export interface ComplianceEvent {
  id: string;
  tenantId: string;
  eventType: string; // e.g., "AGM", "NABARD_RETURN", "TDS_PAYMENT"
  title: string;
  dueDate: Date;
  description: string;
  responsibleRole: string;
  currentStatus: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';
  lastAlertSentAt?: Date;
  alertSchedule: {
    t30Days: boolean;
    t15Days: boolean;
    t7Days: boolean;
    t1Day: boolean;
  };
  escalatedAt?: Date;
  completedAt?: Date;
  notes?: string;
  regulatoryReference?: string;
  createdAt: Date;
  updatedAt: Date;
}

// By-law Management
export interface ByLaw {
  id: string;
  tenantId: string;
  title: string;
  version: number;
  effectiveDate: Date;
  content: string;
  uploadedAt: Date;
  uploadedBy: string;
  amendments: Amendment[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Amendment {
  id: string;
  byLawId: string;
  amendmentNumber: number;
  effectiveDate: Date;
  description: string;
  resolutionReference: string;
  content: string;
  createdAt: Date;
}

// Meeting Minutes
export interface MeetingMinutes {
  id: string;
  tenantId: string;
  meetingType: 'BOARD' | 'AGM' | 'COMMITTEE';
  meetingId: string;
  meetingDate: Date;
  minutesType: 'DRAFT' | 'FINALIZED';
  attendees: string[];
  agenda: AgendaItem[];
  decisions: string[];
  actionItems: ActionItem[];
  attachments: {
    fileName: string;
    fileUrl: string;
  }[];
  sha256Hash?: string; // For tamper detection
  digitallySigned: boolean;
  signedAt?: Date;
  signedBy?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

// Maker-Checker Hierarchy
export interface ApprovalThreshold {
  id: string;
  tenantId: string;
  transactionType: 'LOAN' | 'GL_ENTRY' | 'REFUND' | 'MEMBER_STATUS' | 'DEPOSIT';
  level: number; // 1-4
  maxAmount: number;
  approverRole: string;
  slaHours: number;
  createdAt: Date;
}

export interface ApprovalWorkflow {
  id: string;
  tenantId: string;
  entityType: string; // LOAN, GL_ENTRY, etc.
  entityId: string;
  currentLevel: number;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'ESCALATED';
  approvals: {
    level: number;
    approverRole: string;
    approverUserId?: string;
    approvedAt?: Date;
    rejectionReason?: string;
    escalatedAt?: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}
