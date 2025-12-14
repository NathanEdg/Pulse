import { eq } from "drizzle-orm";
import z from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { task } from "@/server/db/tasks";

export const taskRouter = createTRPCRouter({
  getTask: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const foundTask = await ctx.db
        .select()
        .from(task)
        .where(eq(task.id, input.id))
        .limit(1);

      return foundTask[0] ?? null;
    }),

  getTasks: protectedProcedure
    .input(z.object({ team_id: z.string() }))
    .query(async ({ input, ctx }) => {
      const foundTasks = await ctx.db
        .select()
        .from(task)
        .where(eq(task.team_id, input.team_id));

      return foundTasks;
    }),
});
