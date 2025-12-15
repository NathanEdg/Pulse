"use client";

import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Crown, Users, Loader2 } from "lucide-react";

type TeamMemberTableProps = {
  teamId: string;
};

const getRoleBadgeVariant = (role: string) => {
  switch (role) {
    case "lead":
      return "default" as const;
    case "co-lead":
      return "secondary" as const;
    default:
      return "outline" as const;
  }
};

const getRoleLabel = (role: string) => {
  switch (role) {
    case "lead":
      return "Lead";
    case "co-lead":
      return "Co-Lead";
    default:
      return "Member";
  }
};

export function TeamMemberTable({ teamId }: TeamMemberTableProps) {
  const {
    data: members,
    isLoading,
    refetch,
  } = api.teams.getTeamMembers.useQuery({
    team_id: teamId,
  });

  const { mutate: setLeadMutate } = api.teams.setLead.useMutation({
    onSuccess: () => {
      void refetch();
    },
  });

  const { mutate: setCoLeadMutate } = api.teams.setCoLead.useMutation({
    onSuccess: () => {
      void refetch();
    },
  });

  const { mutate: setMemberMutate } = api.teams.setMember.useMutation({
    onSuccess: () => {
      void refetch();
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Current Members ({isLoading ? "..." : (members?.length ?? 0)})
        </CardTitle>
        <CardDescription>
          View and manage all members of this team
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!members || members.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-muted-foreground text-center"
                  >
                    No members yet. Add your first team member to get started.
                  </TableCell>
                </TableRow>
              ) : (
                members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">
                      {member.name ?? "Unknown"}
                    </TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>
                      <Badge
                        variant={getRoleBadgeVariant(member.role ?? "member")}
                        className="gap-1"
                      >
                        {member.role === "lead" && (
                          <Crown className="h-3 w-3" />
                        )}
                        {getRoleLabel(member.role ?? "member")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(member.joinedAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>View Profile</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() =>
                              setLeadMutate({
                                team_id: teamId,
                                user_id: member.id,
                              })
                            }
                          >
                            Set as Lead
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              setCoLeadMutate({
                                team_id: teamId,
                                user_id: member.id,
                              })
                            }
                          >
                            Set as Co-Lead
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              setMemberMutate({
                                team_id: teamId,
                                user_id: member.id,
                              })
                            }
                          >
                            Set as Member
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">
                            Remove from Team
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
