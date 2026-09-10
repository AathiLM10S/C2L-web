import { serverFetch } from "@/lib/api/server-client";
import { DashboardData } from "@/lib/api";

export async function getDashboardDataServer(): Promise<DashboardData> {
  return serverFetch<DashboardData>("/dashboard");
}
