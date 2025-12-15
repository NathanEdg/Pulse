/**
 * Centralized constants for task management
 * This file contains unified configurations used across the application
 */

export const TASK_STATUSES = {
  backlog: {
    id: "backlog",
    name: "Backlog",
    label: "Backlog",
    color: "#64748b",
  },
  planned: {
    id: "planned",
    name: "Planned",
    label: "Planned",
    color: "#6366f1",
  },
  in_progress: {
    id: "in_progress",
    name: "In Progress",
    label: "In Progress",
    color: "#f59e0b",
  },
  completed: {
    id: "completed",
    name: "Completed",
    label: "Completed",
    color: "#10b981",
  },
  cancelled: {
    id: "cancelled",
    name: "Cancelled",
    label: "Cancelled",
    color: "#ef4444",
  },
} as const;

export type TaskStatus = keyof typeof TASK_STATUSES;

// Helper function to get status array for dropdowns
export const getTaskStatusesArray = () => Object.values(TASK_STATUSES);

// Helper function to get status by id
export const getTaskStatus = (statusId: string) => {
  return TASK_STATUSES[statusId as TaskStatus] ?? null;
};

// Default labels (until API is created)
export const DEFAULT_LABELS = [
  { id: "1", name: "Bug", color: "#EF4444" },
  { id: "2", name: "Feature", color: "#3B82F6" },
  { id: "3", name: "Documentation", color: "#8B5CF6" },
  { id: "4", name: "Enhancement", color: "#10B981" },
  { id: "5", name: "Question", color: "#F59E0B" },
] as const;

// Default cycles (until API is created)
export const DEFAULT_CYCLES = [
  { id: "current", name: "Current Cycle", start: "", end: "" },
  { id: "1", name: "Cycle 1", start: "2024-01", end: "2024-02" },
  { id: "2", name: "Cycle 2", start: "2024-03", end: "2024-04" },
  { id: "3", name: "Cycle 3", start: "2024-05", end: "2024-06" },
] as const;
