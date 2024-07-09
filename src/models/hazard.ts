export interface Hazard extends NewHazardRequest {
  uuid: string,
  time: Date,
}

export interface NewHazardRequest {
  hazard: HazardType,
  location: SnappedLocation,
  blurHash?: string,
  image?: string,
}
export interface SnappedLocation {
  trail: number,
  node: number,
  lat: number,
  long: number,
}
export enum HazardType {
  tree = "tree",
  flood = "flood",
  other = "other",
}

export interface HazardUpdateRequest {
  hazard: string,
  active: boolean,
  blurHash?: string,
  image?: string
}

export interface HazardUpdate extends HazardUpdateRequest {
  uuid: string,
  time: Date,
}
