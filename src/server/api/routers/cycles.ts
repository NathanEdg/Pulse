import { eq, and } from "drizzle-orm";
import z from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { cycle } from "@/server/db/cycles";

export const cyclesRouter = createTRPCRouter({
  getCycles: protectedProcedure
    .input(
      z.object({
        program_id: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const cycles = await ctx.db
        .select()
        .from(cycle)
        .where(eq(cycle.program_id, input.program_id));

      return cycles.map((c) => ({
        ...c,
        number: parseInt(c.cycle_number),
      }));
    }),

  getCycle: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const foundCycle = await ctx.db
        .select()
        .from(cycle)
        .where(eq(cycle.id, input.id))
        .limit(1);

      return foundCycle[0] ?? null;
    }),

  createCycle: protectedProcedure
    .input(
      z.object({
        program_id: z.string(),
        cycle_number: z.string(),
        start_date: z.date(),
        end_date: z.date(),
        goal: z.string().min(1),
        status: z.enum(["planned", "active", "completed"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const newCycle = await ctx.db
        .insert(cycle)
        .values({
          id: crypto.randomUUID(),
          program_id: input.program_id,
          cycle_number: input.cycle_number,
          start_date: input.start_date,
          end_date: input.end_date,
          goal: input.goal,
          status: input.status,
        })
        .returning();

      return newCycle[0];
    }),

  updateCycle: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        cycle_number: z.string().optional(),
        start_date: z.date().optional(),
        end_date: z.date().optional(),
        goal: z.string().min(1).optional(),
        status: z.enum(["planned", "active", "completed"]).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      const updatedCycle = await ctx.db
        .update(cycle)
        .set(updateData)
        .where(eq(cycle.id, id))
        .returning();

      return updatedCycle[0];
    }),

  deleteCycle: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const deletedCycle = await ctx.db
        .delete(cycle)
        .where(eq(cycle.id, input.id))
        .returning();

      return deletedCycle[0];
    }),

  getActiveCycle: protectedProcedure
    .input(
      z.object({
        program_id: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const activeCycle = await ctx.db
        .select()
        .from(cycle)
        .where(
          and(
            eq(cycle.program_id, input.program_id),
            eq(cycle.status, "active"),
          ),
        )
        .limit(1);

      return activeCycle[0] ?? null;
    }),
});
