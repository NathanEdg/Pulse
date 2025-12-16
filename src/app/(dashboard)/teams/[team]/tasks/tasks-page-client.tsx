"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
import { useActiveProgram } from "@/hooks/use-active-program";

type TasksPageClientProps = {
  teamName: string;
  tasks: Awaited<ReturnType<typeof api.tasks.getTasksByTeam>>;
};

export function TasksPageClient({ teamName, tasks }: TasksPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const viewParam = searchParams.get("view") as ViewType | null;
  const { programId } = useActiveProgram();
  const [view, setView] = useState<ViewType>(
    viewParam && ["kanban", "timeline", "list", "calendar"].includes(viewParam)
      ? viewParam
      : "kanban",
  );
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  useEffect(() => {
    if (
      viewParam &&
      ["kanban", "timeline", "list", "calendar"].includes(viewParam)
    ) {
      setView(viewParam);
    }
  }, [viewParam]);

  const handleViewChange = (newView: ViewType) => {
    setView(newView);
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", newView);
    router.replace(`?${params.toString()}`, { scroll: false });
  };

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
          <ViewSwitcher value={view} onValueChange={handleViewChange} />
        </div>
      }
    >
      <TasksView view={view} teamName={teamName} tasks={tasks} />
      <CreateTaskDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        defaultTeam={teamName}
        _programId={programId ?? ""}
      />
    </PageContainer>
  );
}
