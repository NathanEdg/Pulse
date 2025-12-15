"use client";

import { useParams, useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { motion } from "motion/react";
import {
  ArrowLeft,
  MoreHorizontal,
  Link2,
  Star,
  Trash2,
  Calendar as CalendarIcon,
  Users,
  User,
  FolderKanban,
  GitBranch,
  AlertCircle,
  Clock,
  Pencil,
  Check,
  X as XIcon,
  ListTodo,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useActiveProgram } from "@/hooks/use-active-program";
import { TASK_STATUSES, DEFAULT_LABELS, DEFAULT_CYCLES } from "@/lib/constants";

export default function TaskPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.task as string;
  const { programId } = useActiveProgram();

  const {
    data: task,
    isLoading,
    refetch,
  } = api.tasks.getTask.useQuery({ id: taskId }, { enabled: !!taskId });

  const { data: priorities = [] } = api.settings.getPriorities.useQuery(
    { program_id: programId ?? "" },
    { enabled: !!programId },
  );

  const { data: members = [] } = api.programs.getMembers.useQuery(
    { programId: programId ?? "" },
    { enabled: !!programId },
  );

  const { data: isStarred = false, refetch: refetchStarred } =
    api.tasks.isTaskStarred.useQuery({ taskId }, { enabled: !!taskId });

  const starTaskMutation = api.tasks.starTask.useMutation({
    onSuccess: () => {
      toast.success("Task starred");
      void refetchStarred();
    },
    onError: (error) => {
      toast.error(`Failed to star task: ${error.message}`);
    },
  });

  const unstarTaskMutation = api.tasks.unstarTask.useMutation({
    onSuccess: () => {
      toast.success("Task unstarred");
      void refetchStarred();
    },
    onError: (error) => {
      toast.error(`Failed to unstar task: ${error.message}`);
    },
  });

  const updateTaskMutation = api.tasks.updateTask.useMutation({
    onSuccess: () => {
      toast.success("Task updated successfully");
      void refetch();
    },
    onError: (error) => {
      toast.error(`Failed to update task: ${error.message}`);
    },
  });

  const deleteTaskMutation = api.tasks.deleteTask.useMutation({
    onSuccess: () => {
      toast.success("Task deleted");
      router.back();
    },
    onError: (error) => {
      toast.error(`Failed to delete task: ${error.message}`);
    },
  });

  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState("");
  const [editingDescription, setEditingDescription] = useState(false);
  const [description, setDescription] = useState("");
  const [assigneesOpen, setAssigneesOpen] = useState(false);
  const [labelsOpen, setLabelsOpen] = useState(false);
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [dueDateOpen, setDueDateOpen] = useState(false);
  const [newLabelInput, setNewLabelInput] = useState("");
  const [customLabels, setCustomLabels] = useState<
    Array<{ id: string; name: string; color: string }>
  >([]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground flex items-center gap-2">
          <div className="border-muted border-t-foreground h-4 w-4 animate-spin rounded-full border-2" />
          <span className="text-sm">Loading task...</span>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-foreground text-2xl font-semibold">
            Task not found
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            The task you&apos;re looking for doesn&apos;t exist or has been
            deleted.
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => router.back()}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go back
          </Button>
        </div>
      </div>
    );
  }

  const handleUpdateField = (field: string, value: unknown) => {
    if (!task) return;

    updateTaskMutation.mutate({
      id: task.id,
      title: field === "title" ? (value as string) : task.title,
      description:
        field === "description" ? (value as string) : (task.description ?? ""),
      status: field === "status" ? (value as string) : task.status,
      priority:
        field === "priority" ? (value as string) : (task.priority?.id ?? ""),
      project: task.project_id ?? "",
      leader: field === "leader" ? (value as string) : (task.lead_id ?? ""),
      assignees:
        field === "assignees"
          ? (value as string[])
          : (task.assignees_ids ?? []),
      labels: field === "labels" ? (value as string[]) : (task.tags ?? []),
      cycle: field === "cycle" ? (value as string) : (task.cycle_id ?? ""),
      team: task.team_id ?? "",
      start_date:
        field === "start_date"
          ? (value as Date)
          : (task.start_date ?? undefined),
      due_date:
        field === "due_date" ? (value as Date) : (task.due_date ?? undefined),
    });
  };

  const handleTitleSave = () => {
    if (title.trim()) {
      handleUpdateField("title", title.trim());
      setEditingTitle(false);
    }
  };

  const handleDescriptionSave = () => {
    handleUpdateField("description", description);
    setEditingDescription(false);
  };

  const handleCopyLink = () => {
    void navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard");
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this task?")) {
      void deleteTaskMutation.mutate({ id: taskId });
    }
  };

  const handleToggleStar = () => {
    if (isStarred) {
      unstarTaskMutation.mutate({ taskId });
    } else {
      starTaskMutation.mutate({ taskId });
    }
  };

  const toggleAssignee = (userId: string) => {
    const currentAssignees = task.assignees_ids ?? [];
    const newAssignees = currentAssignees.includes(userId)
      ? currentAssignees.filter((id) => id !== userId)
      : [...currentAssignees, userId];
    handleUpdateField("assignees", newAssignees);
  };

  const toggleLabel = (labelId: string) => {
    const currentLabels = task.tags ?? [];
    const newLabels = currentLabels.includes(labelId)
      ? currentLabels.filter((id) => id !== labelId)
      : [...currentLabels, labelId];
    handleUpdateField("labels", newLabels);
  };

  const getLabelById = (labelId: string) => {
    const allLabels = [...DEFAULT_LABELS, ...customLabels];
    return allLabels.find((l) => l.id === labelId);
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
    toggleLabel(newLabel.id);
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

  const getMemberById = (userId: string) => {
    return members.find((m) => m.userId === userId);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="bg-background flex h-screen flex-col">
      {/* Header */}
      <div className="border-border/40 bg-background/95 supports-backdrop-filter:bg-background/60 border-b backdrop-blur">
        <div className="flex h-14 items-center gap-4 px-6">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm font-medium">
              {task.project?.name ?? "Project"}
            </span>
            <span className="text-muted-foreground/50">›</span>
            <span className="text-sm font-medium">{task.title}</span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-2"
              onClick={handleToggleStar}
            >
              <Star
                className={`h-4 w-4 ${isStarred ? "fill-yellow-400 text-yellow-400" : ""}`}
              />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-2"
              onClick={handleCopyLink}
            >
              <Link2 className="h-4 w-4" />
              Copy link
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleCopyLink}>
                  <Link2 className="mr-2 h-4 w-4" />
                  Copy task link
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={handleDelete}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete task
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Task content area */}
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-4xl px-6 py-8">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Title */}
              <div>
                {editingTitle ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="text-3xl font-semibold"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleTitleSave();
                        if (e.key === "Escape") setEditingTitle(false);
                      }}
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={handleTitleSave}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={() => setEditingTitle(false)}
                    >
                      <XIcon className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div
                    className="hover:bg-muted/30 group flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 transition-colors"
                    onClick={() => {
                      setTitle(task.title);
                      setEditingTitle(true);
                    }}
                  >
                    <h1 className="text-foreground text-3xl font-semibold tracking-tight">
                      {task.title}
                    </h1>
                    <Pencil className="text-muted-foreground h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                    Description
                  </h2>
                </div>
                {editingDescription ? (
                  <div className="space-y-2">
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="min-h-32 resize-none text-sm"
                      placeholder="Add a description..."
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="h-8"
                        onClick={handleDescriptionSave}
                      >
                        Save
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8"
                        onClick={() => setEditingDescription(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    className="text-muted-foreground hover:border-border hover:bg-muted/30 cursor-pointer rounded-md border border-transparent px-3 py-2 text-sm transition-colors"
                    onClick={() => {
                      setDescription(task.description ?? "");
                      setEditingDescription(true);
                    }}
                  >
                    {task.description ?? "Add a description..."}
                  </div>
                )}
              </div>

              <Separator />

              {/* Activity section */}
              <div className="space-y-4">
                <h2 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  Activity
                </h2>
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        {task.lead ? getInitials(task.lead.name) : "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {task.lead?.name ?? "User"}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          created this task
                        </span>
                        <span className="text-muted-foreground text-xs">
                          {format(new Date(task.createdAt), "MMM d, yyyy")}
                        </span>
                      </div>
                    </div>
                  </div>
                  {task.updatedAt &&
                    task.updatedAt.getTime() !== task.createdAt.getTime() && (
                      <div className="flex gap-3">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">U</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">User</span>
                            <span className="text-muted-foreground text-xs">
                              updated this task
                            </span>
                            <span className="text-muted-foreground text-xs">
                              {format(new Date(task.updatedAt), "MMM d, yyyy")}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Properties sidebar */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="border-border/40 bg-muted/20 w-80 overflow-y-auto border-l"
        >
          <div className="space-y-1 p-6">
            <h2 className="text-muted-foreground mb-4 text-xs font-semibold tracking-wide uppercase">
              Properties
            </h2>

            {/* Status */}
            <div className="group space-y-1.5">
              <label className="text-muted-foreground text-xs font-medium">
                Status
              </label>
              <Select
                value={task.status}
                onValueChange={(value) => handleUpdateField("status", value)}
              >
                <SelectTrigger className="h-9 w-full">
                  <div className="flex items-center gap-2">
                    <ListTodo className="h-3.5 w-3.5" />
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TASK_STATUSES).map(([key, config]) => {
                    return (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: config.color }}
                          />
                          {config.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <Separator className="my-4" />

            {/* Priority */}
            <div className="group space-y-1.5">
              <label className="text-muted-foreground text-xs font-medium">
                Priority
              </label>
              <Select
                value={task.priority?.id ?? undefined}
                onValueChange={(value) => {
                  handleUpdateField("priority", value);
                }}
              >
                <SelectTrigger className="h-9 w-full">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-3.5 w-3.5" />
                    <SelectValue placeholder="Set priority" />
                  </div>
                </SelectTrigger>
                <SelectContent>
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
            </div>

            <Separator className="my-4" />

            {/* Assignees */}
            <div className="group space-y-1.5">
              <label className="text-muted-foreground text-xs font-medium">
                Assignees
              </label>
              <Popover open={assigneesOpen} onOpenChange={setAssigneesOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-9 w-full justify-start gap-2 font-normal"
                  >
                    <Users className="h-3.5 w-3.5" />
                    {task.assignees_ids && task.assignees_ids.length > 0 ? (
                      <span className="text-sm">
                        {task.assignees_ids.length} assigned
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-sm">
                        Assign members
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-2" align="start">
                  <div className="space-y-1">
                    {members.map((member) => (
                      <div
                        key={member.userId}
                        className="hover:bg-muted flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5"
                        onClick={() => toggleAssignee(member.userId)}
                      >
                        <Checkbox
                          checked={task.assignees_ids?.includes(member.userId)}
                          onCheckedChange={() => toggleAssignee(member.userId)}
                        />
                        <Avatar className="h-5 w-5">
                          <AvatarFallback className="text-xs">
                            {getInitials(member.user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{member.user.name}</span>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
              {task.assignees_ids && task.assignees_ids.length > 0 && (
                <div className="mt-2 space-y-1">
                  {task.assignees_ids.map((id: string) => {
                    const member = getMemberById(id);
                    return (
                      <div
                        key={id}
                        className="hover:bg-muted flex items-center gap-2 rounded-md px-2 py-1.5"
                      >
                        <Avatar className="h-5 w-5">
                          <AvatarFallback className="text-xs">
                            {member
                              ? getInitials(member.user.name)
                              : id.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs">
                          {member?.user.name ?? id}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <Separator className="my-4" />

            {/* Lead */}
            <div className="group space-y-1.5">
              <label className="text-muted-foreground text-xs font-medium">
                Lead
              </label>
              <Select
                value={task.lead_id ?? undefined}
                onValueChange={(value) => {
                  handleUpdateField("leader", value);
                }}
              >
                <SelectTrigger className="h-9 w-full">
                  <div className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5" />
                    <SelectValue placeholder="Set lead" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {members.map((member) => (
                    <SelectItem key={member.userId} value={member.userId}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-5 w-5">
                          <AvatarFallback className="text-xs">
                            {getInitials(member.user.name)}
                          </AvatarFallback>
                        </Avatar>
                        {member.user.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator className="my-4" />

            {/* Labels */}
            <div className="group space-y-1.5">
              <label className="text-muted-foreground text-xs font-medium">
                Labels
              </label>
              <Popover open={labelsOpen} onOpenChange={setLabelsOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-9 w-full justify-start gap-2 font-normal"
                  >
                    <XIcon className="h-3.5 w-3.5 rotate-45" />
                    {task.tags && task.tags.length > 0 ? (
                      <span className="text-sm">{task.tags.length} labels</span>
                    ) : (
                      <span className="text-muted-foreground text-sm">
                        Add labels
                      </span>
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
                    {[...DEFAULT_LABELS, ...customLabels].map((label) => (
                      <div
                        key={label.id}
                        className="hover:bg-muted flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5"
                        onClick={() => toggleLabel(label.id)}
                      >
                        <Checkbox
                          checked={task.tags?.includes(label.id)}
                          onCheckedChange={() => toggleLabel(label.id)}
                        />
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: label.color }}
                        />
                        <span className="text-sm">{label.name}</span>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
              {task.tags && task.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {task.tags.map((tagId: string) => {
                    const label = getLabelById(tagId);
                    return (
                      <Badge
                        key={tagId}
                        variant="secondary"
                        className="text-xs font-normal"
                        style={{
                          backgroundColor: label?.color
                            ? `${label.color}20`
                            : undefined,
                          borderColor: label?.color,
                        }}
                      >
                        {label?.name ?? tagId}
                      </Badge>
                    );
                  })}
                </div>
              )}
            </div>

            <Separator className="my-4" />

            {/* Project */}
            <div className="group space-y-1.5">
              <label className="text-muted-foreground text-xs font-medium">
                Project
              </label>
              <div className="border-input flex items-center gap-2 rounded-md border px-3 py-2">
                <FolderKanban className="h-3.5 w-3.5" />
                <span className="text-sm">
                  {task.project?.name ?? task.project_id}
                </span>
              </div>
            </div>

            <Separator className="my-4" />

            {/* Dates */}
            <div className="group space-y-1.5">
              <label className="text-muted-foreground text-xs font-medium">
                Start Date
              </label>
              <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-9 w-full justify-start gap-2 font-normal"
                  >
                    <Clock className="h-3.5 w-3.5" />
                    {task.start_date ? (
                      <span className="text-sm">
                        {format(new Date(task.start_date), "MMM d, yyyy")}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-sm">
                        Set start date
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={
                      task.start_date ? new Date(task.start_date) : undefined
                    }
                    onSelect={(date) => {
                      if (date) {
                        handleUpdateField("start_date", date);
                        setStartDateOpen(false);
                      }
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="group space-y-1.5">
              <label className="text-muted-foreground text-xs font-medium">
                Due Date
              </label>
              <Popover open={dueDateOpen} onOpenChange={setDueDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-9 w-full justify-start gap-2 font-normal"
                  >
                    <CalendarIcon className="h-3.5 w-3.5" />
                    {task.due_date ? (
                      <span className="text-sm">
                        {format(new Date(task.due_date), "MMM d, yyyy")}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-sm">
                        Set due date
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={
                      task.due_date ? new Date(task.due_date) : undefined
                    }
                    onSelect={(date) => {
                      if (date) {
                        handleUpdateField("due_date", date);
                        setDueDateOpen(false);
                      }
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <Separator className="my-4" />

            {/* Cycle */}
            <div className="group space-y-1.5">
              <label className="text-muted-foreground text-xs font-medium">
                Cycle
              </label>
              <Select
                value={task.cycle_id ?? undefined}
                onValueChange={(value) => {
                  handleUpdateField("cycle", value);
                }}
              >
                <SelectTrigger className="h-9 w-full">
                  <div className="flex items-center gap-2">
                    <GitBranch className="h-3.5 w-3.5" />
                    <SelectValue placeholder="Set cycle" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {DEFAULT_CYCLES.map((cycle) => (
                    <SelectItem key={cycle.id} value={cycle.id}>
                      {cycle.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
