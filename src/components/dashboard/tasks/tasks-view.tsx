"use client";

import type { ViewType } from "./view-switcher";
import type { api } from "@/trpc/server";
import { KanbanView } from "./views/kanban-view";
import { GanttView } from "./views/gantt-view";

type TasksViewProps = {
  view: ViewType;
  teamName: string;
  tasks: Awaited<ReturnType<typeof api.tasks.getTasksByTeam>>;
};

export function TasksView({
  view,
  teamName: _teamName,
  tasks: _tasks,
}: TasksViewProps) {
  return (
    <div className="flex h-full flex-col">
      {view === "kanban" && (
        <div className="flex-1 overflow-x-auto overflow-y-hidden">
          <KanbanView tasks={_tasks} teamName={_teamName} />
        </div>
      )}

      {view === "timeline" && (
        <div className="flex-1 overflow-hidden">
          <GanttView tasks={_tasks} teamName={_teamName} />
        </div>
      )}

      {view === "list" && (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground">List view coming soon...</p>
        </div>
      )}

      {view === "calendar" && (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground">Calendar view coming soon...</p>
        </div>
      )}
    </div>
  );
}
