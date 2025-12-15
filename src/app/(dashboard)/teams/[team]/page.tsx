import { api } from "@/trpc/server";
import { getActiveProgramId } from "@/server/better-auth/get-active-program";
import { PageContainer } from "@/components/util/page-container";
import TeamNotFound from "@/components/dashboard/teams/team-not-found";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Users, Clock, AlertCircle, ListTodo, ArrowRight } from "lucide-react";
import Link from "next/link";

type PageProps = {
  params: Promise<{ team: string }>;
};

export default async function TeamOverviewPage({ params }: PageProps) {
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
      <PageContainer title="Team Overview" description="Team not found">
        <TeamNotFound />
      </PageContainer>
    );
  }

  // Fetch team data
  const [members, tasks] = await Promise.all([
    api.teams.getTeamMembers({ team_id: team.id }),
    api.tasks.getTasksByTeam({ team_id: team.id }),
  ]);

  // Calculate task statistics using correct status values
  const taskStats = {
    total: tasks.length,
    backlog: tasks.filter((t) => t.status === "backlog").length,
    planned: tasks.filter((t) => t.status === "planned").length,
    inProgress: tasks.filter((t) => t.status === "in_progress").length,
    completed: tasks.filter((t) => t.status === "completed").length,
    cancelled: tasks.filter((t) => t.status === "cancelled").length,
  };

  const activeTasks = taskStats.planned + taskStats.inProgress;
  const completionRate =
    taskStats.total > 0
      ? Math.round((taskStats.completed / taskStats.total) * 100)
      : 0;

  const overdueTasks = tasks.filter(
    (t) =>
      t.due_date &&
      new Date(t.due_date) < new Date() &&
      t.status !== "completed" &&
      t.status !== "cancelled",
  ).length;

  return (
    <PageContainer
      title={team.name}
      description={team.description ?? "Team overview and statistics"}
      actions={
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/teams/${teamName}/members`}>
              <Users className="mr-2 h-4 w-4" />
              Manage Members
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href={`/teams/${teamName}/tasks`}>
              <ListTodo className="mr-2 h-4 w-4" />
              View All Tasks
            </Link>
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Task Statistics */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
              <ListTodo className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{taskStats.total}</div>
              <p className="text-muted-foreground text-xs">
                {taskStats.completed} completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Tasks
              </CardTitle>
              <Clock className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeTasks}</div>
              <p className="text-muted-foreground text-xs">
                {taskStats.inProgress} in progress
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
              <AlertCircle className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overdueTasks}</div>
              <p className="text-muted-foreground text-xs">Past due date</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {/* Completion Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Team Progress</CardTitle>
              <CardDescription>
                Overall completion rate for all tasks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Completion Rate</span>
                <span className="text-2xl font-bold">{completionRate}%</span>
              </div>
              <Progress value={completionRate} className="h-3" />
              <div className="text-muted-foreground flex items-center justify-between text-sm">
                <span>{taskStats.completed} completed</span>
                <span>{taskStats.total - taskStats.completed} remaining</span>
              </div>
            </CardContent>
          </Card>

          {/* Task Status Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Task Status Breakdown</CardTitle>
              <CardDescription>
                Distribution of tasks across different statuses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-gray-500" />
                    <span className="text-sm font-medium">Backlog</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground text-sm font-medium">
                      {taskStats.backlog}
                    </span>
                    <div className="bg-muted h-2 w-32 overflow-hidden rounded-full">
                      <div
                        className="h-full bg-gray-500"
                        style={{
                          width: `${taskStats.total > 0 ? (taskStats.backlog / taskStats.total) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-blue-500" />
                    <span className="text-sm font-medium">Planned</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground text-sm font-medium">
                      {taskStats.planned}
                    </span>
                    <div className="bg-muted h-2 w-32 overflow-hidden rounded-full">
                      <div
                        className="h-full bg-blue-500"
                        style={{
                          width: `${taskStats.total > 0 ? (taskStats.planned / taskStats.total) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-amber-500" />
                    <span className="text-sm font-medium">In Progress</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground text-sm font-medium">
                      {taskStats.inProgress}
                    </span>
                    <div className="bg-muted h-2 w-32 overflow-hidden rounded-full">
                      <div
                        className="h-full bg-amber-500"
                        style={{
                          width: `${taskStats.total > 0 ? (taskStats.inProgress / taskStats.total) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-green-500" />
                    <span className="text-sm font-medium">Completed</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground text-sm font-medium">
                      {taskStats.completed}
                    </span>
                    <div className="bg-muted h-2 w-32 overflow-hidden rounded-full">
                      <div
                        className="h-full bg-green-500"
                        style={{
                          width: `${taskStats.total > 0 ? (taskStats.completed / taskStats.total) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-red-500" />
                    <span className="text-sm font-medium">Cancelled</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground text-sm font-medium">
                      {taskStats.cancelled}
                    </span>
                    <div className="bg-muted h-2 w-32 overflow-hidden rounded-full">
                      <div
                        className="h-full bg-red-500"
                        style={{
                          width: `${taskStats.total > 0 ? (taskStats.cancelled / taskStats.total) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Team Members */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>
                  {members.length} {members.length === 1 ? "member" : "members"}{" "}
                  in this team
                </CardDescription>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href={`/teams/${teamName}/members`}>
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {members.length === 0 ? (
              <div className="text-muted-foreground py-8 text-center">
                No members in this team yet.
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {members.slice(0, 6).map((member) => (
                  <div
                    key={member.id}
                    className="border-border hover:bg-accent/50 flex items-center gap-3 rounded-lg border p-3 transition-colors"
                  >
                    <Avatar>
                      <AvatarImage
                        src={member.image ?? undefined}
                        alt={member.name}
                      />
                      <AvatarFallback>
                        {member.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {member.name}
                      </p>
                      <p className="text-muted-foreground truncate text-xs">
                        {member.email}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {members.length > 6 && (
              <div className="text-muted-foreground mt-4 text-center text-sm">
                And {members.length - 6} more member
                {members.length - 6 !== 1 ? "s" : ""}...
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="hover:bg-accent/50 cursor-pointer transition-colors">
            <Link href={`/teams/${teamName}/tasks`}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="bg-primary/10 text-primary rounded-full p-2">
                    <ListTodo className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-base">View Tasks</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Browse and manage all tasks for this team
                </p>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:bg-accent/50 cursor-pointer transition-colors">
            <Link href={`/teams/${teamName}/members`}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="bg-primary/10 text-primary rounded-full p-2">
                    <Users className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-base">Manage Members</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Add or remove team members and manage roles
                </p>
              </CardContent>
            </Link>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
