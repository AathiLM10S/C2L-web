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
      <div className="surface-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] text-slate-600 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200/80">
              <tr>
                <th className="py-3.5 px-4">Batch No</th>
                <th className="py-3.5 px-4">Complexity / Type</th>
                <th className="py-3.5 px-4">Location</th>
                <th className="py-3.5 px-4">Start Date</th>
                <th className="py-3.5 px-4">End Date</th>
                <th className="py-3.5 px-4">Hours</th>
                <th className="py-3.5 px-4">Work Status</th>
                <th className="py-3.5 px-4">Audit Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/90 bg-white text-slate-700">
              {batches.length > 0 ? (
                batches.map((b) => (
                  <tr
                    key={b.id}
                    onClick={() => setSelectedBatchId(b.id)}
                    className="hover:bg-blue-50/40 cursor-pointer transition-colors group"
                  >
                    <td className="py-3 px-4 font-bold text-slate-900 font-mono">
                      <span className="inline-flex items-center space-x-2 px-2 py-0.5 rounded-md bg-slate-100 text-[#0F2942] border border-slate-200/80 font-mono font-bold group-hover:bg-blue-50 group-hover:text-blue-700 group-hover:border-blue-200 transition-colors">
                        <span>#{b.batch_no}</span>
                        {b.is_client_ready && (
                          <span className="status-dot-emerald" title="Client Ready"></span>
                        )}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-800 font-medium">{b.complexity || b.batch_type || "—"}</td>
                    <td className="py-3 px-4 text-slate-600">{b.location || "—"}</td>
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">{b.start_date || "—"}</td>
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">{b.end_date || "—"}</td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-700">{b.total_hours ? `${b.total_hours}h` : "—"}</td>
                    <td className="py-3 px-4">
                      <StatusBadge status={b.work_status} />
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={b.audit_status} type="audit" />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedBatchId(b.id);
                        }}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-blue-700 hover:bg-blue-50 transition-colors cursor-pointer"
                        title="View Batch Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-slate-400 italic">
                    No batches assigned matching your current filter.
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
