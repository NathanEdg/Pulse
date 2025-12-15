"use client";

import { api } from "@/trpc/react";

/**
 * Hook to get the currently active program ID
 * Returns the active program ID or null if no program is selected
 */
export function useActiveProgram() {
  const { data: activeProgram, isLoading } = api.programs.getCurrent.useQuery();

  return {
    programId: activeProgram?.id ?? null,
    program: activeProgram,
    isLoading,
  };
}
