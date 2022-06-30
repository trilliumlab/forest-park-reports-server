import root from 'app-root-path';
import * as fs from 'fs';
import path from 'path';

const trailsDir = path.join(root.path, "trails");

interface Trail {
  info: TrailInfo,
  gpx: string,
}

interface TrailInfo {
  name: string,
  uuid: string,
}

type TrailMap = Record<string, Trail>;

/** Holds all trail gpx files and trail information */
class ParkTrails {
  parkTrails: TrailMap;

  constructor() {
    this.parkTrails = this.loadTrails();
  }

  private loadTrails(): TrailMap {
    const tmpTrails: TrailMap = {};
    for (const file of fs.readdirSync(trailsDir)) {
      const filePath = path.join(trailsDir, file);
      if (fs.statSync(filePath).isDirectory()) {
        const info = JSON.parse(fs.readFileSync(path.join(filePath, "trail.json"), 'utf-8'));
        const gpx = fs.readFileSync(path.join(filePath, "trail.gpx"), 'utf-8');
        tmpTrails[file] = {info, gpx};
      }
    }
    return tmpTrails;
  }

  reload() {
    this.parkTrails = this.loadTrails();
  }
}

export default new ParkTrails();
