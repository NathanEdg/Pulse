import { eq } from "drizzle-orm";
import z from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { task, taskUpdate } from "@/server/db/tasks";
import { api } from "@/trpc/server";
import {
  createUpdateContent,
  UPDATE_TYPES,
} from "@/lib/task-updates/update.factory";

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
  updateTask: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().optional(),
        description: z.string().optional(),
        status: z.string().optional(),
        priority: z.string().optional(),
        tags: z.array(z.string()).optional(),
        start_date: z.date().optional(),
        due_date: z.date().optional(),
        subtasks_ids: z.array(z.string()).optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const updatedFields: Partial<typeof task.$inferSelect> = {};
      const prevTaskDb = await ctx.db
        .select()
        .from(task)
        .where(eq(task.id, input.id))
        .limit(1);

      const prevTask = prevTaskDb[0];
      if (!prevTask) throw new Error("Task not found");

      if (input.title !== undefined) {
        updatedFields.title = input.title;

        api.tasks.registerUpdateToTask({
          task_id: input.id,
          content: createUpdateContent("title-change", {
            newTitle: input.title,
            previousTitle: prevTask.title,
          }),
          update_type: "title-change",
          user_id: ctx.session.user.id,
        });
      }

      if (input.description !== undefined) {
        updatedFields.description = input.description;

        api.tasks.registerUpdateToTask({
          task_id: input.id,
          content: createUpdateContent("description-change", {}),
          update_type: "description-change",
          user_id: ctx.session.user.id,
        });
      }

      if (input.status !== undefined) {
        updatedFields.status = input.status;

        api.tasks.registerUpdateToTask({
          task_id: input.id,
          content: createUpdateContent("status-change", {
            newStatus: input.status,
            previousStatus: prevTask.status,
          }),
          update_type: "status-change",
          user_id: ctx.session.user.id,
        });
      }

      if (input.priority !== undefined) {
        updatedFields.priority = input.priority;

        api.tasks.registerUpdateToTask({
          task_id: input.id,
          content: createUpdateContent("priority-change", {
            newPriority: input.priority,
            previousPriority: prevTask.priority,
          }),
          update_type: "priority-change",
          user_id: ctx.session.user.id,
        });
      }

      if (input.tags !== undefined) {
        updatedFields.tags = input.tags;

        api.tasks.registerUpdateToTask({
          task_id: input.id,
          content: createUpdateContent("tag-change", {}),
          update_type: "tag-change",
          user_id: ctx.session.user.id,
        });
      }

      if (input.start_date !== undefined) {
        updatedFields.start_date = input.start_date;

        api.tasks.registerUpdateToTask({
          task_id: input.id,
          content: createUpdateContent("date-change", {
            newStartDate: input.start_date.toISOString(),
            previousStartDate: prevTask.start_date
              ? prevTask.start_date.toISOString()
              : undefined,
          }),
          update_type: "date-change",
          user_id: ctx.session.user.id,
        });
      }

      if (input.due_date !== undefined) {
        updatedFields.due_date = input.due_date;

        api.tasks.registerUpdateToTask({
          task_id: input.id,
          content: createUpdateContent("date-change", {
            newDueDate: input.due_date.toISOString(),
            previousDueDate: prevTask.due_date
              ? prevTask.due_date.toISOString()
              : undefined,
          }),
          update_type: "date-change",
          user_id: ctx.session.user.id,
        });
      }

      if (input.subtasks_ids !== undefined) {
        updatedFields.subtasks_ids = input.subtasks_ids;

        api.tasks.registerUpdateToTask({
          task_id: input.id,
          content: createUpdateContent("subtask-change", {}),
          update_type: "subtask-change",
          user_id: ctx.session.user.id,
        });
      }

      return await ctx.db
        .update(task)
        .set({
          ...updatedFields,
          updatedAt: new Date(),
        })
        .where(eq(task.id, input.id))
        .returning();
    }),
  registerUpdateToTask: protectedProcedure
    .input(
      z.object({
        task_id: z.string(),
        update_type: z.enum(UPDATE_TYPES),
        content: z.string(),
        user_id: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const userId = input.user_id ?? ctx.session.user.id;

      const newUpdate = await ctx.db
        .insert(taskUpdate)
        .values({
          id: crypto.randomUUID(),
          task_id: input.task_id,
          update_type: input.update_type,
          content: input.content,
          user_id: userId,
          createdAt: new Date(),
        })
        .returning();

      return newUpdate[0];
    }),
});
