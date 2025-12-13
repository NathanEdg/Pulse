"use client"

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import type { task } from "@/server/db/tasks";
import { api } from "@/trpc/react";

const statusColors: Record<string, string> = {
  todo: "bg-slate-200",
  "in-progress": "bg-blue-200",
  done: "bg-green-200",
  blocked: "bg-red-200",
};

const priorityColors: Record<string, string> = {
  low: "bg-green-100",
  medium: "bg-yellow-100",
  high: "bg-orange-100",
  urgent: "bg-red-100",
};

type TaskType = typeof task.$inferSelect;

const formatDate = (date: Date | null | undefined) => {
  if (!date) return "Not set";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

function TaskStatus({ selectedTask }: { selectedTask: TaskType }) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-gray-700">Status</h3>
      <Badge className={`${statusColors[selectedTask.status] ?? "bg-gray-200"} text-black`}>
        {selectedTask.status}
      </Badge>
    </div>
  );
}

function TaskPriority({ selectedTask }: { selectedTask: TaskType }) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-gray-700">Priority</h3>
      <Badge className={`${priorityColors[selectedTask.priority] ?? "bg-gray-200"} text-black`}>
        {selectedTask.priority}
      </Badge>
    </div>
  );
}

function TaskDates({ selectedTask }: { selectedTask: TaskType }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-700">Dates</h3>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Due Date:</span>
          <span className="font-medium">{formatDate(selectedTask.due_date)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Created:</span>
          <span className="font-medium text-xs">{formatDate(selectedTask.createdAt)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Updated:</span>
          <span className="font-medium text-xs">{formatDate(selectedTask.updatedAt)}</span>
        </div>
      </div>
    </div>
  );
}

function TaskDetails({ selectedTask }: { selectedTask: TaskType }) {
  

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-700">Program</h3>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
            <span className="text-gray-600">Name:</span>
            {selectedTask.program_id}
        </div>
        <div className="flex justify-between">
            <span className="text-gray-600">Project:</span>
            {selectedTask.project_id}
        </div>
        <div className="flex justify-between">
            <span className="text-gray-600">Cycle:</span>
            {selectedTask.cycle_id}
        </div>
      </div>
    </div>
  );
}

function TaskTeam({ selectedTask }: { selectedTask: TaskType }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-700">Team</h3>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Lead:</span>
          <span className="font-medium">{selectedTask.lead_id}</span>
        </div>
        {selectedTask.assignees_ids && selectedTask.assignees_ids.length > 0 && (
          <div>
            <span className="text-gray-600">Assignees:</span>
            <div className="mt-1 space-y-1">
              {selectedTask.assignees_ids.map((id) => (
                <div key={id} className="text-xs bg-gray-100 px-2 py-1 rounded">
                  {id}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TaskTags({ selectedTask }: { selectedTask: TaskType }) {
  if (!selectedTask.tags || selectedTask.tags.length === 0) return null;
  
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-700">Tags</h3>
      <div className="flex flex-wrap gap-2">
        {selectedTask.tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="bg-purple-100 text-purple-900">
            {tag}
          </Badge>
        ))}
      </div>
    </div>
  );
}

export function TaskViewSheet({ trigger, selectedTask }: { trigger: React.ReactNode; selectedTask: TaskType }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        {trigger}
      </SheetTrigger>

      <SheetContent className="w-full overflow-y-auto px-4">
        <SheetHeader>
          <SheetTitle className="text-2xl">{selectedTask.title}</SheetTitle>
          {selectedTask.description && (
            <SheetDescription className="text-base mt-2">
              {selectedTask.description}
            </SheetDescription>
          )}
        </SheetHeader>

        <div className="space-y-4 py-6">
          <TaskStatus selectedTask={selectedTask} />
          <TaskPriority selectedTask={selectedTask} />
          <Separator />
          <TaskDates selectedTask={selectedTask} />
          <Separator />
          <TaskDetails selectedTask={selectedTask} />
          <Separator />
          <TaskTeam selectedTask={selectedTask} />
          <Separator />
          <TaskTags selectedTask={selectedTask} />
        </div>

        <SheetFooter>
          <Button type="submit">Go to Task</Button>
          <SheetClose asChild>
            <Button variant="outline">Close</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}