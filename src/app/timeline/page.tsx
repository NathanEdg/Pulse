"use client";

import { useState } from "react";
import Timeline, { type Task } from "@/components/dashboard/gantt/gantt-view";
import { api } from "@/trpc/react";
import { toast } from "sonner";

export default function TimelinePage() {
  const utils = api.useUtils();
  const [pendingTaskIds, setPendingTaskIds] = useState<string[]>([]);

  const { data: tasks, isLoading: isLoadingTasks } =
    api.tasks.getTasks.useQuery();
  const { data: cycles, isLoading: isLoadingCycles } =
    api.tasks.getCycles.useQuery();

  const updateTasks = api.tasks.updateTasks.useMutation({
    onSuccess: async (_, variables) => {
      await utils.tasks.getTasks.invalidate();
      const updatedIds = variables.map((v) => v.id);
      setPendingTaskIds((prev) =>
        prev.filter((id) => !updatedIds.includes(id)),
      );
      toast.success("Tasks updated");
    },
    onError: (error, variables) => {
      const updatedIds = variables.map((v) => v.id);
      setPendingTaskIds((prev) =>
        prev.filter((id) => !updatedIds.includes(id)),
      );
      toast.error(`Failed to update tasks: ${error.message}`);
    },
  });

  const addDependency = api.tasks.addDependency.useMutation({
    onSuccess: async () => {
      await utils.tasks.getTasks.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to add dependency: ${error.message}`);
    },
  });

  const removeDependency = api.tasks.removeDependency.useMutation({
    onSuccess: async () => {
      await utils.tasks.getTasks.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to remove dependency: ${error.message}`);
    },
  });

  const handleTasksChange = (changedTasks: Task[]) => {
    const tasksToUpdate = changedTasks.filter(
      (t) => t.start_date && t.due_date,
    );

    if (tasksToUpdate.length === 0) return;

    setPendingTaskIds((prev) => [...prev, ...tasksToUpdate.map((t) => t.id)]);

    updateTasks.mutate(
      tasksToUpdate.map((task) => ({
        id: task.id,
        start_date: task.start_date!,
        due_date: task.due_date!,
      })),
    );
  };

  const handleDependencyAdd = (sourceId: string, targetId: string) => {
    // In the gantt view, dragging from source to target means target depends on source.
    addDependency.mutate({
      taskId: targetId,
      dependencyId: sourceId,
    });
  };

  const handleDependencyRemove = (sourceId: string, targetId: string) => {
    removeDependency.mutate({
      taskId: targetId,
      dependencyId: sourceId,
    });
  };

  if (isLoadingTasks || isLoadingCycles) {
    return (
      <div className="bg-background flex h-screen w-full items-center justify-center">
        <div className="text-muted-foreground">Loading timeline...</div>
      </div>
    );
  }

  return (
    <div className="bg-background h-screen w-full overflow-hidden">
      <Timeline
        tasks={tasks ?? []}
        cycles={cycles ?? []}
        pendingTaskIds={pendingTaskIds}
        onTasksChange={handleTasksChange}
        onDependencyAdd={handleDependencyAdd}
        onDependencyRemove={handleDependencyRemove}
      />
    </div>
  );
}
