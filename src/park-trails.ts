import root from 'app-root-path';
import path from 'path';
import fs from 'fs-extra';

const trailsDir = path.join(root.path, "trails");

interface TrailInfo {
  name: string,
  uuid: string,
}

type TrailInfoRecord = Record<string, TrailInfo>;
type GpxRecord = Record<string, string>;

/** Holds all trail gpx files and trail information */
export default class ParkTrails {
  trailInfo: TrailInfoRecord;
  trailPaths: GpxRecord;
  async loadTrails() {
    const trailInfo = {};
    const parkTrails = {};
    for (const file of fs.readdirSync(trailsDir)) {
      const filePath = path.join(trailsDir, file);
      const uuid = file.replaceAll("-", "");
      if (fs.statSync(filePath).isDirectory()) {
        trailInfo[uuid] = JSON.parse(await fs.readFile(path.join(filePath, "trail.json"), 'utf-8'))
        parkTrails[uuid] = await fs.readFile(path.join(filePath, "trail.gpx"), 'utf-8');
      }
    }
    this.trailInfo = trailInfo;
    this.trailPaths = parkTrails;
  }
}
