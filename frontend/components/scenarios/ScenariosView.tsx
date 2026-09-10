"use client";

import React, { useState } from "react";
import { Scenario, api } from "@/lib/api";
import {
  Search,
  Plus,
  ExternalLink,
  User as UserIcon,
  Calendar,
  Sparkles,
  X,
} from "lucide-react";

interface ScenariosViewProps {
  initialScenarios: Scenario[];
}

export function ScenariosView({ initialScenarios }: ScenariosViewProps) {
  const [scenarios, setScenarios] = useState<Scenario[]>(initialScenarios);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);

  // New Scenario form
  const [scenarioText, setScenarioText] = useState("");
  const [remarkText, setRemarkText] = useState("");
  const [scope, setScope] = useState("Team");
  const [snipUrl, setSnipUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchScenarios = async () => {
    try {
      const data = await api.getScenarios(search || undefined);
      setScenarios(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateScenario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scenarioText) return;
    setSubmitting(true);
    try {
      await api.createScenario({
        scenario: scenarioText,
        remark: remarkText || undefined,
        individual_or_team: scope,
        last_snip_url: snipUrl || undefined,
        updated_date: new Date().toISOString().split("T")[0],
      });
      setShowModal(false);
      setScenarioText("");
      setRemarkText("");
      setSnipUrl("");
      fetchScenarios();
    } catch (err: any) {
      alert(err.message || "Failed to add scenario");
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = scenarios.filter((sc) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      sc.scenario.toLowerCase().includes(s) ||
      (sc.remark && sc.remark.toLowerCase().includes(s)) ||
      (sc.individual_or_team && sc.individual_or_team.toLowerCase().includes(s))
    );
  });

  return (
    <div className="space-y-6">
      {/* Search & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search scenario title, remark, rules..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-2xs"
          />
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-600 text-white font-semibold text-xs flex items-center space-x-1.5 shadow-xs transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Scenario</span>
        </button>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.length > 0 ? (
          filtered.map((sc) => (
            <div
              key={sc.id}
              className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-blue-300 hover:shadow-sm transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wider flex items-center space-x-1">
                    <Sparkles className="w-3 h-3 text-blue-700" />
                    <span>{sc.individual_or_team || "Team"} Scope</span>
                  </span>
                  <span className="text-[11px] text-slate-400 flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{sc.updated_date}</span>
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 tracking-tight">{sc.scenario}</h3>

                {sc.remark && (
                  <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    {sc.remark}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                <span className="text-slate-500 flex items-center space-x-1.5">
                  <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                  <span>Updated by {sc.updated_by?.name || "Senior Lead"}</span>
                </span>

                {sc.last_snip_url ? (
                  <a
                    href={sc.last_snip_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-700 hover:text-blue-800 font-semibold flex items-center space-x-1 text-xs cursor-pointer"
                  >
                    <span>[View Snip]</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <span className="text-slate-400 text-[11px]">No snip</span>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-2 p-12 text-center text-slate-400 italic">
            No scenarios found matching this search.
          </div>
        )}
      </div>

      {/* Add Scenario Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900">Create Knowledge Scenario</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateScenario} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Scenario Title *</label>
                <input
                  required
                  type="text"
                  value={scenarioText}
                  onChange={(e) => setScenarioText(e.target.value)}
                  placeholder="e.g. PN Mismatch between Teamcenter and Draft"
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Scope</label>
                <select
                  value={scope}
                  onChange={(e) => setScope(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-500"
                >
                  <option value="Team">Team (Global Standard)</option>
                  <option value="Individual">Individual (Specific Assignee)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Clarification / Remark *</label>
                <textarea
                  required
                  rows={3}
                  value={remarkText}
                  onChange={(e) => setRemarkText(e.target.value)}
                  placeholder="Explain the approved resolution or drafting formula..."
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Supporting Snip / Screenshot URL</label>
                <input
                  type="url"
                  value={snipUrl}
                  onChange={(e) => setSnipUrl(e.target.value)}
                  placeholder="https://sharepoint.c2l.internal/evidence/snip.png"
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-600 text-white font-semibold shadow-xs transition-all cursor-pointer"
                >
                  {submitting ? "Saving..." : "Save Reference"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
