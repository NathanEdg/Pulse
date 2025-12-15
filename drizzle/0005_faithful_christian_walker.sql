CREATE TYPE "public"."task_status" AS ENUM('backlog', 'planned', 'in_progress', 'completed', 'cancelled');--> statement-breakpoint
ALTER TABLE "task" ALTER COLUMN "status" SET DATA TYPE task_status USING status::task_status;
