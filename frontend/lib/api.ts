const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  external_user_id?: string;
  created_at?: string;
}

export interface WorkLog {
  id: number;
  batch_id: number;
  batch_no?: string;
  batch_type?: string;
  location?: string;
  sl_no?: number;
  assigned_to_id?: number;
  work_type?: string;
  start_date?: string;
  end_date?: string;
  total_hours?: number;
  status: string;
  qc_status: string;
  qc_by_id?: number;
  remarks?: string;
  employee?: User;
  qc_reviewer?: User;
  created_at?: string;
}

export interface CoAssignment {
  id: number;
  user_id: number;
  role_note?: string;
  user?: User;
}

export interface Batch {
  id: number;
  batch_no: string;
  batch_type?: string;
  location?: string;
  complexity?: string;
  assigned_to_id?: number;
  assigned_to?: User;
  start_date?: string;
  end_date?: string;
  total_hours?: number;
  work_status: string;
  qc_status: string;
  audit_status: string;
  is_client_ready: boolean;
  current_remarks?: string;
  co_assignments?: CoAssignment[];
  work_logs?: WorkLog[];
  created_at?: string;
  updated_at?: string;
}

export interface Audit {
  id: number;
  batch_id: number;
  batch_no?: string;
  audited_by_id: number;
  auditor?: User;
  audit_date: string;
  audit_result: string;
  sheet_metal_qc?: string;
  remarks?: string;
  created_at?: string;
}

export interface QCReference {
  id: number;
  sl_no?: number;
  batch_id?: number;
  batch_no: string;
  batch_owner_id?: number;
  batch_owner?: User;
  audited_by_id?: number;
  auditor?: User;
  start_date?: string;
  end_date?: string;
  audit_date?: string;
  qc_status?: string;
  audit_status?: string;
  audit_result?: string;
  sheet_metal_qc?: string;
  remarks?: string;
  created_at?: string;
  updated_at?: string;
}

export interface QCIssue {
  id: number;
  sl_no?: number;
  batch_id: number;
  batch_no?: string;
  batch_owner?: User;
  batch_owner_name?: string;
  audit_id?: number;
  issue_type: string;
  remark: string;
  proof_url?: string;
  qc_checked_by_id: number;
  qc_checker?: User;
  qc_date: string;
  status: string;
  resolution_note?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Scenario {
  id: number;
  scenario: string;
  remark?: string;
  updated_by_id: number;
  updated_by?: User;
  updated_date: string;
  individual_or_team?: string;
  last_snip_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DailyTracker {
  id: number;
  user_id?: number;
  user_name: string;
  task_date: string;
  phase_1?: string;
  phase_2?: string;
  status: string;
  created_at?: string;
  updated_at?: string;
  user?: User;
}

export interface DashboardKPIs {
  total_batches: number;
  completed: number;
  in_progress: number;
  yet_to_start: number;
  on_hold: number;
  pending_audit: number;
  audit_passed: number;
  audit_failed: number;
  open_qc_issues: number;
  resolved_qc_issues: number;
  client_ready: number;
}

export interface DashboardData {
  user_name: string;
  user_role: string;
  is_admin_or_manager: boolean;
  kpis: DashboardKPIs;
  recent_batches: Batch[];
  recent_qc_issues: QCIssue[];
  on_hold_batches?: Batch[];
  my_on_hold_count?: number;
  on_hold_qc_references?: QCReference[];
  my_on_hold_qc_count?: number;
  status_distribution: Record<string, number>;
  work_type_distribution: Record<string, number>;
}

import {
  getStoredToken,
  setStoredAuth,
  clearStoredAuth,
  getClientCookie,
  USER_COOKIE_NAME,
} from "@/lib/auth/token";

// Token helpers
export const getToken = (): string | null => {
  return getStoredToken();
};

export const setToken = (token: string, user?: User) => {
  if (user) {
    setStoredAuth(token, user);
  } else if (typeof window !== "undefined") {
    const existing = getCurrentStoredUser();
    setStoredAuth(token, existing || { id: 0, name: "", email: "", role: "EMPLOYEE", is_active: true });
  }
};

export const removeToken = () => {
  clearStoredAuth();
};

export const getCurrentStoredUser = (): User | null => {
  if (typeof window === "undefined") return null;
  const fromCookie = getClientCookie(USER_COOKIE_NAME);
  if (fromCookie) {
    try {
      return JSON.parse(fromCookie);
    } catch {}
  }
  const raw = localStorage.getItem("c2l_user");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const setStoredUser = (user: User) => {
  const token = getStoredToken() || "";
  setStoredAuth(token, user);
};

// Generic fetch with auth
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errData.detail || `Request failed with status ${res.status}`);
  }

  return res.json();
}

export const api = {
  // Auth
  login: async (email: string, password: string): Promise<{ access_token: string; user: User }> => {
    const data = await apiRequest<{ access_token: string; user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setToken(data.access_token);
    setStoredUser(data.user);
    return data;
  },
  getMe: () => apiRequest<User>("/auth/me"),
  getUsers: () => apiRequest<User[]>("/auth/users"),
  createUser: (data: Partial<User> & { password?: string }) =>
    apiRequest<User>("/auth/users", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateUser: (id: number, data: Partial<User> & { password?: string }) =>
    apiRequest<User>(`/auth/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  resetPassword: (email: string, new_password: string) =>
    apiRequest<{ message: string }>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ email, new_password }),
    }),

  // Dashboard
  getDashboard: () => apiRequest<DashboardData>("/dashboard"),

  // Batches
  getBatches: (params?: Record<string, string | number | undefined>) => {
    const sp = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== "") sp.append(k, String(v));
      });
    }
    return apiRequest<Batch[]>(`/c2l/batches?${sp.toString()}`);
  },
  getWorkLogs: (params?: Record<string, string | number | undefined>) => {
    const sp = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== "") sp.append(k, String(v));
      });
    }
    return apiRequest<WorkLog[]>(`/c2l/work-logs?${sp.toString()}`);
  },
  getMyBatches: (params?: Record<string, string | number | undefined>) => {
    const sp = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== "") sp.append(k, String(v));
      });
    }
    return apiRequest<Batch[]>(`/c2l/my-batches?${sp.toString()}`);
  },
  getCompletedBatches: (params?: Record<string, string | number | undefined>) => {
    const sp = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== "") sp.append(k, String(v));
      });
    }
    return apiRequest<Batch[]>(`/c2l/completed?${sp.toString()}`);
  },
  getBatchDetail: (id: number) => apiRequest<Batch>(`/c2l/batches/${id}`),
  updateBatch: (id: number, data: Partial<Batch>) =>
    apiRequest<Batch>(`/c2l/batches/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  createBatch: (data: Partial<Batch>) =>
    apiRequest<Batch>("/c2l/batches", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  addWorkLog: (batchId: number, data: Partial<WorkLog>) =>
    apiRequest<WorkLog>(`/c2l/batches/${batchId}/work-logs`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Audits
  getAudits: (params?: Record<string, string | number | undefined>) => {
    const sp = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== "") sp.append(k, String(v));
      });
    }
    return apiRequest<Audit[]>(`/c2l/audits?${sp.toString()}`);
  },
  createAudit: (data: { batch_id: number; audit_date: string; audit_result: string; sheet_metal_qc?: string; remarks?: string }) =>
    apiRequest<Audit>("/c2l/audits", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getPendingAuditBatches: () => apiRequest<Batch[]>("/c2l/audits/pending-batches"),

  // QC Reference
  getQCReferences: (params?: Record<string, string | number | undefined>) => {
    const sp = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== "") sp.append(k, String(v));
      });
    }
    return apiRequest<QCReference[]>(`/qc/reference?${sp.toString()}`);
  },
  createQCReference: (data: Partial<QCReference>) =>
    apiRequest<QCReference>("/qc/reference", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateQCReference: (id: number, data: Partial<QCReference>) =>
    apiRequest<QCReference>(`/qc/reference/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  // QC Issues
  getQCIssues: (params?: Record<string, string | number | undefined>) => {
    const sp = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== "") sp.append(k, String(v));
      });
    }
    return apiRequest<QCIssue[]>(`/qc/issues?${sp.toString()}`);
  },
  createQCIssue: (data: Partial<QCIssue>) =>
    apiRequest<QCIssue>("/qc/issues", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateQCIssue: (id: number, data: Partial<QCIssue>) =>
    apiRequest<QCIssue>(`/qc/issues/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  // Scenarios
  getScenarios: (search?: string) => {
    const sp = search ? `?search=${encodeURIComponent(search)}` : "";
    return apiRequest<Scenario[]>(`/c2l/scenarios${sp}`);
  },
  createScenario: (data: Partial<Scenario>) =>
    apiRequest<Scenario>("/c2l/scenarios", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateScenario: (id: number, data: Partial<Scenario>) =>
    apiRequest<Scenario>(`/c2l/scenarios/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  // Daily Task Tracker
  getDailyTrackers: (params?: Record<string, string | number | undefined>) => {
    const sp = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== "") sp.append(k, String(v));
      });
    }
    return apiRequest<DailyTracker[]>(`/c2l/daily-tracker?${sp.toString()}`);
  },
  getDailyTracker: (id: number) => apiRequest<DailyTracker>(`/c2l/daily-tracker/${id}`),
  createDailyTracker: (data: Partial<DailyTracker>) =>
    apiRequest<DailyTracker>("/c2l/daily-tracker", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateDailyTracker: (id: number, data: Partial<DailyTracker>) =>
    apiRequest<DailyTracker>(`/c2l/daily-tracker/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteDailyTracker: (id: number) =>
    apiRequest<{ message: string }>(`/c2l/daily-tracker/${id}`, {
      method: "DELETE",
    }),

  // Reports
  getExcelReportUrl: (params?: Record<string, string | undefined>) => {
    const sp = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v) sp.append(k, v);
      });
    }
    const token = getToken();
    if (token) sp.append("token", token);
    return `${API_BASE}/reports/excel?${sp.toString()}`;
  },
  getCSVReportUrl: (params?: Record<string, string | undefined>) => {
    const sp = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v) sp.append(k, v);
      });
    }
    const token = getToken();
    if (token) sp.append("token", token);
    return `${API_BASE}/reports/csv?${sp.toString()}`;
  },

  // Seed / Migration
  seedInitial: () =>
    apiRequest<{ status: string; message: string; details: any }>("/import/seed-initial", {
      method: "POST",
    }),
};
