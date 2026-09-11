import React from "react";

interface StatusBadgeProps {
  status: string;
  type?: "work" | "audit" | "qc";
  className?: string;
  size?: "sm" | "md";
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  type = "work",
  className = "",
  size = "md",
}) => {
  const norm = (status || "YET_TO_START").toUpperCase().replace(/\s+/g, "_");

  let colors = "bg-slate-50 text-slate-700 border-slate-200/90";
  let dotClass = "bg-slate-400";
  let animatePulse = false;

  if (
    norm === "COMPLETED" ||
    norm === "PASSED" ||
    norm === "RESOLVED" ||
    norm === "PASS" ||
    norm === "YES"
  ) {
    colors = "bg-emerald-50/90 text-emerald-800 border-emerald-200/80 shadow-[0_1px_2px_rgba(5,150,105,0.06)]";
    dotClass = "bg-emerald-500 status-dot-emerald";
  } else if (norm === "IN_PROGRESS" || norm === "INPROGRESS") {
    colors = "bg-blue-50/90 text-blue-800 border-blue-200/80 shadow-[0_1px_2px_rgba(37,99,235,0.06)]";
    dotClass = "bg-blue-600 status-dot-blue";
    animatePulse = true;
  } else if (norm === "YET_TO_START" || norm === "PENDING") {
    colors = "bg-slate-50 text-slate-600 border-slate-200";
    dotClass = "bg-slate-400";
  } else if (
    norm === "ON_HOLD" ||
    norm === "HOLD" ||
    norm === "RE_AUDIT" ||
    norm === "IN_REVIEW"
  ) {
    colors = "bg-amber-50/90 text-amber-900 border-amber-200/90 shadow-[0_1px_2px_rgba(217,119,6,0.06)]";
    dotClass = "bg-amber-500 status-dot-amber";
  } else if (
    norm === "FAILED" ||
    norm === "FAIL" ||
    norm === "CANCELLED" ||
    norm === "OPEN"
  ) {
    colors = "bg-rose-50/90 text-rose-800 border-rose-200/90 shadow-[0_1px_2px_rgba(225,29,72,0.06)]";
    dotClass = "bg-rose-500 status-dot-rose";
  }

  const label = status ? status.replace(/_/g, " ") : "Yet to Start";

  const sizeClasses =
    size === "sm"
      ? "px-2 py-0.5 text-[10px]"
      : "px-2.5 py-0.5 text-[11px]";

  return (
    <span
      className={`inline-flex items-center font-medium tracking-tight rounded-full border ${sizeClasses} ${colors} ${className}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full mr-1.5 shrink-0 ${dotClass} ${
          animatePulse ? "animate-pulse" : ""
        }`}
      />
      <span className="capitalize">{label}</span>
    </span>
  );
};
