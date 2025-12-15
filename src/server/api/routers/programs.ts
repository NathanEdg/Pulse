import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { auth } from "@/server/better-auth";
import { headers } from "next/headers";
import { z } from "zod";

export const programsRouter = createTRPCRouter({
  getMembers: protectedProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(async ({ input }) => {
      const program = await auth.api.getFullOrganization({
        query: {
          organizationId: input.organizationId,
        },
        headers: await headers(),
      });

      if (!program) {
        throw new Error("Program not found");
      }

      return program.members;
    }),
});
