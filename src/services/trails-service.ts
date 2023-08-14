import root from 'app-root-path';
import path from 'path';
import fs from 'fs-extra';
import Service from '../service.js';
import Server from "../server.js";

const waysDir = path.join(root.path, "ways");
const relationsDir = path.join(root.path, "relations");


export type TrailRecord = Record<number, Trail>;
export type RelationRecord = Record<string, >;

/** Holds all trail gpx files and trail information */
export default class TrailsService implements Service {
  trails: TrailRecord;
  async init() {
    await this.loadTrails();
    await this.loadRelations();
  }
  async loadTrails() {
    const trails = {};
    for (const file of await fs.readdir(waysDir)) {
      const filePath = path.join(waysDir, file);
      const split = file.split(".");
      const system = split[0];
      const extension = split[1];
      if (extension == "json" && (await fs.stat(filePath)).isFile()) {
        const osm: OSM = JSON.parse(await fs.readFile(filePath, 'utf-8'));
        Server().logger.info(`Loaded overpass query: [version: ${osm.version}, generator: ${osm.generator}, osm3s: ${JSON.stringify(osm.osm3s)}`);
        for (const trailModel of osm.elements) {
          trails[trailModel.id] = new Trail(system, trailModel);
        }
      }
    }
    this.trails = trails;
  }
  async loadRelations() {

  }
}

interface OSM {
  version: number,
  generator: string,
  osm3s: {
    timestamp_osm_base: string,
    timestamp_areas_base: string,
    copyright: string,
  },
  elements: TrailModel[]
}

interface TrailModel {
  id: number,
  type: string,
  tags: TagsModel,
  bounds: BoundsModel,
  nodes: number[],
  geometry: Coordinate[],
}

interface TagsModel {[key: string]: string}

interface BoundsModel {
  minlat: number,
  minlon: number,
  maxlat: number,
  maxlon: number,
}

interface Coordinate {
  lat: number,
  lon: number,
  elev: number,
}

export class Trail implements TrailModel {
  system: string;
  id: number;
  type: string;
  tags: TagsModel;
  bounds: BoundsModel;
  nodes: number[];
  geometry: Coordinate[];
  // TODO calculate metadata like min and max elevation to bounds, incline and decline, and distance

  constructor(
    system: string,
    trailModel: TrailModel
  ) {
    this.system = system;
    this.id = trailModel.id;
    this.type = trailModel.type;
    this.tags = trailModel.tags;
    this.bounds = trailModel.bounds;
    this.nodes = trailModel.nodes;
    this.geometry = trailModel.geometry;
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
      point elevation delta * 10 (i8)
  */
  encode(): Buffer {
    // length for name
    const systemLength = Buffer.byteLength(this.system, 'ascii');
    let length = 2 + systemLength;

    // length for id
    length += 8;

    // number of tags
    length += 2;
    // length for tags
    for (const [key, value] of Object.entries(this.tags)) {
      // key length
      length += 2 + Buffer.byteLength(key, 'ascii');
      // value length
      length += 2 + Buffer.byteLength(value, 'ascii');
    }

    // length for bounds
    length += 4*4;

    // length for nodes
    length += 2;
    length += this.nodes.length * 8;

    // length for geometry
    length += 2;
    length += (this.geometry.length * (4+4+1)) + 3;

    // create buffer with calculated length
    const buf = new Buffer(length);
    let pos = 0;

    // write system name
    pos = buf.writeUInt16LE(systemLength, pos);
    pos += buf.write(this.system, pos, 'ascii');

    // write ID
    pos = buf.writeBigUInt64LE(BigInt(this.id), pos);

    // write tags
    pos = buf.writeUInt16LE(Object.keys(this.tags).length, pos);
    for (const [key, value] of Object.entries(this.tags)) {
      // write key
      pos = buf.writeUInt16LE(Buffer.byteLength(key, 'ascii'), pos);
      pos += buf.write(key, pos, 'ascii');
      // write value
      pos = buf.writeUInt16LE(Buffer.byteLength(value, 'ascii'), pos);
      pos += buf.write(value, pos, 'ascii');
    }

    // write bounds
    pos = buf.writeFloatLE(this.bounds.minlat, pos);
    pos = buf.writeFloatLE(this.bounds.minlon, pos);
    pos = buf.writeFloatLE(this.bounds.maxlat, pos);
    pos = buf.writeFloatLE(this.bounds.maxlon, pos);

    // write nodes
    pos = buf.writeUInt16LE(this.nodes.length, pos);
    for (const node of this.nodes) {
      pos = buf.writeBigUInt64LE(BigInt(node), pos);
    }

    // write geometry data
    pos = buf.writeUInt16LE(this.geometry.length, pos);

    for (const [i, coord] of this.geometry.entries()) {
      pos = buf.writeFloatLE(coord.lat, pos);
      pos = buf.writeFloatLE(coord.lon, pos);
      if (i == 0)
        pos = buf.writeFloatLE(coord.elev, pos);
      else
        // minimize drift by doing all math with floats
        // as distance from origin before rounding
        pos = buf.writeInt8(
          Math.round(
            (
              (coord.elev - this.geometry[0].elev)
              - (this.geometry[i-1].elev - this.geometry[0].elev)
            ) * 4
          ),
          pos
        );
    }

    return buf;
  }
}

export class TrailList {
  trails: Trail[];
  constructor(trails: Trail[]) {
    this.trails = trails;
  }

  /*
  Encodes a list of trails into one buffer
  format:

  for each trail:
    trail byte length (u32, le)
    trail data
  */
  encode(): Buffer {
    const trailBufs = this.trails.map((t) => t.encode());
    // // calculate length of final buffer
    // const headerLength = 4 * trailBufs.length;
    // const dataLength = trailBufs.map((b) => b.length).reduce((a, c) => a+c);

    let buf = new Buffer(0);
    // let pos = 0;

    for (const trailBuf of trailBufs) {
      const header = new Buffer(4);
      header.writeUInt32LE(trailBuf.length);
      buf = Buffer.concat([buf, header, trailBuf]);
    }

    return buf;
  }
}
