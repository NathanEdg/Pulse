"use client";

import { api } from "@/trpc/react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import {
  Star,
  ListTodo,
  AlertCircle,
  Users,
  Calendar,
  FolderKanban,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TASK_STATUSES } from "@/lib/constants";
import { format } from "date-fns";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageContainer } from "@/components/util/page-container";

export default function StarredTasksPage() {
  const router = useRouter();
  const { data: tasks = [], isLoading } = api.tasks.getStarredTasks.useQuery();
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");

  const filteredTasks = tasks.filter((task) => {
    if (filterStatus !== "all" && task.status !== filterStatus) return false;
    if (filterPriority !== "all" && task.priority?.id !== filterPriority)
      return false;
    return true;
  });

  const priorities = Array.from(
    new Map(
      tasks.filter((t) => t.priority).map((t) => [t.priority.id, t.priority]),
    ).values(),
  );

  if (isLoading) {
    return (
      <PageContainer
        title="Starred Tasks"
        description="Loading your starred tasks..."
      >
        <div className="flex h-full items-center justify-center">
          <div className="text-muted-foreground flex items-center gap-2">
            <div className="border-muted border-t-foreground h-4 w-4 animate-spin rounded-full border-2" />
            <span className="text-sm">Loading starred tasks...</span>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Starred Tasks"
      description={`${tasks.length} ${tasks.length === 1 ? "task" : "tasks"} starred`}
      actions={
        tasks.length > 0 && (
          <div className="flex items-center gap-3">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {Object.values(TASK_STATUSES).map((status) => (
                  <SelectItem key={status.id} value={status.id}>
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: status.color }}
                      />
                      {status.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All priorities</SelectItem>
                {priorities.map((priority) => (
                  <SelectItem key={priority.id} value={priority.id}>
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: priority.color }}
                      />
                      {priority.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(filterStatus !== "all" || filterPriority !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFilterStatus("all");
                  setFilterPriority("all");
                }}
              >
                Clear filters
              </Button>
            )}
          </div>
        )
      }
    >
      {filteredTasks.length === 0 ? (
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <Star className="text-muted-foreground mx-auto h-16 w-16" />
            <h2 className="text-foreground mt-4 text-xl font-semibold">
              {tasks.length === 0
                ? "No starred tasks"
                : "No tasks match the filters"}
            </h2>
            <p className="text-muted-foreground mt-2 text-sm">
              {tasks.length === 0
                ? "Star tasks to keep track of important work"
                : "Try adjusting your filters"}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task, index) => {
            const statusConfig = TASK_STATUSES[task.status];

            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card
                  className="hover:border-border hover:bg-card/80 group border-border/50 bg-card/50 cursor-pointer p-4 transition-all hover:shadow-lg"
                  onClick={() => router.push(`/task/${task.id}`)}
                >
                  <div className="flex items-start gap-4">
                    {/* Status Indicator */}
                    <div className="pt-1">
                      <span
                        className="block h-2 w-2 rounded-full"
                        style={{
                          backgroundColor: statusConfig?.color ?? "#6B7280",
                        }}
                      />
                    </div>

                    {/* Task Content */}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="text-foreground line-clamp-1 text-lg font-semibold">
                            {task.title}
                          </h3>
                          {task.description && (
                            <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
                              {task.description}
                            </p>
                          )}
                        </div>
                        <Star className="h-5 w-5 shrink-0 fill-yellow-400 text-yellow-400" />
                      </div>

                      {/* Task Metadata */}
                      <div className="flex flex-wrap items-center gap-3 text-xs">
                        {/* Status */}
                        <Badge
                          variant="outline"
                          className="gap-1.5"
                          style={{
                            borderColor: statusConfig?.color,
                            color: statusConfig?.color,
                          }}
                        >
                          <ListTodo className="h-3 w-3" />
                          {statusConfig?.label}
                        </Badge>

                        {/* Priority */}
                        {task.priority && (
                          <Badge
                            variant="outline"
                            className="gap-1.5"
                            style={{
                              borderColor: task.priority.color,
                              color: task.priority.color,
                            }}
                          >
                            <AlertCircle className="h-3 w-3" />
                            {task.priority.name}
                          </Badge>
                        )}

                        {/* Project */}
                        {task.project && (
                          <Badge variant="secondary" className="gap-1.5">
                            <FolderKanban className="h-3 w-3" />
                            {task.project.name}
                          </Badge>
                        )}

                        {/* Assignees */}
                        {task.assignees_ids &&
                          task.assignees_ids.length > 0 && (
                            <Badge
                              variant="secondary"
                              className="border-border/50 gap-1.5"
                            >
                              <Users className="h-3 w-3" />
                              {task.assignees_ids.length}{" "}
                              {task.assignees_ids.length === 1
                                ? "assignee"
                                : "assignees"}
                            </Badge>
                          )}

                        {/* Due Date */}
                        {task.due_date && (
                          <Badge
                            variant="outline"
                            className={`gap-1.5 ${
                              new Date(task.due_date) < new Date()
                                ? "border-red-500 text-red-500"
                                : ""
                            }`}
                          >
                            <Calendar className="h-3 w-3" />
                            {format(new Date(task.due_date), "MMM d, yyyy")}
                          </Badge>
                        )}
                      </div>

                      {/* Lead */}
                      {task.lead && (
                        <div className="flex items-center gap-2 pt-1">
                          <Avatar className="h-5 w-5">
                            <AvatarFallback className="text-[9px]">
                              {task.lead.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()
                                .slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-muted-foreground text-xs">
                            {task.lead.name}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
}
