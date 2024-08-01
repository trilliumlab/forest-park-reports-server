DO $$ BEGIN
 CREATE TYPE "public"."hazardType" AS ENUM('tree', 'flood', 'other');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "hazards" (
	"uuid" uuid PRIMARY KEY NOT NULL,
	"time" timestamp with time zone NOT NULL,
	"hazard" "hazardType" NOT NULL,
	"trail" bigint NOT NULL,
	"node" integer NOT NULL,
	"lat" double precision NOT NULL,
	"long" double precision NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "updates" (
	"uuid" uuid PRIMARY KEY NOT NULL,
	"time" timestamp NOT NULL,
	"hazard" uuid NOT NULL,
	"active" boolean NOT NULL,
	"blur_hash" text,
	"image" uuid
);
