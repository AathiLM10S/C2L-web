import { serverFetch } from "@/lib/api/server-client";
import { Batch, WorkLog } from "@/lib/api";

export async function getBatchesServer(params?: Record<string, string | number | undefined>): Promise<Batch[]> {
  const sp = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== "") sp.append(k, String(v));
    });
  }
  return serverFetch<Batch[]>(`/c2l/batches?${sp.toString()}`);
}

export async function getWorkLogsServer(params?: Record<string, string | number | undefined>): Promise<WorkLog[]> {
  const sp = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== "") sp.append(k, String(v));
    });
  }
  return serverFetch<WorkLog[]>(`/c2l/work-logs?${sp.toString()}`);
}

export async function getBatchDetailServer(id: number): Promise<Batch> {
  return serverFetch<Batch>(`/c2l/batches/${id}`);
}

export async function getMyBatchesServer(params?: Record<string, string | number | undefined>): Promise<Batch[]> {
  const sp = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== "") sp.append(k, String(v));
    });
  }
  return serverFetch<Batch[]>(`/c2l/my-batches?${sp.toString()}`);
}

export async function getPendingAuditBatchesServer(): Promise<Batch[]> {
  return serverFetch<Batch[]>("/c2l/audits/pending-batches");
}
