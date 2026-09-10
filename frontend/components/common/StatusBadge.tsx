import React from "react";

interface StatusBadgeProps {
  status: string;
  type?: "work" | "audit" | "qc";
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = "work", className = "" }) => {
  const norm = (status || "YET_TO_START").toUpperCase().replace(/\s+/g, "_");

  let colors = "bg-slate-100 text-slate-700 border-slate-200"; // fallback

  if (norm === "COMPLETED" || norm === "PASSED" || norm === "RESOLVED" || norm === "PASS" || norm === "YES") {
    colors = "bg-emerald-50 text-emerald-700 border-emerald-200";
  } else if (norm === "IN_PROGRESS" || norm === "INPROGRESS") {
    colors = "bg-blue-50 text-blue-700 border-blue-200";
  } else if (norm === "YET_TO_START" || norm === "PENDING") {
    colors = "bg-slate-100 text-slate-600 border-slate-200";
  } else if (norm === "ON_HOLD" || norm === "HOLD" || norm === "RE_AUDIT" || norm === "IN_REVIEW") {
    colors = "bg-amber-50 text-amber-700 border-amber-200";
  } else if (norm === "FAILED" || norm === "FAIL" || norm === "CANCELLED" || norm === "OPEN") {
    colors = "bg-rose-50 text-rose-700 border-rose-200";
  }

  const label = status ? status.replace(/_/g, " ") : "Yet to Start";

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${colors} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-70"></span>
      {label}
    </span>
  );
};
