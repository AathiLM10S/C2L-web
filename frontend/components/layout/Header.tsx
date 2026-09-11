"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import {
  Menu,
  ExternalLink,
  ChevronDown,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  LogOut,
  UserCheck,
} from "lucide-react";

interface HeaderProps {
  collapsed: boolean;
  onToggleSidebar: () => void;
  title?: string;
}

export const Header: React.FC<HeaderProps> = ({
  collapsed,
  onToggleSidebar,
  title = "C2L Operations Dashboard",
}) => {
  const { user, switchUser, availableUsers, logout } = useAuth();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const pathname = usePathname();

  // Dynamic breadcrumb mapping
  const getBreadcrumb = () => {
    if (pathname === "/") return { section: "Platform", current: "Operations Dashboard" };
    if (pathname === "/c2l/my-batches") return { section: "C2L Batches", current: "My Batches" };
    if (pathname === "/c2l/log") return { section: "C2L Batches", current: "Master Log" };
    if (pathname === "/c2l/daily-tracker") return { section: "Daily Operations", current: "Daily Task Tracker" };
    if (pathname === "/c2l/batch-status") return { section: "Live Analytics", current: "Batch Status Report" };
    if (pathname === "/qc/issues") return { section: "Quality Assurance", current: "QC Issues Log" };
    if (pathname === "/qc/reference") return { section: "Quality Assurance", current: "QC Reference" };
    if (pathname === "/c2l-scenarios") return { section: "Knowledge Base", current: "C2L Scenarios" };
    if (pathname === "/reports") return { section: "Operations", current: "Reports & Export" };
    if (pathname === "/admin/users") return { section: "Administration", current: "Team & Roles" };
    return { section: "Workspace", current: title };
  };

  const breadcrumb = getBreadcrumb();
  const apiDocsUrl = `${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api"}/docs`;

  return (
    <header className="sticky top-0 z-30 h-16 glass-header flex items-center justify-between px-6 text-slate-800">
      {/* Left section: Toggle & Breadcrumb */}
      <div className="flex items-center space-x-3.5">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100/80 transition-colors cursor-pointer"
          title="Toggle Navigation"
        >
          <Menu className="w-4 h-4" />
        </button>

        <div className="flex items-center space-x-2 text-xs">
          <span className="text-slate-400 font-medium hidden sm:inline">
            {breadcrumb.section}
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 hidden sm:inline" />
          <span className="font-bold text-slate-900 tracking-tight text-sm">
            {breadcrumb.current}
          </span>
        </div>
      </div>

      {/* Right section: Swagger link + Persona switcher */}
      <div className="flex items-center space-x-3">
        {/* Backend Swagger Docs Link */}
        <a
          href={apiDocsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden lg:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200/80 hover:border-blue-200 text-xs font-semibold text-slate-600 hover:text-blue-700 transition-all cursor-pointer shadow-2xs"
          title="Open FastAPI Swagger Interactive Documentation"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 status-dot-emerald" />
          <span>API Docs</span>
          <ExternalLink className="w-3 h-3 opacity-60" />
        </a>

        {/* User Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            className="flex items-center space-x-2.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200/90 hover:border-blue-400 hover:shadow-xs transition-all text-left cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-[#0F2942] flex items-center justify-center font-bold text-xs text-white shadow-2xs shrink-0">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : "US"}
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="text-xs font-bold text-slate-900 leading-tight">
                {user?.name || "Select User"}
              </span>
              <span className="text-[10px] text-blue-700 font-semibold tracking-wide">
                {user?.role || "EMPLOYEE"}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
          </button>

          {/* Switcher dropdown */}
          {userDropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white border border-slate-200/90 shadow-[0_20px_50px_rgba(15,41,66,0.16)] py-2 z-50 text-slate-800 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-4 py-2.5 border-b border-slate-100">
                <div className="flex items-center space-x-1.5 text-blue-700">
                  <UserCheck className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-bold uppercase tracking-wider">
                    Switch Active Persona
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Test role permissions & operational workflows
                </p>
              </div>

              <div className="max-h-64 overflow-y-auto py-1 divide-y divide-slate-50">
                {availableUsers.map((u) => {
                  const isCurrent = user?.id === u.id;
                  return (
                    <button
                      key={u.id}
                      onClick={() => {
                        switchUser(u.email);
                        setUserDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-2.5 text-xs transition-colors cursor-pointer ${
                        isCurrent
                          ? "bg-blue-50/80 text-blue-900 font-bold"
                          : "hover:bg-slate-50/80 text-slate-700"
                      }`}
                    >
                      <div className="flex flex-col text-left min-w-0 pr-2">
                        <span className="font-bold text-slate-900 truncate">
                          {u.name}
                        </span>
                        <span className="text-[10px] text-slate-500 truncate">
                          {u.email}
                        </span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono font-bold shrink-0 border border-slate-200">
                        {u.role}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="p-2 border-t border-slate-100 bg-slate-50/70">
                <button
                  onClick={() => {
                    setUserDropdownOpen(false);
                    logout();
                    window.location.href = "/login";
                  }}
                  className="w-full flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl bg-white border border-slate-200 hover:bg-rose-50 hover:border-rose-200 text-slate-700 hover:text-rose-700 text-xs font-bold transition-all cursor-pointer shadow-2xs"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out of Platform</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
