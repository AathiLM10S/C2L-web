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
  Zap,
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
  const isSystemAdmin =
    role === "ADMIN" ||
    ["dharunkumar.j@solidpro-es.com", "admin@c2l-qc.com"].includes(emailLower);
  const canAccessQCIssues =
    isSystemAdmin ||
    [
      "dharun kumar",
      "dharun",
      "system administrator",
      "jothi bash",
      "bash",
      "aathithya",
      "keerthana",
    ].includes(nameLower) ||
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
      label: "OPERATIONS PIPELINE",
      items: [
        {
          name: "My Batches",
          href: "/c2l/my-batches",
          icon: FolderKanban,
          badge: "My Work",
          badgeColor: "bg-blue-50 text-blue-700 border border-blue-200/70",
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
          badge: "Daily",
          badgeColor: "bg-indigo-50 text-indigo-700 border border-indigo-200/70",
        },
        {
          name: "Batch Status Report",
          href: "/c2l/batch-status",
          icon: FileBarChart,
          badge: "Live",
          badgeColor: "bg-emerald-50 text-emerald-700 border border-emerald-200/70",
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
                badgeColor: "bg-rose-50 text-rose-700 border border-rose-200/70",
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
      label: "MANAGEMENT",
      items: [
        {
          name: "Reports & Export",
          href: "/reports",
          icon: FileBarChart,
        },
        ...(isAdminOrLead
          ? [
              {
                name: "Team & Roles",
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
      className={`fixed top-0 left-0 z-40 h-screen transition-all duration-200 flex flex-col bg-white border-r border-slate-200/85 text-slate-700 shadow-[0_1px_3px_rgba(15,23,42,0.02)] ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200/80 bg-white">
        <Link href="/" className="flex items-center space-x-3 overflow-hidden group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0F2942] to-[#1E40AF] flex items-center justify-center shadow-xs shadow-blue-900/20 shrink-0 ring-1 ring-blue-500/20 group-hover:scale-105 transition-transform">
            <Zap className="w-4 h-4 text-cyan-300 fill-cyan-400" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold text-base tracking-tight text-[#0F2942]">
                  C2L
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200/60">
                  OPS
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium tracking-wide">
                SolidPro Engineering
              </span>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation list */}
      <div className="flex-1 overflow-y-auto py-5 px-3 space-y-6">
        {navSections.map((section, idx) => (
          <div key={idx} className="space-y-1">
            {!collapsed && (
              <div className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
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
                    className={`group flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 relative ${
                      isActive
                        ? "bg-blue-50/80 text-blue-900 border border-blue-200/70 shadow-2xs font-bold"
                        : "text-slate-600 hover:bg-slate-50/90 hover:text-slate-900"
                    }`}
                    title={collapsed ? item.name : undefined}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 rounded-r-full bg-blue-600" />
                    )}
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          isActive
                            ? "text-blue-700"
                            : "text-slate-400 group-hover:text-blue-600"
                        }`}
                      />
                      {!collapsed && <span className="truncate">{item.name}</span>}
                    </div>

                    {!collapsed && item.badge && (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
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
      <div className="p-3 border-t border-slate-200/80 bg-slate-50/70">
        {!collapsed ? (
          <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-[#0F2942] text-white flex items-center justify-center font-bold text-[11px] shrink-0">
                {user?.name ? user.name.slice(0, 2).toUpperCase() : "US"}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-slate-900 truncate">
                  {user?.name || "Loading..."}
                </span>
                <span className="text-[10px] text-blue-700 font-semibold tracking-wide capitalize">
                  {role.toLowerCase()}
                </span>
              </div>
            </div>
            <span
              className="w-2 h-2 rounded-full bg-emerald-500 status-dot-emerald shrink-0"
              title="Session Active"
            />
          </div>
        ) : (
          <div className="flex justify-center py-1">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 status-dot-emerald" />
          </div>
        )}
      </div>
    </aside>
  );
};
