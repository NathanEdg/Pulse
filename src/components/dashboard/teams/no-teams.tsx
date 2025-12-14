import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Button } from "@/components/ui/button";
import { Users, Home } from "lucide-react";
import Link from "next/link";

interface NoTeamsProps {
  onCreateTeamClick: () => void;
}

export default function NoTeams({ onCreateTeamClick }: NoTeamsProps) {
  return (
    <div className="flex min-h-[calc(100vh-200px)] items-center justify-center p-4">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Users className="size-6" />
          </EmptyMedia>
          <EmptyTitle>No Teams</EmptyTitle>
          <EmptyDescription>You don't have any teams yet.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <div className="flex w-full flex-col justify-center gap-3 sm:flex-row">
            <Button asChild>
              <Link href="/">
                <Home className="mr-2 size-4" />
                Go to Dashboard
              </Link>
            </Button>
            <Button onClick={onCreateTeamClick}>
              <Users className="mr-2 size-4" />
              Create Team
            </Button>
          </div>
        </EmptyContent>
      </Empty>
    </div>
  );
}
