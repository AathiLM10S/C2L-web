import { serverFetch } from "@/lib/api/server-client";
import { Audit } from "@/lib/api";

export async function getAuditsServer(params?: Record<string, string | number | undefined>): Promise<Audit[]> {
  const sp = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== "") sp.append(k, String(v));
    });
  }
  return serverFetch<Audit[]>(`/c2l/audits?${sp.toString()}`);
}
