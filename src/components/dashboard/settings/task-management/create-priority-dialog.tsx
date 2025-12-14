"use client";

import { z } from "zod";
import { CreateDialog } from "@/components/util/dialogs/create-dialog";
import { ColorPicker } from "@/components/util/dialogs/custom/color-picker";

const prioritySchema = z.object({
  name: z.string().min(1, "Priority name is required"),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid color format"),
  order: z.number().min(1, "Order must be at least 1"),
  description: z.string().optional(),
});

interface CreatePriorityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (priority: {
    name: string;
    color: string;
    description: string;
    order: number;
  }) => Promise<void> | void;
}

export function CreatePriorityDialog({
  open,
  onOpenChange,
  onSubmit,
}: CreatePriorityDialogProps) {
  const handleSubmit = async (data: z.infer<typeof prioritySchema>) => {
    await onSubmit({
      name: data.name,
      color: data.color,
      description: data.description ?? "",
      order: data.order,
    });
  };

  return (
    <CreateDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Create Priority"
      description="Define a new priority with a label, color, and order."
      schema={prioritySchema}
      onSubmit={handleSubmit}
      defaultValues={{
        color: "#EF4444",
        order: 1,
      }}
      fieldConfigs={{
        name: {
          label: "Name",
          placeholder: "High Priority",
        },
        color: {
          label: "Color",
          component: ColorPicker,
          description: "Choose a color to represent this priority",
        },
        order: {
          label: "Order",
          placeholder: "1",
          description: "Display order in priority lists",
        },
        description: {
          label: "Description",
          placeholder: "When should this priority be used?",
        },
      }}
    />
  );
}
