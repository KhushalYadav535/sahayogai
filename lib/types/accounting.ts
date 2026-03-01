export enum AccountType {
  ASSET = 'ASSET',
  LIABILITY = 'LIABILITY',
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
  EQUITY = 'EQUITY',
}

export interface ChartOfAccount {
  code: string
  name: string
  type: AccountType
  parent?: string
  balance: number
  openingBalance: number
  description?: string
  isActive: boolean
}

export interface JournalEntry {
  id: string
  refNumber: string
  date: Date
  narration: string
  lines: JournalLine[]
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'POSTED' | 'REJECTED'
  totalDebit: number
  totalCredit: number
  createdBy: string
  createdAt: Date
  postedBy?: string
  postedAt?: Date
}

export interface JournalLine {
  accountCode: string
  accountName: string
  debit: number
  credit: number
  description?: string
}

export interface TrialBalance {
  accountCode: string
  accountName: string
  openingDr: number
  openingCr: number
  periodDr: number
  periodCr: number
  closingDr: number
  closingCr: number
}

export interface BalanceSheet {
  asOnDate: Date
  assets: { [key: string]: number }
  liabilities: { [key: string]: number }
  equity: { [key: string]: number }
  totalAssets: number
  totalLiabilities: number
  totalEquity: number
}

export interface PLStatement {
  period: { from: Date; to: Date }
  income: { [key: string]: number }
  expense: { [key: string]: number }
  totalIncome: number
  totalExpense: number
  netSurplus: number
}

export interface SuspenseEntry {
  id: string
  date: Date
  amount: number
  narration: string
  source: string
  agingDays: number
  status: 'UNRECONCILED' | 'ASSIGNED' | 'WRITTEN_OFF'
  assignedAccount?: string
}
