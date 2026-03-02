/**
 * API client for Sahayog AI backend
 */
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

async function api<T>(
  path: string,
  init?: RequestInit & { token?: string }
): Promise<T> {
  const { token, ...opts } = init || {};
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((opts.headers as Record<string, string>) || {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...opts, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || res.statusText || "Request failed");
  return data as T;
}

// Auth (stub — use actual token from auth context)
export function setApiToken(token: string | null) {
  if (typeof window !== "undefined") {
    (window as any).__sahayog_token = token;
    if (token) localStorage.setItem("sahayog-token", token);
    else localStorage.removeItem("sahayog-token");
  }
}

export function setMemberToken(token: string | null) {
  if (typeof window !== "undefined") {
    (window as any).__sahayog_member_token = token;
    if (token) localStorage.setItem("sahayog_member_token", token);
    else localStorage.removeItem("sahayog_member_token");
  }
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return (window as any).__sahayog_token || localStorage.getItem("sahayog-token");
}

function getMemberToken(): string | null {
  if (typeof window === "undefined") return null;
  return (window as any).__sahayog_member_token || localStorage.getItem("sahayog_member_token");
}

// Platform Billing (super admin sets plan MRR + per-tenant override)
export const platformBillingApi = {
  getMyBilling: (token?: string) =>
    api<{ success: boolean; billing: { plan: string; mrr: number; arr: number; isOverride: boolean } }>(
      "/platform/billing/me",
      { headers: { Authorization: `Bearer ${token || getToken() || ""}` } }
    ),
  getPlans: (token?: string) =>
    api<{ success: boolean; plans: Record<string, number> }>("/platform/billing/plans", {
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    }),
  setPlans: (body: { starter?: number; pro?: number; enterprise?: number }, token?: string) =>
    api<{ success: boolean; plans: Record<string, number> }>("/platform/billing/plans", {
      method: "PUT",
      body: JSON.stringify(body),
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    }),
  getOverrides: (token?: string) =>
    api<{ success: boolean; overrides: any[] }>("/platform/billing/overrides", {
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    }),
  setOverride: (tenantId: string, mrr: number, token?: string) =>
    api<{ success: boolean; tenantId: string; mrr: number }>(`/platform/billing/overrides/${tenantId}`, {
      method: "PUT",
      body: JSON.stringify({ mrr }),
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    }),
  removeOverride: (tenantId: string, token?: string) =>
    api<{ success: boolean }>(`/platform/billing/overrides/${tenantId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    }),
};

// Platform Rules (super admin)
export const platformRulesApi = {
  list: (token?: string) =>
    api<{ success: boolean; rules: any[] }>("/platform/rules", {
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    }),
  save: (rules: any[], token?: string) =>
    api<{ success: boolean; rules: any[] }>("/platform/rules", {
      method: "PUT",
      body: JSON.stringify({ rules }),
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    }),
};

// Tenants
export const tenantsApi = {
  list: (token?: string) => api<{ success: boolean; tenants: any[] }>("/platform/tenants", { headers: { Authorization: `Bearer ${token || getToken() || ""}` } }),
  get: (id: string, token?: string) => api<{ success: boolean; tenant: any }>(`/platform/tenants/${id}`, { headers: { Authorization: `Bearer ${token || getToken() || ""}` } }),
  create: (body: Record<string, any>, token?: string) =>
    api<{ success: boolean; tenant: any }>("/platform/tenants", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    }),
  updateStatus: (id: string, status: "trial" | "active" | "suspended" | "inactive" | "reactivated" | "offboarded", token?: string) =>
    api<{ success: boolean; tenant: any }>(`/platform/tenants/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    }),
  getCredits: (id: string, token?: string) =>
    api<{ success: boolean; credits: { txCredits: number; smsCredits: number } }>(`/platform/tenants/${id}/credits`, {
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    }),
  updateCredits: (id: string, body: { txCredits?: number; smsCredits?: number }, token?: string) =>
    api<{ success: boolean; credits: { txCredits: number; smsCredits: number } }>(`/platform/tenants/${id}/credits`, {
      method: "PUT",
      body: JSON.stringify(body),
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    }),
  getUsage: (id: string, period?: string, token?: string) => {
    const q = period ? `?period=${period}` : "";
    return api<{ success: boolean; usage: { period: string; activeUsersPeak: number; memberCount: number; txnVolume: number; storageMb: number; aiInvocations: number; apiCalls: number; loansDisbursed?: number } }>(
      `/platform/tenants/${id}/usage${q}`,
      { headers: { Authorization: `Bearer ${token || getToken() || ""}` } }
    );
  },
  getModules: (id: string, token?: string) =>
    api<{ success: boolean; modules: string[]; memberCap: number; plan: string }>(`/platform/tenants/${id}/modules`, {
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    }),
};

// Platform config (super admin: modules per tier, MDA params)
export const platformConfigApi = {
  getModules: (token?: string) =>
    api<{ success: boolean; modules: Record<string, string[]>; memberCap: Record<string, number> }>("/platform/config/modules", {
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    }),
  setModules: (body: { modules?: Record<string, string[]>; memberCap?: Record<string, number> }, token?: string) =>
    api<{ success: boolean; modules: Record<string, string[]>; memberCap: Record<string, number> }>("/platform/config/modules", {
      method: "PUT",
      body: JSON.stringify(body),
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    }),
  getMda: (token?: string) =>
    api<{ success: boolean; mda: { fdrTdsRate: number; minorAge: number; loanProvisionMap: Record<string, number> } }>("/platform/config/mda", {
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    }),
  setMda: (body: { fdrTdsRate?: number; minorAge?: number; loanProvisionMap?: Record<string, number> }, token?: string) =>
    api<{ success: boolean; mda: any }>("/platform/config/mda", {
      method: "PUT",
      body: JSON.stringify(body),
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    }),
  getAi: (token?: string) =>
    api<{ success: boolean; ai: { modelVersion: string; rollbackVersion?: string } }>("/platform/config/ai", {
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    }),
  setAi: (body: { modelVersion?: string; rollbackVersion?: string | null }, token?: string) =>
    api<{ success: boolean; ai: any }>("/platform/config/ai", {
      method: "PUT",
      body: JSON.stringify(body),
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    }),
};

// Jobs (super admin - usage snapshot, etc.)
export const jobsApi = {
  runUsageSnapshot: (period?: string, token?: string) =>
    api<{ success: boolean; message: string; period: string }>("/jobs/usage-snapshot", {
      method: "POST",
      body: JSON.stringify(period ? { period } : {}),
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    }),
  dayEnd: (token?: string) =>
    api<{ success: boolean; message: string; sbAccountsProcessed?: number; overdueEmisMarked?: number; dormantAccountsMarked?: number }>("/jobs/day-end", {
      method: "POST",
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    }),
  monthEnd: (token?: string) =>
    api<{ success: boolean; message: string; npaLoansMarked?: number }>("/jobs/month-end", {
      method: "POST",
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    }),
};

// Platform usage dashboard (super admin)
export const platformUsageApi = {
  getSummary: (token?: string) =>
    api<{ success: boolean; period: string; summary: any[]; totals: { totalTenants: number; totalMembers: number; totalTxns: number } }>(
      "/platform/usage/summary",
      { headers: { Authorization: `Bearer ${token || getToken() || ""}` } }
    ),
};

// Config
export const configApi = {
  list: (token?: string) => api<{ success: boolean; configs: any[] }>("/config", { headers: { Authorization: `Bearer ${token || getToken() || ""}` } }),
  get: (key: string, token?: string) => api<{ success: boolean; config: any }>(`/config/${key}`, { headers: { Authorization: `Bearer ${token || getToken() || ""}` } }),
  put: (key: string, body: { value: string; label?: string }, token?: string) =>
    api<{ success: boolean; config: any }>(`/config/${key}`, {
      method: "PUT",
      body: JSON.stringify(body),
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    }),
};

// Members
export const membersApi = {
  list: (params?: { page?: number; limit?: number; status?: string; search?: string }, token?: string) => {
    const q = new URLSearchParams();
    if (params?.page) q.set("page", String(params.page));
    if (params?.limit) q.set("limit", String(params.limit));
    if (params?.status) q.set("status", params.status);
    if (params?.search) q.set("search", params.search);
    return api<{ success: boolean; members: any[]; total: number }>(
      `/members?${q}`,
      { headers: { Authorization: `Bearer ${token || getToken() || ""}` } }
    );
  },
  get: (id: string, token?: string) =>
    api<{ success: boolean; member: any }>(`/members/${id}`, {
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    }),
  create: (body: Record<string, any>, token?: string) =>
    api<{ success: boolean; member: any }>("/members", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    }),
  update: (id: string, body: Record<string, any>, token?: string) =>
    api<{ success: boolean; member: any }>(`/members/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    }),
  kyc: {
    reinitiate: (memberId: string, token?: string) =>
      api<{ success: boolean; message: string }>(`/members/${memberId}/kyc/reinitiate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token || getToken() || ""}` },
      }),
  },
  form15: {
    get: (memberId: string, token?: string) => api<{ success: boolean; form15: { status?: string; fy?: string } }>(`/members/${memberId}/form15`, { headers: { Authorization: `Bearer ${token || getToken() || ""}` } }),
    submit: (memberId: string, body: { formType: "15G" | "15H"; fy: string }, token?: string) =>
      api<{ success: boolean; message: string }>(`/members/${memberId}/form15`, { method: "POST", body: JSON.stringify(body), headers: { Authorization: `Bearer ${token || getToken() || ""}` } }),
  },
  deathSettlement: {
    get: (memberId: string, token?: string) =>
      api<{ success: boolean; member: any; nominees: any[]; accounts: any[]; deposits: any[]; settlement: any; netPayable: number }>(
        `/members/${memberId}/death-settlement`,
        { headers: { Authorization: `Bearer ${token || getToken() || ""}` } }
      ),
    complete: (memberId: string, body: { dateOfDeath: string; nomineeId?: string }, token?: string) =>
      api<{ success: boolean; member: any; message: string }>(`/members/${memberId}/death-settlement`, {
        method: "POST",
        body: JSON.stringify(body),
        headers: { Authorization: `Bearer ${token || getToken() || ""}` },
      }),
  },
};

// Deposits (FDR/RD/MIS)
export const depositsApi = {
  list: (params?: { memberId?: string; status?: string; depositType?: string; page?: number; limit?: number }, token?: string) => {
    const q = new URLSearchParams();
    if (params?.memberId) q.set("memberId", params.memberId);
    if (params?.status) q.set("status", params.status);
    if (params?.depositType) q.set("depositType", params.depositType);
    if (params?.page) q.set("page", String(params.page || 1));
    if (params?.limit) q.set("limit", String(params.limit || 20));
    return api<{ success: boolean; deposits: any[]; total: number }>(
      `/deposits?${q}`,
      { headers: { Authorization: `Bearer ${token || getToken() || ""}` } }
    );
  },
  get: (id: string, token?: string) =>
    api<{ success: boolean; deposit: any }>(`/deposits/${id}`, {
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    }),
  create: (body: {
    memberId: string;
    depositType: "fd" | "rd" | "mis";
    principal: number;
    interestRate: number;
    tenureMonths: number;
    compoundingFreq?: "monthly" | "quarterly" | "half_yearly" | "yearly";
    rdMonthlyAmount?: number;
    form15Exempt?: boolean;
  }, token?: string) =>
    api<{ success: boolean; deposit: any }>("/deposits", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    }),
};

// SB Accounts
export const sbApi = {
  list: (params?: { memberId?: string; page?: number; limit?: number }, token?: string) => {
    const q = new URLSearchParams();
    if (params?.memberId) q.set("memberId", params.memberId);
    if (params?.page) q.set("page", String(params.page || 1));
    if (params?.limit) q.set("limit", String(params.limit || 20));
    return api<{ success: boolean; accounts: any[]; total: number }>(
      `/sb/accounts?${q}`,
      { headers: { Authorization: `Bearer ${token || getToken() || ""}` } }
    );
  },
  get: (id: string, token?: string) =>
    api<{ success: boolean; account: any }>(`/sb/accounts/${id}`, {
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    }),
  transfer: (body: { fromAccountId: string; toAccountId: string; amount: number; remarks?: string }, token?: string) =>
    api<{ success: boolean; message: string }>(`/sb/transfers`, {
      method: "POST",
      body: JSON.stringify(body),
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    }),
};


// GL / Accounting
export const glApi = {
  coa: {
    list: (token?: string) =>
      api<{ success: boolean; accounts: { id?: string; code: string; name: string; type: string; parent?: string | null; balance: number; openingBalance: number; isActive: boolean }[] }>("/gl/coa", {
        headers: { Authorization: `Bearer ${token || getToken() || ""}` },
      }),
    create: (body: { code: string; name: string; type: string; parentCode?: string }, token?: string) =>
      api<{ success: boolean; account: { id: string; code: string; name: string; type: string; parent?: string | null; balance: number; openingBalance: number; isActive: boolean } }>("/gl/coa", {
        method: "POST",
        body: JSON.stringify(body),
        headers: { Authorization: `Bearer ${token || getToken() || ""}` },
      }),
  },
  trialBalance: (params?: { period?: string; fromDate?: string; toDate?: string }, token?: string) => {
    const q = new URLSearchParams();
    if (params?.period) q.set("period", params.period);
    if (params?.fromDate) q.set("fromDate", params.fromDate);
    if (params?.toDate) q.set("toDate", params.toDate);
    return api<{ success: boolean; rows: any[]; totals: any }>(`/gl/trial-balance?${q}`, {
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    });
  },
  balanceSheet: (params?: { period?: string; fromDate?: string; toDate?: string; asOnDate?: string }, token?: string) => {
    const q = new URLSearchParams();
    if (params?.period) q.set("period", params.period);
    if (params?.fromDate) q.set("fromDate", params.fromDate);
    if (params?.toDate) q.set("toDate", params.toDate);
    if (params?.asOnDate) q.set("asOnDate", params.asOnDate);
    return api<{ success: boolean; assets: any[]; liabilities: any[]; equity: any[] }>(`/gl/balance-sheet?${q}`, {
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    });
  },
  pl: (params?: { period?: string; fromDate?: string; toDate?: string }, token?: string) => {
    const q = new URLSearchParams();
    if (params?.period) q.set("period", params.period);
    if (params?.fromDate) q.set("fromDate", params.fromDate);
    if (params?.toDate) q.set("toDate", params.toDate);
    return api<{ success: boolean; income: any[]; expenses: any[]; netProfit: number }>(`/gl/pl?${q}`, {
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    });
  },
  vouchers: {
    list: (params?: { voucherType?: string; status?: string; page?: number; limit?: number }, token?: string) => {
      const q = new URLSearchParams();
      if (params?.voucherType) q.set("voucherType", params.voucherType);
      if (params?.status) q.set("status", params.status);
      if (params?.page) q.set("page", String(params.page));
      if (params?.limit) q.set("limit", String(params.limit || 20));
      return api<{ success: boolean; vouchers: any[]; total: number }>(`/gl/vouchers?${q}`, {
        headers: { Authorization: `Bearer ${token || getToken() || ""}` },
      });
    },
    create: (body: { voucherType: string; date: string; narration?: string; totalAmount: number; entries: { glCode: string; glName: string; debit: number; credit: number; narration?: string }[] }, token?: string) =>
      api<{ success: boolean; voucher: any }>("/gl/vouchers", {
        method: "POST",
        body: JSON.stringify(body),
        headers: { Authorization: `Bearer ${token || getToken() || ""}` },
      }),
    reverse: (id: string, token?: string) =>
      api<{ success: boolean; reversal: any }>(`/gl/vouchers/${id}/reverse`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token || getToken() || ""}` },
      }),
  },
};

// Suspense ledger
export const suspenseApi = {
  list: (token?: string) =>
    api<{ success: boolean; entries: { id: string; suspenseNumber: string; amount: number; receiptDate: string; narration?: string | null; status: string; openFor: number }[] }>("/suspense", {
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    }),
  create: (body: { amount: number; receiptDate: string; narration?: string }, token?: string) =>
    api<{ success: boolean; entry: any }>("/suspense", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    }),
  clear: (id: string, body: { targetGlCode: string; targetGlName: string; clearingNote: string }, token?: string) =>
    api<{ success: boolean; entry: any }>(`/suspense/${id}/clear`, {
      method: "POST",
      body: JSON.stringify(body),
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    }),
};

// Bank reconciliation
export const bankReconApi = {
  upload: (body: { fileName: string; csvContent: string; bankName?: string }, token?: string) =>
    api<{ success: boolean; upload: { id: string; fileName: string; periodStart: string; periodEnd: string; transactionCount: number } }>("/bank-recon/upload", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    }),
  uploads: (token?: string) =>
    api<{ success: boolean; uploads: { id: string; fileName: string; bankName?: string; periodStart: string; periodEnd: string; transactionCount: number; createdAt: string }[] }>("/bank-recon/uploads", {
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    }),
  entries: (uploadId: string, token?: string) =>
    api<{
      success: boolean;
      upload: { id: string; fileName: string; periodStart: string; periodEnd: string };
      entries: { id: string; source: string; date: string; narration?: string; amount: number; type: string; status: string; confidence?: number | null }[];
    }>(`/bank-recon/entries?uploadId=${uploadId}`, {
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    }),
  match: (body: { bankEntryId: string; glEntryId: string }, token?: string) =>
    api<{ success: boolean; message: string }>("/bank-recon/match", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    }),
  run: (uploadId: string, token?: string) =>
    api<{ success: boolean; message: string; matched: number }>("/bank-recon/run", {
      method: "POST",
      body: JSON.stringify({ uploadId }),
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    }),
};

// Member Portal /me (uses member token)
export const meApi = {
  summary: (token?: string) =>
    api<{
      success: boolean;
      summary: {
        sbBalance: number;
        activeLoansCount: number;
        totalLoanOutstanding: number;
        depositsCount: number;
        totalDepositAmount: number;
        upcomingEMI: number;
        emiDueDate: string | null;
        recentTxns: any[];
      };
    }>("/me/summary", { headers: { Authorization: `Bearer ${token || getMemberToken() || ""}` } }),

  accounts: (token?: string) =>
    api<{ success: boolean; accounts: any[] }>("/me/accounts", {
      headers: { Authorization: `Bearer ${token || getMemberToken() || ""}` },
    }),

  passbook: (accountId: string, token?: string, page: number = 1, limit: number = 30) =>
    api<{ success: boolean; account: any; transactions: any[]; total: number }>(`/me/accounts/${accountId}/passbook?page=${page}&limit=${limit}`, {
      headers: { Authorization: `Bearer ${token || getMemberToken() || ""}` },
    }),

  loans: (token?: string) =>
    api<{ success: boolean; loans: any[] }>("/me/loans", {
      headers: { Authorization: `Bearer ${token || getMemberToken() || ""}` },
    }),

  loanSchedule: (loanId: string, token?: string) =>
    api<{ success: boolean; loan: any }>(`/me/loans/${loanId}/schedule`, {
      headers: { Authorization: `Bearer ${token || getMemberToken() || ""}` },
    }),

  deposits: (token?: string) =>
    api<{ success: boolean; deposits: any[] }>("/me/deposits", {
      headers: { Authorization: `Bearer ${token || getMemberToken() || ""}` },
    }),

  payLoan: (loanId: string, body: { amount: number; upiId?: string; emiId?: string }, token?: string) =>
    api<{ success: boolean; paymentRef: string; message?: string }>(`/me/loans/${loanId}/pay`, {
      method: "POST",
      body: JSON.stringify(body),
      headers: { Authorization: `Bearer ${token || getMemberToken() || ""}` },
    }),
};

// Users (tenant-scoped)
export const usersApi = {
  list: (token?: string) =>
    api<{ success: boolean; users: any[] }>("/users", { headers: { Authorization: `Bearer ${token || getToken() || ""}` } }),
  updateRole: (id: string, role: string, token?: string) =>
    api<{ success: boolean; user: any }>(`/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    }),
  toggleStatus: (id: string, status: "active" | "inactive", token?: string) =>
    api<{ success: boolean; user: any }>(`/users/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    }),
  resetPassword: (id: string, newPassword: string, token?: string) =>
    api<{ success: boolean; message: string }>(`/users/${id}/reset-password`, {
      method: "POST",
      body: JSON.stringify({ newPassword }),
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    }),
};

// Audit Log (tenant-scoped)
export const auditLogApi = {
  list: (
    params?: { search?: string; userFilter?: string; dateFrom?: string; dateTo?: string; page?: number; limit?: number },
    token?: string
  ) => {
    const q = new URLSearchParams();
    if (params?.search) q.set("search", params.search);
    if (params?.userFilter) q.set("userFilter", params.userFilter);
    if (params?.dateFrom) q.set("dateFrom", params.dateFrom);
    if (params?.dateTo) q.set("dateTo", params.dateTo);
    if (params?.page) q.set("page", String(params.page));
    if (params?.limit) q.set("limit", String(params.limit));
    return api<{
      success: boolean;
      logs: { id: string; ts: string; user: string; role: string; action: string; resource: string; detail: string; ip: string; oldData?: any; newData?: any }[];
      total: number;
      page: number;
      limit: number;
    }>(`/users/audit-log?${q}`, { headers: { Authorization: `Bearer ${token || getToken() || ""}` } });
  },
};

// Reports & BI
export const reportsApi = {
  custom: (params: { module: string; limit?: number }, token?: string) => {
    const q = new URLSearchParams();
    q.set("module", params.module);
    if (params.limit) q.set("limit", String(params.limit));
    return api<{ success: boolean; rows: any[]; total: number }>(`/reports/custom?${q}`, {
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    });
  },
  npaTrend: (token?: string) =>
    api<{
      success: boolean;
      summary: { npaRatio: number; grossNpa: number; netNpa: number; provCoverage: number };
      monthlyNPA: { month: string; total: number; sub: number; doubtful: number; loss: number }[];
      dpdBuckets: { bucket: string; count: number; outstanding: number }[];
      npaRegister: { loanId: string; member: string; type: string; outstanding: number; dpd: number; npa: string; provision: number }[];
    }>("/reports/npa-trend", { headers: { Authorization: `Bearer ${token || getToken() || ""}` } }),
  risk: (token?: string) =>
    api<{
      success: boolean;
      kpis: Record<string, string>;
      riskRadar: { subject: string; A: number }[];
      riskBuckets: { range: string; count: number; color: string }[];
      npaMonthTrend: { month: string; npa: number }[];
      highRiskMembers: { name: string; memberId: string; memberNumber: string; score: number; dpd: number; outstanding: number; flags: string[] }[];
    }>("/reports/risk", { headers: { Authorization: `Bearer ${token || getToken() || ""}` } }),
  portfolio: (token?: string) =>
    api<{
      success: boolean;
      heatmapData: { name: string; size: number; count: number; npa: number; color: string }[];
      agingData: { range: string; amount: number; count: number }[];
      kpis: { totalPortfolio: number; totalNpa: number; activeLoans: number; avgLoanSize: number };
      officerPerformance: any[];
    }>("/reports/portfolio", { headers: { Authorization: `Bearer ${token || getToken() || ""}` } }),
};

// Dashboard (tenant-scoped KPIs and recent activity)
export const dashboardApi = {
  getStats: (token?: string) =>
    api<{
      success: boolean;
      stats: { memberCount: number; activeLoansOutstanding: number; activeLoansCount: number; totalSavings: number; totalDeposits: number; memberChangePercent: number };
    }>("/dashboard/stats", { headers: { Authorization: `Bearer ${token || getToken() || ""}` } }),
  getActivity: (limit?: number, token?: string) =>
    api<{
      success: boolean;
      activities: { id: string; type: string; category: string; amount: number; memberName: string; processedAt: string; remarks?: string }[];
    }>(`/dashboard/activity${limit ? `?limit=${limit}` : ""}`, { headers: { Authorization: `Bearer ${token || getToken() || ""}` } }),
};

// Auth
export const authApi = {
  impersonate: (tenantId: string, token?: string) =>
    api<{ success: boolean; token: string; user: any }>("/auth/impersonate", {
      method: "POST",
      body: JSON.stringify({ tenantId }),
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    }),
  login: (body: { email: string; password: string; tenantId?: string }) =>
    api<{ success: boolean; token: string; user: any }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  register: (body: { email: string; password: string; name: string; role?: "superadmin" | "admin" | "staff"; tenantId?: string }, token?: string) =>
    api<{ success: boolean; user: any }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    }),
  registerTenant: (body: { email: string; password: string; adminName: string; societyName: string }) =>
    api<{ success: boolean; tenant: any; user: any }>("/auth/register-tenant", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  memberLogin: (body: { phone: string; tenantId: string }) =>
    api<{ success: boolean; token: string; member: any }>("/me/login", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  requestOtp: (body: { phone: string; tenantId: string }) =>
    api<{ success: boolean; message: string }>("/me/request-otp", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  verifyOtp: (body: { phone: string; tenantId: string; otp: string }) =>
    api<{ success: boolean; token: string; member: any }>("/me/verify-otp", {
      method: "POST",
      body: JSON.stringify(body),
    }),
};

// Tenant MDA config (MT-003 - tenant admin)
export const tenantMdaApi = {
  get: (token?: string) =>
    api<{ success: boolean; mda: any }>("/config/mda", {
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    }),
  put: (body: { fdrTdsRate?: number; minorAge?: number; loanProvisionMap?: Record<string, number> }, token?: string) =>
    api<{ success: boolean; mda: any }>("/config/mda", {
      method: "PUT",
      body: JSON.stringify(body),
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    }),
  getVersions: (token?: string) =>
    api<{ success: boolean; versions: any[] }>("/config/mda/versions", {
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    }),
  rollback: (versionId: string, token?: string) =>
    api<{ success: boolean; mda: any; message: string }>(`/config/mda/rollback/${versionId}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    }),
};

// Governance (Module 2)
export const governanceApi = {
  bod: { list: (t?: string) => api<{ success: boolean; directors: any[] }>("/governance/bod", { headers: { Authorization: `Bearer ${t || getToken() || ""}` } }), create: (b: any, t?: string) => api<{ success: boolean; director: any }>("/governance/bod", { method: "POST", body: JSON.stringify(b), headers: { Authorization: `Bearer ${t || getToken() || ""}` } }) },
  committees: { list: (t?: string) => api<{ success: boolean; committees: any[] }>("/governance/committees", { headers: { Authorization: `Bearer ${t || getToken() || ""}` } }), create: (b: any, t?: string) => api<{ success: boolean; committee: any }>("/governance/committees", { method: "POST", body: JSON.stringify(b), headers: { Authorization: `Bearer ${t || getToken() || ""}` } }) },
  agm: { list: (t?: string) => api<{ success: boolean; agms: any[] }>("/governance/agm", { headers: { Authorization: `Bearer ${t || getToken() || ""}` } }), create: (b: any, t?: string) => api<{ success: boolean; agm: any }>("/governance/agm", { method: "POST", body: JSON.stringify(b), headers: { Authorization: `Bearer ${t || getToken() || ""}` } }) },
  resolutions: { list: (p?: { search?: string; status?: string }, t?: string) => { const q = new URLSearchParams(); if (p?.search) q.set("search", p.search); if (p?.status) q.set("status", p.status); return api<{ success: boolean; resolutions: any[] }>(`/governance/resolutions?${q}`, { headers: { Authorization: `Bearer ${t || getToken() || ""}` } }); }, create: (b: any, t?: string) => api<{ success: boolean; resolution: any }>("/governance/resolutions", { method: "POST", body: JSON.stringify(b), headers: { Authorization: `Bearer ${t || getToken() || ""}` } }) },
  complianceEvents: { list: (p?: { from?: string; to?: string }, t?: string) => { const q = new URLSearchParams(); if (p?.from) q.set("from", p.from); if (p?.to) q.set("to", p.to); return api<{ success: boolean; events: any[] }>(`/governance/compliance-events?${q}`, { headers: { Authorization: `Bearer ${t || getToken() || ""}` } }); }, create: (b: any, t?: string) => api<{ success: boolean; event: any }>("/governance/compliance-events", { method: "POST", body: JSON.stringify(b), headers: { Authorization: `Bearer ${t || getToken() || ""}` } }) },
};

// Compliance (Module 10)
export const complianceApi = {
  nabard: (period?: string, t?: string) => api<{ success: boolean; report: any }>(`/compliance/nabard-report${period ? `?period=${period}` : ""}`, { headers: { Authorization: `Bearer ${t || getToken() || ""}` } }),
  tds26q: (quarter?: string, t?: string) => api<{ success: boolean; report: any }>(`/compliance/tds-26q${quarter ? `?quarter=${quarter}` : ""}`, { headers: { Authorization: `Bearer ${t || getToken() || ""}` } }),
  str: (from?: string, to?: string, t?: string) => { const q = new URLSearchParams(); if (from) q.set("from", from); if (to) q.set("to", to); return api<{ success: boolean; report: any }>(`/compliance/str?${q}`, { headers: { Authorization: `Bearer ${t || getToken() || ""}` } }); },
  aml: (from?: string, t?: string) => api<{ success: boolean; report: any }>(`/compliance/aml${from ? `?from=${from}` : ""}`, { headers: { Authorization: `Bearer ${t || getToken() || ""}` } }),
};

// AI Alerts (Bytez-powered)
export const aiAlertsApi = {
  list: (token?: string) =>
    api<{ success: boolean; alerts: any[] }>("/ai/alerts", {
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    }),
  acknowledge: (id: string, token?: string) =>
    api<{ success: boolean; id: string; status: string }>(`/ai/alerts/${id}/acknowledge`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    }),
  dismiss: (id: string, token?: string) =>
    api<{ success: boolean; id: string; status: string }>(`/ai/alerts/${id}/dismiss`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    }),
  escalate: (id: string, token?: string) =>
    api<{ success: boolean; id: string; status: string }>(`/ai/alerts/${id}/escalate`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    }),
};

// AI Cash Flow (Bytez-powered)
export const cashFlowApi = {
  get: (period?: 30 | 60 | 90, token?: string) => {
    const q = period ? `?period=${period}` : "";
    return api<{
      success: boolean;
      period: number;
      forecast: { date: string; optimistic: number; base: number; pessimistic: number; confidence: number }[];
      kpis: { projectedInflow: number; projectedOutflow: number; netPosition: number; liquidityRatio: number };
      aiInsights: string[];
    }>(`/ai/cash-flow${q}`, {
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    });
  },
};

// Approvals (aggregate vouchers + loan applications)
export const approvalsApi = {
  list: (params?: { status?: "pending" | "approved" | "rejected" | "all" }, token?: string) => {
    const q = new URLSearchParams();
    if (params?.status) q.set("status", params.status);
    return api<{
      success: boolean;
      approvals: any[];
      pending: any[];
      approved: any[];
      rejected: any[];
      escalated: any[];
    }>(`/approvals${q.toString() ? `?${q}` : ""}`, {
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    });
  },
  approveVoucher: (id: string, body?: { comments?: string }, token?: string) =>
    api<{ success: boolean; voucher: any }>(`/approvals/voucher/${id}/approve`, {
      method: "POST",
      body: JSON.stringify(body || {}),
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    }),
  rejectVoucher: (id: string, body?: { reason?: string }, token?: string) =>
    api<{ success: boolean; voucher: any }>(`/approvals/voucher/${id}/reject`, {
      method: "POST",
      body: JSON.stringify(body || {}),
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    }),
  approveLoan: (id: string, body?: { comments?: string }, token?: string) =>
    api<{ success: boolean; application: any }>(`/approvals/loan/${id}/approve`, {
      method: "POST",
      body: JSON.stringify(body || {}),
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    }),
  rejectLoan: (id: string, body?: { reason?: string }, token?: string) =>
    api<{ success: boolean; application: any }>(`/approvals/loan/${id}/reject`, {
      method: "POST",
      body: JSON.stringify(body || {}),
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    }),
};

// Loans
export const loansApi = {
  get: (id: string, token?: string) =>
    api<{ success: boolean; loan: any }>(`/loans/${id}`, {
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    }),
  eligibility: (memberId: string, token?: string) =>
    api<{ success: boolean; eligibility: any; ruleVersion: string }>(`/loans/eligibility/${memberId}`, { headers: { Authorization: `Bearer ${token || getToken() || ""}` } }),
  list: (params?: { status?: string; memberId?: string; page?: number; limit?: number }, token?: string) => {
    const q = new URLSearchParams();
    if (params?.status) q.set("status", params.status || "");
    if (params?.memberId) q.set("memberId", params.memberId);
    if (params?.page) q.set("page", String(params.page || 1));
    if (params?.limit) q.set("limit", String(params.limit || 20));
    return api<{ success: boolean; loans: any[]; total: number }>(
      `/loans?${q}`,
      { headers: { Authorization: `Bearer ${token || getToken() || ""}` } }
    );
  },
  applications: (params?: { status?: string }, token?: string) => {
    const q = new URLSearchParams();
    if (params?.status) q.set("status", params.status || "");
    return api<{ success: boolean; applications: any[]; total: number }>(
      `/loans/applications?${q}`,
      { headers: { Authorization: `Bearer ${token || getToken() || ""}` } }
    );
  },
  createApplication: (body: Record<string, any>, token?: string) =>
    api<{ success: boolean; application: any }>("/loans/applications", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    }),
  writeOff: (id: string, body: { writeOffAmount: number; remarks?: string }, token?: string) =>
    api<{ success: boolean; loan: any }>(`/loans/${id}/write-off`, {
      method: "POST",
      body: JSON.stringify(body),
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    }),
};
