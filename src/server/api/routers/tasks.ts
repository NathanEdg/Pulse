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

  getTasksByTeam: protectedProcedure
    .input(z.object({ team_id: z.string() }))
    .query(async ({ input, ctx }) => {
      const foundTasks = await ctx.db.query.task.findMany({
        where: eq(task.team_id, input.team_id),
        with: {
          priority: true,
        },
      });

      return foundTasks;
    }),

  createTask: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        description: z.string(),
        status: z.string(),
        priority: z.string(),
        project: z.string(),
        leader: z.string(),
        assignees: z.array(z.string()),
        labels: z.array(z.string()),
        cycle: z.string(),
        team: z.string(),
        program_id: z.string(),
        start_date: z.date().nullable().optional(),
        due_date: z.date().nullable().optional(),
        // TODO: Add subtasks support later
        // subtasks: z.array(z.object({
        //   title: z.string(),
        //   description: z.string(),
        //   status: z.string(),
        //   priority: z.string(),
        //   assignee: z.string(),
        // })),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const newTask = await ctx.db
        .insert(task)
        .values({
          id: crypto.randomUUID(),
          program_id: input.program_id,
          cycle_id: input.cycle,
          project_id: input.project,
          team_id: input.team,
          title: input.title,
          description: input.description || null,
          lead_id: input.leader || null,
          assignees_ids: input.assignees,
          status: input.status as
            | "backlog"
            | "planned"
            | "in_progress"
            | "completed"
            | "cancelled",
          priority: input.priority,
          tags: input.labels,
          depends_on: [],
          start_date: input.start_date ?? null,
          due_date: input.due_date ?? null,
        })
        .returning();

      // TODO: Create subtasks here when subtask support is added

      return newTask[0];
    }),

  updateTask: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1),
        description: z.string(),
        status: z.string(),
        priority: z.string(),
        project: z.string(),
        leader: z.string(),
        assignees: z.array(z.string()),
        labels: z.array(z.string()),
        cycle: z.string(),
        team: z.string(),
        start_date: z.date().nullable().optional(),
        due_date: z.date().nullable().optional(),
        // TODO: Add subtasks support later
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const updatedTask = await ctx.db
        .update(task)
        .set({
          title: input.title,
          description: input.description || null,
          status: input.status as
            | "backlog"
            | "planned"
            | "in_progress"
            | "completed"
            | "cancelled",
          priority: input.priority,
          project_id: input.project,
          team_id: input.team,
          cycle_id: input.cycle,
          lead_id: input.leader || null,
          assignees_ids: input.assignees,
          tags: input.labels,
          start_date: input.start_date ?? null,
          due_date: input.due_date ?? null,
          updatedAt: new Date(),
        })
        .where(eq(task.id, input.id))
        .returning();

      // TODO: Update subtasks here when subtask support is added

      return updatedTask[0];
    }),

  deleteTask: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const deletedTask = await ctx.db
        .delete(task)
        .where(eq(task.id, input.id))
        .returning();

      return deletedTask[0];
    }),
});
