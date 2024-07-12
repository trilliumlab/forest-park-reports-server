import { hazards, updates } from '../database/schema.ts';

export interface Hazard extends NewHazardRequest {
  uuid: string;
  time: Date;
}
export type HazardRow = typeof hazards.$inferInsert;
export type HazardType = typeof hazards.$inferInsert.hazard;
export function hazardToHazardRow({location, ...rest}: Hazard): HazardRow {
  return {
    ...rest,
    ...location,
  }
}
export function hazardRowToHazard({trail, node, lat, long, ...rest}: HazardRow): Hazard {
  return {
    ...rest,
    location: { trail, node, lat, long }
  }
}

export interface NewHazardRequest {
  hazard: HazardType;
  location: SnappedLocation;
  blurHash?: string | null;
  image?: string | null;
}
export interface SnappedLocation {
  trail: number;
  node: number;
  lat: number;
  long: number;
}

export interface HazardUpdateRequest {
  hazard: string;
  active: boolean;
  blurHash?: string | null;
  image?: string | null;
}

export interface HazardUpdate extends HazardUpdateRequest {
  uuid: string;
  time: Date;
}
export type HazardUpdateRow = typeof updates.$inferInsert;
