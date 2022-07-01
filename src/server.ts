import { fastify, FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { pino, Logger } from 'pino';

import apiRoutes from './routes/api.js';
import ParkTrails from "./park-trails.js";

const port = 3000;

class ForestParkServer {
  logger: Logger;
  server: FastifyInstance<any>;
  trails: ParkTrails;
  decorators: Decorators;
  constructor() {
    this.logger = pino();
    this.server = fastify({logger: this.logger});
    this.trails = new ParkTrails();
    this.decorators = new Decorators();
  }
  // This is where we run any async code that needs
  // to be run before the http server can be started
  async initialize() {
    await this.trails.loadTrails();
    // make sure that routes are registered at the end of initialization
    // as routes can depend on service initialization.
    await this.registerDecorators();
    await this.registerRoutes();
  }
  async registerDecorators() {
    this.server.setNotFoundHandler(this.decorators.notFound);
  }
  async registerRoutes() {
    this.server.register(apiRoutes, {prefix: '/api/v1'})
  }
  // Runs the server blocking
  async run() {
    await this.server.listen({port, host: "0.0.0.0"});
  }
}

class Decorators {
  notFound(request: FastifyRequest, reply: FastifyReply) {
    reply.code(404).send({code: 404, error: "Resource Not Found"});
  }
}

const Server = new ForestParkServer();
export default Server;

await Server.initialize();
await Server.run();
