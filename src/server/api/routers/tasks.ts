import { eq, and } from "drizzle-orm";
import z from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { task, taskUpdate, taskDependency, subTask } from "@/server/db/tasks";
import { cycle } from "@/server/db/cycles";
import {
  createUpdateContent,
  UPDATE_TYPES,
} from "@/lib/task-updates/update.factory";

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
    status?: "backlog" | "planned" | "in_progress" | "completed" | "cancelled";
    priority?: string;
    tags?: string[];
    start_date?: Date | null;
    due_date?: Date | null;
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
        newStartDate: input.start_date ? input.start_date.toISOString() : null,
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
        newDueDate: input.due_date ? input.due_date.toISOString() : null,
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
  getTasks: protectedProcedure
    .input(
      z.object({
        program_id: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return await ctx.db
        .select()
        .from(task)
        .where(eq(task.program_id, input.program_id));
    }),

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

  getTask: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const foundTask = await ctx.db.query.task.findFirst({
        where: eq(task.id, input.id),
        with: {
          priority: true,
          project: true,
          cycle: true,
          lead: true,
        },
      });

      return foundTask ?? null;
    }),

  updateTask: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().optional(),
        description: z.string().optional(),
        status: z
          .enum(["backlog", "planned", "in_progress", "completed", "cancelled"])
          .optional(),
        priority: z.string().optional(),
        tags: z.array(z.string()).optional(),
        start_date: z.date().nullable().optional(),
        due_date: z.date().nullable().optional(),
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
          status: z
            .enum([
              "backlog",
              "planned",
              "in_progress",
              "completed",
              "cancelled",
            ])
            .optional(),
          priority: z.string().optional(),
          tags: z.array(z.string()).optional(),
          start_date: z.date().nullable().optional(),
          due_date: z.date().nullable().optional(),
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
        subtask_ids: z.array(z.string()).optional(),
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
          subtasks_ids: input.subtask_ids || [],
        })
        .returning();

      if (!newTask[0]) return null;

      // update the current subtask ids to link to the new task
      for (let subtaskId of input.subtask_ids || []) {
        await ctx.db
          .update(subTask)
          .set({ task_id: newTask[0].id, updatedAt: new Date() })
          .where(eq(subTask.id, subtaskId));
      }

      return newTask[0];
    }),

  createSubtask: protectedProcedure
    .input(
      z.object({
        task_id: z.string(),
        title: z.string().min(1),
        description: z.string().optional(),
        status: z.string(),
        priority: z.string(),
        assignee_id: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const newSubtaskId = crypto.randomUUID();

      return await ctx.db
        .insert(subTask)
        .values({
          id: newSubtaskId,
          task_id: input.task_id,
          title: input.title,
          description: input.description || null,
          status: input.status as
            | "backlog"
            | "planned"
            | "in_progress"
            | "completed"
            | "cancelled",
          priority: input.priority,
          assignee_id: input.assignee_id || null,
        })
        .returning();
    }),

  getSubtasks: protectedProcedure
    .input(
      z.object({
        task_id: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      return await ctx.db
        .select()
        .from(subTask)
        .where(eq(subTask.task_id, input.task_id));
    }),

  deleteTask: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // Delete the task
      await ctx.db.delete(task).where(eq(task.id, input.id));

      // Delete related subtasks and updates
      await ctx.db.delete(subTask).where(eq(subTask.task_id, input.id));

      await ctx.db.delete(taskUpdate).where(eq(taskUpdate.task_id, input.id));
    }),

  updateSubtask: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().optional(),
        description: z.string().optional(),
        status: z
          .enum(["backlog", "planned", "in_progress", "completed", "cancelled"])
          .optional(),
        priority: z.string().optional(),
        assignee_id: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const updatedFields: Partial<typeof subTask.$inferSelect> = {};

      if (input.title !== undefined) {
        updatedFields.title = input.title;
      }

      if (input.description !== undefined) {
        updatedFields.description = input.description;
      }

      if (input.status !== undefined) {
        updatedFields.status = input.status;
      }

      if (input.priority !== undefined) {
        updatedFields.priority = input.priority;
      }

      if (input.assignee_id !== undefined) {
        updatedFields.assignee_id = input.assignee_id;
      }

      return await ctx.db
        .update(subTask)
        .set({
          ...updatedFields,
          updatedAt: new Date(),
        })
        .where(eq(subTask.id, input.id))
        .returning();
    }),

  deleteSubtask: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await ctx.db.delete(subTask).where(eq(subTask.id, input.id));
    }),

  starTask: protectedProcedure
    .input(
      z.object({
        taskId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session?.user.id;
      if (!userId) {
        throw new Error("Not authenticated");
      }

      // Check if already starred
      const existing = await ctx.db.query.taskStar.findFirst({
        where: and(
          eq(taskStar.task_id, input.taskId),
          eq(taskStar.user_id, userId),
        ),
      });

      if (existing) {
        return { success: true, starred: true };
      }

      await ctx.db.insert(taskStar).values({
        task_id: input.taskId,
        user_id: userId,
      });

      return { success: true, starred: true };
    }),

  unstarTask: protectedProcedure
    .input(
      z.object({
        taskId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session?.user.id;
      if (!userId) {
        throw new Error("Not authenticated");
      }

      await ctx.db
        .delete(taskStar)
        .where(
          and(eq(taskStar.task_id, input.taskId), eq(taskStar.user_id, userId)),
        );

      return { success: true, starred: false };
    }),

  isTaskStarred: protectedProcedure
    .input(
      z.object({
        taskId: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const userId = ctx.session?.user.id;
      if (!userId) {
        return false;
      }

      const star = await ctx.db.query.taskStar.findFirst({
        where: and(
          eq(taskStar.task_id, input.taskId),
          eq(taskStar.user_id, userId),
        ),
      });

      return !!star;
    }),

  getStarredTasks: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session?.user.id;
    if (!userId) {
      return [];
    }

    const starredTasks = await ctx.db.query.taskStar.findMany({
      where: eq(taskStar.user_id, userId),
      with: {
        task: {
          with: {
            priority: true,
            project: true,
            cycle: true,
            lead: true,
          },
        },
      },
    });

    return starredTasks.map((star) => star.task);
  }),
});
