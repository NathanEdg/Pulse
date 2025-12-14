"use client"

import { useState, useEffect, useRef, useMemo } from "react"
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
} from "@dnd-kit/core"
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plus, MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"

export interface KanbanTask {
  id: string
  title: string
  description?: string
  priority?: "low" | "medium" | "high"
  tags?: string[]
}

export interface KanbanColumn {
  id: string
  title: string
  tasks: KanbanTask[]
  color?: string
}

interface KanbanBoardProps {
  columns: KanbanColumn[]
  onColumnsChange?: (columns: KanbanColumn[]) => void
  onTaskClick?: (task: KanbanTask) => void
  onAddTask?: (columnId: string) => void
}

function TaskCard({
  task,
  onClick,
  isDragging,
}: {
  task: KanbanTask
  onClick?: () => void
  isDragging?: boolean
}) {
  const priorityColors = {
    low: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    medium: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    high: "bg-rose-500/10 text-rose-500 border-rose-500/20",
  }

  return (
    <Card
      className={cn(
        "group cursor-pointer border-border/50 bg-card/50 backdrop-blur-sm p-4 transition-all hover:border-border hover:bg-card/80 hover:shadow-lg",
        isDragging && "opacity-50",
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <h4 className="font-medium text-sm text-foreground leading-snug line-clamp-2">{task.title}</h4>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="h-3.5 w-3.5" />
        </Button>
      </div>

      {task.description && <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{task.description}</p>}

      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {task.tags?.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs px-2 py-0 h-5 bg-secondary/50 border-border/30">
              {tag}
            </Badge>
          ))}
        </div>
        {task.priority && (
          <Badge className={cn("text-xs px-2 py-0 h-5 border capitalize", priorityColors[task.priority])}>{task.priority}</Badge>
        )}
      </div>
    </Card>
  )
}

function SortableTask({
  task,
  onClick,
}: {
  task: KanbanTask
  onClick?: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard task={task} onClick={onClick} isDragging={isDragging} />
    </div>
  )
}

function KanbanColumnComponent({
  column,
  tasks,
  onAddTask,
  onTaskClick,
}: {
  column: KanbanColumn
  tasks: KanbanTask[]
  onAddTask?: () => void
  onTaskClick?: (task: KanbanTask) => void
}) {
  const { setNodeRef } = useSortable({
    id: column.id,
    data: { type: "column" },
  })

  return (
    <div ref={setNodeRef} className="flex flex-col min-w-[320px] max-w-95 shrink-0 h-full">
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: column.color || "#6366f1" }} />
          <h3 className="font-semibold text-sm text-foreground">{column.title}</h3>
          <Badge variant="secondary" className="h-5 px-2 text-xs bg-secondary/50 border-border/30">
            {tasks.length}
          </Badge>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-accent" onClick={onAddTask}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <SortableContext items={tasks} strategy={verticalListSortingStrategy}>
        <div className="flex-1 space-y-3 min-h-[200px] bg-muted/20 border border-border/40 rounded-xl p-3 overflow-y-auto">
          {tasks.map((task) => (
            <SortableTask key={task.id} task={task} onClick={() => onTaskClick?.(task)} />
          ))}
        </div>
      </SortableContext>
    </div>
  )
}

export function KanbanBoard({ columns: initialColumns, onColumnsChange, onTaskClick, onAddTask }: KanbanBoardProps) {
  const [columns, setColumns] = useState<KanbanColumn[]>(initialColumns)
  const [activeTask, setActiveTask] = useState<KanbanTask | null>(null)
  const onColumnsChangeRef = useRef(onColumnsChange)

  // Memoize the initial columns to avoid dependency changes
  const memoizedInitialColumns = useMemo(() => initialColumns, [JSON.stringify(initialColumns)])

  useEffect(() => {
    onColumnsChangeRef.current = onColumnsChange
  }, [onColumnsChange])

  useEffect(() => {
    setColumns(memoizedInitialColumns)
  }, [memoizedInitialColumns])

  useEffect(() => {
    onColumnsChangeRef.current?.(columns)
  }, [columns])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const task = columns.flatMap((col) => col.tasks).find((task) => task.id === active.id)
    setActiveTask(task || null)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    if (activeId === overId) return

    const activeColumn = columns.find((col) => col.tasks.some((task) => task.id === activeId))
    const overColumn = columns.find((col) => col.id === overId || col.tasks.some((task) => task.id === overId))

    if (!activeColumn || !overColumn) return

    if (activeColumn.id !== overColumn.id) {
      setColumns((columns) => {
        const activeItems = activeColumn.tasks
        const overItems = overColumn.tasks
        const activeIndex = activeItems.findIndex((t) => t.id === activeId)
        const overIndex = overItems.findIndex((t) => t.id === overId)

        const newActiveItems = activeItems.filter((t) => t.id !== activeId)
        const newOverItems = [...overItems]
        const [movedItem] = activeItems.splice(activeIndex, 1)

        if (overId === overColumn.id) {
          newOverItems.push(movedItem)
        } else {
          newOverItems.splice(overIndex, 0, movedItem)
        }

        return columns.map((col) => {
          if (col.id === activeColumn.id) {
            return { ...col, tasks: newActiveItems }
          }
          if (col.id === overColumn.id) {
            return { ...col, tasks: newOverItems }
          }
          return col
        })
      })
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    const activeColumn = columns.find((col) => col.tasks.some((task) => task.id === activeId))
    const overColumn = columns.find((col) => col.id === overId || col.tasks.some((task) => task.id === overId))

    if (!activeColumn || !overColumn) return

    // Only allow sorting if the task is moved to a different column
    // Prevent sorting within the same column
    if (activeColumn.id === overColumn.id) return

    const activeIndex = activeColumn.tasks.findIndex((t) => t.id === activeId)
    const overIndex = overColumn.tasks.findIndex((t) => t.id === overId)

    if (activeIndex !== -1) {
      setColumns((columns) => {
        const newActiveItems = activeColumn.tasks.filter((t) => t.id !== activeId)
        const newOverItems = [...overColumn.tasks]
        const [movedItem] = activeColumn.tasks.splice(activeIndex, 1)

        if (overId === overColumn.id) {
          newOverItems.push(movedItem)
        } else if (overIndex !== -1) {
          newOverItems.splice(overIndex, 0, movedItem)
        } else {
          newOverItems.push(movedItem)
        }

        return columns.map((col) => {
          if (col.id === activeColumn.id) {
            return { ...col, tasks: newActiveItems }
          }
          if (col.id === overColumn.id) {
            return { ...col, tasks: newOverItems }
          }
          return col
        })
      })
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-6 h-full overflow-x-auto pb-4">
        {columns.map((column) => (
          <KanbanColumnComponent
            key={column.id}
            column={column}
            tasks={column.tasks}
            onAddTask={() => onAddTask?.(column.id)}
            onTaskClick={onTaskClick}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask ? (
          <div className="rotate-3 scale-105">
            <TaskCard task={activeTask} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
