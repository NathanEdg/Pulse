"use client";

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useLayoutEffect,
  useMemo,
} from "react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  getDaysInMonth,
  setDate,
  getDate,
  differenceInDays,
  addDays,
} from "date-fns";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { toast } from "sonner";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Popover,
  PopoverContent,
  PopoverAnchor,
} from "@/components/ui/popover";

// Utility for tailwind class merging
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Define Task interface based on the schema
export interface Task {
  id: string;
  title: string;
  start_date: Date | null;
  due_date: Date | null;
  status: string;
  priority: string;
  assignees_ids: string[];
  project_id: string;
  tags?: string[];
  depends_on?: string[];
}

export interface Cycle {
  id: string;
  number: number;
  start_date: Date;
  end_date: Date;
}

const LOAD_THRESHOLD = 500;
const BATCH_SIZE = 6;
const ROW_HEIGHT = 64; // Height of each task row
const HEADER_HEIGHT = 48; // Height of the timeline header

export default function Timeline({
  tasks = [],
  cycles = [],
  onTaskMove,
  onDependencyAdd,
  onDependencyRemove,
}: {
  tasks?: Task[];
  cycles?: Cycle[];
  onTaskMove?: (task: Task) => void;
  onDependencyAdd?: (sourceId: string, targetId: string) => void;
  onDependencyRemove?: (sourceId: string, targetId: string) => void;
}) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const zoomTargetRef = useRef<{ totalDays: number; mouseX: number } | null>(
    null,
  );

  const [pixelsPerDay, setPixelsPerDay] = useState(20);

  const prevPixelsPerDay = useRef(pixelsPerDay);
  const isZooming = prevPixelsPerDay.current !== pixelsPerDay;

  useEffect(() => {
    prevPixelsPerDay.current = pixelsPerDay;
  }, [pixelsPerDay]);

  const [localTasks, setLocalTasks] = useState<Task[]>(tasks);

  useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);
  const [cursorX, setCursorX] = useState<number | null>(null);
  const [cursorDate, setCursorDate] = useState<Date | null>(null);
  const [dragState, setDragState] = useState<{
    taskId: string;
    initialMouseX: number;
    initialTaskLeft: number;
    initialTaskWidth: number;
    currentMouseX: number;
    startDate: Date;
    endDate: Date;
    type: "move" | "resize-left" | "resize-right";
    isCtrlPressed: boolean;
    isShiftPressed: boolean;
  } | null>(null);

  const [dependencyDrag, setDependencyDrag] = useState<{
    sourceId: string;
    side: "start" | "end";
    currentX: number;
    currentY: number;
  } | null>(null);

  const [dependencyPopup, setDependencyPopup] = useState<{
    sourceId: string;
    targetId: string;
    x: number;
    y: number;
  } | null>(null);

  // Initialize months centered around today
  const [months, setMonths] = useState<Date[]>(() => {
    const start = startOfMonth(new Date());
    const initialMonths = [];
    for (let i = -6; i < 6; i++) {
      initialMonths.push(addMonths(start, i));
    }
    return initialMonths;
  });

  const [isPrepend, setIsPrepend] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Helper to calculate X position of a date relative to the start of the timeline
  const getDateX = useCallback(
    (date: Date) => {
      const firstMonth = months[0];
      if (!firstMonth) return 0;
      const start = startOfMonth(firstMonth);
      const diffDays = differenceInDays(date, start);
      return diffDays * pixelsPerDay;
    },
    [months, pixelsPerDay],
  );

  const hasCycle = (sourceId: string, targetId: string, tasks: Task[]) => {
    const visited = new Set<string>();
    const stack = [sourceId];

    while (stack.length > 0) {
      const currentId = stack.pop()!;
      if (currentId === targetId) return true;
      if (visited.has(currentId)) continue;
      visited.add(currentId);

      const task = tasks.find((t) => t.id === currentId);
      if (task?.depends_on) {
        stack.push(...task.depends_on);
      }
    }
    return false;
  };

  const reverseAutoSchedule = (tasks: Task[], fixedTaskIds: Set<string>) => {
    let changed = true;
    let newTasks = [...tasks];
    let iterations = 0;

    while (changed && iterations < tasks.length * 2) {
      changed = false;
      const taskMap = new Map(newTasks.map((t) => [t.id, t]));

      for (let i = 0; i < newTasks.length; i++) {
        const task = newTasks[i];
        if (!task || !task.depends_on || task.depends_on.length === 0) continue;

        for (const depId of task.depends_on) {
          const depTask = taskMap.get(depId);
          if (depTask && depTask.due_date && task.start_date) {
            if (depTask.due_date > task.start_date) {
              if (fixedTaskIds.has(depId)) continue;

              const duration = differenceInDays(
                depTask.due_date,
                depTask.start_date!,
              );
              const newEnd = task.start_date;
              const newStart = addDays(newEnd, -duration);

              const depIndex = newTasks.findIndex((t) => t.id === depId);
              if (depIndex !== -1) {
                const updatedDepTask = {
                  ...depTask,
                  start_date: newStart,
                  due_date: newEnd,
                };
                newTasks[depIndex] = updatedDepTask;
                taskMap.set(depId, updatedDepTask);
                changed = true;
              }
            }
          }
        }
      }
      iterations++;
    }
    return newTasks;
  };

  const autoSchedule = (tasks: Task[]) => {
    let changed = true;
    let newTasks = [...tasks];
    let iterations = 0;

    while (changed && iterations < tasks.length * 2) {
      changed = false;
      const taskMap = new Map(newTasks.map((t) => [t.id, t]));

      for (let i = 0; i < newTasks.length; i++) {
        const task = newTasks[i];
        if (!task || !task.depends_on || task.depends_on.length === 0) continue;

        let maxEndDate = new Date(0);
        let hasDependency = false;

        for (const depId of task.depends_on) {
          const depTask = taskMap.get(depId);
          if (depTask && depTask.due_date) {
            hasDependency = true;
            if (depTask.due_date > maxEndDate) {
              maxEndDate = depTask.due_date;
            }
          }
        }

        if (hasDependency && task.start_date && task.start_date < maxEndDate) {
          const duration = differenceInDays(task.due_date!, task.start_date!);
          const newStart = maxEndDate;
          const newEnd = addDays(newStart, duration);

          const updatedTask = {
            ...task,
            start_date: newStart,
            due_date: newEnd,
          };
          newTasks[i] = updatedTask;
          taskMap.set(task.id, updatedTask);
          changed = true;
        }
      }
      iterations++;
    }
    return newTasks;
  };

  const handleCreateDependency = (sourceId: string, targetId: string) => {
    if (hasCycle(sourceId, targetId, localTasks)) {
      toast.error("Cannot create circular dependency");
      return;
    }

    const targetTask = localTasks.find((t) => t.id === targetId);
    if (targetTask?.depends_on?.includes(sourceId)) {
      toast.error("Dependency already exists");
      return;
    }

    const updatedTasks = localTasks.map((t) => {
      if (t.id === targetId) {
        return {
          ...t,
          depends_on: [...(t.depends_on || []), sourceId],
        };
      }
      return t;
    });

    const scheduledTasks = autoSchedule(updatedTasks);
    setLocalTasks(scheduledTasks);
    toast.success("Dependency created");
    onDependencyAdd?.(sourceId, targetId);
  };

  const handleRemoveDependency = (sourceId: string, targetId: string) => {
    const updatedTasks = localTasks.map((t) => {
      if (t.id === targetId) {
        return {
          ...t,
          depends_on: t.depends_on?.filter((id) => id !== sourceId),
        };
      }
      return t;
    });
    setLocalTasks(updatedTasks);
    setDependencyPopup(null);
    toast.success("Dependency removed");
    onDependencyRemove?.(sourceId, targetId);
  };

  // Initial scroll positioning
  useLayoutEffect(() => {
    if (scrollContainerRef.current) {
      let width = 0;
      // Calculate width of past months (first 6)
      for (let i = 0; i < 6; i++) {
        const month = months[i];
        if (month) width += getDaysInMonth(month) * pixelsPerDay;
      }

      // Add days from current month to center on today
      const today = new Date();
      const daysPassed = getDate(today) - 1;
      width += daysPassed * pixelsPerDay;

      const viewportWidth = scrollContainerRef.current.clientWidth;
      // Center the view
      scrollContainerRef.current.scrollLeft = width - viewportWidth / 2;
    }
  }, []); // Run once on mount

  // Scroll Handler
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Sync Sidebar Scroll
    if (sidebarRef.current) {
      sidebarRef.current.scrollTop = container.scrollTop;
    }

    if (isLoading) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;

    // Infinite Scroll Logic
    if (scrollWidth - (scrollLeft + clientWidth) < LOAD_THRESHOLD) {
      setIsLoading(true);
      setMonths((prev) => {
        const lastMonth = prev[prev.length - 1];
        if (!lastMonth) return prev;
        const anchor = lastMonth;
        const newMonths = Array.from({ length: BATCH_SIZE }, (_, i) =>
          addMonths(anchor, i + 1),
        );
        return [...prev, ...newMonths];
      });
      setTimeout(() => setIsLoading(false), 100);
    }

    if (scrollLeft < LOAD_THRESHOLD) {
      setIsLoading(true);
      setIsPrepend(true);
      setMonths((prev) => {
        const firstMonth = prev[0];
        if (!firstMonth) return prev;
        const anchor = firstMonth;
        const newMonths = Array.from({ length: BATCH_SIZE }, (_, i) =>
          subMonths(anchor, BATCH_SIZE - i),
        );
        return [...newMonths, ...prev];
      });
    }
  }, [isLoading]);

  // Prepend Layout Effect
  useLayoutEffect(() => {
    if (!isPrepend) return;
    const container = scrollContainerRef.current;
    if (!container) return;

    let addedWidth = 0;
    for (let i = 0; i < BATCH_SIZE; i++) {
      const month = months[i];
      if (month) addedWidth += getDaysInMonth(month) * pixelsPerDay;
    }

    container.scrollLeft += addedWidth;
    setIsPrepend(false);
    setIsLoading(false);
  }, [months, isPrepend, pixelsPerDay]);

  // Zoom Layout Effect
  useLayoutEffect(() => {
    if (zoomTargetRef.current && scrollContainerRef.current) {
      const { totalDays, mouseX } = zoomTargetRef.current;
      const newTotalX = totalDays * pixelsPerDay;
      scrollContainerRef.current.scrollLeft = newTotalX - mouseX;
      zoomTargetRef.current = null;
    }
  }, [pixelsPerDay]);

  // Wheel Handler (Zoom)
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const rect = container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const scrollLeft = container.scrollLeft;
        const totalX = scrollLeft + mouseX;
        const totalDays = totalX / pixelsPerDay;

        zoomTargetRef.current = { totalDays, mouseX };
        const factor = 1 - e.deltaY * 0.001;
        setPixelsPerDay((prev) => Math.max(2, Math.min(100, prev * factor)));
      }
    };

    container.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      container.removeEventListener("wheel", onWheel);
    };
  }, [pixelsPerDay]);

  const successorMap = useMemo(() => {
    const map = new Map<string, string[]>();
    localTasks.forEach((t) => {
      t.depends_on?.forEach((depId) => {
        if (!map.has(depId)) map.set(depId, []);
        map.get(depId)!.push(t.id);
      });
    });
    return map;
  }, [localTasks]);

  const derivedTasks = useMemo(() => {
    if (!dragState) return localTasks;

    const deltaX = dragState.currentMouseX - dragState.initialMouseX;
    const daysShift = Math.round(deltaX / pixelsPerDay);

    if (daysShift === 0) return localTasks;

    if (dragState.isShiftPressed && dragState.type === "move") {
      const connectedTasks = new Set<string>();
      const stack = [dragState.taskId];
      const taskLookup = new Map(localTasks.map((t) => [t.id, t]));

      while (stack.length) {
        const id = stack.pop()!;
        if (connectedTasks.has(id)) continue;
        connectedTasks.add(id);

        // Add successors
        const successors = successorMap.get(id) || [];
        for (const s of successors) {
          if (!connectedTasks.has(s)) stack.push(s);
        }

        // Add predecessors
        const task = taskLookup.get(id);
        if (task?.depends_on) {
          for (const p of task.depends_on) {
            if (!connectedTasks.has(p)) stack.push(p);
          }
        }
      }

      const tasksWithDrag = localTasks.map((t) => {
        if (connectedTasks.has(t.id)) {
          const newStart = addDays(t.start_date!, daysShift);
          const newEnd = addDays(t.due_date!, daysShift);
          return { ...t, start_date: newStart, due_date: newEnd };
        }
        return t;
      });
      return autoSchedule(tasksWithDrag);
    }

    const tasksWithDrag = localTasks.map((t) => {
      if (t.id === dragState.taskId) {
        let newStart = dragState.startDate;
        let newEnd = dragState.endDate;

        if (dragState.type === "move") {
          newStart = addDays(dragState.startDate, daysShift);
          newEnd = addDays(dragState.endDate, daysShift);
        } else if (dragState.type === "resize-left") {
          newStart = addDays(dragState.startDate, daysShift);
          if (newStart > newEnd) newStart = newEnd;
        } else if (dragState.type === "resize-right") {
          newEnd = addDays(dragState.endDate, daysShift);
          if (newEnd < newStart) newEnd = newStart;
        }
        return { ...t, start_date: newStart, due_date: newEnd };
      }
      return t;
    });

    if (dragState.isCtrlPressed) {
      const reversed = reverseAutoSchedule(
        tasksWithDrag,
        new Set([dragState.taskId]),
      );
      return autoSchedule(reversed);
    }

    return autoSchedule(tasksWithDrag);
  }, [localTasks, dragState, pixelsPerDay, successorMap]);

  // Drag Event Listeners
  useEffect(() => {
    if (!dragState && !dependencyDrag) return;

    const handleWindowMouseMove = (e: MouseEvent) => {
      if (dragState) {
        setDragState((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            currentMouseX: e.clientX,
            isCtrlPressed: e.ctrlKey || e.metaKey,
            isShiftPressed: e.shiftKey,
          };
        });
      }
      if (dependencyDrag) {
        const rect = scrollContainerRef.current?.getBoundingClientRect();
        if (rect) {
          setDependencyDrag((prev) =>
            prev
              ? {
                  ...prev,
                  currentX:
                    e.clientX -
                    rect.left +
                    (scrollContainerRef.current?.scrollLeft || 0),
                  currentY:
                    e.clientY -
                    rect.top +
                    (scrollContainerRef.current?.scrollTop || 0),
                }
              : null,
          );
        }
      }
    };

    const handleWindowMouseUp = () => {
      if (dependencyDrag) {
        setDependencyDrag(null);
      }

      if (dragState) {
        setLocalTasks(derivedTasks);

        derivedTasks.forEach((newTask) => {
          const oldTask = localTasks.find((t) => t.id === newTask.id);
          if (!oldTask) return;

          const hasChanged =
            newTask.start_date?.getTime() !== oldTask.start_date?.getTime() ||
            newTask.due_date?.getTime() !== oldTask.due_date?.getTime();

          if (hasChanged) {
            onTaskMove?.(newTask);
          }
        });
      }
      setDragState(null);
    };

    window.addEventListener("mousemove", handleWindowMouseMove);
    window.addEventListener("mouseup", handleWindowMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleWindowMouseMove);
      window.removeEventListener("mouseup", handleWindowMouseUp);
    };
  }, [dragState, dependencyDrag, pixelsPerDay, derivedTasks]);

  // Mouse Move for Cursor
  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = scrollContainerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const scrollLeft = scrollContainerRef.current?.scrollLeft || 0;
    const totalX = scrollLeft + x;

    setCursorX(x);

    // Calculate date
    const firstMonth = months[0];
    if (!firstMonth) return;
    const start = startOfMonth(firstMonth);
    const daysToAdd = totalX / pixelsPerDay;
    setCursorDate(addDays(start, daysToAdd));
  };

  const handleMouseLeave = () => {
    setCursorX(null);
    setCursorDate(null);
  };

  // Calculate total width
  const totalWidth = useMemo(() => {
    return months.reduce(
      (acc, month) => acc + getDaysInMonth(month) * pixelsPerDay,
      0,
    );
  }, [months, pixelsPerDay]);

  const taskMap = useMemo(() => {
    const map = new Map<string, { index: number; task: Task }>();
    derivedTasks.forEach((t, i) => map.set(t.id, { index: i, task: t }));
    return map;
  }, [derivedTasks]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-background text-foreground relative h-full w-full overflow-hidden"
    >
      {/* Sidebar (Overlay) */}
      <div
        className="bg-background/95 border-border absolute bottom-4 left-0 z-40 flex w-64 flex-col border-r shadow-sm backdrop-blur-sm"
        style={{ top: HEADER_HEIGHT }}
      >
        <div
          ref={sidebarRef}
          className="flex-1 overflow-hidden pt-4" // Added padding top for task spacing
        >
          <AnimatePresence>
            {derivedTasks.map((t) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="hover:bg-accent/50 flex items-center truncate px-4 text-sm font-medium transition-colors"
                style={{ height: ROW_HEIGHT }}
              >
                <div className="flex w-full items-center gap-2">
                  <div
                    className={cn(
                      "h-2 w-2 flex-shrink-0 rounded-full",
                      t.status === "done"
                        ? "bg-green-500"
                        : t.status === "in-progress"
                          ? "bg-amber-500"
                          : "bg-slate-300",
                    )}
                  />
                  <span className="truncate">{t.title}</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Timeline Area */}
      <div className="relative h-full w-full">
        {/* Cursor Follower Label */}
        {cursorX !== null && cursorDate && (
          <div
            className="border-black-100 pointer-events-none absolute top-8 z-50 flex h-full flex-col items-center border-l"
            style={{ left: cursorX }}
          >
            <div className="absolute top-0 -translate-y-full rounded bg-gray-800 px-1.5 py-0.5 text-[10px] font-bold whitespace-nowrap text-white">
              {format(cursorDate, "MMM d").toUpperCase()}
            </div>
          </div>
        )}

        <div
          ref={scrollContainerRef}
          className="timeline-scroll-container relative h-full w-full overflow-auto"
          onScroll={handleScroll}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <div className="relative min-h-full" style={{ width: totalWidth }}>
            {/* Header (Sticky) */}
            <div
              className="bg-background/95 border-border sticky top-0 left-0 z-30 flex w-full border-b backdrop-blur-sm"
              style={{ height: HEADER_HEIGHT }}
            >
              {months.map((m) => (
                <MonthHeader
                  key={m.toISOString()}
                  month={m}
                  pixelsPerDay={pixelsPerDay}
                />
              ))}
              <CycleOverlay
                cycles={cycles}
                months={months}
                pixelsPerDay={pixelsPerDay}
              />
              <CurrentDateLabel months={months} pixelsPerDay={pixelsPerDay} />
            </div>

            {/* Grid Background */}
            <div
              className="pointer-events-none absolute inset-0 z-0 flex h-full"
              style={{ top: HEADER_HEIGHT }}
            >
              {months.map((m) => (
                <MonthGrid
                  key={m.toISOString()}
                  month={m}
                  pixelsPerDay={pixelsPerDay}
                />
              ))}
            </div>

            {/* Current Date Line */}
            <CurrentDateLine months={months} pixelsPerDay={pixelsPerDay} />

            {/* Dependency Lines */}
            <svg
              className="pointer-events-none absolute top-0 left-0 z-0 h-full w-full"
              style={{ top: HEADER_HEIGHT }}
            >
              {derivedTasks.map((targetTask) =>
                targetTask.depends_on?.map((sourceId) => {
                  const source = taskMap.get(sourceId);
                  const target = taskMap.get(targetTask.id);
                  if (!source || !target) return null;

                  const sourceX = getDateX(source.task.due_date!);
                  const sourceY =
                    source.index * ROW_HEIGHT + ROW_HEIGHT / 2 + 16; // +16 for padding top
                  const targetX = getDateX(target.task.start_date!);
                  const targetY =
                    target.index * ROW_HEIGHT + ROW_HEIGHT / 2 + 16;

                  const deltaX = targetX - sourceX;
                  const controlOffset = Math.max(Math.abs(deltaX) * 0.5, 40);
                  const path = `M ${sourceX} ${sourceY} C ${sourceX + controlOffset} ${sourceY}, ${targetX - controlOffset} ${targetY}, ${targetX} ${targetY}`;

                  return (
                    <g key={`${sourceId}-${targetTask.id}`}>
                      {/* Invisible wider path for hitbox */}
                      <path
                        d={path}
                        fill="none"
                        stroke="transparent"
                        strokeWidth="12"
                        className="pointer-events-auto cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDependencyPopup({
                            sourceId,
                            targetId: targetTask.id,
                            x: e.clientX,
                            y: e.clientY,
                          });
                        }}
                      />
                      {/* Visible path */}
                      <path
                        d={path}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeDasharray="4 4"
                        className="text-muted-foreground pointer-events-none"
                      />
                    </g>
                  );
                }),
              )}
              {dependencyDrag &&
                (() => {
                  const source = taskMap.get(dependencyDrag.sourceId);
                  if (!source) return null;
                  const startX =
                    dependencyDrag.side === "end"
                      ? getDateX(source.task.due_date!)
                      : getDateX(source.task.start_date!);
                  const startY =
                    source.index * ROW_HEIGHT + ROW_HEIGHT / 2 + 16;
                  return (
                    <line
                      x1={startX}
                      y1={startY}
                      x2={dependencyDrag.currentX}
                      y2={dependencyDrag.currentY - HEADER_HEIGHT}
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeDasharray="4 4"
                      className="text-primary"
                    />
                  );
                })()}
            </svg>

            {/* Tasks */}
            <div className="pointer-events-none relative z-10 pt-4">
              {" "}
              {/* Added padding top to match sidebar */}
              {derivedTasks.map((t) => {
                const startDate = t.start_date
                  ? new Date(t.start_date)
                  : new Date();
                const dueDate = t.due_date
                  ? new Date(t.due_date)
                  : addDays(startDate, 1);

                const start = startDate < dueDate ? startDate : dueDate;
                const end = startDate < dueDate ? dueDate : startDate;

                let left = getDateX(start);
                let width = Math.max(getDateX(end) - left, pixelsPerDay);

                const isDragging = dragState?.taskId === t.id;

                if (isDragging && dragState) {
                  const deltaX =
                    dragState.currentMouseX - dragState.initialMouseX;

                  if (dragState.type === "move") {
                    left = dragState.initialTaskLeft + deltaX;
                  } else if (dragState.type === "resize-left") {
                    const newWidth = Math.max(
                      dragState.initialTaskWidth - deltaX,
                      pixelsPerDay,
                    );
                    left =
                      dragState.initialTaskLeft +
                      (dragState.initialTaskWidth - newWidth);
                    width = newWidth;
                  } else if (dragState.type === "resize-right") {
                    width = Math.max(
                      dragState.initialTaskWidth + deltaX,
                      pixelsPerDay,
                    );
                  }
                }

                return (
                  <div
                    key={t.id}
                    className="relative w-full"
                    style={{ height: ROW_HEIGHT }}
                  >
                    <motion.div
                      animate={{ left, width }}
                      transition={
                        isZooming || isDragging
                          ? { duration: 0 }
                          : { type: "spring", stiffness: 300, damping: 30 }
                      }
                      className={cn(
                        "bg-secondary border-primary/20 group pointer-events-auto absolute top-1/2 -translate-y-1/2 rounded-md border shadow-sm",
                        isDragging
                          ? "border-primary z-50"
                          : "hover:border-primary transition-colors",
                        dragState?.type === "move" || !isDragging
                          ? "cursor-grab"
                          : "",
                        isDragging && dragState.type === "move"
                          ? "cursor-grabbing"
                          : "",
                      )}
                      style={{ height: "32px" }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDragState({
                          taskId: t.id,
                          initialMouseX: e.clientX,
                          initialTaskLeft: left,
                          initialTaskWidth: width,
                          currentMouseX: e.clientX,
                          startDate: start,
                          endDate: end,
                          type: "move",
                          isCtrlPressed: e.ctrlKey || e.metaKey,
                          isShiftPressed: e.shiftKey,
                        });
                      }}
                      onMouseUp={(e) => {
                        if (
                          dependencyDrag &&
                          dependencyDrag.sourceId !== t.id
                        ) {
                          e.stopPropagation();
                          if (dependencyDrag.side === "end") {
                            handleCreateDependency(
                              dependencyDrag.sourceId,
                              t.id,
                            );
                          } else {
                            handleCreateDependency(
                              t.id,
                              dependencyDrag.sourceId,
                            );
                          }
                          setDependencyDrag(null);
                        }
                      }}
                    >
                      {/* Dependency Connector (Left) */}
                      <div
                        className="bg-primary absolute top-1/2 -left-4 z-50 h-3 w-3 -translate-y-1/2 cursor-crosshair rounded-full opacity-0 transition-opacity group-hover:opacity-100"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          const rect =
                            scrollContainerRef.current?.getBoundingClientRect();
                          if (rect) {
                            setDependencyDrag({
                              sourceId: t.id,
                              side: "start",
                              currentX:
                                e.clientX -
                                rect.left +
                                (scrollContainerRef.current?.scrollLeft || 0),
                              currentY:
                                e.clientY -
                                rect.top +
                                (scrollContainerRef.current?.scrollTop || 0),
                            });
                          }
                        }}
                      />

                      {/* Dependency Connector (Right) */}
                      <div
                        className="bg-primary absolute top-1/2 -right-4 z-50 h-3 w-3 -translate-y-1/2 cursor-crosshair rounded-full opacity-0 transition-opacity group-hover:opacity-100"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          const rect =
                            scrollContainerRef.current?.getBoundingClientRect();
                          if (rect) {
                            setDependencyDrag({
                              sourceId: t.id,
                              side: "end",
                              currentX:
                                e.clientX -
                                rect.left +
                                (scrollContainerRef.current?.scrollLeft || 0),
                              currentY:
                                e.clientY -
                                rect.top +
                                (scrollContainerRef.current?.scrollTop || 0),
                            });
                          }
                        }}
                      />

                      {/* Left Resize Handle */}
                      <div
                        className="hover:bg-primary/20 absolute top-0 bottom-0 left-0 z-10 w-2 cursor-ew-resize"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDragState({
                            taskId: t.id,
                            initialMouseX: e.clientX,
                            initialTaskLeft: left,
                            initialTaskWidth: width,
                            currentMouseX: e.clientX,
                            startDate: start,
                            endDate: end,
                            type: "resize-left",
                            isCtrlPressed: e.ctrlKey || e.metaKey,
                            isShiftPressed: e.shiftKey,
                          });
                        }}
                      />

                      {/* Right Resize Handle */}
                      <div
                        className="hover:bg-primary/20 absolute top-0 right-0 bottom-0 z-10 w-2 cursor-ew-resize"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDragState({
                            taskId: t.id,
                            initialMouseX: e.clientX,
                            initialTaskLeft: left,
                            initialTaskWidth: width,
                            currentMouseX: e.clientX,
                            startDate: start,
                            endDate: end,
                            type: "resize-right",
                            isCtrlPressed: e.ctrlKey || e.metaKey,
                            isShiftPressed: e.shiftKey,
                          });
                        }}
                      />

                      {isDragging && (
                        <div className="bg-background text-foreground border-border absolute -top-10 left-1/2 z-50 -translate-x-1/2 rounded border px-2 py-1 text-xs whitespace-nowrap shadow-md">
                          {format(start, "EEE, MMM d")} -{" "}
                          {format(end, "EEE, MMM d")}
                        </div>
                      )}
                      <span className="text-foreground/80 group-hover:text-foreground pointer-events-none absolute -top-5 left-0 px-1 text-[10px] font-semibold whitespace-nowrap transition-colors">
                        {t.title}
                      </span>
                    </motion.div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Dependency Remove Popup */}
      <Popover
        open={!!dependencyPopup}
        onOpenChange={(open) => !open && setDependencyPopup(null)}
      >
        {dependencyPopup && (
          <PopoverAnchor asChild>
            <div
              style={{
                position: "fixed",
                left: dependencyPopup.x,
                top: dependencyPopup.y,
                width: 1,
                height: 1,
                pointerEvents: "none",
              }}
            />
          </PopoverAnchor>
        )}
        <PopoverContent
          className="w-64 p-0"
          align="center"
          side="bottom"
          sideOffset={10}
        >
          <div className="flex flex-col">
            <div className="flex items-center gap-2 p-3">
              <div className="bg-primary h-2 w-2 rounded-full" />
              <span className="truncate text-xs font-medium">
                {dependencyPopup &&
                  taskMap.get(dependencyPopup.sourceId)?.task.title}
              </span>
            </div>
            <div className="text-muted-foreground px-3 py-2 text-center text-[10px] font-bold tracking-wider uppercase">
              Blocking
            </div>
            <div className="border-border/50 flex items-center gap-2 border-b p-3">
              <div className="bg-primary h-2 w-2 rounded-full" />
              <span className="truncate text-xs font-medium">
                {dependencyPopup &&
                  taskMap.get(dependencyPopup.targetId)?.task.title}
              </span>
            </div>
            <button
              className="hover:bg-accent flex w-full items-center gap-2 rounded-b-md p-3 text-left text-xs transition-colors"
              onClick={() => {
                if (dependencyPopup) {
                  handleRemoveDependency(
                    dependencyPopup.sourceId,
                    dependencyPopup.targetId,
                  );
                }
              }}
            >
              <div className="flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white">
                <X className="h-3 w-3" />
              </div>
              Remove dependency
            </button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Drag Help Bar */}
      <AnimatePresence>
        {dragState && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="bg-foreground/90 text-background fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full px-6 py-2 text-sm font-medium shadow-lg backdrop-blur-sm"
          >
            <span className="mr-4">
              Hold <kbd className="bg-background/20 rounded px-1">Ctrl</kbd> to
              push predecessors
            </span>
            <span>
              Hold <kbd className="bg-background/20 rounded px-1">Shift</kbd> to
              move chain
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function MonthHeader({
  month,
  pixelsPerDay,
}: {
  month: Date;
  pixelsPerDay: number;
}) {
  const daysInMonth = getDaysInMonth(month);
  const width = daysInMonth * pixelsPerDay;

  const isJanuary = month.getMonth() === 0;
  const monthLabel = format(month, "MMM").toUpperCase();
  const yearFormat = pixelsPerDay < 10 ? "yy" : "yyyy";
  const label = isJanuary
    ? `${monthLabel} ${format(month, yearFormat)}`
    : monthLabel;

  return (
    <div
      className="border-border/30 relative z-20 flex h-full flex-shrink-0 items-end border-r border-dashed px-2 pb-2"
      style={{ width }}
    >
      <span className="text-muted-foreground block text-[10px] font-bold tracking-wider whitespace-nowrap">
        {label}
      </span>
    </div>
  );
}

function MonthGrid({
  month,
  pixelsPerDay,
}: {
  month: Date;
  pixelsPerDay: number;
}) {
  const daysInMonth = getDaysInMonth(month);
  const width = daysInMonth * pixelsPerDay;

  // Calculate markers for every 7 days
  const markers = [];
  for (let day = 1; day <= daysInMonth; day += 7) {
    markers.push(day);
  }

  return (
    <div
      className="border-border/30 relative h-full flex-shrink-0 border-r border-dashed"
      style={{ width }}
    >
      {markers.map((day) => {
        const leftOffset = (day - 1) * pixelsPerDay;
        const date = setDate(month, day);

        let textTranslateX = "0px";
        if (day === 1) textTranslateX = "4px";
        if (day >= 29) textTranslateX = "-4px";

        return (
          <div
            key={day}
            className="absolute top-0 flex h-full flex-col items-center"
            style={{ left: `${leftOffset}px`, transform: "translateX(-50%)" }}
          >
            {/* Tick */}
            <div className="bg-border/60 mb-0.5 h-1.5 w-px" />

            {/* Day Label */}
            <div
              className="text-muted-foreground/70 text-[9px] leading-none font-medium"
              style={{ transform: `translateX(${textTranslateX})` }}
            >
              {format(date, "d")}
            </div>

            {/* Vertical Line */}
            <div className="border-border/40 ml-px w-px flex-1 border-l border-dashed" />
          </div>
        );
      })}
    </div>
  );
}

function CurrentDateLabel({
  months,
  pixelsPerDay,
}: {
  months: Date[];
  pixelsPerDay: number;
}) {
  const today = new Date();
  const firstMonth = months[0];
  if (!firstMonth) return null;
  const start = startOfMonth(firstMonth);
  const diffDays = differenceInDays(today, start);
  const left = diffDays * pixelsPerDay;

  // Only render if within range
  if (left < 0) return null;

  return (
    <div
      className="absolute top-0 z-40 flex flex-col items-center"
      style={{
        left: `${left}px`,
        transform: "translateX(-50%)",
      }}
    >
      <div className="absolute top-8 -translate-y-full rounded bg-blue-900 px-1.5 py-0.5 text-[10px] font-bold whitespace-nowrap text-white">
        {format(today, "MMM d").toUpperCase()}
      </div>
    </div>
  );
}

function CurrentDateLine({
  months,
  pixelsPerDay,
}: {
  months: Date[];
  pixelsPerDay: number;
}) {
  const today = new Date();
  const firstMonth = months[0];
  if (!firstMonth) return null;
  const start = startOfMonth(firstMonth);
  const diffDays = differenceInDays(today, start);
  const left = diffDays * pixelsPerDay;

  if (left < 0) return null;

  return (
    <div
      className="absolute top-8 bottom-0 z-40 border-l border-blue-900"
      style={{
        left: `${left}px`,
        transform: "translateX(-50%)",
      }}
    />
  );
}

function CycleOverlay({
  cycles,
  months,
  pixelsPerDay,
}: {
  cycles: Cycle[];
  months: Date[];
  pixelsPerDay: number;
}) {
  const firstMonth = months[0];
  if (!firstMonth) return null;
  const startOfTimeline = startOfMonth(firstMonth);

  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      {cycles.map((cycle) => {
        const startDiff = differenceInDays(cycle.start_date, startOfTimeline);
        const duration = differenceInDays(cycle.end_date, cycle.start_date) + 1;
        const left = startDiff * pixelsPerDay;
        const width = duration * pixelsPerDay;

        if (left + width < 0) return null;

        return (
          <div
            key={cycle.id}
            className="bg-primary/5 border-primary/10 absolute top-0 flex h-full items-center justify-center border-x"
            style={{ left, width }}
          >
            <div className="text-muted-foreground/60 text-[10px] font-medium whitespace-nowrap">
              Cycle {cycle.number}
            </div>
          </div>
        );
      })}
    </div>
  );
}
