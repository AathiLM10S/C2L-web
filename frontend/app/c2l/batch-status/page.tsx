import React from "react";
import { getBatchesServer } from "@/services/batch.service";
import { serverFetch } from "@/lib/api/server-client";
import { BatchStatusReportView } from "@/components/batches/BatchStatusReportView";
import { Batch, User } from "@/lib/api";
import { FolderKanban, Download } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function BatchStatusReportPage() {
  let batches: Batch[] = [];
  let users: User[] = [];

  try {
    const [batchesRes, usersRes] = await Promise.all([
      getBatchesServer({ limit: 400 }),
      serverFetch<User[]>("/auth/users").catch(() => []),
    ]);
    batches = batchesRes;
    users = usersRes;
  } catch (e) {
    console.error("Batch status server fetch error:", e);
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
              <FolderKanban className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                C2L Batch Status Report
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Live operational status tracking with dedicated filters for In Progress, Completed, Hold, and Yet to Start
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3 self-start md:self-auto">
          <a
            href="http://127.0.0.1:8000/api/reports/excel"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-600 text-white font-semibold text-xs flex items-center space-x-2 shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export Excel</span>
          </a>
        </div>
      </div>

      {/* Interactive Client Component for instant tab switching, search, and drawer */}
      <BatchStatusReportView initialBatches={batches} initialUsers={users} />
    </div>
  );
}
