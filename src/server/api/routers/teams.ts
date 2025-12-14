import { eq, and, count, sql } from "drizzle-orm";
import z from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { team, team_member, user } from "@/server/db/schema";

export const teamRouter = createTRPCRouter({
  getTeam: protectedProcedure
    .input(z.object({ name: z.string(), program_id: z.string() }))
    .query(async ({ ctx, input }) => {
      const foundTeam = await ctx.db
        .select()
        .from(team)
        .where(
          and(
            sql`LOWER(${team.name}) = LOWER(${input.name})`,
            eq(team.program_id, input.program_id),
          ),
        )
        .limit(1);

      return foundTeam[0];
    }),

  createTeam: protectedProcedure
    .input(
      z.object({
        program_id: z.string(),
        name: z.string().min(2).max(100),
        description: z.string().min(2).max(1000).optional(),
        color: z.string().min(2).max(100).optional(),
        icon: z.string().min(2).max(100).optional(),
        lead_id: z.string().optional(),
        colead_id: z.string().optional(),
        private: z.boolean().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existingTeam = await ctx.db
        .select()
        .from(team)
        .where(
          and(eq(team.name, input.name), eq(team.program_id, input.program_id)),
        )
        .limit(1);

      if (existingTeam.length > 0) {
        throw new Error("Team already exists!");
      }

      const newTeam = await ctx.db
        .insert(team)
        .values({
          ...input,
          id: crypto.randomUUID(),
        })
        .returning();

      return newTeam[0];
    }),

  getTeams: protectedProcedure
    .input(z.object({ program_id: z.string() }))
    .query(async ({ ctx, input }) => {
      const teams = await ctx.db
        .select()
        .from(team)
        .where(eq(team.program_id, input.program_id));

      return teams;
    }),

  getTeamMembers: protectedProcedure
    .input(z.object({ team_id: z.string() }))
    .query(async ({ ctx, input }) => {
      const members = await ctx.db
        .select({
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: team_member.role,
          joinedAt: team_member.createdAt,
        })
        .from(team_member)
        .innerJoin(user, eq(team_member.user_id, user.id))
        .where(eq(team_member.team_id, input.team_id));

      return members;
    }),

  checkMembership: protectedProcedure
    .input(z.object({ team_id: z.string(), user_id: z.string() }))
    .query(async ({ ctx, input }) => {
      const membership = await ctx.db
        .select()
        .from(team_member)
        .where(
          and(
            eq(team_member.team_id, input.team_id),
            eq(team_member.user_id, input.user_id),
          ),
        )
        .limit(1);

      return membership.length > 0;
    }),

  getTeamsWithMembership: protectedProcedure
    .input(z.object({ program_id: z.string(), user_id: z.string() }))
    .query(async ({ ctx, input }) => {
      const teams = await ctx.db
        .select()
        .from(team)
        .where(eq(team.program_id, input.program_id));

      const teamsWithMembership = await Promise.all(
        teams.map(async (t) => {
          const membership = await ctx.db
            .select()
            .from(team_member)
            .where(
              and(
                eq(team_member.team_id, t.id),
                eq(team_member.user_id, input.user_id),
              ),
            )
            .limit(1);

          const memberCountResult = await ctx.db
            .select({ count: count() })
            .from(team_member)
            .where(eq(team_member.team_id, t.id));

          return {
            ...t,
            isMember: membership.length > 0,
            memberCount: Number(memberCountResult[0]?.count ?? 0),
          };
        }),
      );

      return teamsWithMembership;
    }),

  joinTeam: protectedProcedure
    .input(z.object({ team_id: z.string(), user_id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existingMember = await ctx.db
        .select()
        .from(team_member)
        .where(
          and(
            eq(team_member.team_id, input.team_id),
            eq(team_member.user_id, input.user_id),
          ),
        )
        .limit(1);

      if (existingMember.length > 0) {
        throw new Error("User is already a member of the team!");
      }

      const newMember = await ctx.db
        .insert(team_member)
        .values({
          id: crypto.randomUUID(),
          team_id: input.team_id,
          user_id: input.user_id,
        })
        .returning();

      return newMember[0];
    }),

  leaveTeam: protectedProcedure
    .input(z.object({ team_id: z.string(), user_id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const deleted = await ctx.db
        .delete(team_member)
        .where(
          and(
            eq(team_member.team_id, input.team_id),
            eq(team_member.user_id, input.user_id),
          ),
        )
        .returning();

      if (deleted.length === 0) {
        throw new Error("User is not a member of the team!");
      }

      return deleted[0];
    }),
});
