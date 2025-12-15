import TeamNotFound from "@/components/dashboard/teams/team-not-found";
import { api } from "@/trpc/server";

type PageProps = {
  params: Promise<{ team: string }>;
};

export default async function TeamUpdatesPage({ params }: PageProps) {
  const { team: teamName } = await params;
  const team = await api.teams.getTeam({
    name: teamName,
    program_id: "program-seed-1",
  });

  if (!team) {
    return <TeamNotFound />;
  }

  const allTasks = await api.tasks.getTasks({ team_id: team?.id });

  return (
    <div>
      <h1>Team Updates</h1>
      <p>Team Name: {team.name}</p>
      <p>Team Description: {team.description}</p>
      <p>Team Tasks: {allTasks.length}</p>
    </div>
  );
}
