import React, { Suspense } from "react";
import { getWorkLogsServer, getBatchesServer } from "@/services/batch.service";
import { getUsersServer } from "@/services/user.service";
import { MasterLogView } from "@/components/batches/MasterLogView";

export const dynamic = "force-dynamic";

export default async function MasterLogPage() {
  const [logs, batches, users] = await Promise.all([
    getWorkLogsServer({ limit: 500 }),
    getBatchesServer({ limit: 400 }),
    getUsersServer(),
  ]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Server Header */}
      <div>
        <div className="flex items-center space-x-2">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">C2L Master Log</h1>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            {logs.length} Logged Entries
          </span>
        </div>
        <p className="text-sm text-slate-500 mt-0.5">
          Exact operational log tracking from C2L_Log.csv with timesheets, assignments, and QC reviewer states
        </p>
      </div>

      {/* Interactive Client View */}
      <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading master registry...</div>}>
        <MasterLogView initialLogs={logs} initialBatches={batches} initialUsers={users} />
      </Suspense>
    </div>
  );
}
