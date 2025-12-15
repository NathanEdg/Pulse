"use client";

export default function DashboardPage() {
  return (
    <div className="bg-background flex h-full flex-col">
      <div className="border-border/40 bg-card/30 border-b backdrop-blur-sm">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-foreground mb-1 text-3xl font-bold">
                Project Board
              </h1>
              <p className="text-muted-foreground text-sm">
                Manage and track your team&apos;s progress
              </p>
            </div>
          </div>
        </div>

        <div className="container mx-auto flex-1 overflow-hidden px-6 py-8">
          <h1> tasks </h1>
        </div>
      </div>
    </div>
  );
}
