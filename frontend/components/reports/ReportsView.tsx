"use client";

import React, { useState, useEffect } from "react";
import { Batch, User, api } from "@/lib/api";
import {
  Download,
  Filter,
  FileSpreadsheet,
} from "lucide-react";

interface ReportsViewProps {
  initialUsers: User[];
  initialBatches: Batch[];
}

export function ReportsView({ initialUsers, initialBatches }: ReportsViewProps) {
  const [users] = useState<User[]>(initialUsers);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState("ALL");
  const [batchType, setBatchType] = useState("ALL");
  const [assignedToId, setAssignedToId] = useState("ALL");

  // Live preview counts
  const [previewBatches, setPreviewBatches] = useState<Batch[]>(initialBatches);

  const fetchPreview = async () => {
    try {
      const data = await api.getBatches({
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        status: status === "ALL" ? undefined : status,
        batch_type: batchType === "ALL" ? undefined : batchType,
        assigned_to_id: assignedToId === "ALL" ? undefined : Number(assignedToId),
        limit: 500,
      });
      setPreviewBatches(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPreview();
  }, [startDate, endDate, status, batchType, assignedToId]);

  const total = previewBatches.length;
  const completed = previewBatches.filter((b) => b.work_status === "COMPLETED").length;
  const clientReady = previewBatches.filter((b) => b.work_status === "COMPLETED" && b.audit_status === "PASSED").length;
  const inProgress = previewBatches.filter((b) => b.work_status === "IN_PROGRESS").length;

  const handleDownload = (format: "excel" | "csv") => {
    const fn = format === "excel" ? api.getExcelReportUrl : api.getCSVReportUrl;
    const url = fn({
      start_date: startDate || undefined,
      end_date: endDate || undefined,
      status: status === "ALL" ? undefined : status,
      batch_type: batchType === "ALL" ? undefined : batchType,
      assigned_to_id: assignedToId === "ALL" ? undefined : assignedToId,
    });
    window.open(url, "_blank");
  };

  return (
    <div className="space-y-6">
      {/* Filter Workspace */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
        <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
          <Filter className="w-4 h-4 text-blue-700" />
          <span>Report Parameters & Date Filtering</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
          {/* Start Date */}
          <div>
            <label className="block text-slate-700 font-medium mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-slate-700 font-medium mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Work Status */}
          <div>
            <label className="block text-slate-700 font-medium mb-1">Work Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="COMPLETED">Completed</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="YET_TO_START">Yet to Start</option>
              <option value="ON_HOLD">On Hold</option>
            </select>
          </div>

          {/* Batch Type */}
          <div>
            <label className="block text-slate-700 font-medium mb-1">Batch Type</label>
            <select
              value={batchType}
              onChange={(e) => setBatchType(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Types</option>
              <option value="7-Digit">7-Digit</option>
              <option value="10-Digit">10-Digit</option>
            </select>
          </div>

          {/* Employee */}
          <div>
            <label className="block text-slate-700 font-medium mb-1">Employee</label>
            <select
              value={assignedToId}
              onChange={(e) => setAssignedToId(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Personnel</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between pt-3 border-t border-slate-200 gap-3">
          <div className="text-xs text-slate-500">
            Filter matches <strong className="text-slate-900">{total}</strong> batches in database
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => handleDownload("excel")}
              className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center space-x-2 shadow-xs transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Download Excel (.xlsx)</span>
            </button>

            <button
              onClick={() => handleDownload("csv")}
              className="px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-600 text-white font-bold text-xs flex items-center space-x-2 shadow-xs transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Matching Batches</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{total}</div>
        </div>
        <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/80 shadow-2xs">
          <span className="text-xs text-emerald-800 font-medium">Work Completed</span>
          <div className="text-2xl font-bold text-emerald-700 mt-1">{completed}</div>
        </div>
        <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200/80 shadow-2xs">
          <span className="text-xs text-blue-800 font-medium">In Progress</span>
          <div className="text-2xl font-bold text-blue-700 mt-1">{inProgress}</div>
        </div>
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 shadow-xs">
          <span className="text-xs text-emerald-800 font-medium">Client-Ready Batches</span>
          <div className="text-2xl font-bold text-emerald-700 mt-1">{clientReady}</div>
        </div>
      </div>
    </div>
  );
}
