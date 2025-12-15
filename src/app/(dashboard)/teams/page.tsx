"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, Plus, ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { PageContainer } from "@/components/util/page-container";
import { useState } from "react";
import { CreateTeamDialog } from "@/components/dashboard/teams/create-team-dialog";
import { toast } from "sonner";
import { api } from "@/trpc/react";
import { Loader } from "@/components/util/loader";
import NoTeams from "@/components/dashboard/teams/no-teams";
import { DynamicIcon, type IconName } from "lucide-react/dynamic";
import { authClient } from "@/server/better-auth/client";
import { Badge } from "@/components/ui/badge";
import { useActiveProgram } from "@/hooks/use-active-program";

export default function TeamsPage() {
  const [createTeamOpen, setCreateTeamOpen] = useState(false);
  const { data: currentUser } = authClient.useSession();
  const { programId } = useActiveProgram();

  const { data: teams, isLoading } = api.teams.getTeamsWithMembership.useQuery(
    {
      user_id: currentUser?.user?.id ?? "",
      program_id: programId ?? "",
    },
    {
      enabled: !!programId && !!currentUser?.user?.id,
    },
  );

  const joinTeamMutation = api.teams.joinTeam.useMutation({
    onSuccess: () => {
      toast.success("Joined team successfully!");
      window.location.reload();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const leaveTeamMutation = api.teams.leaveTeam.useMutation({
    onSuccess: () => {
      toast.success("Left team successfully!");
      window.location.reload();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  if (isLoading || !currentUser?.user?.id || !programId) {
    return (
      <PageContainer
        title="Teams"
        description="Browse and manage your team memberships"
        actions={
          <div>
            <Button onClick={() => setCreateTeamOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Team
            </Button>
          </div>
        }
      >
        <Loader text="Loading teams..." />
      </PageContainer>
    );
  }

  if (!teams || teams.length === 0) {
    return (
      <PageContainer
        title="Teams"
        description="Browse and manage your team memberships"
        actions={
          <div>
            <Button onClick={() => setCreateTeamOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Team
            </Button>
          </div>
        }
      >
        <NoTeams onCreateTeamClick={() => setCreateTeamOpen(true)} />
        <CreateTeamDialog
          open={createTeamOpen}
          onOpenChange={setCreateTeamOpen}
          onSubmit={() => {
            toast.success("Team created successfully!");
            window.location.reload();
          }}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Teams"
      description="Browse and manage your team memberships"
      actions={
        <div>
          <Button onClick={() => setCreateTeamOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Team
          </Button>
        </div>
      }
    >
      <div className="container mx-auto px-6">
        <div className="space-y-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">All Teams</h2>
            <div className="text-muted-foreground text-sm">
              {teams.filter((t) => t.isMember).length} joined
            </div>
          </div>

          <div className="grid auto-rows-fr gap-4 md:grid-cols-2 lg:grid-cols-3">
            {teams.map((team) => (
              <Card
                key={team.id}
                className="flex flex-col transition-shadow hover:shadow-md"
              >
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <Avatar
                      className="h-12 w-12 rounded-lg"
                      style={{ backgroundColor: team.color ?? "#3b82f6" }}
                    >
                      <AvatarFallback
                        className="rounded-lg font-semibold text-white"
                        style={{ backgroundColor: team.color ?? "#3b82f6" }}
                      >
                        <DynamicIcon name={(team.icon as IconName) ?? "user"} />
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <CardTitle className="text-lg">{team.name}</CardTitle>
                        {team.isMember && (
                          <Badge variant="secondary" className="h-5">
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Member
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="line-clamp-2">
                        {team.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="mt-auto flex flex-col gap-4">
                  <div className="text-muted-foreground flex items-center text-sm">
                    <Users className="mr-2 h-4 w-4" />
                    {team.memberCount}{" "}
                    {team.memberCount === 1 ? "member" : "members"}
                  </div>
                  <div className="flex gap-2">
                    {!team.isMember && !team.private && (
                      <Button
                        className="flex-1"
                        onClick={() =>
                          joinTeamMutation.mutate({
                            team_id: team.id,
                            user_id: currentUser?.user?.id ?? "",
                          })
                        }
                        disabled={joinTeamMutation.isPending}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Join Team
                      </Button>
                    )}
                    <Button
                      asChild
                      className="flex-1"
                      variant={
                        !team.isMember && !team.private ? "outline" : "default"
                      }
                    >
                      <Link href={`/teams/${team.name.toLowerCase()}`}>
                        View Team
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <CreateTeamDialog
        open={createTeamOpen}
        onOpenChange={setCreateTeamOpen}
        onSubmit={() => {
          toast.success("Team created successfully!");
        }}
      />
    </PageContainer>
  );
}
