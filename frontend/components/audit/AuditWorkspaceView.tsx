"use client";

import React, { useState } from "react";
import { Audit, Batch, api } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import {
  ClipboardCheck,
  Search,
  CheckCircle2,
  Sparkles,
  X,
  AlertCircle,
} from "lucide-react";

interface AuditWorkspaceViewProps {
  initialAudits: Audit[];
  initialPendingBatches: Batch[];
}

export function AuditWorkspaceView({
  initialAudits,
  initialPendingBatches,
}: AuditWorkspaceViewProps) {
  const { user } = useAuth();
  const [audits, setAudits] = useState<Audit[]>(initialAudits);
  const [pendingBatches, setPendingBatches] = useState<Batch[]>(initialPendingBatches);
  const [filterResult, setFilterResult] = useState("ALL");
  const [pendingSearch, setPendingSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // New Audit Form state
  const [selectedBatchId, setSelectedBatchId] = useState<string>("");
  const [selectedBatchNo, setSelectedBatchNo] = useState<string>("");
  const [auditDate, setAuditDate] = useState(new Date().toISOString().split("T")[0]);
  const [auditResult, setAuditResult] = useState("PASS");
  const [sheetMetal, setSheetMetal] = useState("No");
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Permission check: ONLY System Administrator
  const isSystemAdmin =
    user?.role === "ADMIN" || user?.email?.toLowerCase() === "admin@c2l-qc.com";

  const refreshData = async () => {
    try {
      const [newAudits, newPending] = await Promise.all([
        api.getAudits({ result: filterResult === "ALL" ? undefined : filterResult }),
        api.getPendingAuditBatches(),
      ]);
      setAudits(newAudits);
      setPendingBatches(newPending);
    } catch (err) {
      console.error("Error refreshing audit data:", err);
    }
  };

  if (!isSystemAdmin) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4">
        <div className="p-8 rounded-2xl bg-white border border-rose-200 shadow-sm text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Access Restricted: Audit Workspace</h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            By enterprise quality policy, the <strong>Audit Workspace</strong> is restricted exclusively to the{" "}
            <span className="text-blue-700 font-semibold">System Administrator</span>.
          </p>
        </div>
      </div>
    );
  }

  const openAuditModal = (batch: Batch) => {
    setSelectedBatchId(String(batch.id));
    setSelectedBatchNo(batch.batch_no);
    setAuditDate(new Date().toISOString().split("T")[0]);
    setAuditResult("PASS");
    setSheetMetal("No");
    setRemarks(`Audit conducted on batch #${batch.batch_no}`);
    setShowModal(true);
  };

  const handleCreateAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatchId) return;
    setSubmitting(true);
    try {
      await api.createAudit({
        batch_id: Number(selectedBatchId),
        audit_date: auditDate,
        audit_result: auditResult,
        sheet_metal_qc: sheetMetal,
        remarks: remarks || undefined,
      });
      setNotification(`Audit recorded successfully for Batch #${selectedBatchNo}!`);
      setShowModal(false);
      setRemarks("");
      refreshData();
    } catch (err: any) {
      alert(err.message || "Failed to record audit");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredPending = pendingBatches.filter((b) => {
    if (!pendingSearch) return true;
    const s = pendingSearch.toLowerCase();
    return (
      b.batch_no.toLowerCase().includes(s) ||
      (b.assigned_to?.name && b.assigned_to.name.toLowerCase().includes(s)) ||
      (b.location && b.location.toLowerCase().includes(s)) ||
      (b.current_remarks && b.current_remarks.toLowerCase().includes(s))
    );
  });

  const filteredAudits = audits.filter((a) => {
    if (filterResult === "ALL") return true;
    return a.audit_result === filterResult;
  });

  const passCount = audits.filter((a) => a.audit_result === "PASS").length;
  const failCount = audits.filter((a) => a.audit_result === "FAIL").length;

  return (
    <div className="space-y-8">
      {/* Top Banner with Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
            <ClipboardCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">C2L Audit Workspace</h1>
            <p className="text-xs text-slate-500">
              System Administrator Quality Gate — Reviewing Completed C2L Batches Not Yet in QC Reference
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="px-3.5 py-1.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold flex items-center space-x-2 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
            <span>{pendingBatches.length} Pending Audit Verification</span>
          </div>
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

      {/* Logic Card */}
      <div className="p-5 rounded-2xl bg-blue-50/60 border border-blue-200/80 text-xs text-slate-700 space-y-2 shadow-2xs">
        <div className="flex items-center space-x-2 text-blue-900 font-bold text-sm">
          <Sparkles className="w-4 h-4 text-blue-700" />
          <span>Audit Workspace Workflow & Logic</span>
        </div>
        <p className="leading-relaxed">
          <strong>How this workspace operates:</strong> When engineering staff complete work on a batch in the <strong>C2L Master Log</strong>, the batch reaches <span className="text-emerald-700 font-semibold">COMPLETED</span> status. Batches that are <strong>not mentioned in QC Reference</strong> automatically appear in the pending queue below.
        </p>
        <p className="text-slate-600 leading-relaxed">
          As the <strong>System Administrator</strong>, you inspect the CAD models, revisions, link verification, and sheet metal checks here. Once you log the audit as <span className="text-blue-700 font-semibold">PASS</span>, the batch is promoted to Client-Ready and archived with a formal audit record.
        </p>
      </div>

      {/* SECTION 1: Batches Completed in C2L Log (Not Mentioned in QC Reference) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Pending Audit Queue
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                {pendingBatches.length} Batches Awaiting Audit
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Completed in C2L Log • Not in QC Reference • Ready for System Admin audit evaluation
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search pending batch #, owner..."
              value={pendingSearch}
              onChange={(e) => setPendingSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-2xs"
            />
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Batch No</th>
                  <th className="p-3.5">Primary Engineer</th>
                  <th className="p-3.5">Complexity</th>
                  <th className="p-3.5">Location</th>
                  <th className="p-3.5">Completed Date</th>
                  <th className="p-3.5">Total Hours</th>
                  <th className="p-3.5 max-w-xs">Engineering Remarks</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
                {filteredPending.length > 0 ? (
                  filteredPending.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3.5 font-bold text-slate-900 font-mono">
                        <span className="text-blue-700 font-semibold">
                          #{b.batch_no}
                        </span>
                      </td>
                      <td className="p-3.5 font-medium text-slate-900">
                        {b.assigned_to?.name || "Unassigned"}
                      </td>
                      <td className="p-3.5">{b.complexity || b.batch_type || "Standard"}</td>
                      <td className="p-3.5">{b.location || "—"}</td>
                      <td className="p-3.5 text-slate-500 whitespace-nowrap">{b.end_date || b.start_date || "—"}</td>
                      <td className="p-3.5 text-slate-700 font-mono">
                        {b.total_hours ? `${b.total_hours} hrs` : "—"}
                      </td>
                      <td className="p-3.5 max-w-xs truncate text-slate-600" title={b.current_remarks || ""}>
                        {b.current_remarks || <span className="text-slate-400 italic">None</span>}
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => openAuditModal(b)}
                          className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-blue-700 hover:bg-blue-600 text-white font-semibold text-xs shadow-2xs transition-all cursor-pointer"
                        >
                          <ClipboardCheck className="w-3.5 h-3.5" />
                          <span>Audit Batch</span>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="p-10 text-center">
                      <div className="max-w-md mx-auto space-y-2">
                        <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                        <h3 className="text-sm font-bold text-slate-900">All Completed Batches Audited</h3>
                        <p className="text-xs text-slate-500">
                          There are currently no completed batches in C2L Log awaiting audit. All batches completed by engineers have either been audited or are already in QC Reference.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* SECTION 2: Recorded Audits History */}
      <div className="space-y-4 pt-4 border-t border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Recorded Audit History</h2>
            <p className="text-xs text-slate-500">
              Historical record of quality audits verified by System Administrator ({audits.length} audits)
            </p>
          </div>

          <div className="flex space-x-2">
            {["ALL", "PASS", "FAIL"].map((res) => (
              <button
                key={res}
                onClick={() => setFilterResult(res)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  filterResult === res
                    ? "bg-blue-700 text-white shadow-2xs"
                    : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 shadow-2xs"
                }`}
              >
                {res === "ALL" ? `All (${audits.length})` : res === "PASS" ? `Pass (${passCount})` : `Fail (${failCount})`}
              </button>
            ))}
          </div>
        </div>

        {/* Audits Table */}
        <div className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Audit ID</th>
                  <th className="p-3.5">Batch No</th>
                  <th className="p-3.5">Auditor</th>
                  <th className="p-3.5">Audit Date</th>
                  <th className="p-3.5">Result</th>
                  <th className="p-3.5">Sheet Metal QC</th>
                  <th className="p-3.5 max-w-md">Remarks / Findings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
                {filteredAudits.length > 0 ? (
                  filteredAudits.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3.5 font-mono text-slate-500">#{a.id}</td>
                      <td className="p-3.5 font-bold text-slate-900 font-mono">
                        <span className="text-blue-700 font-semibold">#{a.batch_no || a.batch_id}</span>
                      </td>
                      <td className="p-3.5 font-medium text-slate-800">
                        {a.auditor?.name || "System Administrator"}
                      </td>
                      <td className="p-3.5 text-slate-500 whitespace-nowrap">{a.audit_date}</td>
                      <td className="p-3.5">
                        {a.audit_result === "PASS" ? (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            PASS
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            FAIL
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-slate-600">{a.sheet_metal_qc || "—"}</td>
                      <td className="p-3.5 max-w-md text-slate-700 whitespace-pre-line">
                        {a.remarks || <span className="text-slate-400 italic">No remarks</span>}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-10 text-center text-slate-400 italic">
                      No audits recorded matching this filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Record Audit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center space-x-2">
                <ClipboardCheck className="w-5 h-5 text-blue-700" />
                <h3 className="text-base font-bold text-slate-900">Record Batch Audit: #{selectedBatchNo}</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAudit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Audit Date</label>
                  <input
                    type="date"
                    required
                    value={auditDate}
                    onChange={(e) => setAuditDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Audit Result</label>
                  <select
                    value={auditResult}
                    onChange={(e) => setAuditResult(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-500 font-semibold"
                  >
                    <option value="PASS">PASS (Client-Ready)</option>
                    <option value="FAIL">FAIL (Needs Correction)</option>
                    <option value="RE_AUDIT">RE_AUDIT</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Sheet Metal QC Verification</label>
                <select
                  value={sheetMetal}
                  onChange={(e) => setSheetMetal(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-500"
                >
                  <option value="No">No (Not Sheet Metal)</option>
                  <option value="Yes">Yes (Sheet Metal Checked & Verified)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Audit Remarks / Quality Notes *</label>
                <textarea
                  required
                  rows={3}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Record observations, revision checks, link verifications..."
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
                  className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-600 text-white font-semibold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? "Recording..." : "Save Audit Assessment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
