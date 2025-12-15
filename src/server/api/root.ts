import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { settingsRouter } from "./routers/settings";
import { taskRouter } from "./routers/tasks";
import { teamRouter } from "./routers/teams";
import { programsRouter } from "./routers/programs";
import { cyclesRouter } from "./routers/cycles";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  settings: settingsRouter,
  tasks: taskRouter,
  teams: teamRouter,
  programs: programsRouter,
  cycles: cyclesRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
