"use client";

import type { api } from "@/trpc/server";
import { api as clientApi } from "@/trpc/react";
import {
  KanbanBoard,
  type KanbanColumn,
  type KanbanTask,
} from "../../kanban/kanban";
import { CreateTaskDialog } from "../create-task-dialog";
import { ConfirmDeleteDialog } from "@/components/util/dialogs/confirm-deletion";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useActiveProgram } from "@/hooks/use-active-program";
import { TASK_STATUSES } from "@/lib/constants";

type KanbanViewProps = {
  teamName: string;
  tasks: Awaited<ReturnType<typeof api.tasks.getTasksByTeam>>;
};

export function KanbanView({ teamName, tasks }: KanbanViewProps) {
  const router = useRouter();
  const { programId } = useActiveProgram();

  const updateTaskMutation = clientApi.tasks.updateTask.useMutation({
    onSuccess: () => {
      toast.success("Task updated successfully!");
      router.refresh();
    },
    onError: (error) => {
      toast.error(`Failed to update task: ${error.message}`);
    },
  });

  const deleteTaskMutation = clientApi.tasks.deleteTask.useMutation({
    onSuccess: () => {
      toast.success("Task deleted successfully!");
      router.refresh();
    },
    onError: (error) => {
      toast.error(`Failed to delete task: ${error.message}`);
    },
  });

  const transformTask = (
    task: (typeof tasks)[0],
    statusColor?: string,
  ): KanbanTask => ({
    id: task.id,
    title: task.title,
    description: task.description ?? undefined,
    priority: task.priority,
    tags: task.tags ?? undefined,
    status: task.status,
    statusColor: statusColor,
    assigneesCount: task.assignees_ids?.length ?? 0,
  });

  // Helper function to sort tasks by priority sort_order
  const sortByPriority = (a: (typeof tasks)[0], b: (typeof tasks)[0]) => {
    const aSortOrder = a.priority?.sort_order ?? "999";
    const bSortOrder = b.priority?.sort_order ?? "999";
    return aSortOrder.localeCompare(bSortOrder);
  };

  const columns: KanbanColumn[] = Object.values(TASK_STATUSES).map(
    (status) => ({
      id: status.id,
      title: status.label,
      color: status.color,
      tasks: tasks
        .filter((task) => task.status === status.id)
        .sort(sortByPriority)
        .map((task) => transformTask(task, status.color)),
    }),
  );

  const handleColumnsChange = (updatedColumns: KanbanColumn[]) => {
    // Find tasks that have moved to different columns and update their status
    updatedColumns.forEach((column) => {
      column.tasks.forEach((task) => {
        const originalTask = tasks.find((t) => t.id === task.id);
        if (originalTask && originalTask.status !== column.id) {
          // Task has moved to a different column, update its status
          updateTaskMutation.mutate({
            id: task.id,
            status: column.id as
              | "backlog"
              | "planned"
              | "in_progress"
              | "completed"
              | "cancelled",
          });
        }
      });
    });
  };

  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [taskCreateStatus, setTaskCreateStatus] = useState("");
  const [editTaskOpen, setEditTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<(typeof tasks)[0] | null>(
    null,
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<KanbanTask | null>(null);

  const handleTaskDoubleClick = (task: KanbanTask) => {
    router.push(`/task/${task.id}`);
  };

  const handleTaskEdit = (task: KanbanTask) => {
    const fullTask = tasks.find((t) => t.id === task.id);
    if (fullTask) {
      setEditingTask(fullTask);
      setEditTaskOpen(true);
    }
  };

  const handleTaskDelete = (task: KanbanTask) => {
    setTaskToDelete(task);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (taskToDelete) {
      deleteTaskMutation.mutate({ id: taskToDelete.id });
      setTaskToDelete(null);
    }
  };

  return (
    <div className="h-full">
      <KanbanBoard
        columns={columns}
        onColumnsChange={handleColumnsChange}
        onAddTask={(column) => {
          setTaskCreateStatus(column);
          setCreateTaskOpen(true);
        }}
        onTaskClick={handleTaskDoubleClick}
        onTaskEdit={handleTaskEdit}
        onTaskDelete={handleTaskDelete}
      />
      <CreateTaskDialog
        open={createTaskOpen}
        onOpenChange={(isOpen) => {
          setCreateTaskOpen(isOpen);
          if (!isOpen) {
            setTaskCreateStatus("");
          }
        }}
        defaultStatus={taskCreateStatus}
        defaultTeam={teamName}
        _programId={programId ?? undefined}
      />
      {editingTask && (
        <CreateTaskDialog
          open={editTaskOpen}
          onOpenChange={(isOpen) => {
            setEditTaskOpen(isOpen);
            if (!isOpen) {
              setEditingTask(null);
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
          _programId={programId ?? undefined}
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
