"use client";

import React, { useState } from "react";
import { Batch } from "@/lib/api";
import { StatusBadge } from "@/components/common/StatusBadge";
import { BatchDetailDrawer } from "@/components/c2l/BatchDetailDrawer";
import { Eye, ChevronRight, Layers, MapPin } from "lucide-react";

interface DashboardRecentBatchesProps {
  batches: Batch[];
}

export function DashboardRecentBatches({ batches }: DashboardRecentBatchesProps) {
  const [selectedBatchId, setSelectedBatchId] = useState<number | null>(null);

  return (
    <>
      <div className="overflow-x-auto rounded-2xl border border-slate-200/90 shadow-2xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#F8FAFC] text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200/80">
            <tr>
              <th className="p-3.5 pl-4 font-semibold">Batch No</th>
              <th className="p-3.5 font-semibold">Type & Complexity</th>
              <th className="p-3.5 font-semibold">Location</th>
              <th className="p-3.5 font-semibold">Assignee</th>
              <th className="p-3.5 font-semibold">Work Status</th>
              <th className="p-3.5 font-semibold">Audit</th>
              <th className="p-3.5 pr-4 text-right font-semibold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
            {batches && batches.length > 0 ? (
              batches.map((b) => (
                <tr
                  key={b.id}
                  onClick={() => setSelectedBatchId(b.id)}
                  className="hover:bg-blue-50/40 cursor-pointer transition-colors group"
                >
                  <td className="p-3.5 pl-4 font-bold text-slate-900 font-mono">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-blue-700 font-semibold group-hover:underline">
                        #{b.batch_no}
                      </span>
                      {b.is_client_ready && (
                        <span
                          className="w-2 h-2 rounded-full bg-emerald-500 status-dot-emerald"
                          title="Client Ready"
                        />
                      )}
                    </div>
                  </td>
                  <td className="p-3.5 max-w-[180px] truncate text-slate-600 font-medium">
                    {b.batch_type || b.complexity || "—"}
                  </td>
                  <td className="p-3.5 whitespace-nowrap text-slate-600">
                    {b.location ? (
                      <span className="inline-flex items-center space-x-1 text-[11px] text-slate-600">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{b.location}</span>
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="p-3.5 text-slate-800 font-semibold whitespace-nowrap">
                    {b.assigned_to?.name ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 text-[#0F2942] flex items-center justify-center font-bold text-[10px]">
                          {b.assigned_to.name.slice(0, 2).toUpperCase()}
                        </div>
                        <span>{b.assigned_to.name}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">Unassigned</span>
                    )}
                  </td>
                  <td className="p-3.5">
                    <StatusBadge status={b.work_status} size="sm" />
                  </td>
                  <td className="p-3.5">
                    <StatusBadge status={b.audit_status} type="audit" size="sm" />
                  </td>
                  <td className="p-3.5 pr-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setSelectedBatchId(b.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-700 hover:bg-blue-50 transition-colors cursor-pointer"
                      title="Inspect Batch"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-400 italic">
                  No active batches found in current view.
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
