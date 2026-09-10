import React, { Suspense } from "react";
import { getUsersServer } from "@/services/user.service";
import { AdminUsersView } from "@/components/admin/AdminUsersView";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const users = await getUsersServer();

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <div className="flex items-center space-x-2">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Team & Role Access</h1>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            {users.length} Registered Staff
          </span>
        </div>
        <p className="text-sm text-slate-500 mt-0.5">
          Manage employee identities, QC auditors, team leads, and system administrators
        </p>
      </div>

      <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading team directory...</div>}>
        <AdminUsersView initialUsers={users} />
      </Suspense>
    </div>
  );
}
