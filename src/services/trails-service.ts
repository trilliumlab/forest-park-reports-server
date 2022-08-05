import root from 'app-root-path';
import path from 'path';
import fs from 'fs-extra';
import Service from '../service.js';
import Server from "../server.js";
import {XMLParser} from "fast-xml-parser";

const trailsDir = path.join(root.path, "trails");

export interface TrailInfo {
  name: string,
  uuid: string,
}

export type TrailInfoRecord = Record<string, TrailInfo>;
export type GpxRecord = Record<string, Gpx>;

/** Holds all trail gpx files and trail information */
export default class TrailsService implements Service {
  trailInfo: TrailInfoRecord;
  trailPaths: GpxRecord;
  async init() {
    await this.loadTrails();
    await this.loadTrailInfo();
    setInterval(this.loadTrails.bind(this), Server().config.trails.reloadInterval*1000);
    setInterval(this.loadTrailInfo.bind(this), Server().config.trails.reloadInterval*1000);
  }
  async loadTrails() {
    const trailPaths = {};
    for (const file of await fs.readdir(trailsDir)) {
      const filePath = path.join(trailsDir, file);
      const split = file.replaceAll("-", "").split(".");
      const uuid = split[0];
      const extension = split[1];
      if (extension == "gpx" && (await fs.stat(filePath)).isFile()) {
        const gpxStr = await fs.readFile(filePath, 'utf-8');
        trailPaths[uuid] = Gpx.parse(gpxStr);
      }
    }
    this.trailPaths = trailPaths;
  }
  async loadTrailInfo() {
    this.trailInfo = await Server().database.fetchTrailInfo();
  }
}

export class Gpx {
  name: string;
  type: string;
  track: Array<GpxPoint>;
  private static xmlParser = new XMLParser({
    ignoreAttributes: false,
    processEntities: false,
  })
  static parse(gpxData: string): Gpx {
    const gpx = Gpx.xmlParser.parse(gpxData)
    const trk = gpx.gpx.trk;
    const name = trk.name;
    const type = trk.type;
    const track = trk.trkseg.trkpt.map(e => ({
      elevation: e['@_ele'],
      latitude: e['@_lat'],
      longitude: e['@_lon'],
    }));
    return new Gpx(name, type, track);
  }
  constructor(name: string, type: string, track: Array<GpxPoint>) {
    this.name = name;
    this.type = type;
    this.track = track;
  }
}

export class Trail extends Gpx {
  colors: TrailColor;
  constructor(gpx: Gpx, colors: TrailColor) {
    super(gpx.name, gpx.type, gpx.track);
    this.colors = colors;
  }
  /*
    To most effectively transmit polyline data over slow connections, a custom encoding is used to minimize size.
    This is currently lossless for lat and long, but using some sort of compression would be ideal
    https://developers.google.com/maps/documentation/utilities/polylinealgorithm

    Encoding Format:

    trail name byte length (u16, le)
    trail name (ascii)

    trail colors byte length (u16, le)
    for each trail color:
      trail color index (u16, le)
      trail color red (u8)
      trail color green (u8)
      trail color blue (u8)

    track byte length (u16, le)
    for each track point:
      point latitude (float, le)
      point longitude (float, le)
      for first point:
        point elevation (float, le)
      for every other point:
        point elevation delta (i8)
  */
  encode(): Buffer {
    // length for name
    const nameLength = Buffer.byteLength(this.name, 'ascii');
    let length = 2 + nameLength;

    // length for colors
    const colorArr = this.colors.colorArray();
    const colorLength = colorArr.length * (2+1+1+1);
    length += 2 + colorLength;

    // length for track
    const trackLength = this.track.length * (4+4+1);
    length += 2 + trackLength + 3;

    // create buffer with calculated length
    const buf = new Buffer(length);
    let pos = 0;

    // write trail name
    pos = buf.writeUInt16LE(nameLength, pos);
    pos += buf.write(this.name, pos, 'ascii');

    // write trail colors
    pos = buf.writeUInt16LE(colorLength, pos);
    for (const color of colorArr) {
      pos = buf.writeUInt16LE(color.index, pos);
      pos = buf.writeUInt8(color.color.red, pos);
      pos = buf.writeUInt8(color.color.green, pos);
      pos = buf.writeUInt8(color.color.blue, pos);
    }

    // write track data
    pos = buf.writeUInt16LE(trackLength, pos);

    for (const [i, point] of this.track.entries()) {
      pos = buf.writeFloatLE(point.latitude, pos);
      pos = buf.writeFloatLE(point.longitude, pos);
      if (i == 0)
        pos = buf.writeFloatLE(point.elevation, pos);
      else
        // minimize drift by doing all math with floats
        // as distance from origin before rounding
        pos = buf.writeInt8(
          Math.round(
            (point.elevation - this.track[0].elevation)
            - (this.track[i-1].elevation - this.track[0].elevation)
          ),
          pos
        );
    }

    return buf;
  }
}

export class TrailColor {
  baseColor: Color;
  colors: Array<{index: number, color: Color}>;
  constructor(baseColor: Color, colors: Array<{index: number, color: Color}> = []) {
    this.baseColor = baseColor;
    this.colors = colors;
  }
  colorArray(): Array<{index: number, color: Color}> {
    return [{index: 0, color: this.baseColor}, ...this.colors];
  }
}

export class Color {
  red: number;
  green: number;
  blue: number;
  static rgb(red: number, green: number, blue: number): Color {
    return new Color(red, green, blue);
  }
  static hex(color: number|string): Color {
    if (typeof color === 'number') {
      color = color.toString(16);
    }
    if (color.length != 6) {
      throw new Error("Invalid HexCode")
    }
    const red = parseInt(color.substring(0, 2), 16);
    const green = parseInt(color.substring(2, 4), 16);
    const blue = parseInt(color.substring(4), 16);
    return new Color(red, green, blue);
  }
  private constructor(red: number, green: number, blue: number) {
    this.red = red;
    this.green = green;
    this.blue = blue;
  }
}

export interface GpxPoint {
  elevation: number,
  latitude: number,
  longitude: number
}
