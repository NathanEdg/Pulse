import TeamNotFound from "@/components/dashboard/teams/team-not-found";
import { PageContainer } from "@/components/util/page-container";
import { TasksPageClient } from "./tasks-page-client";
import { api } from "@/trpc/server";
import { getActiveProgramId } from "@/server/better-auth/get-active-program";

type PageProps = {
  params: Promise<{ team: string }>;
};

export default async function TasksPage({ params }: PageProps) {
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
      <PageContainer title="Team not found" description="Not found">
        <TeamNotFound />
      </PageContainer>
    );
  }

  const tasks = await api.tasks.getTasksByTeam({
    team_id: team.id,
  });

  return <TasksPageClient teamName={team.name} tasks={tasks} />;
}
