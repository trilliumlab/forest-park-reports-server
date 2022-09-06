import pg from "pg";
import {Hazard, HazardUpdate} from "../models/hazard.js";
import Server from "../server.js";
import Service from "../service.js";
import { TrailInfoRecord } from "./trails-service.js";
import { v1 as uuidv1} from 'uuid';

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
        hazard text NOT NULL,
        trail uuid NOT NULL,
        index integer NOT NULL,
        lat double precision NOT NULL,
        "long" double precision NOT NULL,
        PRIMARY KEY (uuid)
    );`;
    await client.query(hazardsQuery);
    // create hazard confirmation query
    const updatesQuery = `CREATE TABLE IF NOT EXISTS public.updates (
        uuid uuid NOT NULL,
        hazard uuid NOT NULL,
        "time" timestamp with time zone NOT NULL,
        active boolean NOT NULL,
        image uuid,
        PRIMARY KEY (uuid)
    );`;
    await client.query(updatesQuery);
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
        uuid, "time", hazard, trail, index, lat, "long"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7
      );`,
      values: [
        hazard.uuid,
        hazard.time.toISOString(),
        hazard.hazard,
        hazard.location.trail,
        hazard.location.index,
        hazard.location.lat,
        hazard.location.long,
      ],
    };
    await client.query(query);
    client.release();
    await this.updateHazard({
      uuid: uuidv1(),
      hazard: hazard.uuid,
      time: hazard.time,
      active: true,
      image: hazard.image,
    });
  }
  async updateHazard(update: HazardUpdate) {
    const client = await this.pool.connect();
    const query = {
       name: 'update-hazard',
      text: `INSERT INTO public.updates (
        uuid, hazard, "time", active, image
      ) VALUES (
        $1, $2, $3, $4, $5
      );`,
      values: [
        update.uuid,
        update.hazard,
        update.time.toISOString(),
        update.active,
        update.image,
      ]
    };
    await client.query(query);
    client.release();
  }
  async fetchHazards(active = true): Promise<Array<Hazard>> {
    const client = await this.pool.connect();
    const query = {
      name: 'fetch-active-hazards',
      text: `SELECT * FROM public.hazards;`
    };
    const res = await client.query(query);
    client.release();
    const hazards = [];
    await res.rows.forEachParallel(async (e) => {
      const hazard = {
        uuid: e.uuid,
        time: e.time,
        hazard: e.hazard,
        location: {
          trail: e.trail,
          index: e.index,
          lat: e.lat,
          long: e.long
        }
      };
      if (!active) {
        hazards.push(hazard);
      } else {
        const updates = (await this.fetchHazardUpdates(hazard.uuid))
          .sort((a, b) => b.time.getTime() - a.time.getTime());
        if (updates.length > 0) {
          if (updates[0].active) {
            hazards.push(hazard);
          }
        }
      }
    });
    return hazards;
  }
  async fetchHazard(uuid: string): Promise<Hazard | null> {
    const client = await this.pool.connect();
    const query = {
      name: 'fetch-hazard',
      text: `SELECT * FROM public.hazards WHERE uuid = $1`,
      values: [
        uuid
      ],
    };
    const res = await client.query(query);
    client.release();
    if (res.rowCount == 0) {
      return null;
    }
    return {
      uuid: res.rows[0].uuid,
      time: res.rows[0].time,
      hazard: res.rows[0].hazard,
      location: {
        trail: res.rows[0].trail,
        index: res.rows[0].index,
        lat: res.rows[0].lat,
        long: res.rows[0].long
      }
    };
  }
  async fetchHazardUpdates(hazard: string): Promise<Array<HazardUpdate>> {
    const client = await this.pool.connect();
    const query = {
      name: 'fetch-hazard-updates',
      text: `SELECT * FROM public.updates WHERE hazard = $1;`,
      values: [
        hazard
      ],
    };
    const res = await client.query(query);
    client.release();
    return res.rows.map(e => ({
      uuid: e.uuid,
      hazard: e.hazard,
      time: e.time,
      active: e.active,
      image: e.image,
    }));
  }
  async imageInDatabase(uuid: string): Promise<boolean> {
    const client = await this.pool.connect();
    const query = {
      name: 'image-exists',
      text: `SELECT * FROM public.updates WHERE image = $1`,
      values: [
        uuid
      ]
    }
    try {
      const res = await client.query(query);
      return res.rows.length != 0;
    } catch (e) {
      console.log(e);
      return false;
    }
  }
}
