export interface NewHazardRequest {
  hazard: Hazard,
  location: SnappedLocation,
  image?: string
}
export interface SnappedLocation {
  trail: string,
  index: number,
  lat: number,
  long: number,
}
export enum Hazard {
  tree = "tree",
  flood = "flood",
  other = "other",
}

export const NewHazardRequestSchema = {
  title: 'NewHazardRequest',
  type: 'object',
  required: ['hazard', 'location'],
  properties: {
    hazard: { enum: Object.values(Hazard) },
    location: {
      type: 'object',
      required: ['trail', 'index', 'lat', 'long'],
      properties: {
        trail: { type: 'string' },
        index: { type: 'number' },
        lat: { type: 'number' },
        long: { type: 'number' }
      }
    }
  }
}
