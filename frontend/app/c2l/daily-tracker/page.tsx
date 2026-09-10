import React, { Suspense } from "react";
import { getDailyTrackersServer } from "@/services/daily-tracker.service";
import { getUsersServer } from "@/services/user.service";
import { DailyTrackerView } from "@/components/tracker/DailyTrackerView";
import { CalendarCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DailyTrackerPage() {
  const [trackers, users] = await Promise.all([
    getDailyTrackersServer({ limit: 400 }),
    getUsersServer(),
  ]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Server Header */}
      <div>
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
            <CalendarCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                C2L Daily Task Update Tracker
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                {trackers.length} Daily Worklogs
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-0.5">
              Central daily task and batch progress tracker. Team members can view all logs and update their own daily records.
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Client Component */}
      <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading daily task updates...</div>}>
        <DailyTrackerView initialTrackers={trackers} initialUsers={users} />
      </Suspense>
    </div>
  );
}
