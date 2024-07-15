import * as path from "@std/path";
import { Float32, Uint16, Uint32, Uint64 } from "typed_numeric";
import { Buffer } from "@std/io";
import { clamp } from "../util.ts";
import { elevationDeltaMultiplier } from "../const.ts";
import logger from "../logger.ts";
import { Relation, TrailRelationsSchema } from "../schema/trail.ts";

export type TrailRecord = Map<number, Trail>;
export type RelationRecord = Map<number, Relation>;

/** Holds all trail gpx files and trail information */
export class TrailsService {
  trails!: TrailRecord;
  relations!: RelationRecord;
  waysDir: string;
  relationsDir: string;

  constructor(
    waysDir = path.fromFileUrl(import.meta.resolve("../../ways")),
    relationsDir = path.fromFileUrl(import.meta.resolve("../../relations")),
  ) {
    this.waysDir = waysDir;
    this.relationsDir = relationsDir;
  }

  async init() {
    await this.loadTrails();
    await this.loadRelations();
  }

  async loadTrails() {
    const trails: TrailRecord = new Map();

    for await (const entry of Deno.readDir(this.waysDir)) {
      const split = entry.name.split(".");
      const system = split[0];
      const extension = split[1];

      if (entry.isFile && extension.toLowerCase() == "json") {
        const file = path.resolve(this.waysDir, entry.name);
        const osm: OSM = JSON.parse(await Deno.readTextFile(file));

        logger.info(
          `Loaded overpass query: [version: ${osm.version}, generator: ${osm.generator}, osm3s: ${
            JSON.stringify(osm.osm3s)
          }`,
        );

        for (const trailModel of osm.elements) {
          trails.set(trailModel.id, new Trail(system, trailModel));
        }
      }
    }
    this.trails = trails;
  }

  async loadRelations() {
    const relations: RelationRecord = new Map();
    for await (const entry of Deno.readDir(this.relationsDir)) {
      const split = entry.name.split(".");
      const extension = split[1];

      if (entry.isFile && extension.toLowerCase() == "json") {
        const file = path.resolve(this.relationsDir, entry.name);
        const relationList = TrailRelationsSchema.parse(JSON.parse(
          await Deno.readTextFile(file),
        ));
        logger.info(`Loaded ${relationList.length} relations`);
        for (const relation of relationList) {
          relations.set(relation.id, relation);
        }
      }
    }
    this.relations = relations;
  }
}

interface OSM {
  version: number;
  generator: string;
  osm3s: {
    timestamp_osm_base: string;
    timestamp_areas_base: string;
    copyright: string;
  };
  elements: TrailModel[];
}

interface TrailModel {
  id: number;
  type: string;
  tags: TagsModel;
  bounds: BoundsModel;
  nodes: number[];
  geometry: Coordinate[];
}

interface TagsModel {
  [key: string]: string;
}

interface BoundsModel {
  minlat: number;
  minlon: number;
  maxlat: number;
  maxlon: number;
}

interface Coordinate {
  lat: number;
  lon: number;
  elev: number;
}

export class Trail implements TrailModel {
  system: string;
  id!: number;
  type!: string;
  tags!: TagsModel;
  bounds!: BoundsModel;
  nodes!: number[];
  geometry!: Coordinate[];
  // TODO calculate metadata like min and max elevation to bounds, incline and decline, and distance

  constructor(
    system: string,
    trailModel: TrailModel,
  ) {
    this.system = system;
    Object.assign(this, trailModel);
  }

  /*
  To most effectively transmit polyline data over slow connections, a custom encoding is used to minimize size.
  This is currently lossless for lat and long and lossy for elevation, but using some sort of compression would be ideal
  https://developers.google.com/maps/documentation/utilities/polylinealgorithm

  Encoding Format:

  system name byte length (u16, le)
  system name (ascii)

  id (u64, le)

  number of tags (u16, le)
  for each tag:
    tag key byte length (u8)
    tag key (ascii)
    tag value byte length (u8)
    tag value (ascii)

  minlat (float, le)
  minlon (float, le)
  maxlat (float, le)
  maxlon (float, le)

  number of nodes (u16, le)
  for each node:
    node id (u64, le)

  number of coordinates (u16, le)
  for each coordinate:
    point latitude (float, le)
    point longitude (float, le)
    for first point:
      point elevation (float, le)
    for every other point:
      point elevation delta * 8 (i8)
  */
  encode(buf: Buffer = new Buffer()): Buffer {
    const encoder = new TextEncoder();

    // write system name
    const systemBytes = encoder.encode(this.system);
    buf.writeSync(new Uint16(systemBytes.length).toLeBytes().toTypedArray());
    buf.writeSync(systemBytes);

    // write ID
    buf.writeSync(new Uint64(BigInt(this.id)).toLeBytes().toTypedArray());

    // write tags
    buf.writeSync(
      new Uint16(Object.keys(this.tags).length).toLeBytes().toTypedArray(),
    );
    for (const [key, value] of Object.entries(this.tags)) {
      // write key
      const keyBytes = encoder.encode(key);
      buf.writeSync(new Uint16(keyBytes.length).toLeBytes().toTypedArray());
      buf.writeSync(keyBytes);
      // write value
      const valueBytes = encoder.encode(value);
      buf.writeSync(new Uint16(valueBytes.length).toLeBytes().toTypedArray());
      buf.writeSync(valueBytes);
    }

    // write bounds;
    buf.writeSync(new Float32(this.bounds.minlat).toLeBytes().toTypedArray());
    buf.writeSync(new Float32(this.bounds.minlon).toLeBytes().toTypedArray());
    buf.writeSync(new Float32(this.bounds.maxlat).toLeBytes().toTypedArray());
    buf.writeSync(new Float32(this.bounds.maxlon).toLeBytes().toTypedArray());

    // write nodes
    buf.writeSync(new Uint16(this.nodes.length).toLeBytes().toTypedArray());
    for (const node of this.nodes) {
      buf.writeSync(new Uint64(BigInt(node)).toLeBytes().toTypedArray());
    }

    // write geometry data
    buf.writeSync(new Uint16(this.geometry.length).toLeBytes().toTypedArray());

    let elevSum = 0;
    for (const [i, coord] of this.geometry.entries()) {
      buf.writeSync(new Float32(coord.lat).toLeBytes().toTypedArray());
      buf.writeSync(new Float32(coord.lon).toLeBytes().toTypedArray());
      if (i == 0) {
        buf.writeSync(new Float32(coord.elev).toLeBytes().toTypedArray());
      } else {
        // minimize drift by doing all math relative to first height
        const delta = clamp(
          Math.round(
            (coord.elev - this.geometry[0].elev - elevSum) *
              elevationDeltaMultiplier,
          ),
          -128,
          127,
        );
        elevSum += delta / elevationDeltaMultiplier;
        buf.writeSync(new Uint8Array([delta < 0 ? delta + 256 : delta]));
      }
    }

    return buf;
  }
}

export class TrailList {
  trails: Iterable<Trail>;
  constructor(trails: Iterable<Trail>) {
    this.trails = trails;
  }

  /*
  Encodes a list of trails into one buffer
  format:

  for each trail:
    trail byte length (u32, le)
    trail data
  */
  encode(buf: Buffer = new Buffer()): Buffer {
    for (const trail of this.trails) {
      const trailBytes = trail.encode().bytes();
      buf.writeSync(
        new Uint32(BigInt(trailBytes.length)).toLeBytes().toTypedArray(),
      );
      buf.writeSync(trailBytes);
    }
    return buf;
  }
}

const trailsService = new TrailsService();
await trailsService.init();
export default trailsService;
