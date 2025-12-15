"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { type RouterOutputs } from "@/trpc/react";
import GanttChart from "../../gantt/gantt-chart";
import { CreateTaskDialog } from "../create-task-dialog";
import { ConfirmDeleteDialog } from "@/components/util/dialogs/confirm-deletion";
import { useRouter } from "next/navigation";

interface GanttViewProps {
  teamName: string;
  tasks: RouterOutputs["tasks"]["getTasksByTeam"];
}

export function GanttView({ teamName, tasks }: GanttViewProps) {
  const router = useRouter();
  const utils = api.useUtils();
  const [pendingTaskIds, setPendingTaskIds] = useState<string[]>([]);
  const [editTaskOpen, setEditTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<(typeof tasks)[0] | null>(
    null,
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<(typeof tasks)[0] | null>(
    null,
  );

  const { data: cycles } = api.cycles.getCycles.useQuery({
    program_id: "program-seed-1",
  });

  const updateTasks = api.tasks.updateTasks.useMutation({
    onSuccess: async (_, variables) => {
      // Wait for the refetch to complete before clearing pending IDs
      await utils.tasks.getTasksByTeam.refetch();
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
      await utils.tasks.getTasksByTeam.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to add dependency: ${error.message}`);
    },
  });

  const removeDependency = api.tasks.removeDependency.useMutation({
    onSuccess: async () => {
      await utils.tasks.getTasksByTeam.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to remove dependency: ${error.message}`);
    },
  });

  const deleteTaskMutation = api.tasks.deleteTask.useMutation({
    onSuccess: () => {
      toast.success("Task deleted successfully!");
      router.refresh();
    },
    onError: (error) => {
      toast.error(`Failed to delete task: ${error.message}`);
    },
  });

  const handleTasksChange = (
    changedTasks: Array<{
      id: string;
      start_date?: Date | null;
      due_date?: Date | null;
    }>,
  ) => {
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

  const handleTaskClick = (taskId: string) => {
    const fullTask = tasks.find((t) => t.id === taskId);
    if (fullTask) {
      setEditingTask(fullTask);
      setEditTaskOpen(true);
    }
  };

  const handleTaskDelete = (taskId: string) => {
    const fullTask = tasks.find((t) => t.id === taskId);
    if (fullTask) {
      setTaskToDelete(fullTask);
      setDeleteDialogOpen(true);
    }
  };

  const confirmDelete = () => {
    if (taskToDelete) {
      deleteTaskMutation.mutate({ id: taskToDelete.id });
      setTaskToDelete(null);
    }
  };

  return (
    <div className="bg-background h-full w-full overflow-hidden">
      <GanttChart
        tasks={tasks}
        cycles={cycles ?? []}
        pendingTaskIds={pendingTaskIds}
        onTasksChange={handleTasksChange}
        onDependencyAdd={handleDependencyAdd}
        onDependencyRemove={handleDependencyRemove}
        onTaskClick={handleTaskClick}
        onTaskDelete={handleTaskDelete}
      />
      {editingTask && (
        <CreateTaskDialog
          open={editTaskOpen}
          onOpenChange={(isOpen) => {
            setEditTaskOpen(isOpen);
            if (!isOpen) {
              setEditingTask(null);
              // Refresh to update sidebar with new status, priority, tags, and reordering
              router.refresh();
            }
          }}
          taskId={editingTask.id}
          defaultTitle={editingTask.title}
          defaultDescription={editingTask.description ?? ""}
          defaultStatus={editingTask.status}
          defaultTeam={editingTask.team_id ?? ""}
          defaultPriority={
            typeof editingTask.priority === "object" && editingTask.priority
              ? (editingTask.priority as { id: string }).id
              : typeof editingTask.priority === "string"
                ? editingTask.priority
                : ""
          }
          defaultProject={editingTask.project_id}
          defaultLeader={editingTask.lead_id ?? ""}
          defaultAssignees={editingTask.assignees_ids ?? []}
          defaultCycle={editingTask.cycle_id}
          defaultLabels={editingTask.tags ?? []}
          defaultStartDate={editingTask.start_date}
          defaultEndDate={editingTask.due_date}
          _programId="program-seed-1"
        />
      )}
      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Task"
        description="Are you sure you want to delete this task? This action cannot be undone."
        onConfirm={confirmDelete}
      />
    </div>
  );
}
