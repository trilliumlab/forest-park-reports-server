import { FastifyPluginAsync } from "fastify";

import parkTrails from "../trails.js";

const apiRoutes: FastifyPluginAsync = async (server) => {
  console.log(parkTrails);
  server.get('/ping', async (_request, _reply) => {
    return "Pong!";
  });
};
export default apiRoutes;
