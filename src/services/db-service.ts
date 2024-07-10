import * as pg from "postgres";
import { Hazard, HazardUpdate } from "../models/hazard.ts";
import Server from "../server.ts";
import Service from "../service.ts";
import { v1 as uuidv1 } from "@std/uuid";

export default class DbService implements Service {
  pool!: pg.Pool;
  async init() {
    // we create the pool in init because the config has been initialized by here
    this.pool = new pg.Pool(
      Server().config.database,
      Server().config.database.maxConnections,
      true,
    );
    // now we need to verify the db has the proper tables
    await this.setupDatabase();
  }
  private async setupDatabase() {
    using client = await this.pool.connect();
    // create hazards table
    await client.queryObject`CREATE TABLE IF NOT EXISTS public.hazards (
        uuid uuid NOT NULL,
        "time" timestamp with time zone NOT NULL,
        hazard text NOT NULL,
        trail bigint NOT NULL,
        node bigint NOT NULL,
        lat double precision NOT NULL,
        "long" double precision NOT NULL,
        PRIMARY KEY (uuid)
    );`;
    // create hazard confirmation query
    await client.queryObject`CREATE TABLE IF NOT EXISTS public.updates (
        uuid uuid NOT NULL,
        hazard uuid NOT NULL,
        "time" timestamptz NOT NULL,
        active boolean NOT NULL,
        blur_hash text,
        image uuid,
        PRIMARY KEY (uuid)
    );`;
  }
  async saveHazard(hazard: Hazard) {
    using client = await this.pool.connect();
    await client.queryObject(
      `INSERT INTO public.hazards (
        uuid, "time", hazard, trail, node, lat, "long"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7
      );`,
      [
        hazard.uuid,
        hazard.time.toISOString(),
        hazard.hazard,
        hazard.location.trail,
        hazard.location.node,
        hazard.location.lat,
        hazard.location.long,
      ],
    );
    await this.updateHazard({
      uuid: uuidv1.generate(),
      hazard: hazard.uuid,
      time: hazard.time,
      active: true,
      blurHash: hazard.blurHash,
      image: hazard.image,
    });
  }
  async updateHazard(update: HazardUpdate) {
    using client = await this.pool.connect();
    await client.queryObject(
      `INSERT INTO public.updates (
        uuid, hazard, "time", active, blur_hash, image
      ) VALUES (
        $1, $2, $3, $4, $5, $6
      );`,
      [
        update.uuid,
        update.hazard,
        update.time.toISOString(),
        update.active,
        update.blurHash,
        update.image,
      ],
    );
  }
  async fetchHazards(active = true): Promise<Hazard[]> {
    using client = await this.pool.connect();
    const res = await client.queryObject`SELECT * FROM public.hazards;`;
    const hazards: Hazard[] = [];
    // deno-lint-ignore no-explicit-any
    await res.rows.forEachParallel(async (e: any) => {
      const hazard = {
        uuid: e.uuid,
        time: e.time,
        hazard: e.hazard,
        location: {
          trail: parseInt(e.trail),
          node: parseInt(e.node),
          lat: +e.lat,
          long: +e.long,
        },
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
    using client = await this.pool.connect();
    const res = await client.queryObject(
      `SELECT * FROM public.hazards WHERE uuid = $1;`,
      [uuid],
    );
    if (res.rowCount == 0) {
      return null;
    }
    // deno-lint-ignore no-explicit-any
    const first: any = res.rows[0];
    return {
      uuid: first.uuid,
      time: first.time,
      hazard: first.hazard,
      location: {
        trail: first.trail,
        node: first.index,
        lat: first.lat,
        long: first.long,
      },
    };
  }
  async fetchHazardUpdates(hazard: string): Promise<Array<HazardUpdate>> {
    using client = await this.pool.connect();
    const res = await client.queryObject(
      `SELECT * FROM public.updates WHERE hazard = $1;`,
      [hazard],
    );
    // deno-lint-ignore no-explicit-any
    return res.rows.map((e: any) => ({
      uuid: e.uuid,
      hazard: e.hazard,
      time: e.time,
      active: e.active,
      blurHash: e.blur_hash,
      image: e.image,
    }));
  }
  async imageInDatabase(uuid: string): Promise<boolean> {
    using client = await this.pool.connect();
    try {
      const res = await client.queryObject(
        `SELECT * FROM public.updates WHERE image = $1;`,
        [uuid],
      );
      return res.rows.length != 0;
    } catch (e) {
      console.log(e);
      return false;
    }
  }
}
