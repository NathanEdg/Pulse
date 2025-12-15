import { CreateDialog } from "@/components/util/dialogs/create-dialog";
import { CheckboxType } from "@/components/util/dialogs/custom/checkbox-type";
import { ColorPicker } from "@/components/util/dialogs/custom/color-picker";
import { IconPickerType } from "@/components/util/dialogs/custom/icon-picker-type";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { z } from "zod";
import { useActiveProgram } from "@/hooks/use-active-program";

const teamSchema = z.object({
  name: z.string().min(1, "Team name is required"),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid color format"),
  icon: z.string(),
  isPrivate: z.boolean(),
});

interface CreateTeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: z.infer<typeof teamSchema>) => void;
}

export function CreateTeamDialog({
  open,
  onOpenChange,
  onSubmit,
}: CreateTeamDialogProps) {
  const { programId } = useActiveProgram();

  const { mutate: createTeamMutate } = api.teams.createTeam.useMutation({
    onSuccess: () => {
      toast.success("Team created successfully!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create team");
    },
  });

  function handleCreateTeam(values: z.infer<typeof teamSchema>) {
    if (!programId) {
      toast.error("No active program selected");
      return;
    }

    createTeamMutate(
      {
        name: values.name,
        description: values.description,
        color: values.color,
        icon: values.icon,
        private: values.isPrivate,
        program_id: programId,
      },
      {
        onSuccess: () => {
          onSubmit(values);
        },
      },
    );
  }

  return (
    <CreateDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Create a Team"
      description="Create a new team to organize your work"
      schema={teamSchema}
      onSubmit={handleCreateTeam}
      defaultValues={{
        color: "#3b82f6",
        isPrivate: false,
      }}
      fieldConfigs={{
        name: {
          label: "Team Name",
          placeholder: "Enter team name",
          description: "This will be visible to all members",
        },
        description: {
          label: "Description",
          placeholder: "What is this team about?",
        },
        color: {
          label: "Team Color",
          component: ColorPicker,
          description: "Choose a color to represent your team",
        },
        icon: {
          label: "Team Icon",
          component: IconPickerType,
          description: "This will be visible to all members",
        },
        isPrivate: {
          label: "Private Team",
          component: CheckboxType,
          description: "Restrict access to invite only",
        },
      }}
    ></CreateDialog>
  );
}
