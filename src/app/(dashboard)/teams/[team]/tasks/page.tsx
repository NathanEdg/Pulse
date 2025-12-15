import TeamNotFound from "@/components/dashboard/teams/team-not-found";
import { PageContainer } from "@/components/util/page-container";
import { TasksPageClient } from "./tasks-page-client";
import { api } from "@/trpc/server";

type PageProps = {
  params: Promise<{ team: string }>;
};

export default async function TasksPage({ params }: PageProps) {
  const { team: teamName } = await params;

  const team = await api.teams.getTeam({
    name: teamName,
    program_id: "program-seed-1",
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
