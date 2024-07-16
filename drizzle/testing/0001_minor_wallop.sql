ALTER TABLE "hazards" ADD COLUMN "offline" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "updates" ADD COLUMN "offline" boolean DEFAULT false NOT NULL;