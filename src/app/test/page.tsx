"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CreateTaskDialog } from "@/components/dashboard/tasks/create-task-dialog";

export default function TestPage() {
  const [basicDialogOpen, setBasicDialogOpen] = useState(false);
  const [prefilledDialogOpen, setPrefilledDialogOpen] = useState(false);
  const [bugDialogOpen, setBugDialogOpen] = useState(false);
  const [designDialogOpen, setDesignDialogOpen] = useState(false);

  return (
    <div className="container mx-auto max-w-4xl space-y-12 p-8">
      <div>
        <h1 className="mb-2 text-3xl font-bold">Create Task Dialog Tests</h1>
        <p className="text-muted-foreground">
          Test the dialog with different default values and configurations
        </p>
      </div>

      <div className="space-y-6">
        {/* Test 1: Basic Dialog (No Defaults) */}
        <div className="rounded-lg border p-6">
          <h2 className="mb-2 text-xl font-semibold">
            Test 1: Basic Dialog (No Defaults)
          </h2>
          <p className="text-muted-foreground mb-4 text-sm">
            Opens with default settings: OPS team, Backlog status, Current cycle
          </p>
          <Button onClick={() => setBasicDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Basic Task
          </Button>

          <CreateTaskDialog
            open={basicDialogOpen}
            onOpenChange={setBasicDialogOpen}
          />
        </div>

        {/* Test 2: Pre-filled Engineering Task */}
        <div className="rounded-lg border p-6">
          <h2 className="mb-2 text-xl font-semibold">
            Test 2: Pre-filled Engineering Task
          </h2>
          <p className="text-muted-foreground mb-4 text-sm">
            Opens with: Engineering team, High priority, Website Redesign
            project
          </p>
          <Button onClick={() => setPrefilledDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Engineering Task
          </Button>

          <CreateTaskDialog
            open={prefilledDialogOpen}
            onOpenChange={setPrefilledDialogOpen}
            defaultTeam="engineering"
            defaultPriority="2"
            defaultProject="1"
            defaultStatus="in_progress"
          />
        </div>

        {/* Test 3: Bug Report Template */}
        <div className="rounded-lg border p-6">
          <h2 className="mb-2 text-xl font-semibold">
            Test 3: Bug Report Template
          </h2>
          <p className="text-muted-foreground mb-4 text-sm">
            Opens with: OPS team, Urgent priority, Bug label pre-selected
          </p>
          <Button onClick={() => setBugDialogOpen(true)} variant="destructive">
            <Plus className="mr-2 h-4 w-4" />
            Report Bug
          </Button>

          <CreateTaskDialog
            open={bugDialogOpen}
            onOpenChange={setBugDialogOpen}
            defaultTeam="ops"
            defaultPriority="1"
            defaultStatus="backlog"
            defaultLabels={["1"]}
          />
        </div>

        {/* Test 4: Design Task with Multiple Defaults */}
        <div className="rounded-lg border p-6">
          <h2 className="mb-2 text-xl font-semibold">
            Test 4: Design Task Template
          </h2>
          <p className="text-muted-foreground mb-4 text-sm">
            Opens with: Design team, Medium priority, Marketing project, Jane
            assigned, Feature & Documentation labels
          </p>
          <Button onClick={() => setDesignDialogOpen(true)} variant="secondary">
            <Plus className="mr-2 h-4 w-4" />
            Create Design Task
          </Button>

          <CreateTaskDialog
            open={designDialogOpen}
            onOpenChange={setDesignDialogOpen}
            defaultTeam="design"
            defaultPriority="3"
            defaultProject="3"
            defaultAssignee="user2"
            defaultStatus="planned"
            defaultCycle="2"
            defaultLabels={["2", "3"]}
          />
        </div>
      </div>

      <div className="bg-muted/50 rounded-lg border p-6">
        <h3 className="mb-2 font-semibold">Testing Instructions:</h3>
        <ul className="text-muted-foreground space-y-2 text-sm">
          <li>
            ✅ <strong>Default Values:</strong> Verify each dialog opens with
            the correct pre-filled values
          </li>
          <li>
            ✅ <strong>Create More Mode:</strong> Enable &quot;Create more&quot;
            checkbox and submit - defaults should persist
          </li>
          <li>
            ✅ <strong>Reset Behavior:</strong> Close dialog without submitting
            - should reset to defaults on next open
          </li>
          <li>
            ✅ <strong>Unsaved Changes:</strong> Enter data and try to close -
            should show confirmation
          </li>
          <li>
            ✅ <strong>Labels:</strong> Pre-selected labels should appear in the
            selected labels section
          </li>
        </ul>
      </div>

      <div className="rounded-lg border bg-blue-50 p-6 dark:bg-blue-950">
        <h3 className="mb-2 font-semibold text-blue-900 dark:text-blue-100">
          Default Value Props:
        </h3>
        <div className="text-muted-foreground space-y-1 font-mono text-xs">
          <div>
            defaultTeam?: string (e.g., &quot;ops&quot;,
            &quot;engineering&quot;)
          </div>
          <div>
            defaultStatus?: string (e.g., &quot;backlog&quot;,
            &quot;in_progress&quot;)
          </div>
          <div>
            defaultPriority?: string (e.g., &quot;1&quot;, &quot;2&quot;,
            &quot;3&quot;, &quot;4&quot;)
          </div>
          <div>
            defaultProject?: string (e.g., &quot;1&quot;, &quot;2&quot;,
            &quot;3&quot;)
          </div>
          <div>
            defaultAssignee?: string (e.g., &quot;user1&quot;,
            &quot;user2&quot;)
          </div>
          <div>
            defaultCycle?: string (e.g., &quot;current&quot;, &quot;1&quot;,
            &quot;2&quot;)
          </div>
          <div>
            defaultLabels?: string[] (e.g., [&quot;1&quot;, &quot;2&quot;])
          </div>
        </div>
      </div>
    </div>
  );
}
