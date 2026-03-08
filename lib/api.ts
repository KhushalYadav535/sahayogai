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
  if (!res.ok) {
    const zodMsg =
      Array.isArray((data as any)?.errors)
        ? ((data as any).errors as any[])
            .map((e: any) => `${(e.path || []).join(".") || "body"}: ${e.message}`)
            .join("; ")
        : null;
    const msg = zodMsg || (data as any)?.message || res.statusText || "Request failed";
    throw new Error(msg);
  }
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

export function getMemberToken(): string | null {
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
  updateStatus: (id: string, status: "trial" | "active" | "suspended" | "inactive" | "reactivated" | "offboarded", reason?: string, token?: string) =>
    api<{ success: boolean; tenant: any }>(`/platform/tenants/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, reason }),
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    }),
  updatePlan: (id: string, plan: "starter" | "pro" | "enterprise", token?: string) =>
    api<{ success: boolean; tenant: any }>(`/platform/tenants/${id}/plan`, {
      method: "PATCH",
      body: JSON.stringify({ plan }),
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    }),
  getTrialStatus: (id: string, token?: string) =>
    api<{ success: boolean; trial: { isTrial: boolean; trialEndsAt: string | null; daysRemaining: number; isExpired: boolean; shouldTransition: boolean } }>(`/platform/tenants/${id}/trial-status`, {
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
  checkTrialExpiration: (token?: string) =>
    api<{ success: boolean; message: string; transitioned: number }>("/jobs/trial-expiration-check", {
      method: "POST",
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
  // MEM-007: Member Ledger
  getLedger: (id: string, params?: { startDate?: string; endDate?: string; accountType?: string; transactionType?: string; minAmount?: string; maxAmount?: string }, token?: string) => {
    const q = new URLSearchParams();
    if (params?.startDate) q.set("startDate", params.startDate);
    if (params?.endDate) q.set("endDate", params.endDate);
    if (params?.accountType) q.set("accountType", params.accountType);
    if (params?.transactionType) q.set("transactionType", params.transactionType);
    if (params?.minAmount) q.set("minAmount", params.minAmount);
    if (params?.maxAmount) q.set("maxAmount", params.maxAmount);
    return api<{ success: boolean; member: any; ledger: any[]; total: number }>(
      `/members/${id}/ledger?${q}`,
      { headers: { Authorization: `Bearer ${token || getToken() || ""}` } }
    );
  },
  // MEM-012: Joint Membership
  linkJoint: (id: string, body: { jointMemberId: string; jointMode: "EITHER_OR_SURVIVOR" | "JOINTLY" }, token?: string) =>
    api<{ success: boolean; message: string }>(`/members/${id}/joint-link`, {
      method: "POST",
      body: JSON.stringify(body),
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    }),
  unlinkJoint: (id: string, token?: string) =>
    api<{ success: boolean; message: string }>(`/members/${id}/joint-unlink`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    }),
  // MEM-014: KYC Re-validation
  revalidateKyc: (id: string, token?: string) =>
    api<{ success: boolean; message: string }>(`/members/${id}/kyc/revalidate`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    }),
  // MEM-016: Share Transfer
  transferShares: (id: string, body: { targetMemberId: string; shares: number; faceValue: number; resolutionRef: string; remarks?: string }, token?: string) =>
    api<{ success: boolean; message: string; transfer: any }>(`/members/${id}/shares/transfer`, {
      method: "POST",
      body: JSON.stringify(body),
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    }),
  // MEM-017: Suspension & Blacklisting
  suspend: (id: string, body: { reasonCode: string; remarks?: string }, token?: string) =>
    api<{ success: boolean; message: string; member: any }>(`/members/${id}/suspend`, {
      method: "POST",
      body: JSON.stringify(body),
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    }),
  blacklist: (id: string, body: { reasonCode: string; remarks?: string }, token?: string) =>
    api<{ success: boolean; message: string; member: any }>(`/members/${id}/blacklist`, {
      method: "POST",
      body: JSON.stringify(body),
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    }),
  reactivate: (id: string, token?: string) =>
    api<{ success: boolean; message: string; member: any }>(`/members/${id}/reactivate`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    }),
  // MEM-018: Bulk Import
  bulkImport: (body: { members: Array<Record<string, any>> }, token?: string) =>
    api<{ success: boolean; imported: number; failed: number; results: any[]; errors: any[] }>("/members/bulk-import", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    }),
  getBulkImportTemplate: (token?: string) => {
    return fetch(`${API_BASE}/members/bulk-import/template`, {
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    }).then(res => {
      if (!res.ok) throw new Error('Failed to fetch template');
      return res.blob();
    });
  },
  // MEM-019: Membership Certificate
  getCertificate: (id: string, token?: string) => {
    return fetch(`${API_BASE}/members/${id}/certificate`, {
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    }).then(res => {
      if (!res.ok) throw new Error('Failed to fetch certificate');
      return res.text();
    });
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
  mature: (id: string, token?: string) =>
    api<{ success: boolean; principal: number; totalInterest: number; tdsDeducted: number; netPayable: number }>(`/deposits/${id}/mature`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    }),
  getMaturing: (days?: number, token?: string) => {
    const q = new URLSearchParams();
    if (days) q.set("days", String(days));
    return api<{ success: boolean; deposits: any[] }>(
      `/deposits/maturing?${q}`,
      { headers: { Authorization: `Bearer ${token || getToken() || ""}` } }
    );
  },
  getCertificate: (id: string, token?: string) => {
    return fetch(`${API_BASE}/deposits/${id}/certificate`, {
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    }).then(res => {
      if (!res.ok) throw new Error('Failed to fetch certificate');
      return res.blob();
    });
  },
  withdraw: (id: string, token?: string) =>
    api<{ success: boolean; principal: number; holdingMonths: number; penaltyRate: number; penalizedRate: number; totalInterest: number; tdsDeducted: number; netPayable: number }>(`/deposits/${id}/withdraw`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    }),
  lien: (id: string, body: { loanId?: string; action: "mark" | "clear" }, token?: string) =>
    api<{ success: boolean; message: string }>(`/deposits/${id}/lien`, {
      method: "POST",
      body: JSON.stringify(body),
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    }),
  mature: (id: string, body?: { action?: "credit_to_sb" | "auto_renew" | "manual" }, token?: string) =>
    api<{ success: boolean; message: string; principal?: number; totalInterest?: number; tdsDeducted?: number; netPayable?: number; newDeposit?: any }>(`/deposits/${id}/mature`, {
      method: "POST",
      body: JSON.stringify(body || {}),
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    }),
  getAnalytics: (params?: { startDate?: string; endDate?: string }, token?: string) => {
    const q = new URLSearchParams();
    if (params?.startDate) q.set("startDate", params.startDate);
    if (params?.endDate) q.set("endDate", params.endDate);
    return api<{ success: boolean; analytics: any }>(
      `/deposits/analytics/portfolio?${q}`,
      { headers: { Authorization: `Bearer ${token || getToken() || ""}` } }
    );
  },
  getForm16A: (id: string, token?: string) => {
    return fetch(`${API_BASE}/deposits/form16a/${id}`, {
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    }).then(res => {
      if (!res.ok) throw new Error('Failed to fetch Form 16A');
      return res.blob();
    });
  },
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
  create: (body: {
    memberId: string;
    openingDeposit: number;
    interestRate?: number;
    operationMode?: string;
    nominee?: string;
  }, token?: string) =>
    api<{ success: boolean; account: any; message?: string }>("/sb/accounts", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    }),
  transfer: (body: { fromAccountId: string; toAccountId: string; amount: number; remarks?: string }, token?: string) =>
    api<{ success: boolean; message: string }>(`/sb/transfers`, {
      method: "POST",
      body: JSON.stringify(body),
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    }),
  deposit: (id: string, body: { amount: number; remarks?: string }, token?: string) =>
    api<{ success: boolean; account: any; transaction: any; message?: string }>(`/sb/accounts/${id}/deposit`, {
      method: "POST",
      body: JSON.stringify(body),
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    }),
  withdraw: (id: string, body: { amount: number; remarks?: string }, token?: string) =>
    api<{ success: boolean; account: any; transaction: any; message?: string }>(`/sb/accounts/${id}/withdraw`, {
      method: "POST",
      body: JSON.stringify(body),
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    }),
  getPassbook: (id: string, params?: { page?: number; limit?: number; startDate?: string; endDate?: string; format?: string; language?: string }, token?: string) => {
    const q = new URLSearchParams();
    if (params?.page) q.set("page", String(params.page));
    if (params?.limit) q.set("limit", String(params.limit));
    if (params?.startDate) q.set("startDate", params.startDate);
    if (params?.endDate) q.set("endDate", params.endDate);
    if (params?.format) q.set("format", params.format);
    if (params?.language) q.set("language", params.language);
    if (params?.format === "pdf" || params?.format === "excel") {
      return fetch(`${API_BASE}/sb/accounts/${id}/passbook?${q}`, {
        headers: { Authorization: `Bearer ${token || getToken() || ""}` },
      }).then(res => {
        if (!res.ok) throw new Error('Failed to fetch passbook');
        return params.format === "pdf" ? res.text() : res.blob();
      });
    }
    return api<{ success: boolean; transactions: any[]; total: number; account: any }>(
      `/sb/accounts/${id}/passbook?${q}`,
      { headers: { Authorization: `Bearer ${token || getToken() || ""}` } }
    );
  },
  reactivate: (id: string, token?: string) =>
    api<{ success: boolean; message: string; accountNumber: string }>(`/sb/accounts/${id}/reactivate`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    }),
  // SB-008: Bulk Dividend Credit
  bulkDividendCredit: (body: { dividendRate: number; resolutionRef: string; fiscalYear: string }, token?: string) =>
    api<{ success: boolean; message: string; dividendRate: number; resolutionRef: string; fiscalYear: string; totalCredited: number; totalFailed: number; results: any[]; errors: any[] }>("/sb/dividend/bulk-credit", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    }),
  // SB-011: AI Interest Anomaly Detection
  checkInterestAnomaly: (body: { accountId: string; expectedInterest: number; actualInterest: number; period: string }, token?: string) =>
    api<{ success: boolean; anomaly: boolean; message: string; deviationPercent?: number; expectedInterest?: number; actualInterest?: number }>("/sb/interest/anomaly-check", {
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
    upload: async (file: File, token?: string): Promise<{ success: boolean; message: string; results?: { total: number; created: number; updated: number; skipped: number; errors: Array<{ code: string; error: string }> }; errors?: Array<{ row: number; error: string }> }> => {
      const formData = new FormData();
      formData.append("file", file);
      const authToken = token || getToken() || "";
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/v1/gl/coa/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${authToken}` },
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Upload failed");
      }
      return data;
    },
  },
  trialBalance: (params?: { period?: string; fromDate?: string; toDate?: string; excludeAuditAdj?: boolean }, token?: string) => {
    const q = new URLSearchParams();
    if (params?.period) q.set("period", params.period);
    if (params?.fromDate) q.set("fromDate", params.fromDate);
    if (params?.toDate) q.set("toDate", params.toDate);
    if (params?.excludeAuditAdj) q.set("excludeAuditAdj", "true");
    return api<{ success: boolean; rows: any[]; totals: any; period?: string; isFrozen?: boolean; frozenAt?: string | null }>(`/gl/trial-balance?${q}`, {
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
    // AI-005: Auto-Ledger Classification
    suggestClassification: (body: { narration: string }, token?: string) =>
      api<{ success: boolean; suggestion: { glCode: string; glName: string; confidence: number } | null }>("/gl/suggest-classification", {
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

  // MP-004: FDR Maturity Tracker
  maturityTracker: (days?: number, token?: string) =>
    api<{ success: boolean; deposits: any[]; total: number }>(`/me/deposits/maturity-tracker?days=${days || 30}`, {
      headers: { Authorization: `Bearer ${token || getMemberToken() || ""}` },
    }),

  // MP-009: Share Certificate
  shareCertificate: (token?: string) =>
    api<{ success: boolean; member: any; totalShares: number; totalShareValue: number; shareLedger: any[] }>("/me/shares/certificate", {
      headers: { Authorization: `Bearer ${token || getMemberToken() || ""}` },
    }),

  // MP-008: Grievance Submission
  submitGrievance: (body: { category: string; subject: string; description: string; priority?: "low" | "medium" | "high" }, token?: string) =>
    api<{ success: boolean; grievanceRef: string; message?: string }>("/me/grievance", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { Authorization: `Bearer ${token || getMemberToken() || ""}` },
    }),

  // MP-007: Notification Preferences
  getNotificationPreferences: (token?: string) =>
    api<{ success: boolean; preferences: any }>("/me/notifications/preferences", {
      headers: { Authorization: `Bearer ${token || getMemberToken() || ""}` },
    }),

  updateNotificationPreferences: (preferences: any, token?: string) =>
    api<{ success: boolean; preferences: any; message?: string }>("/me/notifications/preferences", {
      method: "PUT",
      body: JSON.stringify(preferences),
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
  directorKpi: (token?: string) =>
    api<{
      success: boolean;
      kpis: Array<{ name: string; value: string; formula: string; status: 'GREEN' | 'AMBER' | 'RED'; trend?: string; variance?: string }>;
    }>("/reports/director-kpi", { headers: { Authorization: `Bearer ${token || getToken() || ""}` } }),
  memberAnalytics: (token?: string) =>
    api<{
      success: boolean;
      summary: { totalMembers: number; activeMembers: number; newMembersThisWeek: number; newMembersThisMonth: number; growthRate: string };
      byStatus: Array<{ status: string; count: number }>;
      byGender: Array<{ gender: string; count: number }>;
      byAgeGroup: Array<{ range: string; count: number }>;
      kycStatus: Array<{ status: string; count: number }>;
      topMembersBySavings: Array<{ memberName: string; memberNumber: string; balance: number }>;
      topMembersByLoans: Array<{ memberName: string; memberNumber: string; outstanding: number }>;
    }>("/reports/member-analytics", { headers: { Authorization: `Bearer ${token || getToken() || ""}` } }),
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
  changePassword: (body: { currentPassword: string; newPassword: string }, token?: string) =>
    api<{ success: boolean; message: string }>("/auth/change-password", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
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
  bod: {
    list: (t?: string) => api<{ success: boolean; data: any[] }>("/governance/bod", { headers: { Authorization: `Bearer ${t || getToken() || ""}` } }),
    create: (b: any, t?: string) => api<{ success: boolean; data: any }>("/governance/bod", { method: "POST", body: JSON.stringify(b), headers: { Authorization: `Bearer ${t || getToken() || ""}` } }),
  },
  committees: {
    list: (t?: string) => api<{ success: boolean; data: any[] }>("/governance/committees", { headers: { Authorization: `Bearer ${t || getToken() || ""}` } }),
    create: (b: any, t?: string) => api<{ success: boolean; data: any }>("/governance/committees", { method: "POST", body: JSON.stringify(b), headers: { Authorization: `Bearer ${t || getToken() || ""}` } }),
  },
  agm: {
    list: (t?: string) => api<{ success: boolean; data: any[] }>("/governance/agm", { headers: { Authorization: `Bearer ${t || getToken() || ""}` } }),
    create: (b: any, t?: string) => api<{ success: boolean; data: any }>("/governance/agm", { method: "POST", body: JSON.stringify(b), headers: { Authorization: `Bearer ${t || getToken() || ""}` } }),
    recordAttendance: (id: string, body: { attendance: any[] }, t?: string) => api<{ success: boolean; message: string }>(`/governance/agm/${id}/attendance`, { method: "POST", body: JSON.stringify(body), headers: { Authorization: `Bearer ${t || getToken() || ""}` } }),
    sendNotice: (id: string, t?: string) => api<{ success: boolean; message: string }>(`/governance/agm/${id}/send-notice`, { method: "POST", headers: { Authorization: `Bearer ${t || getToken() || ""}` } }),
  },
  resolutions: {
    list: (p?: { search?: string; status?: string; meetingType?: string; startDate?: string; endDate?: string }, t?: string) => {
      const q = new URLSearchParams();
      if (p?.search) q.set("search", p.search);
      if (p?.status) q.set("status", p.status);
      if (p?.meetingType) q.set("meetingType", p.meetingType);
      if (p?.startDate) q.set("startDate", p.startDate);
      if (p?.endDate) q.set("endDate", p.endDate);
      return api<{ success: boolean; data: any[]; total: number }>(`/governance/resolutions?${q}`, { headers: { Authorization: `Bearer ${t || getToken() || ""}` } });
    },
    create: (b: any, t?: string) => api<{ success: boolean; data: any }>("/governance/resolutions", { method: "POST", body: JSON.stringify(b), headers: { Authorization: `Bearer ${t || getToken() || ""}` } }),
  },
  complianceEvents: {
    list: (p?: { from?: string; to?: string }, t?: string) => {
      const q = new URLSearchParams();
      if (p?.from) q.set("from", p.from);
      if (p?.to) q.set("to", p.to);
      return api<{ success: boolean; data: any[] }>(`/governance/compliance-events?${q}`, { headers: { Authorization: `Bearer ${t || getToken() || ""}` } });
    },
    create: (b: any, t?: string) => api<{ success: boolean; data: any }>("/governance/compliance-events", { method: "POST", body: JSON.stringify(b), headers: { Authorization: `Bearer ${t || getToken() || ""}` } }),
  },
  // GOV-006: By-law Repository
  bylaws: {
    list: (t?: string) => api<{ success: boolean; data: any[] }>("/governance/bylaws", { headers: { Authorization: `Bearer ${t || getToken() || ""}` } }),
    create: (b: any, t?: string) => api<{ success: boolean; data: any }>("/governance/bylaws", { method: "POST", body: JSON.stringify(b), headers: { Authorization: `Bearer ${t || getToken() || ""}` } }),
  },
  // GOV-007: Meeting Minutes & Action Items
  minutes: {
    create: (meetingId: string, body: any, t?: string) => api<{ success: boolean; data: any }>(`/governance/meetings/${meetingId}/minutes`, { method: "POST", body: JSON.stringify(body), headers: { Authorization: `Bearer ${t || getToken() || ""}` } }),
    list: (meetingId: string, t?: string) => api<{ success: boolean; data: any[] }>(`/governance/meetings/${meetingId}/minutes`, { headers: { Authorization: `Bearer ${t || getToken() || ""}` } }),
    finalize: (id: string, t?: string) => api<{ success: boolean; data: any }>(`/governance/minutes/${id}/finalize`, { method: "POST", headers: { Authorization: `Bearer ${t || getToken() || ""}` } }),
    updateActionItem: (minutesId: string, itemId: string, body: { status: string }, t?: string) => api<{ success: boolean; message: string }>(`/governance/action-items/${minutesId}/${itemId}`, { method: "PATCH", body: JSON.stringify(body), headers: { Authorization: `Bearer ${t || getToken() || ""}` } }),
  },
  // GOV-010: Exception Override Tracking
  overrides: {
    list: (p?: { transactionType?: string; startDate?: string; endDate?: string }, t?: string) => {
      const q = new URLSearchParams();
      if (p?.transactionType) q.set("transactionType", p.transactionType);
      if (p?.startDate) q.set("startDate", p.startDate);
      if (p?.endDate) q.set("endDate", p.endDate);
      return api<{ success: boolean; data: any[]; total: number }>(`/governance/approvals/overrides?${q}`, { headers: { Authorization: `Bearer ${t || getToken() || ""}` } });
    },
    create: (body: any, t?: string) => api<{ success: boolean; data: any }>("/governance/approvals/override", { method: "POST", body: JSON.stringify(body), headers: { Authorization: `Bearer ${t || getToken() || ""}` } }),
  },
  // GOV-008: Maker-Checker Threshold Configuration
  thresholds: {
    list: (p?: { transactionType?: string }, t?: string) => {
      const q = new URLSearchParams();
      if (p?.transactionType) q.set("transactionType", p.transactionType);
      return api<{ success: boolean; data: any[] }>(`/governance/approval-thresholds?${q}`, { headers: { Authorization: `Bearer ${t || getToken() || ""}` } });
    },
    create: (body: any, t?: string) => api<{ success: boolean; data: any }>("/governance/approval-thresholds", { method: "POST", body: JSON.stringify(body), headers: { Authorization: `Bearer ${t || getToken() || ""}` } }),
  },
};

// Compliance (Module 10)
export const complianceApi = {
  // COM-001: NABARD Report
  nabard: (period?: string, t?: string) => api<{ success: boolean; report: any }>(`/compliance/nabard-report${period ? `?period=${period}` : ""}`, { headers: { Authorization: `Bearer ${t || getToken() || ""}` } }),
  // COM-002: Registrar Return
  registrarReturn: (fy?: string, t?: string) => api<{ success: boolean; report: any }>(`/compliance/registrar-return${fy ? `?fy=${fy}` : ""}`, { headers: { Authorization: `Bearer ${t || getToken() || ""}` } }),
  // COM-003: TDS 26Q
  tds26q: (quarter?: string, t?: string) => api<{ success: boolean; report: any }>(`/compliance/tds-26q${quarter ? `?quarter=${quarter}` : ""}`, { headers: { Authorization: `Bearer ${t || getToken() || ""}` } }),
  tdsRecords: (fy?: string, t?: string) => api<{ success: boolean; records: any[]; summary: any }>(`/compliance/tds-records${fy ? `?fy=${fy}` : ""}`, { headers: { Authorization: `Bearer ${t || getToken() || ""}` } }),
  tdsQuarterly: (fy?: string, t?: string) => api<{ success: boolean; quarterly: any[]; fy: string }>(`/compliance/tds-quarterly${fy ? `?fy=${fy}` : ""}`, { headers: { Authorization: `Bearer ${t || getToken() || ""}` } }),
  generateTdsCertificates: (fy?: string, t?: string) => api<{ success: boolean; certificates: any[]; message: string }>("/compliance/tds-certificates", {
    method: "POST",
    body: JSON.stringify({ fy }),
    headers: { Authorization: `Bearer ${t || getToken() || ""}` },
  }),
  // COM-004: 26AS/AIS
  a26asAis: (params?: { fy?: string; pan?: string }, t?: string) => {
    const q = new URLSearchParams();
    if (params?.fy) q.set("fy", params.fy);
    if (params?.pan) q.set("pan", params.pan);
    return api<{ success: boolean; format: string; financialYear: string; records: any[]; totalRecords: number; totalTDS: number; generatedAt: string }>(`/compliance/26as-ais?${q}`, { headers: { Authorization: `Bearer ${t || getToken() || ""}` } });
  },
  // COM-005: STR
  str: (from?: string, to?: string, t?: string) => { const q = new URLSearchParams(); if (from) q.set("from", from); if (to) q.set("to", to); return api<{ success: boolean; report: any }>(`/compliance/str?${q}`, { headers: { Authorization: `Bearer ${t || getToken() || ""}` } }); },
  // COM-006: AML
  aml: (from?: string, t?: string) => api<{ success: boolean; report: any }>(`/compliance/aml${from ? `?from=${from}` : ""}`, { headers: { Authorization: `Bearer ${t || getToken() || ""}` } }),
  // COM-007: Compliance Dashboard
  dashboard: (t?: string) => api<{ success: boolean; dashboard: any }>("/compliance/dashboard", { headers: { Authorization: `Bearer ${t || getToken() || ""}` } }),
  // COM-008: Member Due Report
  memberDueReport: (params?: { memberId?: string; status?: string }, t?: string) => {
    const q = new URLSearchParams();
    if (params?.memberId) q.set("memberId", params.memberId);
    if (params?.status) q.set("status", params.status);
    return api<{ success: boolean; report: any }>(`/compliance/member-due-report?${q}`, { headers: { Authorization: `Bearer ${t || getToken() || ""}` } });
  },
  // COM-009: Member Ledger
  memberLedger: (params: { memberId: string; from?: string; to?: string }, t?: string) => {
    const q = new URLSearchParams();
    q.set("memberId", params.memberId);
    if (params.from) q.set("from", params.from);
    if (params.to) q.set("to", params.to);
    return api<{ success: boolean; report: any }>(`/compliance/member-ledger?${q}`, { headers: { Authorization: `Bearer ${t || getToken() || ""}` } });
  },
  // COM-010: Member List
  memberList: (params?: { status?: string; format?: string }, t?: string) => {
    const q = new URLSearchParams();
    if (params?.status) q.set("status", params.status);
    if (params?.format) q.set("format", params.format);
    return api<{ success: boolean; report: any }>(`/compliance/member-list?${q}`, { headers: { Authorization: `Bearer ${t || getToken() || ""}` } });
  },
  // COM-011: Audit Support Package
  auditSupportPackage: (fy?: string, t?: string) => api<{ success: boolean; package: any }>(`/compliance/audit-support-package${fy ? `?fy=${fy}` : ""}`, { headers: { Authorization: `Bearer ${t || getToken() || ""}` } }),
  // COM-012: SLR/CRR Report
  slrCrrReport: (month?: string, t?: string) => api<{ success: boolean; report: any }>(`/compliance/slr-crr-report${month ? `?month=${month}` : ""}`, { headers: { Authorization: `Bearer ${t || getToken() || ""}` } }),
  // COM-013: GST Invoice
  gstInvoice: (params: { transactionId: string; type: string }, t?: string) => {
    const q = new URLSearchParams();
    q.set("transactionId", params.transactionId);
    q.set("type", params.type);
    return api<{ success: boolean; invoice: any; format: string; generatedAt: string }>(`/compliance/gst-invoice?${q}`, { headers: { Authorization: `Bearer ${t || getToken() || ""}` } });
  },
  // COM-014: Loan Schedule Report
  loanScheduleReport: (params?: { loanId?: string; status?: string }, t?: string) => {
    const q = new URLSearchParams();
    if (params?.loanId) q.set("loanId", params.loanId);
    if (params?.status) q.set("status", params.status);
    return api<{ success: boolean; report: any }>(`/compliance/loan-schedule-report?${q}`, { headers: { Authorization: `Bearer ${t || getToken() || ""}` } });
  },
  // COM-015: Deposit Maturity Schedule
  depositMaturitySchedule: (params?: { from?: string; to?: string; depositType?: string }, t?: string) => {
    const q = new URLSearchParams();
    if (params?.from) q.set("from", params.from);
    if (params?.to) q.set("to", params.to);
    if (params?.depositType) q.set("depositType", params.depositType);
    return api<{ success: boolean; report: any }>(`/compliance/deposit-maturity-schedule?${q}`, { headers: { Authorization: `Bearer ${t || getToken() || ""}` } });
  },
  // COM-016: Regulatory Notifications
  regulatoryNotifications: (unread?: boolean, t?: string) => {
    const q = new URLSearchParams();
    if (unread) q.set("unread", "true");
    return api<{ success: boolean; notifications: any[]; unreadCount: number }>(`/compliance/regulatory-notifications?${q}`, { headers: { Authorization: `Bearer ${t || getToken() || ""}` } });
  },
  // COM-017: Income Tax Exports
  incomeTaxExports: (params?: { fy?: string; format?: string; memberId?: string }, t?: string) => {
    const q = new URLSearchParams();
    if (params?.fy) q.set("fy", params.fy);
    if (params?.format) q.set("format", params.format);
    if (params?.memberId) q.set("memberId", params.memberId);
    return api<{ success: boolean; export: any }>(`/compliance/income-tax-exports?${q}`, { headers: { Authorization: `Bearer ${t || getToken() || ""}` } });
  },
};

// AI Alerts (Bytez-powered)
export const aiApi = {
  // LN-019: Predictive NPA Alerts
  npaPredictiveAlerts: (token?: string) =>
    api<{ success: boolean; alerts: any[]; totalAlerts: number; highRiskCount: number; mediumRiskCount: number }>("/ai/npa-predictive-alerts", {
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    }),
  // AI-009: Compliance Monitoring Alerts
  complianceAlerts: (token?: string) =>
    api<{ success: boolean; alerts: any[]; totalAlerts: number }>("/ai/compliance-alerts", {
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    }),
  // AI-012: Conversational AI
  chat: (body: { query: string; memberId?: string }, token?: string) =>
    api<{ success: boolean; response: string; responseType: string; timestamp: string }>("/ai/chat", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    }),
  // AI-015: Model Versioning
  models: {
    list: (token?: string) =>
      api<{ success: boolean; models: any[] }>("/ai/models", {
        headers: { Authorization: `Bearer ${token || getToken() || ""}` },
      }),
    rollback: (body: { modelId: string; targetVersion: string }, token?: string) =>
      api<{ success: boolean; message: string }>("/ai/models/rollback", {
        method: "POST",
        body: JSON.stringify(body),
        headers: { Authorization: `Bearer ${token || getToken() || ""}` },
      }),
    // AI-019: Performance Monitoring
    performance: (modelId: string, params?: { period?: string }, token?: string) => {
      const q = new URLSearchParams();
      if (params?.period) q.set("period", params.period);
      return api<{
        success: boolean;
        modelId: string;
        period: string;
        activeVersion: string;
        versionMetrics: Array<{
          version: string;
          totalInvocations: number;
          successRate: number;
          errorRate: number;
          avgLatencyMs: number;
          avgConfidence: number;
          p95LatencyMs: number;
          p99LatencyMs: number;
          overrideRate: number;
          lastInvocation: string | null;
        }>;
        timeSeries: Array<{
          date: string;
          invocations: number;
          errors: number;
          avgLatency: number;
          avgConfidence: number;
        }>;
        alerts: Array<{ type: string; severity: string; message: string }>;
        summary: {
          totalInvocations: number;
          activeVersionInvocations: number;
          totalVersions: number;
        };
      }>(`/ai/models/${modelId}/performance?${q}`, {
        headers: { Authorization: `Bearer ${token || getToken() || ""}` },
      });
    },
  },
  // AI-016: Human Override
  override: (body: { decisionId: string; reasonCode: string; reasonDescription: string }, token?: string) =>
    api<{ success: boolean; message: string }>("/ai/override", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    }),
  // AI-018: Bias Audit
  biasAudit: (params?: { modelId?: string; period?: string }, token?: string) => {
    const q = new URLSearchParams();
    if (params?.modelId) q.set("modelId", params.modelId);
    if (params?.period) q.set("period", params.period);
    return api<{ success: boolean; report: any }>(`/ai/bias-audit?${q}`, {
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    });
  },
};

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
// Module 8: Risk & Controls
// Module 9 — Security & RBAC
export const securityApi = {
  // SEC-001: RBAC Permissions
  permissions: {
    list: (token?: string) =>
      api<{ success: boolean; data: any[] }>("/security/permissions", {
        headers: { Authorization: `Bearer ${token || getToken() || ""}` },
      }),
    update: (body: { role: string; permissions: string[] }, token?: string) =>
      api<{ success: boolean; data: any }>("/security/permissions", {
        method: "POST",
        body: JSON.stringify(body),
        headers: { Authorization: `Bearer ${token || getToken() || ""}` },
      }),
  },
  roles: {
    assign: (body: { userId: string; role: string; reason?: string }, token?: string) =>
      api<{ success: boolean; message: string }>("/security/roles/assign", {
        method: "POST",
        body: JSON.stringify(body),
        headers: { Authorization: `Bearer ${token || getToken() || ""}` },
      }),
    assignments: (token?: string) =>
      api<{ success: boolean; data: any[] }>("/security/roles/assignments", {
        headers: { Authorization: `Bearer ${token || getToken() || ""}` },
      }),
  },
  // SEC-002: MFA
  mfa: {
    setup: (token?: string) =>
      api<{ success: boolean; data: { secret: string; qrCodeUrl: string; backupCodes: string[]; manualEntryKey: string } }>("/security/mfa/setup", {
        method: "POST",
        headers: { Authorization: `Bearer ${token || getToken() || ""}` },
      }),
    verify: (body: { code?: string; backupCode?: string }, token?: string) =>
      api<{ success: boolean; message: string }>("/security/mfa/verify", {
        method: "POST",
        body: JSON.stringify(body),
        headers: { Authorization: `Bearer ${token || getToken() || ""}` },
      }),
    disable: (token?: string) =>
      api<{ success: boolean; message: string }>("/security/mfa/disable", {
        method: "POST",
        headers: { Authorization: `Bearer ${token || getToken() || ""}` },
      }),
    status: (token?: string) =>
      api<{ success: boolean; data: { mfaEnabled: boolean; mfaMethod: string | null; backupCodesRemaining: number } }>("/security/mfa/status", {
        headers: { Authorization: `Bearer ${token || getToken() || ""}` },
      }),
  },
  // SEC-005: DPDP Act 2023 Compliance
  dpdp: {
    accessRequest: {
      create: (body: { memberId: string }, token?: string) =>
        api<{ success: boolean; data: any }>("/security/dpdp/access-request", {
          method: "POST",
          body: JSON.stringify(body),
          headers: { Authorization: `Bearer ${token || getToken() || ""}` },
        }),
      list: (token?: string) =>
        api<{ success: boolean; data: any[] }>("/security/dpdp/access-requests", {
          headers: { Authorization: `Bearer ${token || getToken() || ""}` },
        }),
      fulfill: (id: string, token?: string) =>
        api<{ success: boolean; data: any }>(`/security/dpdp/access-requests/${id}/fulfill`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token || getToken() || ""}` },
        }),
    },
    correctionRequest: {
      create: (body: { memberId: string; field: string; newValue: string; reason?: string }, token?: string) =>
        api<{ success: boolean; data: any }>("/security/dpdp/correction-request", {
          method: "POST",
          body: JSON.stringify(body),
          headers: { Authorization: `Bearer ${token || getToken() || ""}` },
        }),
      approve: (id: string, token?: string) =>
        api<{ success: boolean; data: any }>(`/security/dpdp/correction-requests/${id}/approve`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token || getToken() || ""}` },
        }),
    },
    erasureRequest: {
      create: (body: { memberId: string; erasureType: "FULL" | "PARTIAL" | "ANONYMIZE"; reason?: string }, token?: string) =>
        api<{ success: boolean; data: any }>("/security/dpdp/erasure-request", {
          method: "POST",
          body: JSON.stringify(body),
          headers: { Authorization: `Bearer ${token || getToken() || ""}` },
        }),
      process: (id: string, token?: string) =>
        api<{ success: boolean; data: any }>(`/security/dpdp/erasure-requests/${id}/process`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token || getToken() || ""}` },
        }),
    },
    consent: {
      record: (body: { memberId: string; purpose: string; consentGiven: boolean }, token?: string) =>
        api<{ success: boolean; data: any }>("/security/dpdp/consent", {
          method: "POST",
          body: JSON.stringify(body),
          headers: { Authorization: `Bearer ${token || getToken() || ""}` },
        }),
      list: (params: { memberId: string }, token?: string) => {
        const q = new URLSearchParams();
        q.set("memberId", params.memberId);
        return api<{ success: boolean; data: any[] }>(`/security/dpdp/consent?${q}`, {
          headers: { Authorization: `Bearer ${token || getToken() || ""}` },
        });
      },
    },
  },
};

export const riskControlsApi = {
  // RSK-003: Sessions
  sessions: {
    list: (params?: { userId?: string }, token?: string) => {
      const q = new URLSearchParams();
      if (params?.userId) q.set("userId", params.userId);
      return api<{ success: boolean; sessions: any[] }>(`/risk-controls/sessions?${q}`, {
        headers: { Authorization: `Bearer ${token || getToken() || ""}` },
      });
    },
    delete: (id: string, token?: string) =>
      api<{ success: boolean; message: string }>(`/risk-controls/sessions/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token || getToken() || ""}` },
      }),
  },
  // RSK-002: Daily Limits
  dailyLimits: (params?: { userId?: string; accountId?: string }, token?: string) => {
    const q = new URLSearchParams();
    if (params?.userId) q.set("userId", params.userId);
    if (params?.accountId) q.set("accountId", params.accountId);
    return api<{ success: boolean; limits: any[] }>(`/risk-controls/daily-limits?${q}`, {
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    });
  },
  // RSK-005: Password Expiry
  passwordExpiry: (token?: string) =>
    api<{
      success: boolean;
      passwordChangedAt: string;
      daysUntilExpiry: number;
      alertLevel: "NONE" | "WARNING" | "CRITICAL" | "EXPIRED";
      forceExpired: boolean;
    }>("/risk-controls/password-expiry", {
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    }),
  forcePasswordExpire: (userId: string, token?: string) =>
    api<{ success: boolean; message: string }>(`/risk-controls/password-expiry/${userId}/force-expire`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    }),
  // RSK-006: Data Masking
  unmask: (
    body: { field: string; entityType: string; entityId: string; purpose?: string },
    token?: string
  ) =>
    api<{ success: boolean; message: string }>("/risk-controls/data-masking/unmask", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    }),
  // RSK-007: Backup Verification
  backupVerification: (params?: { days?: number }, token?: string) => {
    const q = new URLSearchParams();
    if (params?.days) q.set("days", params.days.toString());
    return api<{ success: boolean; verifications: any[] }>(`/risk-controls/backup-verification?${q}`, {
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    });
  },
  // RSK-010: Audit Log Hash Chain
  auditLogHashChain: (params?: { from?: string; to?: string }, token?: string) => {
    const q = new URLSearchParams();
    if (params?.from) q.set("from", params.from);
    if (params?.to) q.set("to", params.to);
    return api<{
      success: boolean;
      totalLogs: number;
      hashChainLength: number;
      allValid: boolean;
      hashChain: Array<{ auditLogId: string; hash: string; isValid: boolean }>;
    }>(`/risk-controls/audit-log-hash-chain?${q}`, {
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    });
  },
  // RSK-011: Data Retention
  dataRetention: (params?: { category?: string; status?: string }, token?: string) => {
    const q = new URLSearchParams();
    if (params?.category) q.set("category", params.category);
    if (params?.status) q.set("status", params.status);
    return api<{ success: boolean; retention: any[] }>(`/risk-controls/data-retention?${q}`, {
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    });
  },
  // RSK-012: AML Alerts
  amlAlerts: (params?: { status?: string }, token?: string) => {
    const q = new URLSearchParams();
    if (params?.status) q.set("status", params.status);
    return api<{ success: boolean; alerts: any[] }>(`/risk-controls/aml-alerts?${q}`, {
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    });
  },
  reviewAmlAlert: (
    id: string,
    body: { action: "REVIEWED" | "DISMISSED" | "STR_GENERATED"; notes?: string },
    token?: string
  ) =>
    api<{ success: boolean; message: string }>(`/risk-controls/aml-alerts/${id}/review`, {
      method: "POST",
      body: JSON.stringify(body),
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    }),
};

export const loansApi = {
  // LN-010: Restructuring/Refinance
  restructure: (id: string, body: { newTenureMonths?: number; newEmiAmount?: number; moratoriumExtensionMonths?: number; bodResolutionRef: string; remarks?: string }, token?: string) =>
    api<{ success: boolean; message: string; newTenureMonths: number; newEmiAmount: number; restructureCount: number }>(`/loans/${id}/restructure`, {
      method: "POST",
      body: JSON.stringify(body),
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    }),
  refinance: (id: string, body: { newLoanAmount: number; newInterestRate: number; newTenureMonths: number; bodResolutionRef: string; remarks?: string }, token?: string) =>
    api<{ success: boolean; message: string; oldLoan: any; newLoan: any; preclosureCharge: number }>(`/loans/${id}/refinance`, {
      method: "POST",
      body: JSON.stringify(body),
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    }),
  externalRefinance: (id: string, body: { refinanceSource: "DCCB" | "NABARD" | "OTHER"; refinanceAmount: number; refinanceDate: string; documentRef: string; remarks?: string }, token?: string) =>
    api<{ success: boolean; message: string; refinanceAmount: number; documentRef: string }>(`/loans/${id}/external-refinance`, {
      method: "POST",
      body: JSON.stringify(body),
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    }),
  // LN-014: Guarantor
  addGuarantor: (id: string, body: { guarantorMemberId?: string; guarantorName?: string; guarantorIncome: number; guaranteeAmount: number }, token?: string) =>
    api<{ success: boolean; message: string }>(`/loans/${id}/guarantor`, {
      method: "POST",
      body: JSON.stringify(body),
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    }),
  // LN-018: NPA Recovery
  recoveryReport: (token?: string) =>
    api<{ success: boolean; report: any[]; totalWriteOff: number; totalRecovered: number }>("/loans/npa/recovery-report", {
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    }),
  // LN-020: NACH Mandate
  createNachMandate: (id: string, body: { mandateId: string; bankAccount: string; umrn?: string; status: "ACTIVE" | "CANCELLED" | "EXPIRED"; startDate: string; endDate?: string }, token?: string) =>
    api<{ success: boolean; message: string; mandateId: string; umrn?: string }>(`/loans/${id}/nach-mandate`, {
      method: "POST",
      body: JSON.stringify(body),
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    }),
  // LN-023: Group Loan/JLG
  createGroupLoan: (body: { groupName: string; groupType?: "JLG" | "SHG" | "OTHER"; memberIds: string[]; individualLoanAmounts: number[] }, token?: string) =>
    api<{ success: boolean; groupLoan: any; groupCode: string }>("/loans/group-loans", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    }),
  listGroupLoans: (token?: string) =>
    api<{ success: boolean; groupLoans: any[] }>("/loans/group-loans", {
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    }),
  disburseGroupLoan: (id: string, body: { interestRate: number; tenureMonths: number }, token?: string) =>
    api<{ success: boolean; message: string; groupLoan: any; loans: any[] }>(`/loans/group-loans/${id}/disburse`, {
      method: "POST",
      body: JSON.stringify(body),
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    }),
  // LN-024: CIBIL/Experian
  checkCibil: (applicationId: string, token?: string) =>
    api<{ success: boolean; cibilScore: number; cibilReportId: string; reportDate: string; message: string }>(`/loans/applications/${applicationId}/cibil-check`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    }),
  checkExperian: (applicationId: string, token?: string) =>
    api<{ success: boolean; experianScore: number; experianReportId: string; reportDate: string; message: string }>(`/loans/applications/${applicationId}/experian-check`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    }),
  updateCreditBureauScores: (loanId: string, body: { cibilScore?: number; cibilReportId?: string; experianScore?: number; experianReportId?: string }, token?: string) =>
    api<{ success: boolean; message: string }>(`/loans/${loanId}/credit-bureau-scores`, {
      method: "POST",
      body: JSON.stringify(body),
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    }),
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
  getApplication: (id: string, token?: string) =>
    api<{ success: boolean; application: any }>(`/loans/applications/${id}`, {
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    }),
  approveApplication: (id: string, body: { remarks?: string }, token?: string) =>
    api<{ success: boolean; application: any }>(`/loans/applications/${id}/approve`, {
      method: "POST",
      body: JSON.stringify(body),
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    }),
  rejectApplication: (id: string, body: { remarks: string }, token?: string) =>
    api<{ success: boolean; application: any }>(`/loans/applications/${id}/reject`, {
      method: "POST",
      body: JSON.stringify(body),
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    }),
  // AI-002: AI Loan Underwriting Co-Pilot
  getCopilot: (id: string, token?: string) =>
    api<{
      success: boolean;
      riskScore: number;
      riskCategory: string;
      riskFlags: string[];
      recommendations: string[];
      comparableLoans: Array<{ amount: number; tenure: number; outcome: string }>;
      repaymentCapacity: number;
      recommendedAmount: number;
    }>(`/loans/applications/${id}/copilot`, {
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    }),
  // ACC-010: Audit Adjustment Entries
  createAuditAdjustment: (body: {
    date: string;
    narration?: string;
    totalAmount: number;
    entries: Array<{ glCode: string; glName: string; debit: number; credit: number; narration?: string }>;
    auditAccessStartDate: string;
    auditAccessEndDate: string;
  }, token?: string) =>
    api<{ success: boolean; voucher: any }>("/gl/vouchers", {
      method: "POST",
      body: JSON.stringify({
        ...body,
        voucherType: "AUDIT_ADJ",
        isAuditAdjustment: true,
      }),
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    }),
  writeOff: (id: string, body: { writeOffAmount: number; bodResolutionRef: string; remarks?: string }, token?: string) =>
    api<{ success: boolean; message: string; writeOffAmount: number; bodResolutionRef: string }>(`/loans/${id}/write-off`, {
      method: "POST",
      body: JSON.stringify(body),
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    }),
  recovery: (id: string, body: { amount: number; recoveryDate?: string; recoveryMode?: "CASH" | "BANK_TRANSFER" | "ASSET_SALE" | "LEGAL_SETTLEMENT" | "OTHER"; remarks?: string }, token?: string) =>
    api<{ success: boolean; message: string; recoveredAmount: number; totalRecovered: number; recoveryPercent: number }>(`/loans/${id}/recovery`, {
      method: "POST",
      body: JSON.stringify(body),
      headers: { Authorization: `Bearer ${token || getToken() || ""}` },
    }),
};

// Integrations (Module 11)
export const integrationsApi = {
  // INT-001: Aadhaar eKYC
  aadhaarEkycInitiate: (data: { aadhaarNumber: string; memberId?: string }, t?: string) =>
    api<{ success: boolean; otpReference: string; message: string; maskedAadhaar: string }>("/integrations/aadhaar/ekyc/initiate", {
      method: "POST",
      body: JSON.stringify(data),
      headers: { Authorization: `Bearer ${t || getToken() || ""}` },
    }),
  aadhaarEkycVerify: (data: { otpReference: string; otp: string; memberId?: string }, t?: string) =>
    api<{ success: boolean; uidToken: string; identityAttributes: any; message: string }>("/integrations/aadhaar/ekyc/verify", {
      method: "POST",
      body: JSON.stringify(data),
      headers: { Authorization: `Bearer ${t || getToken() || ""}` },
    }),
  // INT-002: UPI
  upiGenerateQr: (data: { amount: number; purpose: string; transactionId?: string; upiId?: string }, t?: string) =>
    api<{ success: boolean; orderId: string; paymentLink: string; qrCode: string; amount: number; expiresAt: string }>("/integrations/upi/generate-qr", {
      method: "POST",
      body: JSON.stringify(data),
      headers: { Authorization: `Bearer ${t || getToken() || ""}` },
    }),
  // INT-005: SMS
  smsSend: (data: { to: string; templateId: string; params?: Record<string, string>; memberId?: string }, t?: string) =>
    api<{ success: boolean; messageId: string; message: string }>("/integrations/sms/send", {
      method: "POST",
      body: JSON.stringify(data),
      headers: { Authorization: `Bearer ${t || getToken() || ""}` },
    }),
  // INT-011: Payment Gateway
  paymentGatewayCreateOrder: (data: { amount: number; purpose: string; transactionId?: string; gateway?: "razorpay" | "payu" }, t?: string) =>
    api<{ success: boolean; orderId: string; gateway: string; amount: number; key: string; gatewayOrderId: string }>("/integrations/payment-gateway/create-order", {
      method: "POST",
      body: JSON.stringify(data),
      headers: { Authorization: `Bearer ${t || getToken() || ""}` },
    }),
  // INT-003: NACH
  nachRegister: (data: { memberId: string; bankAccount: string; amount: number; frequency: "MONTHLY" | "QUARTERLY" | "YEARLY"; startDate: string }, t?: string) =>
    api<{ success: boolean; mandateId: string; message: string }>("/integrations/nach/register", {
      method: "POST",
      body: JSON.stringify(data),
      headers: { Authorization: `Bearer ${t || getToken() || ""}` },
    }),
  // INT-014: Bulk Export
  bulkExport: (type: string, format?: string, t?: string) =>
    api<any>(`/integrations/bulk-export/${type}${format ? `?format=${format}` : ""}`, {
      headers: { Authorization: `Bearer ${t || getToken() || ""}` },
    }),
  // INT-014: Bulk Import
  bulkImport: (type: string, data: { data: any[]; validateOnly?: boolean }, t?: string) =>
    api<{ success: boolean; imported: number; failed: number; results: any[]; errors: any[] }>(`/integrations/bulk-import/${type}`, {
      method: "POST",
      body: JSON.stringify(data),
      headers: { Authorization: `Bearer ${t || getToken() || ""}` },
    }),
};
