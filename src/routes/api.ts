import { FastifyPluginAsync } from "fastify";
import trailRoutes from "./trail.ts";
import hazardRoutes from "./hazard.ts";

const apiRoutes: FastifyPluginAsync = async (server) => {
  server.get('/ping', async () => {
    return "Pong!";
  });
  // register other routes
  server.register(trailRoutes, {prefix: '/trail'});
  server.register(hazardRoutes, {prefix: '/hazard'});
};
export default apiRoutes;
