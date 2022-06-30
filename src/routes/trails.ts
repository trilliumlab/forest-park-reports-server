import { FastifyPluginAsync } from "fastify";

const trailRoutes: FastifyPluginAsync = async (server) => {
  server.get('/list', async (_request, _reply) => {
    return "Trails";
  });
};
export default trailRoutes;
