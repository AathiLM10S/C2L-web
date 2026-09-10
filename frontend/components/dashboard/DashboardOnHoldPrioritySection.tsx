"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { QCReference } from "@/lib/api";
import {
  AlertTriangle,
  PauseCircle,
  Clock,
  User as UserIcon,
  ExternalLink,
  ChevronRight,
  CheckCircle2,
  FileCheck,
  ShieldAlert,
  X,
  Info,
} from "lucide-react";

interface DashboardOnHoldPrioritySectionProps {
  onHoldQCReferences: QCReference[];
  myOnHoldQCCount?: number;
  isAdminOrManager?: boolean;
}

export function DashboardOnHoldPrioritySection({
  onHoldQCReferences = [],
  myOnHoldQCCount = 0,
  isAdminOrManager = false,
}: DashboardOnHoldPrioritySectionProps) {
  const { user } = useAuth();
  const [viewFilter, setViewFilter] = useState<"MY" | "ALL">("MY");
  const [selectedAudit, setSelectedAudit] = useState<QCReference | null>(null);

  // Authenticated user details
  const nameLower = (user?.name || "").toLowerCase().trim();
  const emailLower = (user?.email || "").toLowerCase().trim();
  const isBash = nameLower.includes("bash") || emailLower === "jothi.bash@c2l-qc.com";
  const isLeadOrAdmin =
    user?.role === "ADMIN" ||
    user?.role === "LEAD" ||
    isBash ||
    emailLower === "admin@c2l-qc.com";

  // Filter QC References where the logged-in user is the corresponding Batch Owner
  const myQCReferences = onHoldQCReferences.filter((ref) => {
    if (!user) return false;
    const ownerName = (ref.batch_owner?.name || "").toLowerCase().trim();
    const ownerEmail = (ref.batch_owner?.email || "").toLowerCase().trim();
    return (
      ref.batch_owner_id === user.id ||
      ownerEmail === emailLower ||
      ownerName === nameLower
    );
  });

  const effectiveMyCount = myQCReferences.length;
  const isManager = isAdminOrManager || isLeadOrAdmin;

  // Decide current active tab
  // If user has their own on-hold batches, default to MY; if they have 0 but are manager, default to ALL
  const currentTab = isManager && effectiveMyCount === 0 ? "ALL" : viewFilter;
  const displayList = currentTab === "MY" ? myQCReferences : onHoldQCReferences;

  // If there are no QC Reference records on hold at all
  if (onHoldQCReferences.length === 0) {
    return (
      <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 shadow-2xs flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-emerald-900">
              QC Reference Status Clear
            </h3>
            <p className="text-[11px] text-emerald-700 mt-0.5">
              No batches are currently flagged as HOLD in QC Reference audits.
            </p>
          </div>
        </div>
        <Link
          href="/qc/reference"
          className="text-xs font-semibold text-emerald-800 hover:text-emerald-900 flex items-center space-x-1"
        >
          <span>QC Reference Master</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-amber-300/90 bg-gradient-to-br from-amber-50/90 via-orange-50/40 to-white p-5 md:p-6 shadow-sm space-y-4 animate-in fade-in">
      {/* Top Banner Alert Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-amber-200/70">
        <div className="flex items-start space-x-3">
          <div className="p-2.5 rounded-xl bg-amber-500 text-white shadow-xs shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white shadow-2xs">
                High Priority Alert
              </span>
              <h2 className="text-base md:text-lg font-extrabold text-slate-900 tracking-tight">
                QC Reference On Hold — Action Required for Batch Owners
              </h2>
            </div>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
              {effectiveMyCount > 0 ? (
                <>
                  You have <strong className="text-amber-900 font-bold">{effectiveMyCount} batch(es)</strong> as the <strong className="text-slate-900">Batch Owner</strong> marked as <span className="underline decoration-amber-500 font-bold text-amber-800">HOLD</span> in QC Reference. Review auditor remarks, CAD discrepancies, and compare errors below.
                </>
              ) : (
                <>
                  There are <strong className="text-slate-900 font-bold">{onHoldQCReferences.length} batch(es)</strong> currently on hold in QC Reference. Team batch owners are alerted to resolve auditor blocker notes.
                </>
              )}
            </p>
          </div>
        </div>

        {/* Action Controls & Tab Switcher */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto shrink-0">
          {isManager && (
            <div className="flex items-center p-1 rounded-xl bg-white border border-amber-200 shadow-2xs text-xs font-semibold">
              <button
                onClick={() => setViewFilter("MY")}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  currentTab === "MY"
                    ? "bg-amber-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                My Batches ({effectiveMyCount})
              </button>
              <button
                onClick={() => setViewFilter("ALL")}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  currentTab === "ALL"
                    ? "bg-amber-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                All Team ({onHoldQCReferences.length})
              </button>
            </div>
          )}

          <Link
            href="/qc/reference?status=Hold"
            className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-amber-100/70 border border-amber-300 text-amber-900 text-xs font-semibold flex items-center space-x-1.5 shadow-2xs transition-colors"
          >
            <span>Open QC Reference Page</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Grid of On-Hold QC Reference Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {displayList.map((ref) => {
          const ownerName = (ref.batch_owner?.name || "").toLowerCase().trim();
          const ownerEmail = (ref.batch_owner?.email || "").toLowerCase().trim();
          const isOwnedByMe =
            user &&
            (ref.batch_owner_id === user.id ||
              ownerEmail === emailLower ||
              ownerName === nameLower);

          return (
            <div
              key={ref.id}
              onClick={() => setSelectedAudit(ref)}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                isOwnedByMe
                  ? "bg-white border-amber-400/90 shadow-xs hover:border-amber-500 hover:shadow-md ring-1 ring-amber-400/40"
                  : "bg-white/95 border-slate-200 hover:border-amber-300 hover:shadow-xs"
              }`}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-black font-mono text-slate-900">
                      Batch #{ref.batch_no}
                    </span>
                    {isOwnedByMe ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-950 border border-amber-300">
                        You Are Batch Owner
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                        Owner: {ref.batch_owner?.name || "Unassigned"}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Audited by <strong className="text-slate-700">{ref.auditor?.name || "QC Lead"}</strong>
                  </p>
                </div>

                <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200 flex items-center space-x-1 shrink-0">
                  <PauseCircle className="w-3 h-3 text-rose-600" />
                  <span>QC HOLD</span>
                </span>
              </div>

              {/* Blocker Reason & Auditor Remarks Box */}
              <div className="p-3 rounded-xl bg-amber-50/90 border border-amber-200/90 text-xs space-y-1">
                <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                  Auditor Remarks / Hold Reason:
                </span>
                <p className="text-slate-800 leading-relaxed text-[11px] font-medium line-clamp-3">
                  {ref.remarks ? (
                    ref.remarks
                  ) : (
                    <span className="text-slate-400 italic">
                      Hold status recorded without specific comment. Check drawing revisions.
                    </span>
                  )}
                </p>
              </div>

              {/* Card Footer: Metadata & Action CTA */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <div className="flex items-center space-x-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Audit Result: <strong className="text-rose-700 font-bold">{ref.audit_result || "FAIL"}</strong></span>
                </div>

                <div className="inline-flex items-center space-x-1 font-semibold text-blue-700 hover:text-blue-800">
                  <span>View Details</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Audit Detail Modal */}
      {selectedAudit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    QC Reference Details — Batch #{selectedAudit.batch_no}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Status: <span className="font-bold text-rose-700 uppercase">HOLD</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedAudit(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-500 block font-semibold">Batch Owner</span>
                  <span className="text-xs font-bold text-slate-900">
                    {selectedAudit.batch_owner?.name || "Unassigned"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block font-semibold">Auditor</span>
                  <span className="text-xs font-bold text-slate-900">
                    {selectedAudit.auditor?.name || "Not assigned"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block font-semibold">QC Status</span>
                  <span className="text-xs font-bold text-amber-700">
                    {selectedAudit.qc_status || "Hold"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block font-semibold">Audit Result</span>
                  <span className="text-xs font-bold text-rose-700">
                    {selectedAudit.audit_result || "FAIL"}
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 space-y-1">
                <span className="text-[11px] font-bold text-amber-900 block">
                  Auditor Remarks & Blocker Clarification:
                </span>
                <p className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                  {selectedAudit.remarks || "No remarks logged."}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <Link
                href={`/qc/reference?search=${selectedAudit.batch_no}`}
                className="text-xs font-semibold text-blue-700 hover:text-blue-800 flex items-center space-x-1"
              >
                <span>Open in QC Reference Master</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
              <button
                onClick={() => setSelectedAudit(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
