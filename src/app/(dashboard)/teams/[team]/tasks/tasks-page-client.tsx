"use client";

import { useState } from "react";
import { PageContainer } from "@/components/util/page-container";
import {
  ViewSwitcher,
  type ViewType,
} from "@/components/dashboard/tasks/view-switcher";
import { TasksView } from "@/components/dashboard/tasks/tasks-view";
import { CreateTaskDialog } from "@/components/dashboard/tasks/create-task-dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { api } from "@/trpc/server";

type TasksPageClientProps = {
  teamName: string;
  tasks: Awaited<ReturnType<typeof api.tasks.getTasksByTeam>>;
};

export function TasksPageClient({ teamName, tasks }: TasksPageClientProps) {
  const [view, setView] = useState<ViewType>("kanban");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  return (
    <PageContainer
      title="Team Tasks"
      description={`View tasks for ${teamName}`}
      actions={
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="gap-2"
            onClick={() => setIsCreateDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
            New Task
          </Button>
          <ViewSwitcher value={view} onValueChange={setView} />
        </div>
      }
    >
      <TasksView view={view} teamName={teamName} tasks={tasks} />
      <CreateTaskDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        defaultTeam={teamName}
      />
    </PageContainer>
  );
}
