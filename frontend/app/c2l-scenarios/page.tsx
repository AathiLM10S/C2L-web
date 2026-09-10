import React, { Suspense } from "react";
import { getScenariosServer } from "@/services/scenario.service";
import { ScenariosView } from "@/components/scenarios/ScenariosView";

export const dynamic = "force-dynamic";

export default async function ScenariosPage() {
  const scenarios = await getScenariosServer();

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <div className="flex items-center space-x-2">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">C2L Workflow Scenarios</h1>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            {scenarios.length} Reusable References
          </span>
        </div>
        <p className="text-sm text-slate-500 mt-0.5">
          Centralized repository of standard workflow decisions, TC vs SE rules, and edge-case resolutions
        </p>
      </div>

      <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading workflow scenarios...</div>}>
        <ScenariosView initialScenarios={scenarios} />
      </Suspense>
    </div>
  );
}
