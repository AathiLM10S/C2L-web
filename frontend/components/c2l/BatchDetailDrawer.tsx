"use client";

import React, { useEffect, useState } from "react";
import { Batch, api } from "@/lib/api";
import { StatusBadge } from "@/components/common/StatusBadge";
import { useAuth } from "@/lib/AuthContext";
import {
  X,
  Clock,
  User as UserIcon,
  Calendar,
  Layers,
  MapPin,
  FileCheck,
  ShieldAlert,
  ExternalLink,
  History,
  CheckCircle2,
  AlertCircle,
  Plus,
  Lock,
} from "lucide-react";

interface BatchDetailDrawerProps {
  batchId: number | null;
  onClose: () => void;
  onRefresh?: () => void;
  canEdit?: boolean;
}

export const BatchDetailDrawer: React.FC<BatchDetailDrawerProps> = ({
  batchId,
  onClose,
  onRefresh,
  canEdit,
}) => {
  const { user } = useAuth();
  const nameLower = (user?.name || "").toLowerCase().trim();
  const emailLower = (user?.email || "").toLowerCase().trim();
  const isBash = nameLower.includes("bash") || emailLower === "jothi.bash@c2l-qc.com";
  const userCanManage =
    user?.role === "ADMIN" ||
    user?.role === "LEAD" ||
    isBash ||
    emailLower === "admin@c2l-qc.com";
  const effectiveCanEdit = canEdit !== undefined ? canEdit : userCanManage;

  const [batch, setBatch] = useState<Batch | null>(null);
  const [loading, setLoading] = useState(false);

  // Add work log state
  const [showAddWorkLog, setShowAddWorkLog] = useState(false);
  const [logWorkType, setLogWorkType] = useState("New");
  const [logStatus, setLogStatus] = useState("IN_PROGRESS");
  const [logHours, setLogHours] = useState("");
  const [logStartDate, setLogStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [logEndDate, setLogEndDate] = useState(new Date().toISOString().split("T")[0]);
  const [logRemarks, setLogRemarks] = useState("");
  const [submittingLog, setSubmittingLog] = useState(false);

  const reloadBatch = () => {
    if (!batchId) return;
    setLoading(true);
    api
      .getBatchDetail(batchId)
      .then((data) => setBatch(data))
      .catch((err) => console.error("Error loading batch detail:", err))
      .finally(() => setLoading(false));
  };

  const handleAddWorkLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchId) return;
    setSubmittingLog(true);
    try {
      await api.addWorkLog(batchId, {
        work_type: logWorkType,
        status: logStatus,
        total_hours: logHours ? Number(logHours) : undefined,
        start_date: logStartDate || undefined,
        end_date: logEndDate || undefined,
        remarks: logRemarks || undefined,
      });
      setShowAddWorkLog(false);
      setLogRemarks("");
      setLogHours("");
      reloadBatch();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert(err.message || "Failed to add work log");
    } finally {
      setSubmittingLog(false);
    }
  };

  useEffect(() => {
    if (!batchId) {
      setBatch(null);
      return;
    }
    reloadBatch();
  }, [batchId]);

  if (!batchId) return null;

  const isClientReady =
    batch?.work_status === "COMPLETED" && batch?.audit_status === "PASSED";

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/30 backdrop-blur-xs transition-opacity">
      <div className="w-full max-w-2xl h-full bg-white border-l border-slate-200 shadow-2xl flex flex-col text-slate-800 overflow-hidden animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="p-6 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center font-bold text-blue-700">
              #{batch?.batch_no || "..."}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                  Batch #{batch?.batch_no}
                </h2>
                {effectiveCanEdit && !isClientReady ? (
                  <select
                    value={batch?.work_status || "YET_TO_START"}
                    onChange={async (e) => {
                      const newStatus = e.target.value;
                      try {
                        await api.updateBatch(batch!.id, { work_status: newStatus });
                        setBatch({ ...batch!, work_status: newStatus });
                        if (onRefresh) onRefresh();
                      } catch (err: any) {
                        alert(err.message || "Failed to update batch status");
                      }
                    }}
                    className="text-xs font-semibold px-2 py-0.5 rounded-lg border border-blue-300 bg-blue-50 text-blue-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                    title="Change Batch Status (Admin, Lead & Jothi Bash)"
                  >
                    <option value="YET_TO_START">Yet to Start</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="ON_HOLD">On Hold</option>
                  </select>
                ) : (
                  <StatusBadge status={batch?.work_status || ""} />
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {batch?.complexity || "Standard Complexity"} • {batch?.location || "Location Not Specified"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Read-Only Notice for Non-Managers */}
        {!effectiveCanEdit && (
          <div className="mx-6 mt-4 p-2.5 rounded-xl bg-amber-50/90 border border-amber-200 text-[11px] text-amber-800 flex items-center space-x-2">
            <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>Read-only inspection. Batch creation and status modifications are restricted to Admin, Lead, and Jothi Bash.</span>
          </div>
        )}

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-blue-600 animate-pulse font-medium text-sm">
              Loading batch lifecycle details...
            </div>
          ) : batch ? (
            <>
              {/* Lifecycle Progress Timeline */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-xs font-bold text-blue-800 uppercase tracking-wider block mb-4">
                  Batch Lifecycle Timeline
                </span>
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  {/* Step 1: Work Started */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                        batch.start_date
                          ? "bg-blue-600 text-white"
                          : "bg-slate-200 text-slate-500"
                      }`}
                    >
                      1
                    </div>
                    <span className="font-medium mt-1.5 text-slate-700">Started</span>
                    <span className="text-[10px] text-slate-500">
                      {batch.start_date || "Pending"}
                    </span>
                  </div>

                  {/* Step 2: Work Completed */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                        batch.work_status === "COMPLETED"
                          ? "bg-blue-600 text-white"
                          : "bg-slate-200 text-slate-500"
                      }`}
                    >
                      2
                    </div>
                    <span className="font-medium mt-1.5 text-slate-700">Work Done</span>
                    <span className="text-[10px] text-slate-500">
                      {batch.work_status === "COMPLETED" ? "Completed" : batch.work_status}
                    </span>
                  </div>

                  {/* Step 3: Audit */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                        batch.audit_status === "PASSED"
                          ? "bg-emerald-600 text-white"
                          : batch.audit_status === "FAILED"
                          ? "bg-rose-600 text-white"
                          : "bg-slate-200 text-slate-500"
                      }`}
                    >
                      3
                    </div>
                    <span className="font-medium mt-1.5 text-slate-700">Audited</span>
                    <span className="text-[10px] text-slate-500">
                      {batch.audit_status}
                    </span>
                  </div>

                  {/* Step 4: Client Ready */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                        isClientReady
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "bg-slate-200 text-slate-500"
                      }`}
                    >
                      4
                    </div>
                    <span className="font-medium mt-1.5 text-slate-700">Client Ready</span>
                    <span className="text-[10px] text-slate-500">
                      {isClientReady ? "Approved" : "In Progress"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Metadata Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] text-slate-500 flex items-center space-x-1.5">
                    <UserIcon className="w-3.5 h-3.5 text-blue-600" />
                    <span>Primary Assignee</span>
                  </span>
                  <p className="text-sm font-semibold text-slate-900 mt-1">
                    {batch.assigned_to?.name || "Unassigned"}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] text-slate-500 flex items-center space-x-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    <span>Total Production Hours</span>
                  </span>
                  <p className="text-sm font-semibold text-slate-900 mt-1">
                    {batch.total_hours ? `${batch.total_hours} hrs` : "Not recorded"}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] text-slate-500 flex items-center space-x-1.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-600" />
                    <span>Location / Group</span>
                  </span>
                  <p className="text-sm font-semibold text-slate-900 mt-1">
                    {batch.location || "N/A"}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] text-slate-500 flex items-center space-x-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    <span>Dates (Start - End)</span>
                  </span>
                  <p className="text-sm font-semibold text-slate-900 mt-1">
                    {batch.start_date || "—"} to {batch.end_date || "—"}
                  </p>
                </div>
              </div>

              {/* Co-Workers / Team Assignments */}
              {batch.co_assignments && batch.co_assignments.length > 0 && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-xs font-bold text-slate-800 block mb-2">
                    Co-Assigned Employees on this Batch:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {batch.co_assignments.map((c) => (
                      <span
                        key={c.id}
                        className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs text-slate-700 shadow-2xs"
                      >
                        {c.user?.name || "Team Member"}{" "}
                        {c.role_note && (
                          <span className="text-blue-600 text-[10px]">({c.role_note})</span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Work Logs (Child Table) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-800 uppercase tracking-wider block">
                    Work History & Entries ({batch.work_logs?.length || 0})
                  </span>
                  {effectiveCanEdit ? (
                    <button
                      onClick={() => setShowAddWorkLog(!showAddWorkLog)}
                      className="px-2.5 py-1 rounded-lg bg-blue-700 hover:bg-blue-600 text-white text-[11px] font-semibold flex items-center space-x-1 shadow-xs transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{showAddWorkLog ? "Cancel" : "Add Work Log"}</span>
                    </button>
                  ) : (
                    <span className="text-[11px] text-slate-400 italic flex items-center space-x-1 bg-slate-100 px-2 py-0.5 rounded-md">
                      <Lock className="w-3 h-3 text-slate-400" />
                      <span>View Only</span>
                    </span>
                  )}
                </div>

                {/* Add Work Log Form */}
                {showAddWorkLog && (
                  <form
                    onSubmit={handleAddWorkLog}
                    className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 space-y-3 text-xs animate-in fade-in"
                  >
                    <span className="font-bold text-slate-900 block">Record New Work Entry</span>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-700 mb-1 font-medium">Work Type</label>
                        <select
                          value={logWorkType}
                          onChange={(e) => setLogWorkType(e.target.value)}
                          className="w-full p-2 rounded-lg bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-500"
                        >
                          <option value="New">New</option>
                          <option value="Rework">Rework</option>
                          <option value="Continue">Continue</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-slate-700 mb-1 font-medium">Work Status</label>
                        <select
                          value={logStatus}
                          onChange={(e) => setLogStatus(e.target.value)}
                          className="w-full p-2 rounded-lg bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-500"
                        >
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="COMPLETED">Completed</option>
                          <option value="ON_HOLD">On Hold</option>
                          <option value="YET_TO_START">Yet to Start</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-slate-700 mb-1 font-medium">Hours</label>
                        <input
                          type="number"
                          step="0.5"
                          placeholder="e.g. 4.0"
                          value={logHours}
                          onChange={(e) => setLogHours(e.target.value)}
                          className="w-full p-2 rounded-lg bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 mb-1 font-medium">Start Date</label>
                        <input
                          type="date"
                          value={logStartDate}
                          onChange={(e) => setLogStartDate(e.target.value)}
                          className="w-full p-2 rounded-lg bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 mb-1 font-medium">End Date</label>
                        <input
                          type="date"
                          value={logEndDate}
                          onChange={(e) => setLogEndDate(e.target.value)}
                          className="w-full p-2 rounded-lg bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-700 mb-1 font-medium">Work Remarks / Activities</label>
                      <input
                        type="text"
                        placeholder="Detail of engineering done, revision changes..."
                        value={logRemarks}
                        onChange={(e) => setLogRemarks(e.target.value)}
                        className="w-full p-2 rounded-lg bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="flex justify-end space-x-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowAddWorkLog(false)}
                        className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submittingLog}
                        className="px-3 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-600 text-white font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
                      >
                        {submittingLog ? "Saving..." : "Save Work Log"}
                      </button>
                    </div>
                  </form>
                )}

                {batch.work_logs && batch.work_logs.length > 0 ? (
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-600 uppercase text-[10px] font-semibold">
                        <tr>
                          <th className="p-2.5">Work Type</th>
                          <th className="p-2.5">Employee</th>
                          <th className="p-2.5">Start - End</th>
                          <th className="p-2.5">Hours</th>
                          <th className="p-2.5">Status</th>
                          <th className="p-2.5">Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {batch.work_logs.map((log) => (
                          <tr key={log.id} className="hover:bg-slate-50">
                            <td className="p-2.5 font-semibold text-slate-900">
                              {log.work_type || "New"}
                            </td>
                            <td className="p-2.5 text-slate-700">{log.employee?.name || "—"}</td>
                            <td className="p-2.5 text-slate-500">
                              {log.start_date || "—"} to {log.end_date || "—"}
                            </td>
                            <td className="p-2.5 text-slate-700 font-mono">{log.total_hours ? `${log.total_hours}h` : "—"}</td>
                            <td className="p-2.5">
                              <StatusBadge status={log.status} />
                            </td>
                            <td className="p-2.5 text-slate-600 max-w-xs truncate" title={log.remarks || ""}>
                              {log.remarks || "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No child work logs registered.</p>
                )}
              </div>

              {/* Operational Remarks */}
              {batch.current_remarks && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <span className="font-bold text-slate-800 block mb-1">
                    Operational Remarks:
                  </span>
                  <p className="text-slate-600 whitespace-pre-line leading-relaxed">
                    {batch.current_remarks}
                  </p>
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};
