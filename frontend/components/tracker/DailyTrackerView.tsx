"use client";

import React, { useState } from "react";
import { DailyTracker, User, api } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import {
  Search,
  Plus,
  Edit3,
  Lock,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  User as UserIcon,
  Users,
  Layers,
  Sparkles,
  LayoutGrid,
  CalendarCheck,
  ArrowRight,
  Filter,
  CheckCircle,
} from "lucide-react";

interface DailyTrackerViewProps {
  initialTrackers: DailyTracker[];
  initialUsers: User[];
}

export function DailyTrackerView({
  initialTrackers,
  initialUsers,
}: DailyTrackerViewProps) {
  const { user } = useAuth();
  const [trackers, setTrackers] = useState<DailyTracker[]>(initialTrackers);
  const [users] = useState<User[]>(initialUsers);

  // Active Tab: "my-updates" (primary) vs "team-updates" (secondary visibility)
  const [activeTab, setActiveTab] = useState<"my-updates" | "team-updates">("my-updates");

  // Filters for My Updates
  const [mySearch, setMySearch] = useState("");
  const [myStatusFilter, setMyStatusFilter] = useState("ALL");

  // Filters for Team Updates
  const [teamSearch, setTeamSearch] = useState("");
  const [teamEmployeeFilter, setTeamEmployeeFilter] = useState("ALL");
  const [teamDateFilter, setTeamDateFilter] = useState("ALL");
  const [teamStatusFilter, setTeamStatusFilter] = useState("ALL");

  // Modals & Form
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingTrackerId, setEditingTrackerId] = useState<number | null>(null);
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);
  const [formPhase1, setFormPhase1] = useState("");
  const [formPhase2, setFormPhase2] = useState("");
  const [formStatus, setFormStatus] = useState("Completed");
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const todayStr = "2026-09-10"; // Today's date in tracker context

  // Check if current user is owner or admin
  const isOwnerOf = (t: DailyTracker) => {
    if (!user) return false;
    if (t.user_id && t.user_id === user.id) return true;
    return t.user_name.toLowerCase().trim() === user.name.toLowerCase().trim();
  };

  const isAdmin = user?.role === "ADMIN";

  const refreshData = async () => {
    try {
      const data = await api.getDailyTrackers({ limit: 500 });
      setTrackers(data);
    } catch (e) {
      console.error("Error refreshing tracker data:", e);
    }
  };

  // Filter My Trackers
  const myTrackers = trackers.filter((t) => isOwnerOf(t));

  // Find Today's update for current user
  const myTodayUpdate = myTrackers.find((t) => t.task_date === todayStr);

  // Filtered personal records
  const filteredMyTrackers = myTrackers.filter((t) => {
    if (myStatusFilter !== "ALL") {
      const s = (t.status || "").toLowerCase();
      if (!s.includes(myStatusFilter.toLowerCase())) return false;
    }
    if (!mySearch) return true;
    const q = mySearch.toLowerCase();
    return (
      (t.phase_1 && t.phase_1.toLowerCase().includes(q)) ||
      (t.phase_2 && t.phase_2.toLowerCase().includes(q)) ||
      (t.task_date && t.task_date.toLowerCase().includes(q)) ||
      (t.status && t.status.toLowerCase().includes(q))
    );
  });

  // Unique dates for team filter
  const uniqueDates = Array.from(new Set(trackers.map((t) => t.task_date))).filter(Boolean).sort().reverse();

  // Filtered Team Trackers
  const filteredTeamTrackers = trackers.filter((t) => {
    if (teamDateFilter !== "ALL" && t.task_date !== teamDateFilter) {
      return false;
    }
    if (teamEmployeeFilter !== "ALL") {
      if (t.user_name.toLowerCase().trim() !== teamEmployeeFilter.toLowerCase().trim()) {
        return false;
      }
    }
    if (teamStatusFilter !== "ALL") {
      const s = (t.status || "").toLowerCase();
      if (!s.includes(teamStatusFilter.toLowerCase())) return false;
    }
    if (!teamSearch) return true;
    const q = teamSearch.toLowerCase();
    return (
      (t.user_name && t.user_name.toLowerCase().includes(q)) ||
      (t.phase_1 && t.phase_1.toLowerCase().includes(q)) ||
      (t.phase_2 && t.phase_2.toLowerCase().includes(q)) ||
      (t.task_date && t.task_date.toLowerCase().includes(q)) ||
      (t.status && t.status.toLowerCase().includes(q))
    );
  });

  // Open Create Modal
  const openCreateModal = (targetDate?: string) => {
    setModalMode("create");
    setEditingTrackerId(null);
    setFormDate(targetDate || todayStr);
    setFormPhase1("");
    setFormPhase2("");
    setFormStatus("Completed");
    setShowModal(true);
  };

  // Open Edit Modal
  const openEditModal = (t: DailyTracker) => {
    const canEdit = isOwnerOf(t) || isAdmin;
    if (!canEdit) {
      alert("You can only edit your own daily worklog entries. Others' entries are view-only.");
      return;
    }
    setModalMode("edit");
    setEditingTrackerId(t.id);
    setFormDate(t.task_date);
    setFormPhase1(t.phase_1 || "");
    setFormPhase2(t.phase_2 || "");
    setFormStatus(t.status || "Completed");
    setShowModal(true);
  };

  // Handle Submit (Create or Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPhase1 && !formPhase2) {
      alert("Please enter at least Phase 1 or Phase 2 task updates.");
      return;
    }
    setSubmitting(true);
    try {
      if (modalMode === "create") {
        await api.createDailyTracker({
          task_date: formDate,
          phase_1: formPhase1 || undefined,
          phase_2: formPhase2 || undefined,
          status: formStatus,
        });
        setNotification(`Daily task update for ${formDate} saved successfully!`);
      } else if (modalMode === "edit" && editingTrackerId) {
        await api.updateDailyTracker(editingTrackerId, {
          task_date: formDate,
          phase_1: formPhase1,
          phase_2: formPhase2,
          status: formStatus,
        });
        setNotification(`Daily task update for ${formDate} updated successfully!`);
      }
      setShowModal(false);
      refreshData();
    } catch (err: any) {
      alert(err.message || "Failed to save daily task log");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (statusStr: string) => {
    const s = (statusStr || "").toLowerCase();
    if (s.includes("complete")) {
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle className="w-3 h-3 text-emerald-600" />
          <span>Completed</span>
        </span>
      );
    }
    if (s.includes("progress")) {
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
          <Clock className="w-3 h-3 text-blue-600" />
          <span>In-Progress</span>
        </span>
      );
    }
    if (s.includes("hold")) {
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <AlertCircle className="w-3 h-3 text-amber-600" />
          <span>On-Hold</span>
        </span>
      );
    }
    if (s.includes("leave")) {
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
          <span>Leave</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
        <span>{statusStr || "Recorded"}</span>
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        {/* Navigation Tabs */}
        <div className="flex items-center space-x-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
          <button
            onClick={() => setActiveTab("my-updates")}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "my-updates"
                ? "bg-white text-blue-800 shadow-xs border border-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <UserIcon className="w-4 h-4 text-blue-700" />
            <span>My Daily Updates</span>
            <span className="px-2 py-0.2 rounded-full text-[10px] bg-blue-50 text-blue-700 font-extrabold border border-blue-200">
              {myTrackers.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("team-updates")}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "team-updates"
                ? "bg-white text-blue-800 shadow-xs border border-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Users className="w-4 h-4 text-slate-500" />
            <span>All Team Updates (Visibility)</span>
            <span className="px-2 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-700 font-extrabold">
              {trackers.length}
            </span>
          </button>
        </div>

        {/* Primary Action Button */}
        <button
          onClick={() => openCreateModal(todayStr)}
          className="px-4 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-600 text-white font-semibold text-xs flex items-center space-x-2 shadow-xs transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Log Daily Tasks</span>
        </button>
      </div>

      {notification && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between shadow-2xs animate-fade-in">
          <span className="font-medium">{notification}</span>
          <button
            onClick={() => setNotification(null)}
            className="text-emerald-600 hover:text-emerald-900 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: MY DAILY UPDATES (PRIMARY PERSONAL WORK-CARD EXPERIENCE) */}
      {/* ========================================================================= */}
      {activeTab === "my-updates" && (
        <div className="space-y-8 animate-fade-in">
          {/* 1. HERO CARD: TODAY'S UPDATE */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <Sparkles className="w-4 h-4 text-blue-700" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Today&apos;s Update ({todayStr})
              </h2>
            </div>

            {myTodayUpdate ? (
              /* Already Logged for Today */
              <div className="p-6 rounded-3xl bg-gradient-to-br from-white via-blue-50/30 to-blue-50/60 border border-blue-200 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-blue-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-700 text-white flex items-center justify-center font-bold text-sm shadow-xs shadow-blue-700/30">
                      {user?.name?.slice(0, 2).toUpperCase() || "ME"}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-base font-bold text-slate-900">
                          {user?.name}&apos;s Log for Today
                        </h3>
                        {getStatusBadge(myTodayUpdate.status)}
                      </div>
                      <span className="text-xs text-slate-500 font-mono">
                        Date: {myTodayUpdate.task_date} • Recorded in C2L Tracker
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => openEditModal(myTodayUpdate)}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-600 text-white text-xs font-bold shadow-xs transition-all cursor-pointer self-start sm:self-auto"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Today&apos;s Update</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Phase 1 Box */}
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
                    <div className="flex items-center space-x-1.5 text-blue-700 font-bold uppercase tracking-wider text-[11px]">
                      <Layers className="w-3.5 h-3.5" />
                      <span>Phase 1 Work / Batches</span>
                    </div>
                    <p className="text-slate-800 leading-relaxed whitespace-pre-line text-xs font-normal">
                      {myTodayUpdate.phase_1 || <span className="text-slate-400 italic">No Phase 1 tasks entered</span>}
                    </p>
                  </div>

                  {/* Phase 2 Box */}
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
                    <div className="flex items-center space-x-1.5 text-blue-700 font-bold uppercase tracking-wider text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-700" />
                      <span>Phase 2 Work / Batches</span>
                    </div>
                    <p className="text-slate-800 leading-relaxed whitespace-pre-line text-xs font-normal">
                      {myTodayUpdate.phase_2 || <span className="text-slate-400 italic">No Phase 2 tasks entered</span>}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* Not Yet Logged for Today */
              <div className="p-6 rounded-3xl bg-white border-2 border-dashed border-blue-200 text-center space-y-3 shadow-xs">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    You haven&apos;t logged today&apos;s tasks yet ({todayStr})
                  </h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                    Keep your operational progress current by updating your Phase 1 and Phase 2 tasks for today.
                  </p>
                </div>
                <div>
                  <button
                    onClick={() => openCreateModal(todayStr)}
                    className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-600 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Log Today&apos;s Work ({todayStr})</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 2. SUMMARY METRICS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">My Logged Days</span>
              <div className="text-2xl font-bold text-slate-900 mt-1">{myTrackers.length}</div>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 shadow-2xs">
              <span className="text-xs text-emerald-800 font-medium">Completed Logs</span>
              <div className="text-2xl font-bold text-emerald-700 mt-1">
                {myTrackers.filter((t) => (t.status || "").toLowerCase().includes("complete")).length}
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/80 shadow-2xs">
              <span className="text-xs text-blue-800 font-medium">In-Progress Logs</span>
              <div className="text-2xl font-bold text-blue-700 mt-1">
                {myTrackers.filter((t) => (t.status || "").toLowerCase().includes("progress")).length}
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Today&apos;s Status</span>
              <div className="text-sm font-bold text-slate-900 mt-2">
                {myTodayUpdate ? (
                  <span className="text-emerald-700">Logged ({myTodayUpdate.status})</span>
                ) : (
                  <span className="text-amber-700">Pending Log</span>
                )}
              </div>
            </div>
          </div>

          {/* 3. HISTORICAL WORKLOG CARDS GRID */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  My Worklog History ({filteredMyTrackers.length} Days)
                </h3>
                <p className="text-xs text-slate-500">
                  Personal daily updates across all production dates
                </p>
              </div>

              {/* Filters */}
              <div className="flex items-center space-x-2">
                <div className="relative w-48 sm:w-60">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search my logs..."
                    value={mySearch}
                    onChange={(e) => setMySearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-2xs"
                  />
                </div>

                <select
                  value={myStatusFilter}
                  onChange={(e) => setMyStatusFilter(e.target.value)}
                  className="py-1.5 px-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 focus:outline-none focus:border-blue-500 shadow-2xs"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="Completed">Completed</option>
                  <option value="In-Progress">In-Progress</option>
                  <option value="On-Hold">On-Hold</option>
                  <option value="Leave">Leave</option>
                </select>
              </div>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMyTrackers.length > 0 ? (
                filteredMyTrackers.map((t) => (
                  <div
                    key={t.id}
                    className={`p-5 rounded-2xl bg-white border transition-all shadow-xs hover:shadow-sm flex flex-col justify-between space-y-3 ${
                      t.task_date === todayStr
                        ? "border-blue-300 ring-2 ring-blue-50"
                        : "border-slate-200"
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Card Top */}
                      <div className="flex items-center justify-between">
                        <span className="flex items-center space-x-1.5 text-xs font-bold text-slate-900 font-mono">
                          <Calendar className="w-3.5 h-3.5 text-blue-700" />
                          <span>{t.task_date}</span>
                          {t.task_date === todayStr && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] bg-blue-100 text-blue-800 font-bold">
                              Today
                            </span>
                          )}
                        </span>
                        {getStatusBadge(t.status)}
                      </div>

                      {/* Phase 1 */}
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                        <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">
                          Phase 1:
                        </span>
                        <p className="text-slate-800 text-xs leading-relaxed whitespace-pre-line">
                          {t.phase_1 || <span className="text-slate-400 italic">None</span>}
                        </p>
                      </div>

                      {/* Phase 2 */}
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                        <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">
                          Phase 2:
                        </span>
                        <p className="text-slate-800 text-xs leading-relaxed whitespace-pre-line">
                          {t.phase_2 || <span className="text-slate-400 italic">None</span>}
                        </p>
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">
                        Worklog #{t.id}
                      </span>
                      <button
                        onClick={() => openEditModal(t)}
                        className="inline-flex items-center space-x-1 px-3 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Edit Log</span>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full p-12 text-center text-slate-400 italic bg-white rounded-2xl border border-slate-200">
                  No personal worklogs match this filter.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ALL TEAM UPDATES (SECONDARY VISIBILITY & OBSERVATION TAB) */}
      {/* ========================================================================= */}
      {activeTab === "team-updates" && (
        <div className="space-y-6 animate-fade-in">
          {/* Header Info Banner */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-blue-700" />
              <span>
                <strong>Team Visibility:</strong> Observing daily task updates across all 9 team members.
                Other members&apos; logs are view-only.
              </span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white border border-slate-200 text-slate-700 shadow-2xs">
              {filteredTeamTrackers.length} Logs Displayed
            </span>
          </div>

          {/* Filter Bar */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Search */}
            <div className="relative md:col-span-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search team updates..."
                value={teamSearch}
                onChange={(e) => setTeamSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>

            {/* Date Filter */}
            <div>
              <select
                value={teamDateFilter}
                onChange={(e) => setTeamDateFilter(e.target.value)}
                className="w-full py-2 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
              >
                <option value="ALL">All Dates</option>
                {uniqueDates.map((d) => (
                  <option key={d} value={d}>
                    {d === todayStr ? `Today (${d})` : d}
                  </option>
                ))}
              </select>
            </div>

            {/* Employee Filter */}
            <div>
              <select
                value={teamEmployeeFilter}
                onChange={(e) => setTeamEmployeeFilter(e.target.value)}
                className="w-full py-2 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
              >
                <option value="ALL">All Team Members</option>
                {users.map((u) => (
                  <option key={u.id} value={u.name}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={teamStatusFilter}
                onChange={(e) => setTeamStatusFilter(e.target.value)}
                className="w-full py-2 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="Completed">Completed</option>
                <option value="In-Progress">In-Progress</option>
                <option value="On-Hold">On-Hold</option>
                <option value="Leave">Leave</option>
              </select>
            </div>
          </div>

          {/* Team Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTeamTrackers.length > 0 ? (
              filteredTeamTrackers.map((t) => {
                const isOwner = isOwnerOf(t);
                const canEdit = isOwner || isAdmin;

                return (
                  <div
                    key={t.id}
                    className={`p-5 rounded-2xl bg-white border transition-all shadow-xs hover:shadow-sm flex flex-col justify-between space-y-3 ${
                      isOwner ? "border-blue-300 ring-2 ring-blue-50/50" : "border-slate-200"
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Card Header: Member + Date */}
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center font-bold text-xs text-blue-700 shrink-0">
                            {t.user_name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center space-x-1.5">
                              <span className="font-bold text-xs text-slate-900">
                                {t.user_name}
                              </span>
                              {isOwner && (
                                <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-blue-100 text-blue-800">
                                  You
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-500 font-mono block">
                              {t.task_date}
                            </span>
                          </div>
                        </div>

                        <div>{getStatusBadge(t.status)}</div>
                      </div>

                      {/* Phase 1 */}
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                        <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">
                          Phase 1:
                        </span>
                        <p className="text-slate-800 text-xs leading-relaxed whitespace-pre-line">
                          {t.phase_1 || <span className="text-slate-400 italic">None</span>}
                        </p>
                      </div>

                      {/* Phase 2 */}
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                        <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">
                          Phase 2:
                        </span>
                        <p className="text-slate-800 text-xs leading-relaxed whitespace-pre-line">
                          {t.phase_2 || <span className="text-slate-400 italic">None</span>}
                        </p>
                      </div>
                    </div>

                    {/* Card Action Footer */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-slate-400">
                        {t.user?.role || "Team Member"}
                      </span>

                      {canEdit ? (
                        <button
                          onClick={() => openEditModal(t)}
                          className="inline-flex items-center space-x-1 px-3 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Edit My Log</span>
                        </button>
                      ) : (
                        <span
                          className="inline-flex items-center space-x-1 text-slate-400 text-xs select-none"
                          title="View only for other team members"
                        >
                          <Lock className="w-3 h-3 text-slate-400" />
                          <span>View Only</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full p-12 text-center text-slate-400 italic bg-white rounded-2xl border border-slate-200">
                No team updates match the selected filters.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* LOG / EDIT DAILY TASK MODAL */}
      {/* ========================================================================= */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                {modalMode === "create" ? (
                  <>
                    <Plus className="w-5 h-5 text-blue-700" />
                    <h2 className="text-lg font-bold text-slate-900">Log Daily Task Update</h2>
                  </>
                ) : (
                  <>
                    <Edit3 className="w-5 h-5 text-blue-700" />
                    <h2 className="text-lg font-bold text-slate-900">
                      Edit Daily Task Log
                    </h2>
                  </>
                )}
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Task Date *</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-500"
                  >
                    <option value="Completed">Completed</option>
                    <option value="In-Progress">In-Progress</option>
                    <option value="On-Hold">On-Hold</option>
                    <option value="Leave">Leave</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Phase 1 Tasks / Batches Worked
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Batches 308, 457 rework, CAD assessment, PDF compare..."
                  value={formPhase1}
                  onChange={(e) => setFormPhase1(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Phase 2 Tasks / Batches Worked
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Audit batches 97, 340, link checks, Teamcenter vs SE validation..."
                  value={formPhase2}
                  onChange={(e) => setFormPhase2(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600">
                <span>Logging as: </span>
                <strong className="text-slate-900">{user?.name}</strong> ({user?.email})
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-600 text-white font-semibold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                >
                  {submitting
                    ? "Saving..."
                    : modalMode === "create"
                    ? "Save Daily Update"
                    : "Update Worklog"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
