"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { WorkLog, Batch, User, api } from "@/lib/api";
import { StatusBadge } from "@/components/common/StatusBadge";
import { BatchDetailDrawer } from "@/components/c2l/BatchDetailDrawer";
import {
  Search,
  Download,
  Plus,
  X,
  FileSpreadsheet,
  Clock,
  CheckCircle2,
  PlayCircle,
  Eye,
  Pencil,
  ShieldCheck,
} from "lucide-react";


interface MasterLogViewProps {
  initialLogs: WorkLog[];
  initialBatches: Batch[];
  initialUsers: User[];
}

export function MasterLogView({
  initialLogs,
  initialBatches,
  initialUsers,
}: MasterLogViewProps) {
  const { user } = useAuth();
  const nameLower = (user?.name || "").toLowerCase().trim();
  const emailLower = (user?.email || "").toLowerCase().trim();
  const isBash = nameLower.includes("bash") || emailLower === "jothibash.n@solidpro-es.com";
  const canManageBatch =
    user?.role === "ADMIN" ||
    user?.role === "LEAD" ||
    isBash ||
    emailLower === "dharunkumar.j@solidpro-es.com";

  const [logs, setLogs] = useState<WorkLog[]>(initialLogs);
  const [batches] = useState<Batch[]>(initialBatches);
  const [users] = useState<User[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [employeeFilter, setEmployeeFilter] = useState<string>("ALL");
  const [selectedBatchId, setSelectedBatchId] = useState<number | null>(null);

  // Create Batch / Log Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBatchNo, setNewBatchNo] = useState("");
  const [newBatchType, setNewBatchType] = useState("7-Digit");
  const [newLocation, setNewLocation] = useState("Wide Island");
  const [newWorkType, setNewWorkType] = useState("New");
  const [newAssigneeId, setNewAssigneeId] = useState<string>("");
  const [customLocations, setCustomLocations] = useState<string[]>([]);
  const [isAddingLocation, setIsAddingLocation] = useState(false);
  const [newLocationInput, setNewLocationInput] = useState("");
  const [customBatchTypes, setCustomBatchTypes] = useState<string[]>([]);
  const [isAddingBatchType, setIsAddingBatchType] = useState(false);
  const [newBatchTypeInput, setNewBatchTypeInput] = useState("");

  const defaultLocations = ["Reach-in", "Wide Island", "Insight"];
  const existingLocations = Array.from(
    new Set([
      ...defaultLocations,
      ...batches.map((b) => b.location?.trim()).filter(Boolean) as string[],
      ...logs.map((l) => l.location?.trim()).filter(Boolean) as string[],
      ...customLocations,
    ])
  ).sort();

  const defaultBatchTypes = ["7-Digit", "10-Digit"];
  const existingBatchTypes = Array.from(
    new Set([
      ...defaultBatchTypes,
      ...batches.map((b) => b.batch_type?.trim()).filter(Boolean) as string[],
      ...logs.map((l) => l.batch_type?.trim()).filter(Boolean) as string[],
      ...customBatchTypes,
    ])
  ).sort();
  const [newWorkStatus, setNewWorkStatus] = useState("IN_PROGRESS");
  const [newHours, setNewHours] = useState("");
  const [newStartDate, setNewStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [newEndDate, setNewEndDate] = useState("");
  const [newRemarks, setNewRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const refreshLogs = async () => {
    try {
      const data = await api.getWorkLogs({ limit: 500 });
      setLogs(data);
    } catch (e) {
      console.error(e);
    }
  };

  // Edit Work Log Modal State (Anyone can edit master log entries)
  const [editingLog, setEditingLog] = useState<WorkLog | null>(null);
  const [editWorkType, setEditWorkType] = useState("New");
  const [editStatus, setEditStatus] = useState("IN_PROGRESS");
  const [editHours, setEditHours] = useState("");
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");
  const [editAssigneeId, setEditAssigneeId] = useState<string>("");
  const [editRemarks, setEditRemarks] = useState("");
  const [submittingEdit, setSubmittingEdit] = useState(false);

  const handleOpenEditLog = (l: WorkLog) => {
    setEditingLog(l);
    setEditWorkType(l.work_type || "New");
    setEditStatus(l.status || "IN_PROGRESS");
    setEditHours(l.total_hours !== undefined && l.total_hours !== null ? String(l.total_hours) : "");
    setEditStartDate(l.start_date || "");
    setEditEndDate(l.end_date || "");
    setEditAssigneeId(l.assigned_to_id ? String(l.assigned_to_id) : (l.employee?.id ? String(l.employee.id) : ""));
    setEditRemarks(l.remarks || "");
  };

  const handleSaveEditLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLog) return;
    setSubmittingEdit(true);
    try {
      await api.updateWorkLog(editingLog.id, {
        work_type: editWorkType,
        status: editStatus,
        total_hours: editHours ? Number(editHours) : undefined,
        start_date: editStartDate || undefined,
        end_date: editEndDate || undefined,
        assigned_to_id: editAssigneeId ? Number(editAssigneeId) : undefined,
        remarks: editRemarks || undefined,
      });
      setEditingLog(null);
      refreshLogs();
    } catch (err: any) {
      alert(err.message || "Failed to update work log");
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleCreateLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBatchNo) {
      alert("Batch Number is required");
      return;
    }
    setSubmitting(true);
    try {
      // First ensure batch exists or create it
      const newB = await api.createBatch({
        batch_no: newBatchNo,
        batch_type: newBatchType,
        location: newLocation,
        assigned_to_id: newAssigneeId ? Number(newAssigneeId) : user?.id,
        work_status: newWorkStatus,
        start_date: newStartDate,
        end_date: newEndDate || undefined,
        total_hours: newHours ? Number(newHours) : undefined,
        current_remarks: newRemarks || undefined,
      });

      // Add work log
      await api.addWorkLog(newB.id, {
        work_type: newWorkType,
        assigned_to_id: newAssigneeId ? Number(newAssigneeId) : user?.id,
        start_date: newStartDate,
        end_date: newEndDate || undefined,
        total_hours: newHours ? Number(newHours) : undefined,
        status: newWorkStatus,
        remarks: newRemarks || undefined,
      });

      setShowCreateModal(false);
      setNewBatchNo("");
      setNewRemarks("");
      setNewHours("");
      refreshLogs();
    } catch (err: any) {
      alert(err.message || "Failed to create log entry");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (statusFilter !== "ALL") {
      const norm = (log.status || "").toUpperCase();
      if (statusFilter === "IN_PROGRESS" && norm !== "IN_PROGRESS") return false;
      if (statusFilter === "COMPLETED" && norm !== "COMPLETED") return false;
      if (statusFilter === "ON_HOLD" && norm !== "ON_HOLD") return false;
      if (statusFilter === "YET_TO_START" && norm !== "YET_TO_START") return false;
    }
    if (employeeFilter !== "ALL" && log.assigned_to_id !== Number(employeeFilter)) {
      return false;
    }
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      (log.batch_no && log.batch_no.toLowerCase().includes(s)) ||
      (log.employee?.name && log.employee.name.toLowerCase().includes(s)) ||
      (log.location && log.location.toLowerCase().includes(s)) ||
      (log.work_type && log.work_type.toLowerCase().includes(s)) ||
      (log.batch_type && log.batch_type.toLowerCase().includes(s)) ||
      (log.remarks && log.remarks.toLowerCase().includes(s))
    );
  });

  const totalLogs = logs.length;
  const completedLogs = logs.filter((l) => l.status === "COMPLETED").length;
  const inProgressLogs = logs.filter((l) => l.status === "IN_PROGRESS").length;
  const totalHours = logs.reduce((acc, curr) => acc + (curr.total_hours || 0), 0);

  return (
    <div className="space-y-6">
      {/* KPI Cards Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total C2L Log Entries
            </span>
            <FileSpreadsheet className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{totalLogs}</div>
          <span className="text-[10px] text-slate-500">Exact records from C2L_Log.csv</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
              Completed Batches
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-700">{completedLogs}</div>
          <span className="text-[10px] text-emerald-600">Production work signed off</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
              In Progress
            </span>
            <PlayCircle className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-extrabold text-blue-700">{inProgressLogs}</div>
          <span className="text-[10px] text-blue-600">Active design & model cleanup</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">
              Total Logged Hours
            </span>
            <Clock className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-extrabold text-indigo-700">
            {totalHours.toFixed(1)} <span className="text-xs font-semibold text-slate-500">hrs</span>
          </div>
          <span className="text-[10px] text-indigo-600">Cumulative CAD engineering effort</span>
        </div>
      </div>

      {/* Action & Filter Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search batch #, staff, location, remarks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="py-2 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="COMPLETED">Completed</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="ON_HOLD">On Hold</option>
            <option value="YET_TO_START">Yet to Start</option>
          </select>

          <select
            value={employeeFilter}
            onChange={(e) => setEmployeeFilter(e.target.value)}
            className="py-2 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="ALL">All Staff</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-600 text-white font-semibold text-xs flex items-center space-x-1.5 shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Work Log</span>
          </button>

          <a
            href={`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api"}/reports/excel`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs flex items-center space-x-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </a>
        </div>
      </div>

      {/* C2L Log Table matching exact C2L_Log.csv */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
              <tr>
                <th className="p-3.5 w-12 text-center">Sl.No</th>
                <th className="p-3.5">Batch No</th>
                <th className="p-3.5">Assigned To</th>
                <th className="p-3.5">Batch Type</th>
                <th className="p-3.5">Location</th>
                <th className="p-3.5">Work Type</th>
                <th className="p-3.5">Dates</th>
                <th className="p-3.5">Hours</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">QC Status</th>
                <th className="p-3.5">QC Reviewer</th>
                <th className="p-3.5">Remarks</th>
                <th className="p-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((l) => (
                  <tr
                    key={l.id}
                    onClick={() => setSelectedBatchId(l.batch_id)}
                    className="hover:bg-blue-50/40 cursor-pointer transition-colors"
                  >
                    <td className="p-3.5 text-center font-mono text-slate-400">
                      {l.sl_no ?? l.id}
                    </td>
                    <td className="p-3.5 font-bold text-slate-900 font-mono">
                      <span className="text-blue-700 font-semibold">#{l.batch_no}</span>
                    </td>
                    <td className="p-3.5 font-medium text-slate-800 whitespace-nowrap">
                      {l.employee?.name || "—"}
                    </td>
                    <td className="p-3.5 whitespace-nowrap text-slate-600">
                      {l.batch_type || "—"}
                    </td>
                    <td className="p-3.5 whitespace-nowrap text-slate-600">
                      {l.location || "—"}
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-semibold">
                        {l.work_type || "New"}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-500 whitespace-nowrap text-[11px]">
                      {l.start_date || l.end_date
                        ? `${l.start_date || "—"} → ${l.end_date || "—"}`
                        : "—"}
                    </td>
                    <td className="p-3.5 font-mono text-slate-800 whitespace-nowrap">
                      {l.total_hours ? `${l.total_hours} hrs` : "—"}
                    </td>
                    <td className="p-3.5">
                      <StatusBadge status={l.status} />
                    </td>
                    <td className="p-3.5">
                      <StatusBadge status={l.qc_status} type="qc" />
                    </td>
                    <td className="p-3.5 whitespace-nowrap text-slate-600">
                      {l.qc_reviewer?.name || "—"}
                    </td>
                    <td className="p-3.5 max-w-xs truncate text-slate-500" title={l.remarks || ""}>
                      {l.remarks || "—"}
                    </td>
                    <td className="p-3.5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => handleOpenEditLog(l)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-blue-700 hover:bg-blue-50 transition-colors cursor-pointer"
                          title="Edit Work Log"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setSelectedBatchId(l.batch_id)}
                          className="p-1.5 rounded-lg text-blue-700 hover:bg-blue-100/60 transition-colors cursor-pointer"
                          title="View Batch Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={13} className="p-8 text-center text-slate-400">
                    No work logs found matching your filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawer */}
      {selectedBatchId && (
        <BatchDetailDrawer
          batchId={selectedBatchId}
          onClose={() => setSelectedBatchId(null)}
          onRefresh={refreshLogs}
          canEdit={true}
        />
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-blue-700 text-white">
              <h3 className="font-bold text-sm">Create New Batch / Work Log</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateLog} className="p-6 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Batch Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 520"
                  value={newBatchNo}
                  onChange={(e) => setNewBatchNo(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700">Batch Type</label>
                    {!isAddingBatchType && (
                      <button
                        type="button"
                        onClick={() => setIsAddingBatchType(true)}
                        className="text-[10px] text-blue-700 hover:text-blue-800 font-bold flex items-center space-x-0.5 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add</span>
                      </button>
                    )}
                  </div>
                  {isAddingBatchType ? (
                    <div className="flex items-center space-x-1">
                      <input
                        type="text"
                        autoFocus
                        placeholder="e.g. 12-Digit"
                        value={newBatchTypeInput}
                        onChange={(e) => setNewBatchTypeInput(e.target.value)}
                        className="flex-1 py-1.5 px-2 rounded-lg border border-blue-400 text-slate-900 focus:outline-none text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newBatchTypeInput.trim()) {
                            const val = newBatchTypeInput.trim();
                            setCustomBatchTypes((prev) => [...prev, val]);
                            setNewBatchType(val);
                            setNewBatchTypeInput("");
                            setIsAddingBatchType(false);
                          }
                        }}
                        className="px-2 py-1.5 rounded-lg bg-blue-700 text-white font-semibold text-xs cursor-pointer"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsAddingBatchType(false)}
                        className="px-1.5 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-xs cursor-pointer hover:bg-slate-200"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <select
                      value={newBatchType}
                      onChange={(e) => setNewBatchType(e.target.value)}
                      className="w-full py-2 px-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      {existingBatchTypes.map((bt) => (
                        <option key={bt} value={bt}>
                          {bt}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700">Location</label>
                    {!isAddingLocation && (
                      <button
                        type="button"
                        onClick={() => setIsAddingLocation(true)}
                        className="text-[10px] text-blue-700 hover:text-blue-800 font-bold flex items-center space-x-0.5 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Location</span>
                      </button>
                    )}
                  </div>
                  {isAddingLocation ? (
                    <div className="flex items-center space-x-1">
                      <input
                        type="text"
                        autoFocus
                        placeholder="Location name..."
                        value={newLocationInput}
                        onChange={(e) => setNewLocationInput(e.target.value)}
                        className="flex-1 py-1.5 px-2 rounded-lg border border-blue-400 text-slate-900 focus:outline-none text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newLocationInput.trim()) {
                            const val = newLocationInput.trim();
                            setCustomLocations((prev) => [...prev, val]);
                            setNewLocation(val);
                            setNewLocationInput("");
                            setIsAddingLocation(false);
                          }
                        }}
                        className="px-2 py-1.5 rounded-lg bg-blue-700 text-white font-semibold text-xs cursor-pointer"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsAddingLocation(false)}
                        className="px-1.5 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-xs cursor-pointer hover:bg-slate-200"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1.5">
                      <select
                        value={newLocation}
                        onChange={(e) => setNewLocation(e.target.value)}
                        className="flex-1 py-2 px-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
                      >
                        <option value="">Select Location...</option>
                        {existingLocations.map((loc) => (
                          <option key={loc} value={loc}>
                            {loc}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => setIsAddingLocation(true)}
                        className="px-2.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-semibold whitespace-nowrap flex items-center space-x-1 cursor-pointer transition-colors"
                        title="Add Location"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Assignee</label>
                  <select
                    value={newAssigneeId}
                    onChange={(e) => setNewAssigneeId(e.target.value)}
                    className="w-full py-2 px-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Myself ({user?.name})</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Work Type</label>
                  <select
                    value={newWorkType}
                    onChange={(e) => setNewWorkType(e.target.value)}
                    className="w-full py-2 px-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="New">New</option>
                    <option value="Rework">Rework</option>
                    <option value="Continue">Continue</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={newWorkStatus}
                    onChange={(e) => setNewWorkStatus(e.target.value)}
                    className="w-full py-2 px-2 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="ON_HOLD">On Hold</option>
                    <option value="YET_TO_START">Yet to Start</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                    className="w-full py-2 px-2 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Hours</label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="8.0"
                    value={newHours}
                    onChange={(e) => setNewHours(e.target.value)}
                    className="w-full py-2 px-2 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Remarks</label>
                <textarea
                  rows={2}
                  placeholder="Task progress notes..."
                  value={newRemarks}
                  onChange={(e) => setNewRemarks(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-blue-700 text-white font-semibold hover:bg-blue-600 disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? "Saving..." : "Save Entry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Work Log Modal (Available to all team members) */}
      {editingLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-blue-700 text-white">
              <div className="flex items-center space-x-2">
                <Pencil className="w-4 h-4" />
                <h3 className="font-bold text-sm">
                  Edit Work Log: Batch #{editingLog.batch_no || editingLog.batch_id}
                </h3>
              </div>
              <button
                onClick={() => setEditingLog(null)}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditLog} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Assignee</label>
                  <select
                    value={editAssigneeId}
                    onChange={(e) => setEditAssigneeId(e.target.value)}
                    className="w-full py-2 px-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Select Assignee</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Work Type</label>
                  <select
                    value={editWorkType}
                    onChange={(e) => setEditWorkType(e.target.value)}
                    className="w-full py-2 px-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="New">New</option>
                    <option value="Rework">Rework</option>
                    <option value="Continue">Continue</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full py-2 px-2 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="ON_HOLD">On Hold</option>
                    <option value="YET_TO_START">Yet to Start</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={editStartDate}
                    onChange={(e) => setEditStartDate(e.target.value)}
                    className="w-full py-2 px-2 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={editEndDate}
                    onChange={(e) => setEditEndDate(e.target.value)}
                    className="w-full py-2 px-2 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Hours Logged</label>
                <input
                  type="number"
                  step="0.5"
                  placeholder="e.g. 8.0"
                  value={editHours}
                  onChange={(e) => setEditHours(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Remarks</label>
                <textarea
                  rows={2}
                  placeholder="Worklog progress notes..."
                  value={editRemarks}
                  onChange={(e) => setEditRemarks(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingLog(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingEdit}
                  className="px-4 py-2 rounded-xl bg-blue-700 text-white font-semibold hover:bg-blue-600 disabled:opacity-50 cursor-pointer"
                >
                  {submittingEdit ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

