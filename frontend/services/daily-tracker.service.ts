import { serverFetch } from "@/lib/api/server-client";
import { DailyTracker } from "@/lib/api";

export async function getDailyTrackersServer(
  params?: Record<string, string | number | undefined>
): Promise<DailyTracker[]> {
  try {
    const sp = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== "") sp.append(k, String(v));
      });
    }
    const query = sp.toString() ? `?${sp.toString()}` : "";
    return await serverFetch<DailyTracker[]>(`/c2l/daily-tracker${query}`);
  } catch (error) {
    console.error("Failed to fetch daily trackers on server:", error);
    return [];
  }
}
