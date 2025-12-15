import { eq, and } from "drizzle-orm";
import z from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { task, taskUpdate, taskDependency } from "@/server/db/tasks";
import { cycle } from "@/server/db/cycles";
import {
  createUpdateContent,
  UPDATE_TYPES,
} from "@/lib/task-updates/update.factory";

// Helper function to avoid circular dependency with api caller
const registerUpdateHelper = async (
  ctx: any,
  input: {
    task_id: string;
    update_type: (typeof UPDATE_TYPES)[number];
    content: string;
    user_id?: string;
  },
) => {
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
};

const updateTaskHelper = async (
  ctx: any,
  input: {
    id: string;
    title?: string;
    description?: string;
    status?: string;
    priority?: string;
    tags?: string[];
    start_date?: Date;
    due_date?: Date;
    subtasks_ids?: string[];
  },
) => {
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

    await registerUpdateHelper(ctx, {
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

    await registerUpdateHelper(ctx, {
      task_id: input.id,
      content: createUpdateContent("description-change", {}),
      update_type: "description-change",
      user_id: ctx.session.user.id,
    });
  }

  if (input.status !== undefined) {
    updatedFields.status = input.status;

    await registerUpdateHelper(ctx, {
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

    await registerUpdateHelper(ctx, {
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

    await registerUpdateHelper(ctx, {
      task_id: input.id,
      content: createUpdateContent("tag-change", {}),
      update_type: "tag-change",
      user_id: ctx.session.user.id,
    });
  }

  if (input.start_date !== undefined) {
    updatedFields.start_date = input.start_date;

    await registerUpdateHelper(ctx, {
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

    await registerUpdateHelper(ctx, {
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

    await registerUpdateHelper(ctx, {
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
};

export const taskRouter = createTRPCRouter({
  getTasks: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.select().from(task);
  }),

  getCycles: protectedProcedure.query(async ({ ctx }) => {
    const cycles = await ctx.db.select().from(cycle);
    return cycles.map((c) => ({
      ...c,
      number: parseInt(c.cycle_number),
    }));
  }),

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
      return await updateTaskHelper(ctx, input);
    }),

  updateTasks: protectedProcedure
    .input(
      z.array(
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
      ),
    )
    .mutation(async ({ input, ctx }) => {
      const results = [];

      for (const taskInput of input) {
        try {
          const result = await updateTaskHelper(ctx, taskInput);
          if (result[0]) {
            results.push(result[0]);
          }
        } catch (error) {
          // Skip tasks that are not found
          continue;
        }
      }

      return results;
    }),

  addDependency: protectedProcedure
    .input(
      z.object({
        taskId: z.string(),
        dependencyId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // Check if dependency already exists
      const existing = await ctx.db
        .select()
        .from(taskDependency)
        .where(
          and(
            eq(taskDependency.task_id, input.taskId),
            eq(taskDependency.dependency_id, input.dependencyId),
          ),
        )
        .limit(1);

      if (existing.length > 0) return;

      // Add to taskDependency table
      await ctx.db.insert(taskDependency).values({
        task_id: input.taskId,
        dependency_id: input.dependencyId,
      });

      // Update task's depends_on array
      const taskRow = await ctx.db
        .select()
        .from(task)
        .where(eq(task.id, input.taskId))
        .limit(1);

      if (taskRow[0]) {
        const currentDependsOn = taskRow[0].depends_on || [];
        if (!currentDependsOn.includes(input.dependencyId)) {
          await ctx.db
            .update(task)
            .set({
              depends_on: [...currentDependsOn, input.dependencyId],
              updatedAt: new Date(),
            })
            .where(eq(task.id, input.taskId));
        }
      }

      await registerUpdateHelper(ctx, {
        task_id: input.taskId,
        content: createUpdateContent("dependency-add", {
          dependencyId: input.dependencyId,
        }),
        update_type: "dependency-add",
        user_id: ctx.session.user.id,
      });
    }),

  removeDependency: protectedProcedure
    .input(
      z.object({
        taskId: z.string(),
        dependencyId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // Remove from taskDependency table
      await ctx.db
        .delete(taskDependency)
        .where(
          and(
            eq(taskDependency.task_id, input.taskId),
            eq(taskDependency.dependency_id, input.dependencyId),
          ),
        );

      // Update task's depends_on array
      const taskRow = await ctx.db
        .select()
        .from(task)
        .where(eq(task.id, input.taskId))
        .limit(1);

      if (taskRow[0]) {
        const currentDependsOn = taskRow[0].depends_on || [];
        const newDependsOn = currentDependsOn.filter(
          (id) => id !== input.dependencyId,
        );

        if (currentDependsOn.length !== newDependsOn.length) {
          await ctx.db
            .update(task)
            .set({
              depends_on: newDependsOn,
              updatedAt: new Date(),
            })
            .where(eq(task.id, input.taskId));
        }
      }

      await registerUpdateHelper(ctx, {
        task_id: input.taskId,
        content: createUpdateContent("dependency-remove", {
          dependencyId: input.dependencyId,
        }),
        update_type: "dependency-remove",
        user_id: ctx.session.user.id,
      });
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
      return await registerUpdateHelper(ctx, input);
    }),
});
