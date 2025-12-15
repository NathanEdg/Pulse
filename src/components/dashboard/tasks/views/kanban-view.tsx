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

type KanbanViewProps = {
  teamName: string;
  tasks: Awaited<ReturnType<typeof api.tasks.getTasksByTeam>>;
};

export function KanbanView({ teamName, tasks }: KanbanViewProps) {
  const router = useRouter();
  const createTaskMutation = clientApi.tasks.createTask.useMutation({
    onSuccess: () => {
      toast.success("Task created successfully!");
      router.refresh();
    },
    onError: (error) => {
      toast.error(`Failed to create task: ${error.message}`);
    },
  });

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

  const columns: KanbanColumn[] = [
    {
      id: "backlog",
      title: "Backlog",
      color: "#64748b",
      tasks: tasks
        .filter((task) => task.status === "backlog")
        .sort(sortByPriority)
        .map((task) => transformTask(task, "#64748b")),
    },
    {
      id: "planned",
      title: "Planned",
      color: "#6366f1",
      tasks: tasks
        .filter((task) => task.status === "planned")
        .sort(sortByPriority)
        .map((task) => transformTask(task, "#6366f1")),
    },
    {
      id: "in_progress",
      title: "In Progress",
      color: "#f59e0b",
      tasks: tasks
        .filter((task) => task.status === "in_progress")
        .sort(sortByPriority)
        .map((task) => transformTask(task, "#f59e0b")),
    },
    {
      id: "completed",
      title: "Completed",
      color: "#10b981",
      tasks: tasks
        .filter((task) => task.status === "completed")
        .sort(sortByPriority)
        .map((task) => transformTask(task, "#10b981")),
    },
    {
      id: "cancelled",
      title: "Cancelled",
      color: "#ef4444",
      tasks: tasks
        .filter((task) => task.status === "cancelled")
        .sort(sortByPriority)
        .map((task) => transformTask(task, "#ef4444")),
    },
  ];

  const handleColumnsChange = (updatedColumns: KanbanColumn[]) => {
    // Find tasks that have moved to different columns and update their status
    updatedColumns.forEach((column) => {
      column.tasks.forEach((task) => {
        const originalTask = tasks.find((t) => t.id === task.id);
        if (originalTask && originalTask.status !== column.id) {
          // Task has moved to a different column, update its status
          updateTaskMutation.mutate({
            id: task.id,
            title: task.title,
            description: task.description ?? "",
            status: column.id,
            priority:
              typeof originalTask.priority === "object" && originalTask.priority
                ? (originalTask.priority as { id: string }).id
                : typeof originalTask.priority === "string"
                  ? originalTask.priority
                  : "",
            project: originalTask.project_id ?? "",
            leader: originalTask.lead_id ?? "",
            assignees: originalTask.assignees_ids ?? [],
            labels: originalTask.tags ?? [],
            cycle: originalTask.cycle_id ?? "",
            team: originalTask.team_id ?? "",
            start_date: originalTask.start_date ?? undefined,
            due_date: originalTask.due_date ?? undefined,
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
    const fullTask = tasks.find((t) => t.id === task.id);
    if (fullTask) {
      setEditingTask(fullTask);
      setEditTaskOpen(true);
    }
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
        _programId="4287f030-7ee1-4025-bb03-0074fff9afd9"
        onTaskCreate={(taskData) => {
          createTaskMutation.mutate({
            title: taskData.title,
            description: taskData.description,
            status: taskData.status,
            priority: taskData.priority,
            project: taskData.project,
            leader: taskData.leader,
            assignees: taskData.assignees,
            labels: taskData.labels,
            cycle: taskData.cycle,
            team: taskData.team,
            program_id: "4287f030-7ee1-4025-bb03-0074fff9afd9",
            start_date: taskData.startDate ?? undefined,
            due_date: taskData.endDate ?? undefined,
          });
        }}
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
          _programId="4287f030-7ee1-4025-bb03-0074fff9afd9"
          onTaskUpdate={(taskData) => {
            updateTaskMutation.mutate({
              id: taskData.id,
              title: taskData.title,
              description: taskData.description,
              status: taskData.status,
              priority: taskData.priority,
              project: taskData.project,
              leader: taskData.leader,
              assignees: taskData.assignees,
              labels: taskData.labels,
              cycle: taskData.cycle,
              team: taskData.team,
              start_date: taskData.startDate ?? undefined,
              due_date: taskData.endDate ?? undefined,
            });
          }}
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
