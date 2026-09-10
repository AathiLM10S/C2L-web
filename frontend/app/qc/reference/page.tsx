import React, { Suspense } from "react";
import { getQCReferencesServer } from "@/services/qc.service";
import { getUsersServer } from "@/services/user.service";
import { QCReferenceView } from "@/components/qc/QCReferenceView";

export const dynamic = "force-dynamic";

export default async function QCReferencePage() {
  const [references, users] = await Promise.all([
    getQCReferencesServer({ limit: 400 }),
    getUsersServer(),
  ]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <div className="flex items-center space-x-2">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">QC Reference Master</h1>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            {references.length} Master Records
          </span>
        </div>
        <p className="text-sm text-slate-500 mt-0.5">
          1:1 Exact dataset from QC Reference CSV + Auto-promoted Completed C2L Batches
        </p>
      </div>

      <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading QC Reference master...</div>}>
        <QCReferenceView initialReferences={references} initialUsers={users} />
      </Suspense>
    </div>
  );
}
