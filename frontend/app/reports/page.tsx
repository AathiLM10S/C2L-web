import React, { Suspense } from "react";
import { getUsersServer } from "@/services/user.service";
import { getBatchesServer } from "@/services/batch.service";
import { ReportsView } from "@/components/reports/ReportsView";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const [users, batches] = await Promise.all([
    getUsersServer(),
    getBatchesServer({ limit: 500 }),
  ]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <div className="flex items-center space-x-2">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Enterprise Reporting</h1>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Live Database Data
          </span>
        </div>
        <p className="text-sm text-slate-500 mt-0.5">
          Generate, filter, and export live production and QC audit reports on demand
        </p>
      </div>

      <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading reports workspace...</div>}>
        <ReportsView initialUsers={users} initialBatches={batches} />
      </Suspense>
    </div>
  );
}
