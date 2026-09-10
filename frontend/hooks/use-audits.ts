"use client";

import { useState, useCallback } from "react";
import { api, Audit, Batch } from "@/lib/api";

interface UseAuditsOptions {
  initialAudits?: Audit[];
  initialPending?: Batch[];
}

export function useAudits(options: UseAuditsOptions = {}) {
  const [audits, setAudits] = useState<Audit[]>(options.initialAudits || []);
  const [pendingBatches, setPendingBatches] = useState<Batch[]>(options.initialPending || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async (result?: string) => {
    setLoading(true);
    setError(null);
    try {
      const [auditsData, pendingData] = await Promise.all([
        api.getAudits({ result: result === "ALL" ? undefined : result }),
        api.getPendingAuditBatches().catch(() => []),
      ]);
      setAudits(auditsData);
      setPendingBatches(pendingData);
    } catch (err: any) {
      setError(err.message || "Failed to load audit data");
    } finally {
      setLoading(false);
    }
  }, []);

  return { audits, setAudits, pendingBatches, setPendingBatches, loading, error, refetch };
}
