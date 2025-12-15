ALTER TABLE "team" DROP CONSTRAINT "team_lead_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "team" DROP CONSTRAINT "team_colead_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "task" ALTER COLUMN "lead_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "team" DROP COLUMN "lead_id";--> statement-breakpoint
ALTER TABLE "team" DROP COLUMN "colead_id";