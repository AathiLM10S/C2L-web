"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import {
  LayoutDashboard,
  FolderKanban,
  FileSpreadsheet,
  CheckCircle2,
  ShieldAlert,
  BookOpen,
  FileBarChart,
  Users,
  Layers,
  Sparkles,
  ClipboardCheck,
  CalendarCheck,
} from "lucide-react";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const pathname = usePathname();
  const { user } = useAuth();
  const role = user?.role || "EMPLOYEE";
  const nameLower = (user?.name || "").toLowerCase().trim();
  const emailLower = (user?.email || "").toLowerCase().trim();
  const isAdminOrLead = ["ADMIN", "LEAD", "MANAGER", "BU_HEAD"].includes(role);
  const isSystemAdmin = role === "ADMIN" || ["dharunkumar.j@solidpro-es.com", "admin@c2l-qc.com"].includes(emailLower);
  const canAccessQCIssues =
    isSystemAdmin ||
    ["dharun kumar", "dharun", "system administrator", "jothi bash", "bash", "aathithya", "keerthana"].includes(nameLower) ||
    [
      "dharunkumar.j@solidpro-es.com",
      "jothibash.n@solidpro-es.com",
      "aathithyakathiresan.s@solidpro-es.com",
      "keerthana.a@solidpro-es.com",
      "admin@c2l-qc.com",
      "jothi.bash@c2l-qc.com",
      "aathithya@c2l-qc.com",
      "keerthana@c2l-qc.com",
    ].includes(emailLower);

  const navSections = [
    {
      label: "OVERVIEW",
      items: [
        {
          name: "Dashboard",
          href: "/",
          icon: LayoutDashboard,
        },
      ],
    },
    {
      label: "C2L BATCHES",
      items: [
        {
          name: "My Batches",
          href: "/c2l/my-batches",
          icon: FolderKanban,
          badge: "My Work",
          badgeColor: "bg-blue-100 text-blue-800",
        },
        {
          name: "C2L Master Log",
          href: "/c2l/log",
          icon: FileSpreadsheet,
        },
        {
          name: "Daily Task Tracker",
          href: "/c2l/daily-tracker",
          icon: CalendarCheck,
          badge: "Daily Updates",
          badgeColor: "bg-blue-100 text-blue-800",
        },
        {
          name: "Batch Status Report",
          href: "/c2l/batch-status",
          icon: FileBarChart,
          badge: "Live Status",
          badgeColor: "bg-emerald-100 text-emerald-800",
        },
      ],
    },
    {
      label: "QUALITY & REFERENCE",
      items: [
        ...(canAccessQCIssues
          ? [
              {
                name: "QC Issues Log",
                href: "/qc/issues",
                icon: ShieldAlert,
                badge: "QC Team",
                badgeColor: "bg-rose-100 text-rose-800",
              },
            ]
          : []),
        {
          name: "QC Reference",
          href: "/qc/reference",
          icon: Layers,
        },
        {
          name: "C2L Scenarios",
          href: "/c2l-scenarios",
          icon: BookOpen,
        },
      ],
    },
    {
      label: "OPERATIONS",
      items: [
        {
          name: "Reports & Export",
          href: "/reports",
          icon: FileBarChart,
        },
        ...(isAdminOrLead
          ? [
              {
                name: "Team & Users",
                href: "/admin/users",
                icon: Users,
              },
            ]
          : []),
      ],
    },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 z-40 h-screen transition-all duration-300 flex flex-col bg-white border-r border-slate-200 text-slate-700 shadow-xs ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 bg-white">
        <Link href="/" className="flex items-center space-x-3 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-blue-700 flex items-center justify-center shadow-sm shadow-blue-700/20 shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-lg tracking-tight text-slate-900">
                C2L
              </span>
              <span className="text-[10px] text-blue-700 font-semibold tracking-wider uppercase">
                Operations Platform
              </span>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation list */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {navSections.map((section, idx) => (
          <div key={idx} className="space-y-1">
            {!collapsed && (
              <div className="px-3 text-[11px] font-bold text-slate-400 tracking-wider">
                {section.label}
              </div>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 ${
                      isActive
                        ? "bg-blue-50 text-blue-800 border border-blue-200 shadow-xs"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                    title={collapsed ? item.name : undefined}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          isActive ? "text-blue-700" : "text-slate-400 group-hover:text-blue-600"
                        }`}
                      />
                      {!collapsed && <span className="truncate">{item.name}</span>}
                    </div>

                    {!collapsed && item.badge && (
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          item.badgeColor || "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Role Footer */}
      <div className="p-3 border-t border-slate-200 bg-slate-50">
        {!collapsed ? (
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-white border border-slate-200 shadow-2xs">
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-slate-900 truncate">
                {user?.name || "Loading..."}
              </span>
              <span className="text-[10px] text-blue-700 font-medium capitalize">
                {role.toLowerCase()}
              </span>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-xs shadow-emerald-500/50"></span>
          </div>
        ) : (
          <div className="flex justify-center py-1">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
          </div>
        )}
      </div>
    </aside>
  );
};
