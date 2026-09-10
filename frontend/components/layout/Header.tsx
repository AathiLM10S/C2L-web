"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import {
  Menu,
  ExternalLink,
  ChevronDown,
  Sparkles,
  ShieldCheck,
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

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-6 text-slate-800 shadow-xs">
      {/* Left section: Toggle & Title */}
      <div className="flex items-center space-x-4">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
          title="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex flex-col">
          <h1 className="text-base font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <span>{title}</span>
          </h1>
          <span className="text-[11px] text-blue-700 font-medium">
            Automated C2L Workflow & Quality Assurance
          </span>
        </div>
      </div>

      {/* Right section: Quick Switcher, API Docs, User Avatar */}
      <div className="flex items-center space-x-4">
        {/* Backend Swagger Docs Link */}
        <a
          href="http://127.0.0.1:8000/api/docs"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-blue-700 hover:bg-blue-50 transition-all cursor-pointer"
        >
          <span>FastAPI Docs</span>
          <ExternalLink className="w-3.5 h-3.5 opacity-80" />
        </a>

        {/* User Switcher Dropdown for instant role testing */}
        <div className="relative">
          <button
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            className="flex items-center space-x-2.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-blue-500 hover:shadow-xs transition-all text-left cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-blue-700 flex items-center justify-center font-bold text-xs text-white shadow-xs">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : "US"}
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="text-xs font-semibold text-slate-900 leading-tight">
                {user?.name || "Select User"}
              </span>
              <span className="text-[10px] text-blue-700 font-medium">
                {user?.role || "Role"} • Switch
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
          </button>

          {/* Switcher dropdown */}
          {userDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl bg-white border border-slate-200 shadow-xl py-2 z-50 text-slate-800 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-2 border-b border-slate-100">
                <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider">
                  Switch Active Persona
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Test role permissions & user views
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
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors cursor-pointer ${
                        isCurrent
                          ? "bg-blue-50 text-blue-800 font-semibold"
                          : "hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <div className="flex flex-col text-left">
                        <span className="font-medium text-slate-900">{u.name}</span>
                        <span className="text-[10px] text-slate-500">{u.email}</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono">
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
                  className="w-full flex items-center justify-center space-x-2 py-1.5 px-3 rounded-lg bg-white border border-slate-200 hover:bg-red-50 hover:border-red-200 text-slate-700 hover:text-red-700 text-xs font-semibold transition-all cursor-pointer"
                >
                  <span>Sign Out / Switch Account</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
