"use client";

import { useState, useCallback } from "react";
import { api, QCIssue } from "@/lib/api";

interface UseQCIssuesOptions {
  initialIssues?: QCIssue[];
}

export function useQCIssues(options: UseQCIssuesOptions = {}) {
  const [issues, setIssues] = useState<QCIssue[]>(options.initialIssues || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(
    async (params?: { status?: string; issue_type?: string; search?: string }) => {
      setLoading(true);
      setError(null);
      try {
        const data = await api.getQCIssues(params);
        setIssues(data);
      } catch (err: any) {
        setError(err.message || "Failed to load QC issues");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { issues, setIssues, loading, error, refetch };
}
