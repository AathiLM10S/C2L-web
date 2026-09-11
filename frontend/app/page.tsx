import React from "react";
import Link from "next/link";
import { getDashboardDataServer } from "@/services/dashboard.service";
import { DashboardRecentBatches } from "@/components/dashboard/DashboardRecentBatches";
import { DashboardOnHoldPrioritySection } from "@/components/dashboard/DashboardOnHoldPrioritySection";
import { StatusBadge } from "@/components/common/StatusBadge";
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowUpRight,
  ChevronRight,
  Layers,
  ShieldAlert,
  TrendingUp,
  Activity,
  AlertCircle,
  FileSpreadsheet,
  CheckCircle,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  let data;
  try {
    data = await getDashboardDataServer();
  } catch (e) {
    console.error("Dashboard server fetch error:", e);
    data = {
      user_name: "Team Member",
      user_role: "LEAD",
      is_admin_or_manager: true,
      kpis: {
        total_batches: 0,
        completed: 0,
        in_progress: 0,
        yet_to_start: 0,
        on_hold: 0,
        pending_audit: 0,
        audit_passed: 0,
        audit_failed: 0,
        open_qc_issues: 0,
        resolved_qc_issues: 0,
        client_ready: 0,
      },
      recent_batches: [],
      recent_qc_issues: [],
      status_distribution: {},
      work_type_distribution: {},
    };
  }

  const kpis = data?.kpis;
  const totalBatches = kpis?.total_batches || 1;
  const completionRate = Math.round(((kpis?.completed || 0) / totalBatches) * 100);
  const clientReadyRate = Math.round(((kpis?.client_ready || 0) / totalBatches) * 100);

  return (
    <div className="space-y-7 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Executive Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0F2942] via-[#143859] to-[#1E40AF] p-7 md:p-8 text-white shadow-[0_12px_36px_rgba(15,41,66,0.18)] ring-1 ring-white/10">
        {/* Subtle geometric grid background overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-10 -bottom-10 w-60 h-60 bg-cyan-500/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-cyan-200">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 status-dot-blue animate-pulse" />
              <span>{data?.user_role || "LEAD"} Workspace Active</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
              Good day, {data?.user_name || "Team Member"}
            </h1>

            <p className="text-blue-100/80 text-xs sm:text-sm max-w-2xl leading-relaxed">
              {data?.is_admin_or_manager
                ? "Full operations command: monitor CAD model cleanup throughput, quality audit clearance, on-hold bottlenecks, and client deliverable readiness."
                : "Your personal CAD workstation overview: track your assigned batches, log daily updates, and monitor quality inspection clearance."}
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              href="/c2l/my-batches"
              className="px-4 py-2.5 rounded-xl bg-white text-[#0F2942] hover:bg-cyan-50 font-bold text-xs shadow-md transition-all flex items-center space-x-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>My Active Batches</span>
              <ArrowUpRight className="w-4 h-4 text-blue-700" />
            </Link>
            <Link
              href="/c2l/daily-tracker"
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/25 font-semibold text-xs backdrop-blur-md transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Today&apos;s Update</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Priority Bottleneck Section (If any on-hold audits exist) */}
      <DashboardOnHoldPrioritySection
        onHoldQCReferences={data?.on_hold_qc_references || []}
        myOnHoldQCCount={data?.my_on_hold_qc_count || 0}
        isAdminOrManager={data?.is_admin_or_manager || false}
      />

      {/* Primary KPI Operations Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Registry Volume */}
        <div className="surface-elevated p-5 rounded-2xl relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total Batches
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs border border-blue-200/60">
              <FolderKanban className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[#0F2942] tracking-tight">
            {kpis?.total_batches ?? 0}
          </div>
          <div className="mt-3 space-y-1.5">
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(10, completionRate))}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 font-medium">
              <span>{kpis?.completed ?? 0} finished</span>
              <span>{completionRate}% progress</span>
            </div>
          </div>
        </div>

        {/* Active Work In-Progress */}
        <div className="surface-elevated p-5 rounded-2xl relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
              In Progress
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-200/60">
              <Activity className="w-4 h-4 animate-pulse" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-blue-700 tracking-tight">
            {kpis?.in_progress ?? 0}
          </div>
          <div className="mt-3 flex items-center space-x-1.5 text-[11px] text-blue-700 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 status-dot-blue" />
            <span>Active CAD modeling & cleanup</span>
          </div>
        </div>

        {/* Work Completed */}
        <div className="surface-elevated p-5 rounded-2xl relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
              Work Completed
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200/60">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-emerald-700 tracking-tight">
            {kpis?.completed ?? 0}
          </div>
          <div className="mt-3 flex items-center space-x-1.5 text-[11px] text-emerald-700 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 status-dot-emerald" />
            <span>Finished & awaiting audit review</span>
          </div>
        </div>

        {/* Client Ready (The Gold Standard) */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50/90 via-teal-50/50 to-white border border-emerald-300/80 shadow-[0_4px_16px_-2px_rgba(5,150,105,0.08)] relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-900">
              Client Ready
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-800 tracking-tight">
            {kpis?.client_ready ?? 0}
          </div>
          <div className="mt-3 flex items-center justify-between text-[10px] text-emerald-800 font-semibold">
            <span>Work Done + Audit Passed</span>
            <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-mono">
              {clientReadyRate}% of total
            </span>
          </div>
        </div>
      </div>

      {/* Secondary Operational Status Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Yet to Start
            </span>
            <span className="text-xl font-extrabold text-slate-800 mt-0.5 block">
              {kpis?.yet_to_start ?? 0}
            </span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold">
            Backlog
          </span>
        </div>

        <Link
          href="/c2l/batch-status?status=ON_HOLD"
          className="p-4 rounded-xl bg-amber-50/70 hover:bg-amber-50 border border-amber-200/90 flex items-center justify-between shadow-2xs transition-all cursor-pointer group"
        >
          <div>
            <span className="text-[10px] uppercase font-bold text-amber-800 block tracking-wider">
              On Hold
            </span>
            <span className="text-xl font-extrabold text-amber-700 mt-0.5 block">
              {kpis?.on_hold ?? 0}
            </span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold border border-amber-300/80 group-hover:bg-amber-200 transition-colors">
            Attention
          </span>
        </Link>

        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Audit Passed
            </span>
            <span className="text-xl font-extrabold text-emerald-700 mt-0.5 block">
              {kpis?.audit_passed ?? 0}
            </span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/70 font-bold">
            Verified
          </span>
        </div>

        <Link
          href="/c2l/log"
          className="p-4 rounded-xl bg-white hover:bg-blue-50/50 border border-slate-200/90 flex items-center justify-between shadow-2xs transition-all cursor-pointer group"
        >
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Master Log
            </span>
            <span className="text-sm font-bold text-blue-700 mt-1 block">
              Full Timesheet
            </span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/70 font-bold group-hover:bg-blue-100">
            CSV Log
          </span>
        </Link>
      </div>

      {/* Main Content Grid: Recent Batches & Quick Tools */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Active Batches (2 cols) */}
        <div className="lg:col-span-2 surface-card p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Recent Active Batches
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Click any row to open drawer with full lifecycle history and QA audit
              </p>
            </div>
            <Link
              href="/c2l/batch-status"
              className="text-xs font-bold text-blue-700 hover:text-blue-800 flex items-center space-x-1 transition-colors"
            >
              <span>Batch Status Report</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <DashboardRecentBatches batches={data?.recent_batches || []} />
        </div>

        {/* Quick Operations & Tools (1 col) */}
        <div className="surface-card p-6 rounded-3xl space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="pb-2 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Operational Shortcuts
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Direct access to core C2L workflows
              </p>
            </div>

            <div className="space-y-2.5">
              <Link
                href="/c2l/batch-status"
                className="p-3.5 rounded-2xl bg-[#F8FAFC] hover:bg-blue-50/70 border border-slate-200/80 hover:border-blue-200 flex items-center justify-between transition-all group cursor-pointer"
              >
                <div>
                  <span className="text-xs font-bold text-slate-900 group-hover:text-blue-700 block">
                    C2L Batch Status Report
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    150+ batches with stage filters & quick status
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
              </Link>

              <Link
                href="/c2l/log"
                className="p-3.5 rounded-2xl bg-[#F8FAFC] hover:bg-blue-50/70 border border-slate-200/80 hover:border-blue-200 flex items-center justify-between transition-all group cursor-pointer"
              >
                <div>
                  <span className="text-xs font-bold text-slate-900 group-hover:text-blue-700 block">
                    C2L Master Log Timesheet
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Hours, work types & QC reviewer assignments
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
              </Link>

              <Link
                href="/c2l/daily-tracker"
                className="p-3.5 rounded-2xl bg-[#F8FAFC] hover:bg-blue-50/70 border border-slate-200/80 hover:border-blue-200 flex items-center justify-between transition-all group cursor-pointer"
              >
                <div>
                  <span className="text-xs font-bold text-slate-900 group-hover:text-blue-700 block">
                    Daily Task Update Tracker
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Phase 1 & Phase 2 daily task records
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
              </Link>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <Link
              href="/c2l-scenarios"
              className="w-full py-2.5 px-3.5 rounded-xl bg-blue-50/80 hover:bg-blue-100/70 border border-blue-200/80 text-blue-800 text-xs font-bold flex items-center justify-between transition-all"
            >
              <span>Explore C2L Knowledge Scenarios</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
