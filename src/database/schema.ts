import {
  bigint,
  integer,
  boolean,
  doublePrecision,
  pgTable,
  pgEnum,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const hazardTypeEnum = pgEnum("hazardType", ["tree", "flood", "other"]);

export const hazards = pgTable("hazards", {
  uuid: uuid("uuid").primaryKey(),
  time: timestamp("time", { withTimezone: true }).notNull(),
  hazard: hazardTypeEnum("hazard").notNull(),
  trail: bigint("trail", { mode: 'number' }).notNull(),
  node: integer("node").notNull(),
  lat: doublePrecision("lat").notNull(),
  long: doublePrecision("long").notNull(),
});

export const updates = pgTable("updates", {
  uuid: uuid("uuid").primaryKey(),
  time: timestamp("time").notNull(),
  hazard: uuid("hazard").notNull(),
  active: boolean("active").notNull(),
  blurHash: text("blur_hash"),
  image: uuid("image"),
});
