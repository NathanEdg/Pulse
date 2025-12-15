import { auth } from "./config";
import { headers } from "next/headers";
import { db } from "@/server/db";
import { program } from "@/server/db/programs";
import { eq } from "drizzle-orm";

/**
 * Get the active program for the current user session (server-side)
 * Returns null if no active program is found
 */
export async function getActiveProgram() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  console.log("[getActiveProgram] Session:", {
    userId: session?.user?.id,
    activeOrganizationId: session?.session?.activeOrganizationId,
  });

  if (!session?.session.activeOrganizationId) {
    console.log("[getActiveProgram] No active organization ID in session");
    return null;
  }

  const activeProgram = await db
    .select()
    .from(program)
    .where(eq(program.organizationId, session.session.activeOrganizationId))
    .limit(1);

  console.log("[getActiveProgram] Found program:", activeProgram[0]?.id);

  return activeProgram[0] ?? null;
}

/**
 * Get the active program ID for the current user session (server-side)
 * Returns null if no active program is found
 */
export async function getActiveProgramId() {
  const activeProgram = await getActiveProgram();
  return activeProgram?.id ?? null;
}
