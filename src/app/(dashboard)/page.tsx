"use client"

import { KanbanBoard, type KanbanColumn } from "@/components/dashboard/kanban/kanban"
import { TaskViewSheet } from "@/components/dashboard/sheets/task-view-sheet"
import { Button } from "@/components/ui/button"
import { useState } from "react"

const initialData: KanbanColumn[] = [
  {
    id: "todo",
    title: "To Do",
    color: "#6366f1",
    tasks: [
      {
        id: "1",
        title: "Design new landing page",
        description: "Create mockups for the new product launch page",
        priority: "high",
        tags: ["design", "ui/ux"],
      },
      {
        id: "2",
        title: "Research user analytics",
        description: "Analyze Q4 metrics and prepare report",
        priority: "medium",
        tags: ["research", "analytics"],
      },
      {
        id: "3",
        title: "Update documentation",
        description: "Add new API endpoints to developer docs",
        priority: "low",
        tags: ["docs"],
      },
    ],
  },
  {
    id: "in-progress",
    title: "In Progress",
    color: "#f59e0b",
    tasks: [
      {
        id: "4",
        title: "Build authentication flow",
        description: "Implement OAuth 2.0 with social providers",
        priority: "high",
        tags: ["development", "backend"],
      },
      {
        id: "5",
        title: "Optimize database queries",
        description: "Reduce API response time by 40%",
        priority: "medium",
        tags: ["performance", "backend"],
      },
    ],
  },
  {
    id: "review",
    title: "Review",
    color: "#8b5cf6",
    tasks: [
      {
        id: "6",
        title: "Code review for feature branch",
        description: "Review PR #234 - Payment integration",
        priority: "high",
        tags: ["code-review"],
      },
    ],
  },
  {
    id: "done",
    title: "Done",
    color: "#10b981",
    tasks: [
      {
        id: "7",
        title: "Deploy staging environment",
        description: "Set up staging server with new configuration",
        tags: ["devops", "deployment"],
      },
      {
        id: "8",
        title: "Fix mobile responsive issues",
        description: "Resolved layout problems on iOS devices",
        tags: ["bug-fix", "frontend"],
      },
    ],
  },
]

export default function DashboardPage() {
  const [columns, setColumns] = useState(initialData)

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border/40 bg-card/30 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-1">Project Board</h1>
              <p className="text-sm text-muted-foreground">Manage and track your team&apos;s progress</p>
            </div>
            <TaskViewSheet trigger={<Button>Open Task</Button>} selectedTask={
              {
                id: "4",
                program_id: "prog_123",
                cycle_id: "cycle_001",
                project_id: "proj_456",
                title: "Build authentication flow",
                description: "Implement OAuth 2.0 with social providers",
                lead_id: "user_789",
                assignees_ids: ["user_101", "user_202"],
                status: "in-progress",
                priority: "high",
                tags: ["development", "backend"],
                due_date: new Date("2025-12-31"),
                createdAt: new Date("2025-12-01"),
                updatedAt: new Date("2025-12-10"),
              }}
            />
            <div className="flex items-center gap-3">
              <div className="text-xs text-muted-foreground">
                {columns.reduce((acc, col) => acc + col.tasks.length, 0)} tasks
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <KanbanBoard
          columns={columns}
          onColumnsChange={setColumns}
          onTaskClick={(task) => console.log("Task clicked:", task)}
          onAddTask={(columnId) => console.log("Add task to:", columnId)}
        />
      </div>
    </div>
  )
}
