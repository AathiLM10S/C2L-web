import { serverFetch } from "@/lib/api/server-client";
import { Scenario } from "@/lib/api";

export async function getScenariosServer(search?: string): Promise<Scenario[]> {
  const sp = search ? `?search=${encodeURIComponent(search)}` : "";
  return serverFetch<Scenario[]>(`/c2l/scenarios${sp}`);
}
