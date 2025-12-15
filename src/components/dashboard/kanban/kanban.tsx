"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, MoreHorizontal, Users, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import type { taskPriority } from "@/server/db/tasks";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface KanbanTask {
  id: string;
  title: string;
  description?: string;
  priority?: typeof taskPriority.$inferSelect;
  tags?: string[];
  status?: string;
  statusColor?: string;
  assigneesCount?: number;
}

export interface KanbanColumn {
  id: string;
  title: string;
  tasks: KanbanTask[];
  color?: string;
}

interface KanbanBoardProps {
  columns: KanbanColumn[];
  onColumnsChange?: (columns: KanbanColumn[]) => void;
  onTaskClick?: (task: KanbanTask) => void;
  onAddTask?: (columnId: string) => void;
  onTaskEdit?: (task: KanbanTask) => void;
  onTaskDelete?: (task: KanbanTask) => void;
}

function TaskCard({
  task,
  onClick,
  isDragging,
  onEdit,
  onDelete,
}: {
  task: KanbanTask;
  onClick?: () => void;
  isDragging?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  return (
    <Card
      className={cn(
        "group border-border/50 bg-card/50 hover:border-border hover:bg-card/80 cursor-pointer p-4 backdrop-blur-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-lg",
        isDragging && "opacity-50",
      )}
      onDoubleClick={onClick}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <h4 className="text-foreground line-clamp-2 text-sm leading-snug font-medium">
          {task.title}
        </h4>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0 opacity-0 transition-all duration-200 group-hover:opacity-100"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.();
              }}
            >
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.();
              }}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {task.description && (
        <p className="text-muted-foreground mb-3 line-clamp-2 text-xs">
          {task.description}
        </p>
      )}

      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {task.status && (
            <Badge
              variant="outline"
              className="h-5 px-2 py-0 text-xs capitalize"
              style={{
                borderColor: task.statusColor,
                color: task.statusColor,
              }}
            >
              {task.status.replace(/_/g, " ")}
            </Badge>
          )}
          {task.tags && task.tags.length > 0 && (
            <Badge
              variant="secondary"
              className="bg-secondary/50 border-border/30 h-5 gap-1 px-1.5 py-0 text-xs"
            >
              <Tag className="h-3 w-3" />
              {task.tags.length}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {task.assigneesCount !== undefined && task.assigneesCount > 0 && (
            <Badge
              variant="outline"
              className="border-border/50 h-5 gap-1 px-1.5 py-0 text-xs"
            >
              <Users className="h-3 w-3" />
              {task.assigneesCount}
            </Badge>
          )}
          {task.priority && (
            <Badge
              variant="outline"
              className="h-5 px-2 py-0 text-xs capitalize"
              style={{
                borderColor: task.priority.color,
                color: task.priority.color,
              }}
            >
              {task.priority.name}
            </Badge>
          )}
        </div>
      </div>
    </Card>
  );
}

function SortableTask({
  task,
  onClick,
  onEdit,
  onDelete,
}: {
  task: KanbanTask;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || "transform 200ms ease",
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard
        task={task}
        onClick={onClick}
        isDragging={isDragging}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </div>
  );
}

function KanbanColumnComponent({
  column,
  tasks,
  onAddTask,
  onTaskClick,
  onTaskEdit,
  onTaskDelete,
}: {
  column: KanbanColumn;
  tasks: KanbanTask[];
  onAddTask?: () => void;
  onTaskClick?: (task: KanbanTask) => void;
  onTaskEdit?: (task: KanbanTask) => void;
  onTaskDelete?: (task: KanbanTask) => void;
}) {
  const { setNodeRef } = useSortable({
    id: column.id,
    data: { type: "column" },
  });

  return (
    <div ref={setNodeRef} className="flex h-full w-[320px] shrink-0 flex-col">
      <div className="mb-4 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: column.color || "#6366f1" }}
          />
          <h3 className="text-foreground text-sm font-semibold">
            {column.title}
          </h3>
          <Badge
            variant="secondary"
            className="bg-secondary/50 border-border/30 h-5 px-2 text-xs"
          >
            {tasks.length}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-accent h-7 w-7"
          onClick={onAddTask}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Tasks are sorted by priority and cannot be manually reordered within columns */}
      <SortableContext items={tasks} strategy={verticalListSortingStrategy}>
        <div className="bg-muted/20 border-border/40 flex-1 space-y-3 overflow-y-auto rounded-xl border p-3 transition-all duration-200">
          {tasks.map((task, index) => (
            <div
              key={task.id}
              style={{
                animation: `fadeIn 300ms ease-out ${index * 50}ms both`,
              }}
            >
              <SortableTask
                task={task}
                onClick={() => onTaskClick?.(task)}
                onEdit={() => onTaskEdit?.(task)}
                onDelete={() => onTaskDelete?.(task)}
              />
            </div>
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

export function KanbanBoard({
  columns: initialColumns,
  onColumnsChange,
  onTaskClick,
  onAddTask,
  onTaskEdit,
  onTaskDelete,
}: KanbanBoardProps) {
  const [columns, setColumns] = useState<KanbanColumn[]>(initialColumns);
  const [activeTask, setActiveTask] = useState<KanbanTask | null>(null);
  const [originalColumnId, setOriginalColumnId] = useState<string | null>(null);
  const onColumnsChangeRef = useRef(onColumnsChange);

  // Memoize the initial columns to avoid dependency changes
  const memoizedInitialColumns = useMemo(
    () => initialColumns,
    [JSON.stringify(initialColumns)],
  );

  useEffect(() => {
    onColumnsChangeRef.current = onColumnsChange;
  }, [onColumnsChange]);

  useEffect(() => {
    setColumns(memoizedInitialColumns);
  }, [memoizedInitialColumns]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = columns
      .flatMap((col) => col.tasks)
      .find((task) => task.id === active.id);
    setActiveTask(task || null);

    // Track which column the task started in
    const startColumn = columns.find((col) =>
      col.tasks.some((t) => t.id === active.id),
    );
    setOriginalColumnId(startColumn?.id || null);
  };

  // Helper function to sort tasks by priority (lower sort_order = higher priority)
  // Tasks without a priority are sorted to the end
  const sortTasksByPriority = (tasks: KanbanTask[]) => {
    return [...tasks].sort((a, b) => {
      const aSortOrder = a.priority?.sort_order ?? "999";
      const bSortOrder = b.priority?.sort_order ?? "999";
      return aSortOrder.localeCompare(bSortOrder);
    });
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    const activeColumn = columns.find((col) =>
      col.tasks.some((task) => task.id === activeId),
    );
    const overColumn = columns.find(
      (col) =>
        col.id === overId || col.tasks.some((task) => task.id === overId),
    );

    if (!activeColumn || !overColumn) return;

    // Only allow moving between columns, not within the same column
    if (activeColumn.id !== overColumn.id) {
      setColumns((columns) => {
        const activeItems = activeColumn.tasks;
        const overItems = overColumn.tasks;
        const activeIndex = activeItems.findIndex((t) => t.id === activeId);
        const movedItem = activeItems[activeIndex];

        if (!movedItem) return columns;

        const newActiveItems = activeItems.filter((t) => t.id !== activeId);

        // Add moved item to the new column and sort by priority
        const newOverItems = sortTasksByPriority([...overItems, movedItem]);

        return columns.map((col) => {
          if (col.id === activeColumn.id) {
            return { ...col, tasks: newActiveItems };
          }
          if (col.id === overColumn.id) {
            return { ...col, tasks: newOverItems };
          }
          return col;
        });
      });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active } = event;
    setActiveTask(null);

    // Find which column the task ended up in
    const finalColumn = columns.find((col) =>
      col.tasks.some((task) => task.id === active.id),
    );

    if (!finalColumn) {
      setOriginalColumnId(null);
      return;
    }

    // Check if the task moved to a different column
    if (originalColumnId && finalColumn.id !== originalColumnId) {
      // Notify parent component that columns have changed (task was dropped)
      onColumnsChangeRef.current?.(columns);
    }

    setOriginalColumnId(null);
  };

  return (
    <>
      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex h-full gap-6 overflow-x-auto pt-2 pb-4">
          {columns.map((column, index) => (
            <div
              key={column.id}
              style={{
                animation: `fadeIn 400ms ease-out ${index * 100}ms both`,
              }}
            >
              <KanbanColumnComponent
                column={column}
                tasks={column.tasks}
                onAddTask={() => onAddTask?.(column.id)}
                onTaskClick={onTaskClick}
                onTaskEdit={onTaskEdit}
                onTaskDelete={onTaskDelete}
              />
            </div>
          ))}
        </div>

        <DragOverlay>
          {activeTask ? (
            <div className="scale-105 rotate-3 transition-transform duration-200">
              <TaskCard task={activeTask} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </>
  );
}
