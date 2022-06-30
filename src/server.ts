import { fastify, FastifyInstance } from "fastify";
import { pino, Logger } from 'pino';

import apiRoutes from './routes/api.js';
import ParkTrails from "./park-trails.js";

const port = 3000;

class ForestParkServer {
  logger: Logger;
  server: FastifyInstance<any>;
  trails: ParkTrails;
  constructor() {
    this.logger = pino();
    this.server = fastify({logger: this.logger});
    this.trails = new ParkTrails();
  }
  // This is where we run any async code that needs
  // to be run before the http server can be started
  async initialize() {
    await this.trails.loadTrails();
    // make sure that routes are registered at the end of initialization
    // as routes can depend on service initialization.
    await this.registerRoutes();
  }
  async registerRoutes() {
    this.server.register(apiRoutes, {prefix: '/api/v1'})
  }
  // Runs the server blocking
  async run() {
    await this.server.listen({port});
  }
}

const Server = new ForestParkServer();
export default Server;

await Server.initialize();
await Server.run();
