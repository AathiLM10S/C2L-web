"use client";

import React, { useState } from "react";
import { QCIssue, Batch, api } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { StatusBadge } from "@/components/common/StatusBadge";
import {
  ShieldAlert,
  Search,
  CheckCircle2,
  Plus,
  Lock,
  ExternalLink,
  X,
} from "lucide-react";
import Link from "next/link";

interface QCIssuesViewProps {
  initialIssues: QCIssue[];
  initialBatches: Batch[];
}

export function QCIssuesView({
  initialIssues,
  initialBatches,
}: QCIssuesViewProps) {
  const { user } = useAuth();
  const [issues, setIssues] = useState<QCIssue[]>(initialIssues);
  const [batches] = useState<Batch[]>(initialBatches);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [issueTypeFilter, setIssueTypeFilter] = useState("ALL");

  // Proof preview drawer
  const [selectedIssue, setSelectedIssue] = useState<QCIssue | null>(null);

  // New Issue Modal
  const [showModal, setShowModal] = useState(false);
  const [newBatchNo, setNewBatchNo] = useState("");
  const [newOwnerName, setNewOwnerName] = useState("");
  const [newType, setNewType] = useState("CAD Assessment");
  const [newRemark, setNewRemark] = useState("");
  const [newProof, setNewProof] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Permission check: Only System Admin, Bash, Aathithya, Keerthana can access
  const nameLower = (user?.name || "").toLowerCase().trim();
  const emailLower = (user?.email || "").toLowerCase().trim();
  const isAuthorized =
    user?.role === "ADMIN" ||
    ["system administrator", "jothi bash", "bash", "aathithya", "keerthana"].includes(nameLower) ||
    ["admin@c2l-qc.com", "jothi.bash@c2l-qc.com", "aathithya@c2l-qc.com", "keerthana@c2l-qc.com"].includes(emailLower);

  const refreshIssues = async () => {
    try {
      const data = await api.getQCIssues({
        status: statusFilter === "ALL" ? undefined : statusFilter,
        issue_type: issueTypeFilter === "ALL" ? undefined : issueTypeFilter,
        search: search || undefined,
      });
      setIssues(data);
    } catch (err) {
      console.error("Error refreshing QC issues:", err);
    }
  };

  const handleCreateIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBatchNo || !newRemark) {
      alert("Batch Number and Remark are required");
      return;
    }
    setSubmitting(true);
    try {
      const matchedBatch = batches.find((b) => b.batch_no.toLowerCase() === newBatchNo.toLowerCase());
      await api.createQCIssue({
        batch_id: matchedBatch?.id,
        batch_no: newBatchNo,
        batch_owner_name: newOwnerName || matchedBatch?.assigned_to?.name || undefined,
        issue_type: newType,
        remark: newRemark,
        proof_url: newProof || undefined,
        qc_date: new Date().toISOString().split("T")[0],
        status: "OPEN",
      });
      setShowModal(false);
      setNewBatchNo("");
      setNewOwnerName("");
      setNewRemark("");
      setNewProof("");
      refreshIssues();
    } catch (err: any) {
      alert(err.message || "Failed to create QC issue");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolveIssue = async (issueId: number) => {
    try {
      await api.updateQCIssue(issueId, {
        status: "RESOLVED",
        resolution_note: "Resolved and verified in draft/Teamcenter",
      });
      refreshIssues();
      if (selectedIssue && selectedIssue.id === issueId) {
        setSelectedIssue({ ...selectedIssue, status: "RESOLVED" });
      }
    } catch (err: any) {
      alert(err.message || "Failed to resolve issue");
    }
  };

  if (!isAuthorized) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4">
        <div className="p-8 rounded-2xl bg-white border border-rose-200 shadow-sm text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
            <Lock className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Access Restricted: QC Issues Log</h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            By system policy, the <strong>QC Issues Log</strong> is confidential and exclusively accessible to{" "}
            <span className="text-blue-700 font-semibold">Bash, Aathithya, Keerthana</span>, and the{" "}
            <span className="text-blue-700 font-semibold">System Administrator</span>.
          </p>
          <div className="pt-4">
            <Link
              href="/"
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-600 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              <span>Return to Dashboard</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const filtered = issues.filter((i) => {
    if (statusFilter !== "ALL" && i.status !== statusFilter) return false;
    if (issueTypeFilter !== "ALL" && i.issue_type !== issueTypeFilter) return false;
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      (i.batch_no && i.batch_no.toLowerCase().includes(s)) ||
      (i.remark && i.remark.toLowerCase().includes(s)) ||
      (i.batch_owner_name && i.batch_owner_name.toLowerCase().includes(s)) ||
      (i.issue_type && i.issue_type.toLowerCase().includes(s))
    );
  });

  const openCount = issues.filter((i) => i.status === "OPEN").length;

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            {openCount} Open Issues
          </span>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs flex items-center space-x-1.5 shadow-xs transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Report QC Issue</span>
        </button>
      </div>

      {/* Filter Controls */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search remark, batch #, issue type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full py-2 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">Open Issues</option>
            <option value="RESOLVED">Resolved Issues</option>
          </select>
        </div>

        <div>
          <select
            value={issueTypeFilter}
            onChange={(e) => setIssueTypeFilter(e.target.value)}
            className="w-full py-2 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Issue Types</option>
            <option value="CAD Assessment">CAD Assessment</option>
            <option value="Revision Mismatch">Revision Mismatch</option>
            <option value="Illegal Character">Illegal Character</option>
            <option value="Missing Parts / CAD">Missing Parts / CAD</option>
            <option value="Formula / Logo">Formula / Logo</option>
            <option value="Sheet Metal">Sheet Metal</option>
          </select>
        </div>
      </div>

      {/* Issues Table */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
              <tr>
                <th className="p-3.5">Issue ID</th>
                <th className="p-3.5">Batch No</th>
                <th className="p-3.5">Batch Owner</th>
                <th className="p-3.5">QC Date</th>
                <th className="p-3.5">QC Checked By</th>
                <th className="p-3.5">Issue Type</th>
                <th className="p-3.5">Remark Description</th>
                <th className="p-3.5">Proof</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
              {filtered.length > 0 ? (
                filtered.map((i) => (
                  <tr
                    key={i.id}
                    onClick={() => setSelectedIssue(i)}
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <td className="p-3.5 font-mono text-slate-400">#{i.sl_no || i.id}</td>
                    <td className="p-3.5 font-bold text-slate-900 font-mono">
                      <span className="text-blue-700 font-semibold">
                        #{i.batch_no || i.batch_id}
                      </span>
                    </td>
                    <td className="p-3.5 font-medium text-slate-800">
                      {i.batch_owner_name || i.batch_owner?.name || "Owner"}
                    </td>
                    <td className="p-3.5 text-slate-500 whitespace-nowrap">{i.qc_date}</td>
                    <td className="p-3.5 text-slate-800">{i.qc_checker?.name || "QC Auditor"}</td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-medium">
                        {i.issue_type}
                      </span>
                    </td>
                    <td className="p-3.5 max-w-sm truncate text-slate-700">{i.remark}</td>
                    <td className="p-3.5">
                      {i.proof_url ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedIssue(i);
                          }}
                          className="text-blue-700 hover:text-blue-800 font-semibold flex items-center space-x-1 cursor-pointer"
                        >
                          <span>[View Snip]</span>
                        </button>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="p-3.5">
                      <StatusBadge status={i.status} type="qc" />
                    </td>
                    <td className="p-3.5 text-right">
                      {i.status === "OPEN" ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleResolveIssue(i.id);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[11px] font-semibold transition-colors cursor-pointer"
                        >
                          Resolve
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium">Resolved</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="p-12 text-center">
                    <div className="max-w-md mx-auto space-y-3">
                      <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <h3 className="text-base font-bold text-slate-900">QC Issues Table is Clean</h3>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        There are currently no QC issues logged. The QC Issues table is reserved for user-defined issues. You can log new issues as audits are performed.
                      </p>
                      <button
                        onClick={() => setShowModal(true)}
                        className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-600 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Log First QC Issue</span>
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* QC Issue Detail Drawer */}
      {selectedIssue && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/30 backdrop-blur-xs">
          <div className="w-full max-w-lg h-full bg-white border-l border-slate-200 shadow-2xl p-6 flex flex-col justify-between text-slate-800 animate-in slide-in-from-right duration-300">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-lg font-bold text-slate-900">QC Issue #{selectedIssue.id}</h2>
                    <StatusBadge status={selectedIssue.status} type="qc" />
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Batch #{selectedIssue.batch_no || selectedIssue.batch_id} • {selectedIssue.issue_type}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedIssue(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <span className="text-slate-500 font-medium block">Issue Remark / Description:</span>
                  <p className="text-slate-900 whitespace-pre-line text-sm leading-relaxed">
                    {selectedIssue.remark}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[11px] text-slate-500 block">Batch Owner:</span>
                    <span className="text-sm font-semibold text-slate-900">
                      {selectedIssue.batch_owner_name || selectedIssue.batch_owner?.name || "Owner"}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[11px] text-slate-500 block">QC Inspector:</span>
                    <span className="text-sm font-semibold text-slate-900">
                      {selectedIssue.qc_checker?.name || "QC Auditor"}
                    </span>
                  </div>
                </div>

                {selectedIssue.proof_url && (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <span className="text-slate-500 font-medium block">Evidence / Proof Snippet:</span>
                    <a
                      href={selectedIssue.proof_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-between text-blue-700 hover:text-blue-900 transition-colors"
                    >
                      <span className="truncate">{selectedIssue.proof_url}</span>
                      <ExternalLink className="w-4 h-4 shrink-0 ml-2" />
                    </a>
                  </div>
                )}

                {selectedIssue.resolution_note && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800">
                    <span className="font-semibold block mb-1">Resolution Note:</span>
                    <p>{selectedIssue.resolution_note}</p>
                  </div>
                )}
              </div>
            </div>

            {selectedIssue.status === "OPEN" && (
              <div className="pt-4 border-t border-slate-200">
                <button
                  onClick={() => handleResolveIssue(selectedIssue.id)}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                >
                  Mark Issue as Resolved
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Report QC Issue Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900">Log New QC Issue</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateIssue} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Batch Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 1386 or select below"
                  value={newBatchNo}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNewBatchNo(val);
                    const b = batches.find((x) => x.batch_no.toLowerCase() === val.toLowerCase());
                    if (b?.assigned_to?.name) {
                      setNewOwnerName(b.assigned_to.name);
                    }
                  }}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 font-mono"
                  list="batch-suggestions"
                />
                <datalist id="batch-suggestions">
                  {batches.map((b) => (
                    <option key={b.id} value={b.batch_no}>
                      {b.batch_no} - {b.assigned_to?.name || "Unassigned"}
                    </option>
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Batch Owner Name</label>
                <input
                  type="text"
                  placeholder="e.g. Godwin, Naresh..."
                  value={newOwnerName}
                  onChange={(e) => setNewOwnerName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Issue Category *</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-500"
                >
                  <option value="CAD Assessment">CAD Assessment</option>
                  <option value="Revision Mismatch">Revision Mismatch</option>
                  <option value="Illegal Character">Illegal Character</option>
                  <option value="Missing Parts / CAD">Missing Parts / CAD</option>
                  <option value="Formula / Logo">Formula / Logo</option>
                  <option value="PDF Comparison">PDF Comparison</option>
                  <option value="Sheet Metal">Sheet Metal</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Issue Remark / Details *</label>
                <textarea
                  required
                  rows={3}
                  value={newRemark}
                  onChange={(e) => setNewRemark(e.target.value)}
                  placeholder="e.g. PN .0624 mismatch with Teamcenter revision description..."
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Evidence Proof URL (Optional)</label>
                <input
                  type="url"
                  value={newProof}
                  onChange={(e) => setNewProof(e.target.value)}
                  placeholder="https://sharepoint.c2l.internal/evidence/snip.png"
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold shadow-xs transition-all cursor-pointer"
                >
                  {submitting ? "Saving..." : "Log QC Issue"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
