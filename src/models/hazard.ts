export interface Hazard extends NewHazardRequest {
  uuid: string,
  time: Date,
}

export interface NewHazardRequest {
  hazard: HazardType,
  location: SnappedLocation,
  image?: string,
}
export interface SnappedLocation {
  trail: string,
  index: number,
  lat: number,
  long: number,
}
export enum HazardType {
  tree = "tree",
  flood = "flood",
  other = "other",
}

export const NewHazardRequestSchema = {
  title: 'NewHazardRequest',
  type: 'object',
  required: ['hazard', 'location'],
  properties: {
    hazard: { enum: Object.values(HazardType) },
    location: {
      type: 'object',
      required: ['trail', 'index', 'lat', 'long'],
      properties: {
        trail: { type: 'string' },
        index: { type: 'number' },
        lat: { type: 'number' },
        long: { type: 'number' },
      }
    }
  }
}

export const HazardSchema = {
  ...NewHazardRequestSchema,
  title: "HazardSchema",
  required: [...NewHazardRequestSchema.required, 'uuid', 'time'],
  properties: {
    ...NewHazardRequestSchema.properties,
    uuid: { type: 'string', format: 'uuid' },
    time: { type: 'string', format: 'date-time' },
  }
}

export interface HazardUpdateRequest {
  hazard: string,
  active: boolean,
  image?: string
}

export const HazardUpdateRequestSchema = {
  title: "HazardUpdateRequestSchema",
  type: 'object',
  required: [
    'hazard',
    'active'
  ],
  properties: {
    hazard: { type: 'string', format: 'uuid' },
    active: { type: 'boolean' },
  }
}

export interface HazardUpdate extends HazardUpdateRequest {
  uuid: string,
  time: Date,
}

export const HazardUpdateSchema = {
  ...HazardUpdateRequestSchema,
  title: "HazardUpdateSchema",
  required: [
    ...HazardUpdateRequestSchema.required,
    'uuid',
    'time',
  ],
  properties: {
    ...HazardUpdateRequestSchema.properties,
    uuid: { type: 'string', format: 'uuid' },
    time: { type: 'string', format: 'date-time' },
  }
}
