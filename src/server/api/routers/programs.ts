import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { auth } from "@/server/better-auth";
import { program } from "@/server/db/programs";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { z } from "zod";

export const programsRouter = createTRPCRouter({
  // Create a new program with a corresponding Better Auth organization
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(2).max(100),
        description: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Create the Better Auth organization first
      const organization = await auth.api.createOrganization({
        body: {
          name: input.name,
          slug: input.name.toLowerCase().replace(/\s+/g, "-"),
        },
        headers: await headers(),
      });

      console.log("[createProgram] Created organization:", organization);

      if (!organization) {
        throw new Error("Failed to create organization");
      }

      // Verify user is a member
      const fullOrg = await auth.api.getFullOrganization({
        query: {
          organizationId: organization.id,
        },
        headers: await headers(),
      });

      console.log("[createProgram] Full organization:", {
        id: fullOrg?.id,
        members: fullOrg?.members?.length,
      });

      // Create the program record linked to the organization
      const newProgram = await ctx.db
        .insert(program)
        .values({
          id: crypto.randomUUID(),
          organizationId: organization.id,
          name: input.name,
          description: input.description,
          active: true,
        })
        .returning();

      // Set the newly created organization as active
      try {
        const setActiveResult = await auth.api.setActiveOrganization({
          body: {
            organizationId: organization.id,
          },
          headers: await headers(),
        });

        console.log(
          "[createProgram] Set active organization result:",
          setActiveResult,
        );

        // Verify it was set
        const verifySession = await auth.api.getSession({
          headers: await headers(),
        });

        console.log(
          "[createProgram] Active org in session:",
          verifySession?.session.activeOrganizationId,
        );
      } catch (error) {
        console.error(
          "[createProgram] Error setting active organization:",
          error,
        );
        throw new Error(
          `Failed to set active organization: ${error instanceof Error ? error.message : String(error)}`,
        );
      }

      return newProgram[0];
    }),

  // Get the current active program based on the user's active organization
  getCurrent: protectedProcedure.query(async ({ ctx }) => {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.session.activeOrganizationId) {
      return null;
    }

    const currentProgram = await ctx.db
      .select()
      .from(program)
      .where(eq(program.organizationId, session.session.activeOrganizationId))
      .limit(1);

    return currentProgram[0] ?? null;
  }),

  // List all programs the user has access to
  list: protectedProcedure.query(async ({ ctx }) => {
    // Get all organizations the user is a member of
    const organizations = await auth.api.listOrganizations({
      headers: await headers(),
    });

    if (!organizations || organizations.length === 0) {
      return [];
    }

    // Get programs for these organizations
    const organizationIds = organizations.map((org) => org.id);
    const programs = await ctx.db
      .select()
      .from(program)
      .where(
        eq(
          program.organizationId,
          organizationIds[0] ?? "", // We'll need to use IN clause for multiple
        ),
      );

    // For now, let's fetch all programs and filter
    const allPrograms = await ctx.db.select().from(program);
    const userPrograms = allPrograms.filter((p) =>
      organizationIds.includes(p.organizationId),
    );

    return userPrograms;
  }),

  // Switch the active program
  switchProgram: protectedProcedure
    .input(z.object({ programId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Get the program to find its organization ID
      const selectedProgram = await ctx.db
        .select()
        .from(program)
        .where(eq(program.id, input.programId))
        .limit(1);

      if (!selectedProgram[0]) {
        throw new Error("Program not found");
      }

      console.log(
        "[switchProgram] Setting active organization:",
        selectedProgram[0].organizationId,
      );

      // Set the organization as active
      try {
        const result = await auth.api.setActiveOrganization({
          body: {
            organizationId: selectedProgram[0].organizationId,
          },
          headers: await headers(),
        });

        console.log("[switchProgram] setActiveOrganization result:", result);

        // Verify it was set by checking the session
        const verifySession = await auth.api.getSession({
          headers: await headers(),
        });

        console.log(
          "[switchProgram] Verified activeOrganizationId:",
          verifySession?.session.activeOrganizationId,
        );

        if (!verifySession?.session.activeOrganizationId) {
          throw new Error("Active organization was not set in session");
        }
      } catch (error) {
        console.error(
          "[switchProgram] Error setting active organization:",
          error,
        );
        throw new Error(
          `Failed to switch program: ${error instanceof Error ? error.message : String(error)}`,
        );
      }

      return selectedProgram[0];
    }),

  // Get program members (from the organization)
  getMembers: protectedProcedure
    .input(z.object({ programId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Get the program's organization ID
      const selectedProgram = await ctx.db
        .select()
        .from(program)
        .where(eq(program.id, input.programId))
        .limit(1);

      if (!selectedProgram[0]) {
        throw new Error("Program not found");
      }

      const programData = await auth.api.getFullOrganization({
        query: {
          organizationId: selectedProgram[0].organizationId,
        },
        headers: await headers(),
      });

      if (!programData) {
        throw new Error("Organization not found");
      }

      return programData.members;
    }),
});
