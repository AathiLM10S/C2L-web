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

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Welcome Banner — Enterprise White Card with Rich Royal Blue Accents */}
      <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200 p-6 md:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-800 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Role: {data?.user_role || "LEAD"}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
              Good day, {data?.user_name || "Team Member"}
            </h1>
            <p className="text-slate-600 text-sm mt-1 max-w-2xl leading-relaxed">
              {data?.is_admin_or_manager
                ? "Full operations overview: monitor overall batch throughput, audit passes, open QC issues, and client-ready reporting."
                : "Your personalized workload overview: tracking your active batches, upcoming audit eligibility, and quality remarks."}
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href="/c2l/my-batches"
              className="px-4 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-600 text-white font-semibold text-xs shadow-sm transition-all flex items-center space-x-1.5"
            >
              <span>View My Batches</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
            <Link
              href="/reports"
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold text-xs shadow-2xs transition-all flex items-center space-x-1.5"
            >
              <span>Generate Report</span>
            </Link>
          </div>
        </div>
      </div>

      {/* High Priority: QC Reference On-Hold Audits for Corresponding Batch Owners */}
      <DashboardOnHoldPrioritySection
        onHoldQCReferences={data?.on_hold_qc_references || []}
        myOnHoldQCCount={data?.my_on_hold_qc_count || 0}
        isAdminOrManager={data?.is_admin_or_manager || false}
      />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Batches */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-blue-300 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Batches
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <FolderKanban className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900">{kpis?.total_batches ?? 0}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">Across entire registry</span>
        </div>

        {/* Completed Work */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Work Completed
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-700">{kpis?.completed ?? 0}</div>
          <span className="text-[11px] text-emerald-600 mt-1 block">Ready for audit check</span>
        </div>

        {/* In Progress */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-blue-300 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              In Progress
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-blue-700">{kpis?.in_progress ?? 0}</div>
          <span className="text-[11px] text-blue-600 mt-1 block">Active engineering</span>
        </div>

        {/* Client-Ready Highlighted */}
        <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200 shadow-xs hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
              Client Ready
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-800">{kpis?.client_ready ?? 0}</div>
          <span className="text-[11px] text-emerald-700 mt-1 block font-medium">
            Work Done + Audit Passed
          </span>
        </div>
      </div>

      {/* Secondary Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[11px] text-slate-500 block font-medium">Yet To Start</span>
            <span className="text-xl font-bold text-slate-800">{kpis?.yet_to_start ?? 0}</span>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">Backlog</span>
        </div>

        <Link
          href="/c2l/batch-status?status=ON_HOLD"
          className="p-4 rounded-xl bg-amber-50/50 hover:bg-amber-50 border border-amber-200 flex items-center justify-between shadow-2xs hover:border-amber-300 transition-all cursor-pointer"
        >
          <div>
            <span className="text-[11px] text-amber-800 block font-bold">On Hold Batches</span>
            <span className="text-xl font-black text-amber-700">{kpis?.on_hold ?? 0}</span>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 font-bold">
            Attention Needed
          </span>
        </Link>

        <div className="p-4 rounded-xl bg-white border border-slate-200 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[11px] text-slate-500 block font-medium">Audit Passed</span>
            <span className="text-xl font-bold text-emerald-700">{kpis?.audit_passed ?? 0}</span>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">Verified</span>
        </div>

        <Link
          href="/c2l/log"
          className="p-4 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 flex items-center justify-between shadow-2xs transition-all cursor-pointer"
        >
          <div>
            <span className="text-[11px] text-slate-500 block font-medium">C2L Master Log</span>
            <span className="text-xl font-bold text-blue-700">Timesheets</span>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-semibold">Log CSV</span>
        </Link>
      </div>

      {/* Main Content Grid: Recent Batches & Quick Workflows */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Active Batches (2 cols) */}
        <div className="lg:col-span-2 rounded-2xl bg-white border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Recent / Active Batches
              </h2>
              <p className="text-xs text-slate-500">
                Click any batch row for full lifecycle details and work logs
              </p>
            </div>
            <Link
              href="/c2l/batch-status"
              className="text-xs font-semibold text-blue-700 hover:text-blue-800 flex items-center space-x-1"
            >
              <span>Batch Status Report</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <DashboardRecentBatches batches={data?.recent_batches || []} />
        </div>

        {/* Quick Operations & Tools (1 col) */}
        <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                C2L Operational Shortcuts
              </h2>
              <p className="text-xs text-slate-500">Direct access to CAD workflows</p>
            </div>

            <div className="space-y-2.5">
              <Link
                href="/c2l/batch-status"
                className="p-3 rounded-xl bg-slate-50 hover:bg-blue-50/70 border border-slate-200 hover:border-blue-200 flex items-center justify-between transition-all group"
              >
                <div>
                  <span className="text-xs font-bold text-slate-900 group-hover:text-blue-700">
                    C2L Batch Status Report
                  </span>
                  <p className="text-[11px] text-slate-500">
                    150+ batch rows with hold/progress filters
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
              </Link>

              <Link
                href="/c2l/log"
                className="p-3 rounded-xl bg-slate-50 hover:bg-blue-50/70 border border-slate-200 hover:border-blue-200 flex items-center justify-between transition-all group"
              >
                <div>
                  <span className="text-xs font-bold text-slate-900 group-hover:text-blue-700">
                    C2L Master Log Timesheet
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Logged engineering hours & QC reviewers
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
              </Link>

              <Link
                href="/c2l/daily-tracker"
                className="p-3 rounded-xl bg-slate-50 hover:bg-blue-50/70 border border-slate-200 hover:border-blue-200 flex items-center justify-between transition-all group"
              >
                <div>
                  <span className="text-xs font-bold text-slate-900 group-hover:text-blue-700">
                    Daily Task Update Tracker
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Personal work logs and daily updates
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
              </Link>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <Link
              href="/c2l-scenarios"
              className="w-full py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-blue-700 text-xs font-semibold flex items-center justify-between transition-all"
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
