ALTER TABLE "team" ALTER COLUMN "lead_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "team" ALTER COLUMN "colead_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "team" ADD COLUMN "color" text;--> statement-breakpoint
ALTER TABLE "team" ADD COLUMN "icon" text;--> statement-breakpoint
ALTER TABLE "team" ADD COLUMN "private" boolean NOT NULL;