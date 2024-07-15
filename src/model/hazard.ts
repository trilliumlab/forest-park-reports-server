import { hazards, updates } from "../database/schema.ts";
import { Hazard } from "../schema/hazard.ts";

export type HazardRow = typeof hazards.$inferInsert;
export type HazardType = typeof hazards.$inferInsert.hazard;
export function hazardToHazardRow({ location, ...rest }: Hazard): HazardRow {
  return {
    ...rest,
    ...location,
  };
}
export function hazardRowToHazard(
  { trail, node, lat, long, ...rest }: HazardRow,
): Hazard {
  return {
    ...rest,
    location: { trail, node, lat, long },
  };
}

export type HazardUpdateRow = typeof updates.$inferInsert;
