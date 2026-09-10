import React, { Suspense } from "react";
import { getQCIssuesServer } from "@/services/qc.service";
import { getBatchesServer } from "@/services/batch.service";
import { QCIssuesView } from "@/components/qc/QCIssuesView";

export const dynamic = "force-dynamic";

export default async function QCIssuesPage() {
  const [issues, batches] = await Promise.all([
    getQCIssuesServer(),
    getBatchesServer({ limit: 200 }),
  ]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <div className="flex items-center space-x-2">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">QC Issues Log</h1>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            {issues.length} Logged Discrepancies
          </span>
        </div>
        <p className="text-sm text-slate-500 mt-0.5">
          User-defined QC discrepancies, CAD revision issues, and link checks
        </p>
      </div>

      <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading QC issues log...</div>}>
        <QCIssuesView initialIssues={issues} initialBatches={batches} />
      </Suspense>
    </div>
  );
}
