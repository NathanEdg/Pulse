"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ChevronsUpDown, Plus, Loader2 } from "lucide-react";
import * as React from "react";
import { api } from "@/trpc/react";
import LogoSvg from "@/components/logo/logo-svg";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function ProgramSwitcher() {
  const { isMobile } = useSidebar();
  const router = useRouter();
  const [isOpen, setIsOpen] = React.useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);
  const [newProgramName, setNewProgramName] = React.useState("");
  const [newProgramDescription, setNewProgramDescription] = React.useState("");

  const utils = api.useUtils();

  // Fetch current active program
  const { data: activeProgram, isLoading: isLoadingCurrent } =
    api.programs.getCurrent.useQuery(undefined, {
      refetchOnMount: true,
    });

  // Fetch all programs user has access to
  const { data: programs = [], isLoading: isLoadingPrograms } =
    api.programs.list.useQuery();

  // Switch program mutation
  const switchProgramMutation = api.programs.switchProgram.useMutation({
    onSuccess: async () => {
      toast.success("Switched program successfully");
      // Invalidate queries
      await utils.programs.getCurrent.invalidate();
      await utils.programs.list.invalidate();
      // Use hard redirect to ensure server reads fresh session
      window.location.href = "/";
    },
    onError: (error) => {
      toast.error(`Failed to switch program: ${error.message}`);
    },
  });

  // Create program mutation
  const createProgramMutation = api.programs.create.useMutation({
    onSuccess: async () => {
      toast.success("Program created successfully");
      setIsCreateDialogOpen(false);
      setNewProgramName("");
      setNewProgramDescription("");
      // Invalidate queries to refetch with new program
      await utils.programs.list.invalidate();
      await utils.programs.getCurrent.invalidate();
      // Use hard redirect to ensure server reads fresh session
      window.location.href = "/";
    },
    onError: (error) => {
      toast.error(`Failed to create program: ${error.message}`);
    },
  });

  const handleCreateProgram = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProgramName.trim()) {
      toast.error("Program name is required");
      return;
    }
    createProgramMutation.mutate({
      name: newProgramName,
      description: newProgramDescription || undefined,
    });
  };

  const isLoading = isLoadingCurrent || isLoadingPrograms;

  if (isLoading) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" className="animate-pulse">
            <div className="bg-muted flex aspect-square size-8 items-center justify-center rounded-lg" />
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="bg-muted h-4 w-24 rounded" />
              <span className="bg-muted mt-1 h-3 w-16 rounded" />
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  // If no active program, show placeholder
  if (!activeProgram) {
    return (
      <>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg">
                  <div className="bg-background text-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                    <Plus className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      Create Program
                    </span>
                    <span className="text-muted-foreground truncate text-xs">
                      Get started
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="mb-4 w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                align="start"
                side={isMobile ? "bottom" : "right"}
                sideOffset={4}
              >
                <DropdownMenuLabel className="text-muted-foreground text-xs">
                  No program selected
                </DropdownMenuLabel>
                <DropdownMenuItem
                  className="gap-2 p-2"
                  onClick={() => {
                    setIsOpen(false);
                    setIsCreateDialogOpen(true);
                  }}
                >
                  <div className="bg-background flex size-6 items-center justify-center rounded-md border">
                    <Plus className="size-4" />
                  </div>
                  <div className="text-muted-foreground font-medium">
                    Create Program
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* Create Program Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent>
            <form onSubmit={handleCreateProgram}>
              <DialogHeader>
                <DialogTitle>Create New Program</DialogTitle>
                <DialogDescription>
                  Set up a new program to organize your teams and projects
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="program-name">Program Name *</Label>
                  <Input
                    id="program-name"
                    placeholder="Enter program name"
                    value={newProgramName}
                    onChange={(e) => setNewProgramName(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="program-description">Description</Label>
                  <Textarea
                    id="program-description"
                    placeholder="What is this program about?"
                    value={newProgramDescription}
                    onChange={(e) => setNewProgramDescription(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreateDialogOpen(false);
                    setNewProgramName("");
                    setNewProgramDescription("");
                  }}
                  disabled={createProgramMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    !newProgramName.trim() || createProgramMutation.isPending
                  }
                >
                  {createProgramMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Program
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <div className="bg-background text-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <LogoSvg className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {activeProgram.name}
                  </span>
                  <span className="text-muted-foreground truncate text-xs">
                    {activeProgram.active ? "Active" : "Inactive"}
                  </span>
                </div>
                <ChevronsUpDown className="ml-auto" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="mb-4 w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
              align="start"
              side={isMobile ? "bottom" : "right"}
              sideOffset={4}
            >
              <DropdownMenuLabel className="text-muted-foreground text-xs">
                Programs
              </DropdownMenuLabel>
              {programs.map((program, index) => (
                <DropdownMenuItem
                  key={program.id}
                  onClick={() => {
                    if (program.id !== activeProgram.id) {
                      switchProgramMutation.mutate({ programId: program.id });
                    }
                    setIsOpen(false);
                  }}
                  className="gap-2 p-2"
                  disabled={switchProgramMutation.isPending}
                >
                  <div className="flex size-6 items-center justify-center rounded-sm border">
                    <LogoSvg className="size-4 shrink-0" />
                  </div>
                  <div className="flex flex-1 items-center justify-between">
                    <span>{program.name}</span>
                    {program.id === activeProgram.id && (
                      <span className="text-muted-foreground text-xs">
                        Active
                      </span>
                    )}
                  </div>
                  {index < 9 && (
                    <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
                  )}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="gap-2 p-2"
                onClick={() => {
                  setIsOpen(false);
                  setIsCreateDialogOpen(true);
                }}
              >
                <div className="bg-background flex size-6 items-center justify-center rounded-md border">
                  <Plus className="size-4" />
                </div>
                <div className="text-muted-foreground font-medium">
                  Create Program
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      {/* Create Program Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <form onSubmit={handleCreateProgram}>
            <DialogHeader>
              <DialogTitle>Create New Program</DialogTitle>
              <DialogDescription>
                Set up a new program to organize your teams and projects
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="program-name">Program Name *</Label>
                <Input
                  id="program-name"
                  placeholder="Enter program name"
                  value={newProgramName}
                  onChange={(e) => setNewProgramName(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="program-description">Description</Label>
                <Textarea
                  id="program-description"
                  placeholder="What is this program about?"
                  value={newProgramDescription}
                  onChange={(e) => setNewProgramDescription(e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  setNewProgramName("");
                  setNewProgramDescription("");
                }}
                disabled={createProgramMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  !newProgramName.trim() || createProgramMutation.isPending
                }
              >
                {createProgramMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Program
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
