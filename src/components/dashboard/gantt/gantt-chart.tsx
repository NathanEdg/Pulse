"use client";

import type { project } from "@/server/db/projects";
import type { task } from "@/server/db/tasks";

interface GanttChartProps {
  projects: Array<typeof project.$inferSelect>;
}

export function GanttChart({ projects }: GanttChartProps) {
  const currentDate = new Date();

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[1400px]">

      </div>
    </div>
  )
}

function GanttHeader() {
  return (
    <div className="flex mb-4">
      <div className="w-48 shrink-0" />
      <div className="flex-1 relative">
        <div className="flex border-b border-zinc-800">
        </div>
      </div>
    </div>
  )
}

function GanttTask({ renderTask }: { renderTask: typeof task.$inferSelect }) {
  return (
    <div className=""
  )
}
