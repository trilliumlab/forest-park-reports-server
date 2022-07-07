import { FastifyPluginAsync } from "fastify";
import trailRoutes from "./trail.js";
import hazardRoutes from "./hazard.js";

const apiRoutes: FastifyPluginAsync = async (server) => {
  server.get('/ping', async () => {
    return "Pong!";
  });
  // register other routes
  server.register(trailRoutes, {prefix: '/trail'});
  server.register(hazardRoutes, {prefix: '/hazard'});
};
export default apiRoutes;
