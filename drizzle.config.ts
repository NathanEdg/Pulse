import { type Config } from "drizzle-kit";

import { env } from "@/env";

export default {
  schema: [
    "./src/server/db/schema.ts",
    "./src/server/db/tasks.ts",
    "./src/server/db/cycles.ts",
    "./src/server/db/programs.ts",
    "./src/server/db/teams.ts",
  ],
  dialect: "postgresql",
  dbCredentials: {
    url: env.DATABASE_URL,
  },
} satisfies Config;
