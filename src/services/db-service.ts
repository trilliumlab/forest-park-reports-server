import pg from "pg";
import Server from "../server.js";
import Service from "../service.js";

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
    const sql = `CREATE TABLE IF NOT EXISTS public.trail_info (
      uuid uuid NOT NULL,
      name text NOT NULL,
      PRIMARY KEY (uuid)
    );`
    await client.query(sql);
  }
}
