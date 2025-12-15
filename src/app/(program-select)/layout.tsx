import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Select Program | Pulse",
  description: "Select or create a program to get started",
};

export default function ProgramSelectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
}
