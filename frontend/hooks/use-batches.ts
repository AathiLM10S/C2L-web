"use client";

import { useState, useEffect, useCallback } from "react";
import { api, Batch } from "@/lib/api";

interface UseBatchesOptions {
  initialBatches?: Batch[];
  status?: string;
  assignedToId?: number;
  search?: string;
}

export function useBatches(options: UseBatchesOptions = {}) {
  const [batches, setBatches] = useState<Batch[]>(options.initialBatches || []);
  const [loading, setLoading] = useState(!options.initialBatches);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(
    async (params?: Record<string, string | number | undefined>) => {
      setLoading(true);
      setError(null);
      try {
        const data = await api.getBatches(params);
        setBatches(data);
      } catch (err: any) {
        setError(err.message || "Failed to fetch batches");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { batches, setBatches, loading, error, refetch };
}
