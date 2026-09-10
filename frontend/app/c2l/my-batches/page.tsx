import React, { Suspense } from "react";
import { getMyBatchesServer } from "@/services/batch.service";
import { MyBatchesView } from "@/components/batches/MyBatchesView";

export const dynamic = "force-dynamic";

export default async function MyBatchesPage() {
  const batches = await getMyBatchesServer();

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <div className="flex items-center space-x-2">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Batches</h1>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            {batches.length} Active Records
          </span>
        </div>
        <p className="text-sm text-slate-500 mt-0.5">
          Batches assigned directly to your user account and co-assignments
        </p>
      </div>

      <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading your batches...</div>}>
        <MyBatchesView initialBatches={batches} />
      </Suspense>
    </div>
  );
}
