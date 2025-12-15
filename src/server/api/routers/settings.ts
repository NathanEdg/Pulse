import { z } from "zod";
import { eq } from "drizzle-orm";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { taskPriority } from "@/server/db/tasks";

export const settingsRouter = createTRPCRouter({
  createPriority: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        color: z.string(),
        sort_order: z.string(),
        description: z.string(),
        program_id: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const newPriority = await ctx.db
        .insert(taskPriority)
        .values({
          id: crypto.randomUUID(),
          name: input.name,
          color: input.color,
          sort_order: input.sort_order,
          description: input.description,
          program_id: input.program_id,
        })
        .returning();

      return newPriority[0];
    }),

  deletePriority: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(taskPriority).where(eq(taskPriority.id, input.id));
    }),

  getPriorities: protectedProcedure
    .input(z.object({ program_id: z.string() }))
    .query(async ({ ctx, input }) => {
      const priorities = await ctx.db
        .select()
        .from(taskPriority)
        .where(eq(taskPriority.program_id, input.program_id))
        .orderBy(taskPriority.sort_order);

      return priorities;
    }),

  editPriority: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string(),
        color: z.string(),
        sort_order: z.string(),
        description: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const updatedPriority = await ctx.db
        .update(taskPriority)
        .set({
          name: input.name,
          color: input.color,
          sort_order: input.sort_order,
          description: input.description,
        })
        .where(eq(taskPriority.id, input.id))
        .returning();

      return updatedPriority[0];
    }),
});
