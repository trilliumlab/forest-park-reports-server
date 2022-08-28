import pg from "pg";
import { Hazard } from "../models/hazard.js";
import Server from "../server.js";
import Service from "../service.js";
import { TrailInfoRecord } from "./trails-service.js";

export default class DbService implements Service {
  pool: pg.Pool;
  async init() {
    // we create the pool in init because the config has been initialized by here
    this.pool = new pg.Pool({
      max: Server().config.database.maxConnections,
      connectionString: Server().config.database.url
    });
    // now we need to verify the db has the proper tables
    await this.setupDatabase();
  }
  private async setupDatabase() {
    const client = await this.pool.connect();
    // create trail info table
    const trailInfoQuery = `CREATE TABLE IF NOT EXISTS public.trail_info (
      uuid uuid NOT NULL,
      name text NOT NULL,
      PRIMARY KEY (uuid)
    );`;
    await client.query(trailInfoQuery);
    // create hazards table
    const hazardsQuery = `CREATE TABLE IF NOT EXISTS public.hazards (
        uuid uuid NOT NULL,
        "time" timestamp with time zone NOT NULL,
        active boolean NOT NULL,
        hazard text NOT NULL,
        trail uuid NOT NULL,
        index integer NOT NULL,
        lat double precision NOT NULL,
        "long" double precision NOT NULL,
        image uuid,
        PRIMARY KEY (uuid)
    );`;
    await client.query(hazardsQuery);
    // remember to always release client when done to free up pool
    client.release();
  }
  async fetchTrailInfo(): Promise<TrailInfoRecord> {
    const client = await this.pool.connect();
    const query = {
      name: "fetch-trail-info",
      text: `SELECT * FROM public.trail_info`
    };
    const res = await client.query(query);
    const trailInfo = {};
    for (const row of res.rows) {
      trailInfo[row.uuid] = {
        name: row.name,
        uuid: row.uuid
      };
    }
    client.release();
    return trailInfo;
  }
  async saveHazard(hazard: Hazard) {
    const client = await this.pool.connect();
    const query = {
      name: 'save-hazard',
      text: `INSERT INTO public.hazards (
        uuid, "time", active, hazard, trail, index, lat, "long", image
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9
      );`,
      values: [
        hazard.uuid,
        hazard.time.toISOString(),
        hazard.active,
        hazard.hazard,
        hazard.location.trail,
        hazard.location.index,
        hazard.location.lat,
        hazard.location.long,
        hazard.image,
      ]
    };
    await client.query(query);
    client.release();
  }
  async fetchActiveHazards(): Promise<Array<Hazard>> {
    const client = await this.pool.connect();
    const query = {
      name: 'fetch-active-hazards',
      text: `SELECT * FROM public.hazards WHERE active;`
    };
    const res = await client.query(query);
    client.release();
    return res.rows.map(e => ({
      uuid: e.uuid,
      time: e.time,
      active: e.active,
      hazard: e.hazard,
      location: {
        trail: e.trail,
        index: e.index,
        lat: e.lat,
        long: e.long
      },
      image: e.image,
    }));
  }
  async imageInDatabase(uuid: string): Promise<boolean> {
    const client = await this.pool.connect();
    const query = {
      name: 'image-exists',
      text: `SELECT * FROM public.hazards WHERE image == $1`,
      values: [
        uuid
      ]
    }
    const res = await client.query(query);
    return res.rowCount != 0;
  }
}
