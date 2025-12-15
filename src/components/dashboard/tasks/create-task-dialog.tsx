"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { api } from "@/trpc/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  X,
  Paperclip,
  Tag,
  RefreshCw,
  Plus,
  MoreVertical,
  ListTodo,
  AlertCircle,
  FolderKanban,
  User,
  GitBranch,
  CalendarIcon,
  Users,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";

interface CreateTaskDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  _teamId?: string;
  _programId?: string;
  children?: React.ReactNode;
  taskId?: string; // If provided, we're in edit mode
  defaultTitle?: string;
  defaultDescription?: string;
  defaultTeam?: string;
  defaultStatus?: string;
  defaultPriority?: string;
  defaultProject?: string;
  defaultLeader?: string;
  defaultAssignees?: string[];
  defaultCycle?: string;
  defaultLabels?: string[];
  defaultStartDate?: Date | null;
  defaultEndDate?: Date | null;
}

export function CreateTaskDialog({
  open,
  onOpenChange,
  _teamId,
  _programId = "program-seed-1",
  children,
  taskId,
  defaultTitle = "",
  defaultDescription = "",
  defaultTeam = "",
  defaultStatus = "backlog",
  defaultPriority = "",
  defaultProject = "",
  defaultLeader = "",
  defaultAssignees = [],
  defaultCycle = "current",
  defaultLabels = [],
  defaultStartDate = null,
  defaultEndDate = null,
}: CreateTaskDialogProps) {
  const router = useRouter();
  const isEditMode = !!taskId;
  const [title, setTitle] = useState(defaultTitle);
  const [description, setDescription] = useState(defaultDescription);
  const [selectedStatus, setSelectedStatus] = useState(defaultStatus);
  const [selectedPriority, setSelectedPriority] = useState(defaultPriority);
  const [selectedProject, setSelectedProject] = useState(defaultProject);
  const [selectedLeader, setSelectedLeader] = useState(defaultLeader);
  const [selectedAssignees, setSelectedAssignees] =
    useState<string[]>(defaultAssignees);
  const [selectedLabels, setSelectedLabels] = useState<string[]>(defaultLabels);
  const [customLabels, setCustomLabels] = useState<
    Array<{ id: string; name: string; color: string }>
  >([]);
  const [newLabelInput, setNewLabelInput] = useState("");
  const [selectedCycle, setSelectedCycle] = useState(defaultCycle);
  const [selectedTeam, setSelectedTeam] = useState(defaultTeam);
  const [startDate, setStartDate] = useState<Date | undefined>(
    defaultStartDate ?? undefined,
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    defaultEndDate ?? undefined,
  );
  const [createMore, setCreateMore] = useState(false);
  const [labelsOpen, setLabelsOpen] = useState(false);
  const [assigneesOpen, setAssigneesOpen] = useState(false);
  const [showSubtaskForm, setShowSubtaskForm] = useState(false);
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null);
  const [subtasks, setSubtasks] = useState<
    Array<{
      id: string;
      title: string;
      description: string;
      status: string;
      priority: string;
      assignee: string;
      isNew?: boolean;
      isDeleted?: boolean;
    }>
  >([]);
  const [subtaskTitle, setSubtaskTitle] = useState("");
  const [subtaskDescription, setSubtaskDescription] = useState("");
  const [subtaskStatus, setSubtaskStatus] = useState("backlog");
  const [subtaskPriority, setSubtaskPriority] = useState("");
  const [subtaskAssignee, setSubtaskAssignee] = useState("");
  const [showConfirmClose, setShowConfirmClose] = useState(false);

  // API Queries
  const { data: priorities = [] } = api.settings.getPriorities.useQuery({
    program_id: _programId,
  });

  const { data: existingSubtasks = [] } = api.tasks.getSubtasks.useQuery(
    { task_id: taskId! },
    {
      enabled: isEditMode && !!taskId,
      refetchOnMount: true,
      refetchOnWindowFocus: false,
    },
  );

  // API Mutations
  const createTaskMutation = api.tasks.createTask.useMutation({
    onSuccess: () => {
      toast.success("Task created successfully!");
      router.refresh();
    },
    onError: (error) => {
      toast.error(`Failed to create task: ${error.message}`);
    },
  });

  const updateTaskMutation = api.tasks.updateTask.useMutation({
    onSuccess: () => {
      toast.success("Task updated successfully!");
      router.refresh();
    },
    onError: (error) => {
      toast.error(`Failed to update task: ${error.message}`);
    },
  });

  const createSubtaskMutation = api.tasks.createSubtask.useMutation({
    onError: (error) => {
      toast.error(`Failed to create subtask: ${error.message}`);
    },
  });

  const updateSubtaskMutation = api.tasks.updateSubtask.useMutation({
    onError: (error) => {
      toast.error(`Failed to update subtask: ${error.message}`);
    },
  });

  const deleteSubtaskMutation = api.tasks.deleteSubtask.useMutation({
    onError: (error) => {
      toast.error(`Failed to delete subtask: ${error.message}`);
    },
  });

  const statuses = [
    { id: "backlog", name: "Backlog", color: "#9CA3AF" },
    { id: "planned", name: "Planned", color: "#3B82F6" },
    { id: "in_progress", name: "In Progress", color: "#F59E0B" },
    { id: "completed", name: "Completed", color: "#10B981" },
    { id: "cancelled", name: "Cancelled", color: "#EF4444" },
  ];

  const projects = [
    { id: "1", name: "Website Redesign", color: "#8B5CF6" },
    { id: "2", name: "Mobile App", color: "#10B981" },
    { id: "3", name: "Marketing Campaign", color: "#F59E0B" },
  ];

  const labels = [
    { id: "1", name: "Bug", color: "#EF4444" },
    { id: "2", name: "Feature", color: "#3B82F6" },
    { id: "3", name: "Documentation", color: "#8B5CF6" },
    { id: "4", name: "Enhancement", color: "#10B981" },
    { id: "5", name: "Question", color: "#F59E0B" },
  ];

  const cycles = [
    { id: "current", name: "Current", start: "", end: "" },
    { id: "1", name: "Cycle 1", start: "2024-01", end: "2024-02" },
    { id: "2", name: "Cycle 2", start: "2024-03", end: "2024-04" },
    { id: "3", name: "Cycle 3", start: "2024-05", end: "2024-06" },
  ];

  const { data: teams = [] } = api.teams.getTeams.useQuery({
    program_id: _programId,
  });

  const { data: members = [] } = api.programs.getMembers.useQuery({
    organizationId: _programId,
  });

  const allLabels = [...labels, ...customLabels];

  // Track previous open state to detect when dialog opens
  const prevOpenRef = useRef(open);

  // Load existing subtasks when they become available in edit mode
  useEffect(() => {
    console.log("Subtask effect running:", {
      isEditMode,
      subtasksCount: existingSubtasks.length,
      open,
      taskId,
    });
    if (isEditMode && existingSubtasks.length > 0 && open) {
      console.log("Loading subtasks:", existingSubtasks);
      setSubtasks(
        existingSubtasks.map((st) => ({
          id: st.id,
          title: st.title,
          description: st.description || "",
          status: st.status,
          priority: st.priority,
          assignee: st.assignee_id || "",
          isNew: false,
          isDeleted: false,
        })),
      );
    }
  }, [isEditMode, existingSubtasks, open, taskId]);

  // Sync props with state when dialog transitions from closed to open
  useEffect(() => {
    if (open && !prevOpenRef.current) {
      setTitle(defaultTitle);
      setDescription(defaultDescription);
      setSelectedStatus(defaultStatus);
      setSelectedPriority(defaultPriority || "");
      // Find team by name or ID (case-insensitive)
      const matchedTeam = teams.find(
        (t) =>
          t.name.toLowerCase() === defaultTeam.toLowerCase() ||
          t.id === defaultTeam,
      );
      setSelectedTeam(matchedTeam?.id || teams[0]?.id || "");
      setSelectedProject(defaultProject || "");
      setSelectedLeader(defaultLeader || "");
      setSelectedAssignees(defaultAssignees);
      setSelectedCycle(defaultCycle || "current");
      setSelectedLabels(defaultLabels);
      setStartDate(defaultStartDate ?? undefined);
      setEndDate(defaultEndDate ?? undefined);

      // Reset subtasks if not in edit mode
      // (subtasks in edit mode are loaded by a separate effect)
      if (!isEditMode) {
        setSubtasks([]);
      }
    }
    prevOpenRef.current = open;
  }, [
    open,
    defaultTitle,
    defaultDescription,
    defaultStatus,
    defaultPriority,
    defaultTeam,
    defaultProject,
    defaultLeader,
    defaultAssignees,
    defaultCycle,
    defaultLabels,
    defaultStartDate,
    defaultEndDate,
    teams,
    isEditMode,
  ]);

  // Set first team as default when teams are loaded and no team is selected
  useEffect(() => {
    if (teams.length > 0 && !selectedTeam) {
      setSelectedTeam(teams[0]?.id ?? "");
    }
  }, [teams, selectedTeam]);

  // Handle subtask submission (used by both button click and keyboard shortcut)
  const handleSubtaskSubmit = useCallback(() => {
    if (!subtaskTitle.trim()) return;

    if (editingSubtaskId) {
      // Update existing subtask
      setSubtasks((prev) =>
        prev.map((s) =>
          s.id === editingSubtaskId
            ? {
                id: s.id,
                title: subtaskTitle,
                description: subtaskDescription,
                status: subtaskStatus,
                priority: subtaskPriority,
                assignee: subtaskAssignee,
                isNew: s.isNew,
                isDeleted: false,
              }
            : s,
        ),
      );
    } else {
      // Add new subtask
      const newSubtask = {
        id: crypto.randomUUID(),
        title: subtaskTitle,
        description: subtaskDescription,
        status: subtaskStatus,
        priority: subtaskPriority,
        assignee: subtaskAssignee,
        isNew: true,
        isDeleted: false,
      };
      setSubtasks((prev) => [...prev, newSubtask]);
    }
    setShowSubtaskForm(false);
    setEditingSubtaskId(null);
    setSubtaskTitle("");
    setSubtaskDescription("");
    setSubtaskStatus("backlog");
    setSubtaskPriority("");
    setSubtaskAssignee("");
  }, [
    subtaskTitle,
    editingSubtaskId,
    subtaskDescription,
    subtaskStatus,
    subtaskPriority,
    subtaskAssignee,
  ]);

  // Handle Ctrl/Cmd+Enter keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if Ctrl (Windows/Linux) or Cmd (Mac) + Enter is pressed
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();

        // If subtask form is open, submit subtask
        if (showSubtaskForm) {
          handleSubtaskSubmit();
        }
        // Otherwise submit main task if valid (check inline)
        else if (
          !showSubtaskForm &&
          title.trim().length > 0 &&
          description.trim().length > 0
        ) {
          handleSubmit();
        }
      }
    };

    if (open) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [open, showSubtaskForm, title, description, handleSubtaskSubmit]);

  // Check if form has unsaved changes (differs from defaults)
  const hasUnsavedChanges = () => {
    return (
      title.trim() !== "" ||
      description.trim() !== "" ||
      selectedPriority !== defaultPriority ||
      selectedProject !== defaultProject ||
      selectedLeader !== defaultLeader ||
      JSON.stringify(selectedAssignees.sort()) !==
        JSON.stringify(defaultAssignees.sort()) ||
      JSON.stringify(selectedLabels.sort()) !==
        JSON.stringify(defaultLabels.sort()) ||
      subtasks.length > 0 ||
      showSubtaskForm ||
      selectedCycle !== defaultCycle ||
      selectedTeam !== defaultTeam
    );
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setSelectedStatus(defaultStatus);
    setSelectedPriority(defaultPriority || "");
    setSelectedProject(defaultProject);
    setSelectedLeader(defaultLeader);
    setSelectedAssignees(defaultAssignees);
    setSelectedLabels(defaultLabels);
    setCustomLabels([]);
    setSelectedCycle(defaultCycle);
    setSelectedTeam(defaultTeam);
    setStartDate(defaultStartDate ?? undefined);
    setEndDate(defaultEndDate ?? undefined);
    setSubtasks([]);
    setShowSubtaskForm(false);
    setEditingSubtaskId(null);
    setSubtaskTitle("");
    setSubtaskDescription("");
    setSubtaskStatus("backlog");
    setSubtaskPriority("");
    setSubtaskAssignee("");
    setCreateMore(false);
  };

  const handleClose = (shouldClose: boolean) => {
    if (shouldClose) {
      if (hasUnsavedChanges()) {
        setShowConfirmClose(true);
        return;
      }
      resetForm();
      onOpenChange?.(false);
    }
  };

  const confirmClose = () => {
    resetForm();
    setShowConfirmClose(false);
    onOpenChange?.(false);
  };

  const cancelClose = () => {
    setShowConfirmClose(false);
  };

  const handleSubmit = async () => {
    if (isEditMode && taskId) {
      // Handle task update
      try {
        // Handle subtask changes
        const newSubtasks = subtasks.filter((st) => st.isNew && !st.isDeleted);
        const updatedSubtasks = subtasks.filter(
          (st) => !st.isNew && !st.isDeleted,
        );
        const deletedSubtasks = subtasks.filter((st) => st.isDeleted);

        // Create new subtasks
        const createdSubtaskIds: string[] = [];
        for (const subtask of newSubtasks) {
          const result = await createSubtaskMutation.mutateAsync({
            title: subtask.title,
            description: subtask.description,
            task_id: taskId,
            priority: subtask.priority,
            status: subtask.status,
            assignee_id: subtask.assignee || undefined,
          });
          if (result?.[0]?.id) {
            createdSubtaskIds.push(result[0].id);
          }
        }

        // Update existing subtasks
        for (const subtask of updatedSubtasks) {
          await updateSubtaskMutation.mutateAsync({
            id: subtask.id,
            title: subtask.title,
            description: subtask.description,
            status: subtask.status as
              | "backlog"
              | "planned"
              | "in_progress"
              | "completed"
              | "cancelled",
            priority: subtask.priority,
            assignee_id: subtask.assignee || undefined,
          });
        }

        // Delete removed subtasks
        for (const subtask of deletedSubtasks) {
          if (!subtask.isNew) {
            await deleteSubtaskMutation.mutateAsync({ id: subtask.id });
          }
        }

        // Get all current subtask IDs (existing + newly created)
        const allSubtaskIds = [
          ...updatedSubtasks.map((st) => st.id),
          ...createdSubtaskIds,
        ];

        // Update the task
        await updateTaskMutation.mutateAsync({
          id: taskId,
          title,
          description,
          status: selectedStatus as
            | "backlog"
            | "planned"
            | "in_progress"
            | "completed"
            | "cancelled",
          priority: selectedPriority,
          tags: selectedLabels,
          start_date: startDate ?? null,
          due_date: endDate ?? null,
          subtasks_ids: allSubtaskIds,
        });

        resetForm();
        onOpenChange?.(false);
      } catch (error) {
        console.error("Error updating task:", error);
      }
    } else {
      // Handle task creation
      try {
        // Create the task first
        const taskResult = await createTaskMutation.mutateAsync({
          title,
          description,
          status: selectedStatus,
          priority: selectedPriority,
          project: selectedProject,
          leader: selectedLeader,
          assignees: selectedAssignees,
          labels: selectedLabels,
          cycle: selectedCycle,
          team: selectedTeam,
          program_id: _programId,
          start_date: startDate ?? null,
          due_date: endDate ?? null,
          subtask_ids: [],
        });

        // Get the created task ID
        const createdTaskId = taskResult?.id;

        // Now create subtasks with the real task ID
        const subtaskIds: string[] = [];
        if (createdTaskId) {
          const subtasksToCreate = subtasks.filter((st) => !st.isDeleted);

          for (const subtask of subtasksToCreate) {
            const result = await createSubtaskMutation.mutateAsync({
              title: subtask.title,
              description: subtask.description,
              task_id: createdTaskId,
              priority: subtask.priority,
              status: subtask.status,
              assignee_id: subtask.assignee || undefined,
            });
            if (result?.[0]?.id) {
              subtaskIds.push(result[0].id);
            }
          }

          // Update the task with subtask IDs if any were created
          if (subtaskIds.length > 0) {
            await updateTaskMutation.mutateAsync({
              id: createdTaskId,
              subtasks_ids: subtaskIds,
            });
          }
        }

        if (!createMore) {
          resetForm();
          onOpenChange?.(false);
        } else {
          // Reset main form and subtasks for next task, but keep defaults
          setTitle("");
          setDescription("");
          setSubtasks([]);
          setShowSubtaskForm(false);
          setEditingSubtaskId(null);
          setSubtaskTitle("");
          setSubtaskDescription("");
          setSubtaskStatus("backlog");
          setSubtaskPriority("");
          setSubtaskAssignee("");
        }
      } catch (error) {
        console.error("Error creating task:", error);
      }
    }
  };

  const toggleLabel = (labelId: string) => {
    setSelectedLabels((prev) =>
      prev.includes(labelId)
        ? prev.filter((id) => id !== labelId)
        : [...prev, labelId],
    );
  };

  const removeLabel = (labelId: string) => {
    setSelectedLabels((prev) => prev.filter((id) => id !== labelId));
  };

  const toggleAssignee = (assigneeId: string) => {
    setSelectedAssignees((prev) => {
      if (prev.includes(assigneeId)) {
        return prev.filter((id) => id !== assigneeId);
      } else {
        return [...prev, assigneeId];
      }
    });
  };

  const removeAssignee = (assigneeId: string) => {
    setSelectedAssignees((prev) => prev.filter((id) => id !== assigneeId));
  };

  const addCustomLabel = () => {
    if (!newLabelInput.trim()) return;

    const newLabel = {
      id: `custom-${Date.now()}`,
      name: newLabelInput.trim(),
      color: `#${Math.floor(Math.random() * 16777215)
        .toString(16)
        .padStart(6, "0")}`,
    };

    setCustomLabels((prev) => [...prev, newLabel]);
    setSelectedLabels((prev) => [...prev, newLabel.id]);
    setNewLabelInput("");
  };

  const handleLabelInputKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addCustomLabel();
    }
  };

  const isValid = title.trim().length > 0 && description.trim().length > 0;

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose} modal>
        {children && <DialogTrigger asChild>{children}</DialogTrigger>}
        <DialogContent
          showCloseButton={false}
          className="animate-in fade-in-0 zoom-in-95 max-w-4xl gap-0 p-0 duration-200 sm:max-w-4xl"
          onEscapeKeyDown={(e) => {
            if (hasUnsavedChanges()) {
              e.preventDefault();
              setShowConfirmClose(true);
            }
          }}
          onPointerDownOutside={(e) => {
            if (hasUnsavedChanges()) {
              e.preventDefault();
              setShowConfirmClose(true);
            }
          }}
        >
          <DialogTitle className="sr-only">
            {isEditMode ? "Edit Task" : "Create New Task"}
          </DialogTitle>
          {/* Header with team/project breadcrumb */}
          <div className="flex items-center gap-2 border-b px-4 py-3">
            <div className="flex items-center gap-2 text-sm">
              <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                <SelectTrigger className="focus: h-auto w-auto cursor-pointer gap-1.5 border-0 p-0 text-xs font-medium shadow-none ring-0 [&>svg]:hidden">
                  <Badge
                    variant="outline"
                    className="text-muted-foreground cursor-pointer gap-1.5 text-xs font-medium"
                  >
                    <span
                      className="size-1.5 rounded-full"
                      style={{
                        backgroundColor:
                          teams.find((t) => t.id === selectedTeam)?.color ??
                          "#EF4444",
                      }}
                    />
                    <SelectValue />
                  </Badge>
                </SelectTrigger>
                <SelectContent align="start">
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-muted-foreground/50">&gt;</span>
              <span className="text-muted-foreground">
                {title.trim() || "New Task"}
              </span>
            </div>
            <div className="ml-auto">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => handleClose(true)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Main content */}
          <div className="flex flex-col gap-4 p-6">
            {/* Title input */}
            <Input
              placeholder="Task title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="placeholder:text-muted-foreground/50 h-auto rounded-none border-0 bg-transparent p-0 text-2xl font-semibold shadow-none focus-visible:ring-0"
              autoFocus
            />

            {/* Description */}
            <Textarea
              placeholder="Add description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="placeholder:text-muted-foreground/50 min-h-30 resize-none rounded-none border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0"
            />

            {/* Properties bar */}
            <div className="flex flex-wrap items-center gap-2 pt-2">
              {/* Status */}
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="text-muted-foreground border-input hover:bg-accent hover:text-foreground h-8 w-auto gap-2 bg-transparent text-xs font-normal">
                  <ListTodo className="h-3.5 w-3.5" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((status) => (
                    <SelectItem key={status.id} value={status.id}>
                      <div className="flex items-center gap-2">
                        <span
                          className="size-2 rounded-full"
                          style={{ backgroundColor: status.color }}
                        />
                        {status.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Priority */}
              <Select
                value={
                  priorities.find((p) => p.id === selectedPriority)
                    ? selectedPriority
                    : undefined
                }
                onValueChange={setSelectedPriority}
              >
                <SelectTrigger className="text-muted-foreground border-input hover: bg-accent hover:text-foreground h-8 w-auto gap-2 bg-transparent text-xs font-normal">
                  <AlertCircle className="h-3.5 w-3.5" />
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  {priorities.map((priority) => (
                    <SelectItem key={priority.id} value={priority.id}>
                      <div className="flex items-center gap-2">
                        <span
                          className="size-2 rounded-full"
                          style={{ backgroundColor: priority.color }}
                        />
                        {priority.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Project */}
              <Select
                value={selectedProject}
                onValueChange={setSelectedProject}
              >
                <SelectTrigger className="text-muted-foreground border-input hover:bg-accent hover:text-foreground h-8 w-auto gap-2 bg-transparent text-xs font-normal">
                  <FolderKanban className="h-3.5 w-3.5" />
                  <SelectValue placeholder="Project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      <div className="flex items-center gap-2">
                        <span
                          className="size-2 rounded-full"
                          style={{ backgroundColor: project.color }}
                        />
                        {project.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Leader */}
              <Select value={selectedLeader} onValueChange={setSelectedLeader}>
                <SelectTrigger className="text-muted-foreground border-input hover: bg-accent hover:text-foreground h-8 w-auto gap-2 bg-transparent text-xs font-normal">
                  <User className="h-3.5 w-3.5" />
                  <SelectValue placeholder="Leader" />
                </SelectTrigger>
                <SelectContent>
                  {members.map((member) => (
                    <SelectItem key={member.userId} value={member.userId}>
                      <div className="flex items-center gap-2">
                        <Avatar className="size-4">
                          <AvatarFallback className="text-[8px]">
                            {member.user.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {member.user.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Assignees (Multi-select) */}
              <Popover open={assigneesOpen} onOpenChange={setAssigneesOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-muted-foreground border-input hover:bg-accent hover:text-foreground h-8 gap-2 bg-transparent px-3 text-xs font-normal"
                  >
                    <Users className="h-3.5 w-3.5" />
                    Assignees
                    {selectedAssignees.length > 0 && (
                      <Badge
                        variant="secondary"
                        className="ml-1 h-4 px-1 text-[10px]"
                      >
                        {selectedAssignees.length}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-0" align="start">
                  <div className="border-border/50 border-b p-2">
                    <div className="text-muted-foreground text-xs font-medium">
                      Select assignees
                    </div>
                  </div>
                  <div className="max-h-48 overflow-y-auto p-2">
                    {members.map((member) => (
                      <div
                        key={member.userId}
                        className="hover:bg-accent flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5"
                        onClick={() => toggleAssignee(member.userId)}
                      >
                        <Checkbox
                          checked={selectedAssignees.includes(member.userId)}
                          onCheckedChange={() => toggleAssignee(member.userId)}
                        />
                        <Avatar className="size-5">
                          <AvatarFallback className="text-[9px]">
                            {member.user.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-foreground text-xs">
                          {member.user.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              {/* Labels */}
              <Popover open={labelsOpen} onOpenChange={setLabelsOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-muted-foreground border-input hover:bg-accent hover:text-foreground h-8 gap-2 bg-transparent px-3 text-xs font-normal"
                  >
                    <Tag className="h-3.5 w-3.5" />
                    Labels
                    {selectedLabels.length > 0 && (
                      <Badge
                        variant="secondary"
                        className="ml-1 h-4 px-1 text-[10px]"
                      >
                        {selectedLabels.length}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-2" align="start">
                  {/* Custom label input */}
                  <div className="mb-2 flex gap-2 border-b pb-2">
                    <Input
                      placeholder="Create custom label..."
                      value={newLabelInput}
                      onChange={(e) => setNewLabelInput(e.target.value)}
                      onKeyDown={handleLabelInputKeyDown}
                      className="h-8 text-xs"
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={addCustomLabel}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-1">
                    {allLabels.map((label) => (
                      <div
                        key={label.id}
                        className="hover:bg-accent flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5"
                        onClick={() => toggleLabel(label.id)}
                      >
                        <Checkbox
                          checked={selectedLabels.includes(label.id)}
                          onCheckedChange={() => toggleLabel(label.id)}
                        />
                        <span
                          className="size-2 rounded-full"
                          style={{ backgroundColor: label.color }}
                        />
                        <span className="text-sm">{label.name}</span>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              {/* Cycle */}
              <Select value={selectedCycle} onValueChange={setSelectedCycle}>
                <SelectTrigger className="text-muted-foreground border-input hover:bg-accent hover:text-foreground h-8 w-auto gap-2 bg-transparent text-xs font-normal">
                  <RefreshCw className="h-3.5 w-3.5" />
                  <SelectValue>
                    {cycles.find((c) => c.id === (selectedCycle || "current"))
                      ?.name || "Current"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent align="end">
                  {cycles.map((cycle) => (
                    <SelectItem key={cycle.id} value={cycle.id}>
                      {cycle.id === "current" ? (
                        <span>{cycle.name}</span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground text-xs">
                            {cycle.start} - {cycle.end}
                          </span>
                          {cycle.name}
                        </div>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Start Date */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-muted-foreground border-input hover:bg-accent hover:text-foreground h-8 w-auto gap-2 bg-transparent px-2 text-xs font-normal"
                  >
                    <CalendarIcon className="h-3.5 w-3.5" />
                    {startDate ? format(startDate, "MMM d") : "Start"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                  {startDate && (
                    <div className="border-t p-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => setStartDate(undefined)}
                      >
                        Clear Date
                      </Button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>

              {/* End Date */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-muted-foreground border-input hover:bg-accent hover:text-foreground h-8 w-auto gap-2 bg-transparent px-2 text-xs font-normal"
                  >
                    <CalendarIcon className="h-3.5 w-3.5" />
                    {endDate ? format(endDate, "MMM d") : "End"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                  />
                  {endDate && (
                    <div className="border-t p-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => setEndDate(undefined)}
                      >
                        Clear Date
                      </Button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>

              {/* Actions Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-muted-foreground border-input hover:bg-accent hover:text-foreground h-8 w-8 bg-transparent p-0"
                  >
                    <MoreVertical className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => setShowSubtaskForm(true)}>
                    <GitBranch className="h-4 w-4" />
                    Create subtask
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Selected assignees display */}
            <AnimatePresence mode="popLayout">
              {selectedAssignees.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-wrap gap-1.5"
                >
                  {selectedAssignees.map((assigneeId) => {
                    const member = members.find((m) => m.userId === assigneeId);
                    if (!member) return null;
                    const initials = member.user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase();
                    return (
                      <motion.div
                        key={member.userId}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.15, delay: 0.05 }}
                      >
                        <Badge
                          variant="secondary"
                          className="bg-secondary/50 border-border/30 gap-1.5 pr-2 pl-1 text-xs"
                        >
                          <Avatar className="size-4">
                            <AvatarFallback className="text-[8px]">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          {member.user.name}
                          <button
                            onClick={() => removeAssignee(member.userId)}
                            className="hover:bg-background/50 ml-1 rounded-full"
                          >
                            <X className="h-2.5 w-2.5" />
                          </button>
                        </Badge>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Selected labels display */}
            <AnimatePresence mode="popLayout">
              {selectedLabels.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-wrap gap-2 pt-2"
                >
                  {selectedLabels.map((labelId, index) => {
                    const label = allLabels.find((l) => l.id === labelId);
                    if (!label) return null;
                    return (
                      <motion.div
                        key={label.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.2, delay: index * 0.03 }}
                      >
                        <Badge variant="outline" className="gap-1.5 pr-1">
                          <span
                            className="size-2 rounded-full"
                            style={{ backgroundColor: label.color }}
                          />
                          {label.name}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0 hover:bg-transparent"
                            onClick={() => removeLabel(label.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Created Subtasks list */}
            <AnimatePresence mode="wait">
              {subtasks.length > 0 && !showSubtaskForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                  className="overflow-hidden border-t pt-4"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-medium">
                      Subtasks {subtasks.length}
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1 text-xs"
                      onClick={() => setShowSubtaskForm(true)}
                    >
                      <Plus className="h-3 w-3" />
                      Add subtask
                    </Button>
                  </div>
                  <div className="max-h-60 space-y-2 overflow-y-auto pr-2">
                    <AnimatePresence mode="popLayout">
                      {subtasks
                        .filter((st) => !st.isDeleted)
                        .map((subtask, index) => (
                          <motion.div
                            key={subtask.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20, height: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                            whileHover={{ scale: 1.01 }}
                            className="bg-muted/50 hover:bg-muted/70 flex cursor-pointer items-center justify-between rounded-md p-3 transition-colors duration-200"
                            onDoubleClick={() => {
                              setEditingSubtaskId(subtask.id);
                              setSubtaskTitle(subtask.title);
                              setSubtaskDescription(subtask.description);
                              setSubtaskStatus(subtask.status);
                              setSubtaskPriority(subtask.priority);
                              setSubtaskAssignee(subtask.assignee);
                              setShowSubtaskForm(true);
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">
                                {subtask.title}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {subtask.assignee &&
                                (() => {
                                  const member = members.find(
                                    (m) => m.userId === subtask.assignee,
                                  );
                                  if (!member) return null;
                                  const initials = member.user.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                    .toUpperCase();
                                  return (
                                    <Avatar className="size-5">
                                      <AvatarFallback className="text-[8px]">
                                        {initials}
                                      </AvatarFallback>
                                    </Avatar>
                                  );
                                })()}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                  >
                                    <MoreVertical className="h-3 w-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setEditingSubtaskId(subtask.id);
                                      setSubtaskTitle(subtask.title);
                                      setSubtaskDescription(
                                        subtask.description,
                                      );
                                      setSubtaskStatus(subtask.status);
                                      setSubtaskPriority(subtask.priority);
                                      setSubtaskAssignee(subtask.assignee);
                                      setShowSubtaskForm(true);
                                    }}
                                  >
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      setSubtasks((prev) =>
                                        prev.map((s) =>
                                          s.id === subtask.id
                                            ? { ...s, isDeleted: true }
                                            : s,
                                        ),
                                      )
                                    }
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </motion.div>
                        ))}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Subtask form */}
            <AnimatePresence mode="wait">
              {showSubtaskForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0, scale: 0.95 }}
                  animate={{ opacity: 1, height: "auto", scale: 1 }}
                  exit={{ opacity: 0, height: 0, scale: 0.95 }}
                  transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                  className="max-h-96 overflow-hidden overflow-y-auto"
                >
                  <motion.div
                    initial={{ y: 20 }}
                    animate={{ y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className="bg-muted/70 border-border m-4 rounded-lg border-2 p-4"
                  >
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3, delay: 0.2 }}
                      className="mb-4 flex items-center justify-between"
                    >
                      <h3 className="text-sm font-medium">
                        {editingSubtaskId ? "Edit subtask" : "Create subtask"}
                      </h3>
                      {/* Subtask properties inline with title */}
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Status */}
                        <Select
                          value={subtaskStatus}
                          onValueChange={setSubtaskStatus}
                        >
                          <SelectTrigger className="text-foreground h-8 w-auto gap-2 text-xs">
                            <ListTodo className="h-3 w-3" />
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent>
                            {statuses.map((status) => (
                              <SelectItem key={status.id} value={status.id}>
                                <div className="flex items-center gap-2">
                                  <span
                                    className="size-2 rounded-full"
                                    style={{ backgroundColor: status.color }}
                                  />
                                  {status.name}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {/* Priority */}
                        <Select
                          value={
                            priorities.find((p) => p.id === subtaskPriority)
                              ? subtaskPriority
                              : undefined
                          }
                          onValueChange={setSubtaskPriority}
                        >
                          <SelectTrigger className="text-foreground h-8 w-auto gap-2 text-xs">
                            <AlertCircle className="h-3 w-3" />
                            <SelectValue placeholder="Priority" />
                          </SelectTrigger>
                          <SelectContent>
                            {priorities.map((priority) => (
                              <SelectItem key={priority.id} value={priority.id}>
                                <div className="flex items-center gap-2">
                                  <span
                                    className="size-2 rounded-full"
                                    style={{ backgroundColor: priority.color }}
                                  />
                                  {priority.name}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {/* Assignee */}
                        <Select
                          value={subtaskAssignee}
                          onValueChange={setSubtaskAssignee}
                        >
                          <SelectTrigger className="text-foreground h-8 w-auto gap-2 text-xs">
                            <User className="h-3 w-3" />
                            <SelectValue placeholder="Assignee" />
                          </SelectTrigger>
                          <SelectContent>
                            {members.map((member) => (
                              <SelectItem
                                key={member.userId}
                                value={member.userId}
                              >
                                <div className="flex items-center gap-2">
                                  <Avatar className="size-4">
                                    <AvatarFallback className="text-[8px]">
                                      {member.user.name
                                        .split(" ")
                                        .map((n) => n[0])
                                        .join("")
                                        .toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  {member.user.name}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.3 }}
                      className="flex flex-col gap-3"
                    >
                      {/* Subtask title */}
                      <Input
                        placeholder="Task title"
                        value={subtaskTitle}
                        onChange={(e) => setSubtaskTitle(e.target.value)}
                        className="placeholder:text-muted-foreground/50 h-auto rounded-none border-0 bg-transparent p-0 text-base font-medium shadow-none focus-visible:ring-0"
                      />

                      {/* Subtask description */}
                      <Textarea
                        placeholder="Add description..."
                        value={subtaskDescription}
                        onChange={(e) => setSubtaskDescription(e.target.value)}
                        className="placeholder:text-muted-foreground/50 min-h-20 resize-none rounded-none border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0"
                      />

                      {/* Subtask actions */}
                      <div className="mt-4 flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => {
                            setShowSubtaskForm(false);
                            setEditingSubtaskId(null);
                            setSubtaskTitle("");
                            setSubtaskDescription("");
                            setSubtaskStatus("backlog");
                            setSubtaskPriority("");
                            setSubtaskAssignee("");
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          className="h-7 text-xs"
                          disabled={!subtaskTitle.trim()}
                          onClick={handleSubtaskSubmit}
                        >
                          {editingSubtaskId ? "Update subtask" : "Add subtask"}
                        </Button>
                      </div>
                    </motion.div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t px-4 py-3">
            <Button variant="ghost" size="sm" className="h-8 gap-2">
              <Paperclip className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-2">
              {/* Create more toggle - only show when creating, not editing */}
              {!isEditMode && (
                <label className="flex cursor-pointer items-center gap-2">
                  <Checkbox
                    checked={createMore}
                    onCheckedChange={(checked) =>
                      setCreateMore(checked === true)
                    }
                  />
                  <span className="text-muted-foreground text-xs">
                    Create more
                  </span>
                </label>
              )}

              <Button
                onClick={handleSubmit}
                disabled={
                  !isValid ||
                  createTaskMutation.isPending ||
                  updateTaskMutation.isPending ||
                  createSubtaskMutation.isPending ||
                  updateSubtaskMutation.isPending ||
                  deleteSubtaskMutation.isPending
                }
              >
                {createTaskMutation.isPending ||
                updateTaskMutation.isPending ||
                createSubtaskMutation.isPending ||
                updateSubtaskMutation.isPending ||
                deleteSubtaskMutation.isPending
                  ? "Saving..."
                  : isEditMode
                    ? "Update Task"
                    : "Create Task"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmClose} onOpenChange={setShowConfirmClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to close this
              dialog? All your changes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelClose}>
              Continue editing
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmClose}>
              Discard changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
