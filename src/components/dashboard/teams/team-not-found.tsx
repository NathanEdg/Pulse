import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Button } from "@/components/ui/button";
import { Users, ArrowLeft, Home } from "lucide-react";
import Link from "next/link";

export default function TeamNotFound() {
  return (
    <div className="flex min-h-[calc(100vh-200px)] items-center justify-center p-4">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Users className="size-6" />
          </EmptyMedia>
          <EmptyTitle>Team Not Found</EmptyTitle>
          <EmptyDescription>
            The team you're looking for doesn't exist or you don't have access
            to it.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <div className="flex w-full flex-col justify-center gap-3 sm:flex-row">
            <Button variant="outline" asChild>
              <Link href="/teams">
                <ArrowLeft className="mr-2 size-4" />
                Back to Teams
              </Link>
            </Button>
            <Button asChild>
              <Link href="/">
                <Home className="mr-2 size-4" />
                Go to Dashboard
              </Link>
            </Button>
          </div>
        </EmptyContent>
      </Empty>
    </div>
  );
}
