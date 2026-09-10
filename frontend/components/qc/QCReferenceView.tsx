"use client";

import React, { useState } from "react";
import { QCReference, User, api } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import {
  Layers,
  Search,
  Plus,
  Edit2,
  ShieldCheck,
  X,
  Filter,
} from "lucide-react";

interface QCReferenceViewProps {
  initialReferences: QCReference[];
  initialUsers: User[];
}

export function QCReferenceView({
  initialReferences,
  initialUsers,
}: QCReferenceViewProps) {
  const { user } = useAuth();
  const [references, setReferences] = useState<QCReference[]>(initialReferences);
  const [users] = useState<User[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedRef, setSelectedRef] = useState<QCReference | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Permission: only bash, aathithya, keerthana, and system admin can edit QC Reference
  const nameLower = (user?.name || "").toLowerCase().trim();
  const emailLower = (user?.email || "").toLowerCase().trim();
  const canEdit =
    user?.role === "ADMIN" ||
    ["system administrator", "jothi bash", "bash", "aathithya", "keerthana"].includes(nameLower) ||
    ["admin@c2l-qc.com", "jothi.bash@c2l-qc.com", "aathithya@c2l-qc.com", "keerthana@c2l-qc.com"].includes(emailLower);

  // Edit form state
  const [formData, setFormData] = useState<Partial<QCReference>>({});

  const refreshData = async () => {
    try {
      const refsData = await api.getQCReferences({ limit: 400 });
      setReferences(refsData);
    } catch (err) {
      console.error("Error refreshing QC References:", err);
    }
  };

  const openEditModal = (ref: QCReference) => {
    setSelectedRef(ref);
    setFormData({
      qc_status: ref.qc_status || "YES",
      audit_status: ref.audit_status || "YES",
      audit_result: ref.audit_result || "PASS",
      audited_by_id: ref.audited_by_id,
      batch_owner_id: ref.batch_owner_id,
      start_date: ref.start_date || "",
      end_date: ref.end_date || "",
      sheet_metal_qc: ref.sheet_metal_qc || "",
      remarks: ref.remarks || "",
    });
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRef) return;
    setSubmitting(true);
    try {
      await api.updateQCReference(selectedRef.id, formData);
      setNotification("QC Reference record updated successfully!");
      setIsEditModalOpen(false);
      refreshData();
    } catch (err: any) {
      alert(err.message || "Failed to update QC Reference");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.batch_no) {
      alert("Batch Number is required");
      return;
    }
    setSubmitting(true);
    try {
      await api.createQCReference(formData);
      setNotification("New QC Reference record created!");
      setIsCreateModalOpen(false);
      refreshData();
    } catch (err: any) {
      alert(err.message || "Failed to create QC Reference");
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = references.filter((r) => {
    if (statusFilter !== "ALL") {
      const qcNorm = (r.qc_status || "").toUpperCase();
      if (statusFilter === "YES" && qcNorm !== "YES") return false;
      if (statusFilter === "NO" && qcNorm !== "NO") return false;
      if (statusFilter === "HOLD" && qcNorm !== "HOLD") return false;
    }
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      (r.batch_no && r.batch_no.toLowerCase().includes(s)) ||
      (r.batch_owner?.name && r.batch_owner.name.toLowerCase().includes(s)) ||
      (r.auditor?.name && r.auditor.name.toLowerCase().includes(s)) ||
      (r.remarks && r.remarks.toLowerCase().includes(s)) ||
      (r.sheet_metal_qc && r.sheet_metal_qc.toLowerCase().includes(s))
    );
  });

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            {references.length} Total Master Records
          </span>
        </div>

        <div className="flex items-center space-x-3">
          {canEdit && (
            <button
              onClick={() => {
                setFormData({
                  batch_no: "",
                  qc_status: "YES",
                  audit_status: "YES",
                  audit_result: "PASS",
                  start_date: new Date().toISOString().split("T")[0],
                  end_date: new Date().toISOString().split("T")[0],
                  remarks: "",
                });
                setIsCreateModalOpen(true);
              }}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-600 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add QC Reference</span>
            </button>
          )}
        </div>
      </div>

      {notification && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between shadow-2xs animate-fade-in">
          <span className="font-medium">{notification}</span>
          <button onClick={() => setNotification(null)} className="text-emerald-600 hover:text-emerald-900 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Permission banner */}
      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center space-x-2 text-slate-700">
          <ShieldCheck className="w-4 h-4 text-blue-700" />
          <span>
            Access Rule: <strong>QC Reference Editing</strong> is authorized for{" "}
            <span className="text-blue-700 font-semibold">Bash, Aathithya, Keerthana</span>, and{" "}
            <span className="text-blue-700 font-semibold">System Administrator</span>.
          </span>
        </div>
        <span
          className={`self-start sm:self-auto px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
            canEdit ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-200 text-slate-600"
          }`}
        >
          {canEdit ? "Authorized to Edit" : "View Only"}
        </span>
      </div>

      {/* Filters and Search */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Batch #, Owner, Auditor, Remarks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-500 font-medium">QC Status:</span>
          {["ALL", "YES", "NO", "HOLD"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === st
                  ? "bg-blue-700 text-white shadow-2xs"
                  : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 shadow-2xs"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Reference Table */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
              <tr>
                <th className="p-3.5">S.No</th>
                <th className="p-3.5">Batch No</th>
                <th className="p-3.5">Batch Owner</th>
                <th className="p-3.5">Assigned To (Auditor)</th>
                <th className="p-3.5">Start Date</th>
                <th className="p-3.5">End Date</th>
                <th className="p-3.5 text-center">QC Status</th>
                <th className="p-3.5 text-center">Audit Status</th>
                <th className="p-3.5">Sheet Metal QC</th>
                <th className="p-3.5 max-w-xs">Remarks</th>
                {canEdit && <th className="p-3.5 text-right">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
              {filtered.length > 0 ? (
                filtered.map((r, idx) => {
                  const qcStatus = (r.qc_status || "YES").toUpperCase();
                  const isHold = qcStatus === "HOLD";
                  const isNo = qcStatus === "NO";
                  const isYes = qcStatus === "YES";

                  return (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3.5 font-mono text-slate-400">{r.sl_no || idx + 1}</td>
                      <td className="p-3.5 font-bold text-slate-900 font-mono">
                        <span className="text-blue-700 font-semibold">
                          #{r.batch_no}
                        </span>
                      </td>
                      <td className="p-3.5 font-medium text-slate-800">
                        {r.batch_owner?.name || <span className="text-slate-400 italic">Unassigned</span>}
                      </td>
                      <td className="p-3.5 text-slate-600">
                        {r.auditor?.name || <span className="text-slate-400 italic">—</span>}
                      </td>
                      <td className="p-3.5 text-slate-500 whitespace-nowrap">{r.start_date || "—"}</td>
                      <td className="p-3.5 text-slate-500 whitespace-nowrap">{r.end_date || "—"}</td>
                      <td className="p-3.5 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                            isYes
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : isHold
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : isNo
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : "bg-blue-50 text-blue-700 border-blue-200"
                          }`}
                        >
                          {r.qc_status || "YES"}
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                            r.audit_status?.toUpperCase() === "YES" || r.audit_result === "PASS"
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : "bg-slate-100 text-slate-600 border border-slate-200"
                          }`}
                        >
                          {r.audit_status || r.audit_result || "YES"}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-600">{r.sheet_metal_qc || "—"}</td>
                      <td className="p-3.5 max-w-xs text-slate-700 whitespace-pre-line truncate" title={r.remarks || ""}>
                        {r.remarks || <span className="text-slate-400 italic">None</span>}
                      </td>
                      {canEdit && (
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => openEditModal(r)}
                            className="p-1.5 rounded-lg text-blue-700 hover:bg-blue-50 border border-transparent hover:border-blue-200 transition-colors cursor-pointer"
                            title="Edit QC Reference"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={canEdit ? 11 : 10} className="p-10 text-center text-slate-400 italic">
                    No matching QC Reference records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && selectedRef && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <Edit2 className="w-5 h-5 text-blue-700" />
                <h2 className="text-lg font-bold text-slate-900">Edit QC Reference: #{selectedRef.batch_no}</h2>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-medium">QC Status</label>
                  <select
                    value={formData.qc_status || "YES"}
                    onChange={(e) => setFormData({ ...formData, qc_status: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-500"
                  >
                    <option value="YES">YES</option>
                    <option value="NO">NO</option>
                    <option value="HOLD">HOLD</option>
                    <option value="PENDING">PENDING</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-medium">Audit Status / Result</label>
                  <select
                    value={formData.audit_status || "YES"}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        audit_status: e.target.value,
                        audit_result: e.target.value === "YES" ? "PASS" : "FAIL",
                      })
                    }
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-500"
                  >
                    <option value="YES">YES (PASS)</option>
                    <option value="NO">NO (FAIL)</option>
                    <option value="HOLD">HOLD</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-medium">Batch Owner</label>
                  <select
                    value={formData.batch_owner_id || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        batch_owner_id: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">-- Select Owner --</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-medium">Auditor / QC Reviewer</label>
                  <select
                    value={formData.audited_by_id || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        audited_by_id: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">-- Select Auditor --</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-medium">Start Date</label>
                  <input
                    type="date"
                    value={formData.start_date || ""}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-medium">End Date</label>
                  <input
                    type="date"
                    value={formData.end_date || ""}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-medium">Sheet Metal QC</label>
                <input
                  type="text"
                  placeholder="e.g. Done, Pending, N/A"
                  value={formData.sheet_metal_qc || ""}
                  onChange={(e) => setFormData({ ...formData, sheet_metal_qc: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-medium">Remarks / Notes</label>
                <textarea
                  rows={3}
                  placeholder="Detailed notes on QC status, rework items, or link checks..."
                  value={formData.remarks || ""}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-600 text-white font-semibold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <Plus className="w-5 h-5 text-blue-700" />
                <h2 className="text-lg font-bold text-slate-900">Add New QC Reference</h2>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 mb-1 font-medium">Batch Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 1386"
                  value={formData.batch_no || ""}
                  onChange={(e) => setFormData({ ...formData, batch_no: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-medium">QC Status</label>
                  <select
                    value={formData.qc_status || "YES"}
                    onChange={(e) => setFormData({ ...formData, qc_status: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-500"
                  >
                    <option value="YES">YES</option>
                    <option value="NO">NO</option>
                    <option value="HOLD">HOLD</option>
                    <option value="PENDING">PENDING</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-medium">Audit Status</label>
                  <select
                    value={formData.audit_status || "YES"}
                    onChange={(e) => setFormData({ ...formData, audit_status: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-500"
                  >
                    <option value="YES">YES</option>
                    <option value="NO">NO</option>
                    <option value="HOLD">HOLD</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-medium">Batch Owner</label>
                  <select
                    value={formData.batch_owner_id || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        batch_owner_id: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">-- Select Owner --</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-medium">Auditor</label>
                  <select
                    value={formData.audited_by_id || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        audited_by_id: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">-- Select Auditor --</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-medium">Start Date</label>
                  <input
                    type="date"
                    value={formData.start_date || ""}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-medium">End Date</label>
                  <input
                    type="date"
                    value={formData.end_date || ""}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-medium">Remarks</label>
                <textarea
                  rows={3}
                  placeholder="Enter remarks..."
                  value={formData.remarks || ""}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-600 text-white font-semibold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? "Creating..." : "Create Reference"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
