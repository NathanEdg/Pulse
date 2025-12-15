"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Plus, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import LogoSvg from "@/components/logo/logo-svg";

export default function SelectProgramPage() {
  const router = useRouter();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newProgramName, setNewProgramName] = useState("");
  const [newProgramDescription, setNewProgramDescription] = useState("");

  const utils = api.useUtils();
  const { data: programs = [], isLoading: isLoadingPrograms } =
    api.programs.list.useQuery();

  const switchProgramMutation = api.programs.switchProgram.useMutation({
    onSuccess: async () => {
      toast.success("Program selected successfully");
      // Invalidate queries
      await utils.programs.getCurrent.invalidate();
      await utils.programs.list.invalidate();
      // Use hard redirect to ensure server reads fresh session
      window.location.href = "/";
    },
    onError: (error) => {
      toast.error(`Failed to select program: ${error.message}`);
    },
  });

  const createProgramMutation = api.programs.create.useMutation({
    onSuccess: async (newProgram) => {
      toast.success("Program created successfully");
      setIsCreateDialogOpen(false);
      setNewProgramName("");
      setNewProgramDescription("");
      // Invalidate programs list to refetch with new program
      await utils.programs.list.invalidate();
      await utils.programs.getCurrent.invalidate();
      // Use hard redirect to ensure server reads fresh session
      window.location.href = "/";
    },
    onError: (error) => {
      toast.error(`Failed to create program: ${error.message}`);
    },
  });

  const handleSelectProgram = (programId: string) => {
    switchProgramMutation.mutate({ programId });
  };

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

  if (isLoadingPrograms) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="text-primary mx-auto h-8 w-8 animate-spin" />
          <p className="text-muted-foreground mt-4">Loading programs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center px-4">
          <div className="flex items-center gap-2">
            <LogoSvg className="h-8 w-8" />
            <span className="text-xl font-semibold">Pulse</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="container mx-auto max-w-4xl px-4 py-12">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold tracking-tight">
              Select a Program
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">
              Choose a program to continue or create a new one
            </p>
          </div>

          {programs.length === 0 ? (
            <Card className="mx-auto max-w-md">
              <CardHeader className="text-center">
                <CardTitle>No Programs Found</CardTitle>
                <CardDescription>
                  Get started by creating your first program
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <Button
                  size="lg"
                  onClick={() => setIsCreateDialogOpen(true)}
                  className="gap-2"
                >
                  <Plus className="h-5 w-5" />
                  Create Your First Program
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                {programs.map((program) => (
                  <Card
                    key={program.id}
                    className="transition-shadow hover:shadow-lg"
                  >
                    <CardHeader>
                      <div className="flex items-start gap-4">
                        <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-lg">
                          <LogoSvg className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-xl">
                            {program.name}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            {program.description || "No description"}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Button
                        className="w-full gap-2"
                        onClick={() => handleSelectProgram(program.id)}
                        disabled={switchProgramMutation.isPending}
                      >
                        {switchProgramMutation.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Selecting...
                          </>
                        ) : (
                          <>
                            Select Program
                            <ArrowRight className="h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex justify-center pt-4">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setIsCreateDialogOpen(true)}
                  className="gap-2"
                >
                  <Plus className="h-5 w-5" />
                  Create New Program
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>

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
                <Label htmlFor="name">Program Name *</Label>
                <Input
                  id="name"
                  placeholder="Enter program name"
                  value={newProgramName}
                  onChange={(e) => setNewProgramName(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
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
    </div>
  );
}
