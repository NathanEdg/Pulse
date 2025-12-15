import TeamNotFound from "@/components/dashboard/teams/team-not-found";
import { TeamMemberTable } from "@/components/dashboard/teams/members/team-member-table";
import { api } from "@/trpc/server";
import { PageContainer } from "@/components/util/page-container";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { getActiveProgramId } from "@/server/better-auth/get-active-program";

type PageProps = {
  params: Promise<{ team: string }>;
};

export default async function TeamMembersPage({ params }: PageProps) {
  const { team: teamName } = await params;
  const programId = await getActiveProgramId();

  if (!programId) {
    return (
      <PageContainer
        title="No program selected"
        description="Please select a program"
      >
        <div className="text-muted-foreground text-center">
          No active program found. Please select a program from the sidebar.
        </div>
      </PageContainer>
    );
  }

  const team = await api.teams.getTeam({
    name: teamName,
    program_id: programId,
  });

  if (!team) {
    return (
      <PageContainer title="Team Members" description="Manage team members">
        <TeamNotFound />
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Team Members"
      description="Manage team members"
      actions={
        <Button>
          <Plus /> Add Member
        </Button>
      }
    >
      <TeamMemberTable teamId={team.id} />
    </PageContainer>
  );
}
