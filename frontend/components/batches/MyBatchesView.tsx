"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { Batch, api } from "@/lib/api";
import { StatusBadge } from "@/components/common/StatusBadge";
import { BatchDetailDrawer } from "@/components/c2l/BatchDetailDrawer";
import { Search, Eye } from "lucide-react";

interface MyBatchesViewProps {
  initialBatches: Batch[];
}

export function MyBatchesView({ initialBatches }: MyBatchesViewProps) {
  const { user } = useAuth();
  const [batches, setBatches] = useState<Batch[]>(initialBatches);
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [selectedBatchId, setSelectedBatchId] = useState<number | null>(null);

  const fetchMyBatches = async () => {
    try {
      const data = await api.getMyBatches({
        status: activeTab === "ALL" ? undefined : activeTab,
        search: search || undefined,
      });
      setBatches(data);
    } catch (err) {
      console.error("Error loading my batches:", err);
    }
  };

  useEffect(() => {
    fetchMyBatches();
  }, [user, activeTab]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMyBatches();
  };

  const tabs = [
    { label: "All Batches", value: "ALL" },
    { label: "Completed", value: "COMPLETED" },
    { label: "In Progress", value: "IN_PROGRESS" },
    { label: "Yet to Start", value: "YET_TO_START" },
    { label: "On Hold", value: "ON_HOLD" },
  ];

  return (
    <div className="space-y-6">
      {/* Action Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
              {batches.length} Assigned to You
            </span>
          </div>
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex items-center space-x-2">
          <div className="relative w-64 md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search batch #, location, remarks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-2xs"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-600 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            Search
          </button>
        </form>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 border-b border-slate-200 pb-px overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`px-4 py-2 text-xs font-semibold rounded-t-xl transition-all border-b-2 cursor-pointer ${
                isActive
                  ? "bg-blue-50 text-blue-700 border-blue-700 font-bold"
                  : "text-slate-500 hover:text-slate-800 border-transparent hover:border-slate-300"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Batches Table */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
              <tr>
                <th className="p-3.5">Batch No</th>
                <th className="p-3.5">Complexity / Type</th>
                <th className="p-3.5">Location</th>
                <th className="p-3.5">Start Date</th>
                <th className="p-3.5">End Date</th>
                <th className="p-3.5">Hours</th>
                <th className="p-3.5">Work Status</th>
                <th className="p-3.5">Audit Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
              {batches.length > 0 ? (
                batches.map((b) => (
                  <tr
                    key={b.id}
                    onClick={() => setSelectedBatchId(b.id)}
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <td className="p-3.5 font-bold text-slate-900 flex items-center space-x-2 font-mono">
                      <span className="text-blue-700 font-semibold">#{b.batch_no}</span>
                      {b.is_client_ready && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500" title="Client Ready"></span>
                      )}
                    </td>
                    <td className="p-3.5">{b.complexity || b.batch_type || "—"}</td>
                    <td className="p-3.5">{b.location || "—"}</td>
                    <td className="p-3.5 text-slate-500">{b.start_date || "—"}</td>
                    <td className="p-3.5 text-slate-500">{b.end_date || "—"}</td>
                    <td className="p-3.5 font-mono">{b.total_hours ? `${b.total_hours}h` : "—"}</td>
                    <td className="p-3.5">
                      <StatusBadge status={b.work_status} />
                    </td>
                    <td className="p-3.5">
                      <StatusBadge status={b.audit_status} type="audit" />
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedBatchId(b.id);
                        }}
                        className="p-1.5 rounded-lg text-blue-700 hover:bg-blue-50 transition-colors cursor-pointer"
                        title="View Lifecycle Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="p-10 text-center text-slate-400 italic">
                    No batches match the selected filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Batch Detail Drawer */}
      <BatchDetailDrawer
        batchId={selectedBatchId}
        onClose={() => setSelectedBatchId(null)}
        onRefresh={fetchMyBatches}
      />
    </div>
  );
}
