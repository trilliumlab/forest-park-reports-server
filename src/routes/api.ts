import { FastifyPluginAsync } from "fastify";
import trailRoutes from "./trails.js";

const apiRoutes: FastifyPluginAsync = async (server) => {
  server.get('/ping', async () => {
    return "Pong!";
  });
  // register other routes
  server.register(trailRoutes, {prefix: '/trails'});
};
export default apiRoutes;
