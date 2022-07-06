import root from 'app-root-path';
import path from 'path';
import fs from 'fs-extra';
import Service from '../service.js';
import Server from "../server.js";

const trailsDir = path.join(root.path, "trails");

export interface TrailInfo {
  name: string,
  uuid: string,
}

export type TrailInfoRecord = Record<string, TrailInfo>;
export type GpxRecord = Record<string, string>;

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
      const uuid = file.replaceAll("-", "");
      if (fs.statSync(filePath).isDirectory()) {
        trailPaths[uuid] = await fs.readFile(path.join(filePath, "trail.gpx"), 'utf-8');
      }
    }
    this.trailPaths = trailPaths;
  }
  async loadTrailInfo() {
    Server().logger.info("Reloading trail info");
    this.trailInfo = await Server().database.fetchTrailInfo();
  }
}
