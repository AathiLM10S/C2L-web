"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { Batch, User, api } from "@/lib/api";
import { StatusBadge } from "@/components/common/StatusBadge";
import { BatchDetailDrawer } from "@/components/c2l/BatchDetailDrawer";
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  PauseCircle,
  PlayCircle,
  Search,
  Filter,
  Download,
  Eye,
  Layers,
  Plus,
  X,
  Pencil,
  ShieldCheck,
  Lock,
  AlertCircle,
} from "lucide-react";

interface BatchStatusReportViewProps {
  initialBatches: Batch[];
  initialUsers: User[];
}

export function BatchStatusReportView({
  initialBatches,
  initialUsers,
}: BatchStatusReportViewProps) {
  const { user } = useAuth();
  const [batches, setBatches] = useState<Batch[]>(initialBatches);
  const [users] = useState<User[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [employeeFilter, setEmployeeFilter] = useState<string>("ALL");
  const [selectedBatchId, setSelectedBatchId] = useState<number | null>(null);

  // Permission: restricted to Admin, Lead, and Jothi Bash
  const nameLower = (user?.name || "").toLowerCase().trim();
  const emailLower = (user?.email || "").toLowerCase().trim();
  const isBash =
    nameLower.includes("bash") ||
    emailLower === "jothibash.n@solidpro-es.com" ||
    emailLower === "jothi.bash@c2l-qc.com";
  const canManageBatch =
    user?.role === "ADMIN" ||
    user?.role === "LEAD" ||
    isBash ||
    emailLower === "dharunkumar.j@solidpro-es.com" ||
    emailLower === "admin@c2l-qc.com";

  // Notifications
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Create Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createBatchNo, setCreateBatchNo] = useState("");
  const [createComplexity, setCreateComplexity] = useState("3-7/10 digit part numbers");
  const [createLocation, setCreateLocation] = useState("Reach-in");
  const [createAssigneeId, setCreateAssigneeId] = useState<string>("");
  const [customLocations, setCustomLocations] = useState<string[]>([]);
  const [isAddingLocation, setIsAddingLocation] = useState(false);
  const [newLocationInput, setNewLocationInput] = useState("");
  const [customComplexities, setCustomComplexities] = useState<string[]>([]);
  const [isAddingComplexity, setIsAddingComplexity] = useState(false);
  const [newComplexityInput, setNewComplexityInput] = useState("");

  const defaultLocations = ["Reach-in", "Wide Island", "Insight"];
  const existingLocations = Array.from(
    new Set([
      ...defaultLocations,
      ...batches.map((b) => b.location?.trim()).filter(Boolean) as string[],
      ...customLocations,
    ])
  ).sort();

  const defaultComplexities = [
    "3-7/10 digit part numbers",
    "10-Purchased Parts",
    "2-Rev/Description Update",
    "1-Rev/Description",
    "11-Purchased Assemblies",
    "13-Non Graphic Part",
    "5-instructions/dimensional application dwg",
  ];
  const existingComplexities = Array.from(
    new Set([
      ...defaultComplexities,
      ...batches.map((b) => b.complexity?.trim()).filter(Boolean) as string[],
      ...customComplexities,
    ])
  ).sort();
  const [createWorkStatus, setCreateWorkStatus] = useState("IN_PROGRESS");
  const [createHours, setCreateHours] = useState("");
  const [createStartDate, setCreateStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [createEndDate, setCreateEndDate] = useState("");
  const [createRemarks, setCreateRemarks] = useState("");
  const [submittingCreate, setSubmittingCreate] = useState(false);

  // Edit Modal State
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
  const [editWorkStatus, setEditWorkStatus] = useState("IN_PROGRESS");
  const [editAuditStatus, setEditAuditStatus] = useState("YET_TO_START");
  const [editComplexity, setEditComplexity] = useState("Standard");
  const [editLocation, setEditLocation] = useState("");
  const [editAssigneeId, setEditAssigneeId] = useState<string>("");
  const [editHours, setEditHours] = useState("");
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");
  const [editRemarks, setEditRemarks] = useState("");
  const [submittingEdit, setSubmittingEdit] = useState(false);

  // Filter batches locally for instant latency-free updates
  const filtered = batches.filter((b) => {
    if (statusFilter !== "ALL") {
      const norm = (b.work_status || "").toUpperCase();
      if (statusFilter === "IN_PROGRESS" && norm !== "IN_PROGRESS") return false;
      if (statusFilter === "COMPLETED" && norm !== "COMPLETED") return false;
      if (statusFilter === "ON_HOLD" && norm !== "ON_HOLD") return false;
      if (statusFilter === "YET_TO_START" && norm !== "YET_TO_START" && norm !== "") return false;
    }
    if (employeeFilter !== "ALL" && b.assigned_to_id !== Number(employeeFilter)) {
      return false;
    }
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      b.batch_no.toLowerCase().includes(s) ||
      (b.assigned_to?.name && b.assigned_to.name.toLowerCase().includes(s)) ||
      (b.location && b.location.toLowerCase().includes(s)) ||
      (b.current_remarks && b.current_remarks.toLowerCase().includes(s))
    );
  });

  const totalCount = batches.length;
  const inProgressCount = batches.filter((b) => b.work_status === "IN_PROGRESS").length;
  const completedCount = batches.filter((b) => b.work_status === "COMPLETED").length;
  const onHoldCount = batches.filter((b) => b.work_status === "ON_HOLD").length;
  const yetToStartCount = batches.filter(
    (b) => b.work_status === "YET_TO_START" || !b.work_status
  ).length;

  const refreshBatches = async () => {
    try {
      const updated = await api.getBatches({ limit: 400 });
      setBatches(updated);
    } catch (e) {
      console.error(e);
    }
  };

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Quick 1-click status update from table
  const handleQuickStatusChange = async (batchId: number, newStatus: string) => {
    if (!canManageBatch) {
      showNotification("error", "Permission denied: Batch status can only be edited by Admin, Lead, or Jothi Bash.");
      return;
    }
    try {
      await api.updateBatch(batchId, { work_status: newStatus });
      setBatches((prev) =>
        prev.map((b) => (b.id === batchId ? { ...b, work_status: newStatus } : b))
      );
      showNotification("success", `Batch status updated to ${newStatus}`);
    } catch (err: any) {
      showNotification("error", err.message || "Failed to update status");
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (batch: Batch, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canManageBatch) {
      showNotification("error", "Permission denied: Batch status can only be edited by Admin, Lead, or Jothi Bash.");
      return;
    }
    setEditingBatch(batch);
    setEditWorkStatus(batch.work_status || "IN_PROGRESS");
    setEditAuditStatus(batch.audit_status || "YET_TO_START");
    setEditComplexity(batch.complexity || "Standard");
    setEditLocation(batch.location || "");
    setEditAssigneeId(batch.assigned_to_id ? String(batch.assigned_to_id) : "");
    setEditHours(batch.total_hours ? String(batch.total_hours) : "");
    setEditStartDate(batch.start_date || "");
    setEditEndDate(batch.end_date || "");
    setEditRemarks(batch.current_remarks || "");
  };

  // Save Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBatch) return;
    if (!canManageBatch) {
      showNotification("error", "Permission denied: Batch status can only be edited by Admin, Lead, or Jothi Bash.");
      return;
    }
    setSubmittingEdit(true);
    try {
      const updated = await api.updateBatch(editingBatch.id, {
        work_status: editWorkStatus,
        audit_status: editAuditStatus,
        complexity: editComplexity,
        location: editLocation || undefined,
        assigned_to_id: editAssigneeId ? Number(editAssigneeId) : undefined,
        total_hours: editHours ? Number(editHours) : undefined,
        start_date: editStartDate || undefined,
        end_date: editEndDate || undefined,
        current_remarks: editRemarks || undefined,
      });
      setBatches((prev) => prev.map((b) => (b.id === editingBatch.id ? updated : b)));
      setEditingBatch(null);
      showNotification("success", `Batch #${updated.batch_no} updated successfully`);
    } catch (err: any) {
      showNotification("error", err.message || "Failed to update batch");
    } finally {
      setSubmittingEdit(false);
    }
  };

  // Save Create
  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageBatch) {
      showNotification("error", "Permission denied: Batch creation is restricted to Admin, Lead, and Jothi Bash.");
      return;
    }
    if (!createBatchNo.trim()) {
      showNotification("error", "Batch Number is required");
      return;
    }
    setSubmittingCreate(true);
    try {
      const created = await api.createBatch({
        batch_no: createBatchNo.trim(),
        complexity: createComplexity,
        location: createLocation,
        assigned_to_id: createAssigneeId ? Number(createAssigneeId) : undefined,
        work_status: createWorkStatus,
        start_date: createStartDate || undefined,
        end_date: createEndDate || undefined,
        total_hours: createHours ? Number(createHours) : undefined,
        current_remarks: createRemarks || undefined,
      });
      setShowCreateModal(false);
      setCreateBatchNo("");
      setCreateRemarks("");
      setCreateHours("");
      refreshBatches();
      showNotification("success", `Batch #${created.batch_no} created successfully`);
    } catch (err: any) {
      showNotification("error", err.message || "Failed to create batch");
    } finally {
      setSubmittingCreate(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs font-semibold animate-in fade-in slide-in-from-top-2 ${
            notification.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          <div className="flex items-center space-x-2">
            {notification.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Access Permission Banner */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div
            className={`p-2 rounded-xl ${
              canManageBatch
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-amber-50 text-amber-700 border border-amber-200"
            }`}
          >
            {canManageBatch ? (
              <ShieldCheck className="w-5 h-5" />
            ) : (
              <Lock className="w-5 h-5" />
            )}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-800">
                Batch Status & Management Access Policy
              </span>
              {canManageBatch ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center space-x-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Authorized (Admin, Lead & Jothi Bash)</span>
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center space-x-1">
                  <Lock className="w-3 h-3" />
                  <span>View Only Mode</span>
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Batches can only be added or have their status edited by{" "}
              <strong className="text-slate-700">Admin</strong>,{" "}
              <strong className="text-slate-700">Lead</strong>, and{" "}
              <strong className="text-slate-700">Jothi Bash</strong>.
              {!canManageBatch && " Other roles have inspection-only rights."}
            </p>
          </div>
        </div>

        {canManageBatch && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-600 text-white font-semibold text-xs flex items-center space-x-1.5 shadow-xs transition-all cursor-pointer self-start sm:self-auto shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Batch</span>
          </button>
        )}
      </div>

      {/* Top Interactive KPI Filter Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {/* All Batches */}
        <button
          onClick={() => setStatusFilter("ALL")}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === "ALL"
              ? "bg-blue-50 border-blue-600 shadow-xs"
              : "bg-white border-slate-200 hover:border-slate-300 shadow-2xs"
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
              All Batches
            </span>
            <Layers className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{totalCount}</div>
          <span className="text-[10px] text-slate-500 mt-1 block">Full production scope</span>
        </button>

        {/* In Progress */}
        <button
          onClick={() => setStatusFilter("IN_PROGRESS")}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === "IN_PROGRESS"
              ? "bg-blue-50 border-blue-600 shadow-xs"
              : "bg-white border-slate-200 hover:border-blue-200 shadow-2xs"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
              In Progress
            </span>
            <PlayCircle className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-700">{inProgressCount}</div>
          <span className="text-[10px] text-blue-600 mt-1 block">Active engineering</span>
        </button>

        {/* Completed */}
        <button
          onClick={() => setStatusFilter("COMPLETED")}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === "COMPLETED"
              ? "bg-emerald-50 border-emerald-600 shadow-xs"
              : "bg-white border-slate-200 hover:border-emerald-200 shadow-2xs"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
              Completed
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700">{completedCount}</div>
          <span className="text-[10px] text-emerald-600 mt-1 block">Work finished</span>
        </button>

        {/* On Hold */}
        <button
          onClick={() => setStatusFilter("ON_HOLD")}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === "ON_HOLD"
              ? "bg-amber-50 border-amber-600 shadow-xs"
              : "bg-white border-slate-200 hover:border-amber-200 shadow-2xs"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
              On Hold
            </span>
            <PauseCircle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-700">{onHoldCount}</div>
          <span className="text-[10px] text-amber-600 mt-1 block">Blocked / Info req.</span>
        </button>

        {/* Yet To Start */}
        <button
          onClick={() => setStatusFilter("YET_TO_START")}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === "YET_TO_START"
              ? "bg-slate-100 border-slate-400 shadow-xs"
              : "bg-white border-slate-200 hover:border-slate-300 shadow-2xs"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
              Yet to Start
            </span>
            <Clock className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl font-black text-slate-800">{yetToStartCount}</div>
          <span className="text-[10px] text-slate-500 mt-1 block">In backlog queue</span>
        </button>
      </div>

      {/* Filter Tabs Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Status Tab Pills */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          <span className="text-xs font-bold text-slate-500 mr-2 flex items-center space-x-1">
            <Filter className="w-3.5 h-3.5 text-blue-600" />
            <span>Filter:</span>
          </span>
          {[
            { id: "ALL", label: "All Statuses", count: totalCount },
            { id: "IN_PROGRESS", label: "In Progress", count: inProgressCount },
            { id: "COMPLETED", label: "Completed", count: completedCount },
            { id: "ON_HOLD", label: "On Hold", count: onHoldCount },
            { id: "YET_TO_START", label: "Yet to Start", count: yetToStartCount },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center space-x-1.5 ${
                statusFilter === tab.id
                  ? "bg-blue-700 text-white shadow-xs"
                  : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  statusFilter === tab.id ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search & Assignee Filter */}
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search batch, location, remarks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
            />
          </div>

          <select
            value={employeeFilter}
            onChange={(e) => setEmployeeFilter(e.target.value)}
            className="py-1.5 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="ALL">All Assignees</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>
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
                <th className="p-3.5">Primary Owner</th>
                <th className="p-3.5">Start Date</th>
                <th className="p-3.5">End Date</th>
                <th className="p-3.5">Total Hours</th>
                <th className="p-3.5">Work Status</th>
                <th className="p-3.5">Audit Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
              {filtered.length > 0 ? (
                filtered.map((b) => (
                  <tr
                    key={b.id}
                    onClick={() => setSelectedBatchId(b.id)}
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <td className="p-3.5 font-bold text-slate-900 font-mono">
                      <span className="text-blue-700 font-semibold">#{b.batch_no}</span>
                    </td>
                    <td className="p-3.5 max-w-xs truncate">{b.complexity || b.batch_type || "—"}</td>
                    <td className="p-3.5">{b.location || "—"}</td>
                    <td className="p-3.5 font-medium text-slate-800">
                      {b.assigned_to?.name || "Unassigned"}
                    </td>
                    <td className="p-3.5 text-slate-500 whitespace-nowrap">{b.start_date || "—"}</td>
                    <td className="p-3.5 text-slate-500 whitespace-nowrap">{b.end_date || "—"}</td>
                    <td className="p-3.5 text-slate-700 font-mono">
                      {b.total_hours ? `${b.total_hours} hrs` : "—"}
                    </td>
                    <td className="p-3.5" onClick={(e) => e.stopPropagation()}>
                      {canManageBatch ? (
                        <select
                          value={b.work_status || "YET_TO_START"}
                          onChange={(e) => handleQuickStatusChange(b.id, e.target.value)}
                          className={`py-1 px-2.5 rounded-lg text-[11px] font-bold border cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                            b.work_status === "COMPLETED"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                              : b.work_status === "IN_PROGRESS"
                              ? "bg-blue-50 text-blue-800 border-blue-300"
                              : b.work_status === "ON_HOLD"
                              ? "bg-amber-50 text-amber-800 border-amber-300"
                              : "bg-slate-100 text-slate-700 border-slate-300"
                          }`}
                          title="Change status (Admin, Lead & Jothi Bash)"
                        >
                          <option value="IN_PROGRESS">IN_PROGRESS</option>
                          <option value="COMPLETED">COMPLETED</option>
                          <option value="ON_HOLD">ON_HOLD</option>
                          <option value="YET_TO_START">YET_TO_START</option>
                        </select>
                      ) : (
                        <StatusBadge status={b.work_status} />
                      )}
                    </td>
                    <td className="p-3.5">
                      <StatusBadge status={b.audit_status} type="audit" />
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end space-x-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setSelectedBatchId(b.id)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-blue-700 hover:bg-blue-50 transition-colors cursor-pointer"
                          title="View Batch Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {canManageBatch && (
                          <button
                            onClick={(e) => handleOpenEdit(b, e)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-blue-700 hover:bg-blue-50 transition-colors cursor-pointer"
                            title="Edit Batch Status & Details (Authorized)"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="p-12 text-center text-slate-400 italic">
                    No batches match the selected status ({statusFilter}) or search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Batch Lifecycle Drawer */}
      <BatchDetailDrawer
        batchId={selectedBatchId}
        onClose={() => setSelectedBatchId(null)}
        onRefresh={refreshBatches}
        canEdit={canManageBatch}
      />

      {/* Create New Batch Modal (Only for Admin, Lead, Jothi Bash) */}
      {showCreateModal && canManageBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Add New C2L Batch</h2>
                  <p className="text-[11px] text-slate-500">Authorized: Admin, Lead, and Jothi Bash</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBatch} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">
                    Batch Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BATCH-2026-042"
                    value={createBatchNo}
                    onChange={(e) => setCreateBatchNo(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-700 font-semibold">Complexity</label>
                    {!isAddingComplexity && (
                      <button
                        type="button"
                        onClick={() => setIsAddingComplexity(true)}
                        className="text-[10px] text-blue-700 hover:text-blue-800 font-bold flex items-center space-x-0.5 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add New</span>
                      </button>
                    )}
                  </div>
                  {isAddingComplexity ? (
                    <div className="flex items-center space-x-1.5">
                      <input
                        type="text"
                        autoFocus
                        placeholder="Custom complexity..."
                        value={newComplexityInput}
                        onChange={(e) => setNewComplexityInput(e.target.value)}
                        className="flex-1 p-2 rounded-xl bg-white border border-blue-400 text-slate-900 focus:outline-none text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newComplexityInput.trim()) {
                            const val = newComplexityInput.trim();
                            setCustomComplexities((prev) => [...prev, val]);
                            setCreateComplexity(val);
                            setNewComplexityInput("");
                            setIsAddingComplexity(false);
                          }
                        }}
                        className="px-2.5 py-2 rounded-xl bg-blue-700 text-white font-semibold text-xs cursor-pointer"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsAddingComplexity(false)}
                        className="px-2 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs cursor-pointer hover:bg-slate-200"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <select
                      value={createComplexity}
                      onChange={(e) => setCreateComplexity(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white cursor-pointer"
                    >
                      {existingComplexities.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-700 font-semibold">Location</label>
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
                    <div className="flex items-center space-x-1.5">
                      <input
                        type="text"
                        autoFocus
                        placeholder="Enter location name..."
                        value={newLocationInput}
                        onChange={(e) => setNewLocationInput(e.target.value)}
                        className="flex-1 p-2 rounded-xl bg-white border border-blue-400 text-slate-900 focus:outline-none text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newLocationInput.trim()) {
                            const val = newLocationInput.trim();
                            setCustomLocations((prev) => [...prev, val]);
                            setCreateLocation(val);
                            setNewLocationInput("");
                            setIsAddingLocation(false);
                          }
                        }}
                        className="px-2.5 py-2 rounded-xl bg-blue-700 text-white font-semibold text-xs cursor-pointer"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsAddingLocation(false)}
                        className="px-2 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs cursor-pointer hover:bg-slate-200"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1.5">
                      <select
                        value={createLocation}
                        onChange={(e) => setCreateLocation(e.target.value)}
                        className="flex-1 p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white cursor-pointer"
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
                        className="px-2.5 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-semibold whitespace-nowrap flex items-center space-x-1 cursor-pointer transition-colors"
                        title="Add Location"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Location</span>
                      </button>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Primary Assignee</label>
                  <select
                    value={createAssigneeId}
                    onChange={(e) => setCreateAssigneeId(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white cursor-pointer"
                  >
                    <option value="">Current User ({user?.name || "Self"})</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Initial Work Status</label>
                  <select
                    value={createWorkStatus}
                    onChange={(e) => setCreateWorkStatus(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white cursor-pointer"
                  >
                    <option value="IN_PROGRESS">IN_PROGRESS (Active)</option>
                    <option value="YET_TO_START">YET_TO_START (Backlog)</option>
                    <option value="COMPLETED">COMPLETED (Finished)</option>
                    <option value="ON_HOLD">ON_HOLD (Blocked)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Production Hours</label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="e.g. 8.0"
                    value={createHours}
                    onChange={(e) => setCreateHours(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Start Date</label>
                  <input
                    type="date"
                    value={createStartDate}
                    onChange={(e) => setCreateStartDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">End Date (Target/Actual)</label>
                  <input
                    type="date"
                    value={createEndDate}
                    onChange={(e) => setCreateEndDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Remarks / Initial Scope</label>
                <textarea
                  rows={2}
                  placeholder="Notes on batch requirements, CAD drawings, revision notes..."
                  value={createRemarks}
                  onChange={(e) => setCreateRemarks(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingCreate}
                  className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-600 text-white font-semibold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                >
                  {submittingCreate ? "Creating..." : "Create Batch"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Batch Status & Details Modal (Only for Admin, Lead, Jothi Bash) */}
      {editingBatch && canManageBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Edit Batch #{editingBatch.batch_no}
                  </h2>
                  <p className="text-[11px] text-slate-500">Authorized: Admin, Lead, and Jothi Bash</p>
                </div>
              </div>
              <button
                onClick={() => setEditingBatch(null)}
                className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Work Status</label>
                  <select
                    value={editWorkStatus}
                    onChange={(e) => setEditWorkStatus(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white cursor-pointer"
                  >
                    <option value="IN_PROGRESS">IN_PROGRESS (Active)</option>
                    <option value="COMPLETED">COMPLETED (Finished)</option>
                    <option value="ON_HOLD">ON_HOLD (Blocked)</option>
                    <option value="YET_TO_START">YET_TO_START (Backlog)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Audit Status</label>
                  <select
                    value={editAuditStatus}
                    onChange={(e) => setEditAuditStatus(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white cursor-pointer"
                  >
                    <option value="YET_TO_START">YET_TO_START</option>
                    <option value="IN_PROGRESS">IN_PROGRESS</option>
                    <option value="PASSED">PASSED</option>
                    <option value="FAILED">FAILED</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Complexity / Type</label>
                  <input
                    type="text"
                    value={editComplexity}
                    onChange={(e) => setEditComplexity(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Location</label>
                  <input
                    type="text"
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Assignee</label>
                  <select
                    value={editAssigneeId}
                    onChange={(e) => setEditAssigneeId(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white cursor-pointer"
                  >
                    <option value="">Unassigned</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Total Hours</label>
                  <input
                    type="number"
                    step="0.5"
                    value={editHours}
                    onChange={(e) => setEditHours(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Start Date</label>
                  <input
                    type="date"
                    value={editStartDate}
                    onChange={(e) => setEditStartDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">End Date</label>
                  <input
                    type="date"
                    value={editEndDate}
                    onChange={(e) => setEditEndDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Remarks</label>
                <textarea
                  rows={2}
                  value={editRemarks}
                  onChange={(e) => setEditRemarks(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingBatch(null)}
                  className="px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingEdit}
                  className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-600 text-white font-semibold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
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
