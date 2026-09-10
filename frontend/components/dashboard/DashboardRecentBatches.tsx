"use client";

import React, { useState } from "react";
import { Batch } from "@/lib/api";
import { StatusBadge } from "@/components/common/StatusBadge";
import { BatchDetailDrawer } from "@/components/c2l/BatchDetailDrawer";
import { Eye } from "lucide-react";

interface DashboardRecentBatchesProps {
  batches: Batch[];
}

export function DashboardRecentBatches({ batches }: DashboardRecentBatchesProps) {
  const [selectedBatchId, setSelectedBatchId] = useState<number | null>(null);

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100 text-slate-600 uppercase text-[10px] font-bold">
            <tr>
              <th className="p-3">Batch No</th>
              <th className="p-3">Type</th>
              <th className="p-3">Location</th>
              <th className="p-3">Assignee</th>
              <th className="p-3">Work Status</th>
              <th className="p-3">Audit</th>
              <th className="p-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
            {batches && batches.length > 0 ? (
              batches.map((b) => (
                <tr
                  key={b.id}
                  onClick={() => setSelectedBatchId(b.id)}
                  className="hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <td className="p-3 font-bold text-slate-900 flex items-center space-x-1.5 font-mono">
                    <span className="text-blue-700 font-semibold">#{b.batch_no}</span>
                    {b.is_client_ready && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500" title="Client Ready"></span>
                    )}
                  </td>
                  <td className="p-3">{b.batch_type || b.complexity || "—"}</td>
                  <td className="p-3">{b.location || "—"}</td>
                  <td className="p-3 text-slate-800 font-medium">
                    {b.assigned_to?.name || "Unassigned"}
                  </td>
                  <td className="p-3">
                    <StatusBadge status={b.work_status} />
                  </td>
                  <td className="p-3">
                    <StatusBadge status={b.audit_status} type="audit" />
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedBatchId(b.id);
                      }}
                      className="p-1 rounded hover:bg-slate-100 text-blue-700 cursor-pointer"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-400 italic">
                  No active batches found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <BatchDetailDrawer
        batchId={selectedBatchId}
        onClose={() => setSelectedBatchId(null)}
      />
    </>
  );
}
