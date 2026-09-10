import { serverFetch } from "@/lib/api/server-client";
import { QCReference, QCIssue } from "@/lib/api";

export async function getQCReferencesServer(params?: Record<string, string | number | undefined>): Promise<QCReference[]> {
  const sp = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== "") sp.append(k, String(v));
    });
  }
  return serverFetch<QCReference[]>(`/qc/reference?${sp.toString()}`);
}

export async function getQCIssuesServer(params?: Record<string, string | number | undefined>): Promise<QCIssue[]> {
  const sp = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== "") sp.append(k, String(v));
    });
  }
  return serverFetch<QCIssue[]>(`/qc/issues?${sp.toString()}`);
}
