import { FastifyPluginAsync, FastifyRequest } from "fastify";
import Server from "../server.js";
import { NewHazardRequest, NewHazardRequestSchema } from "../models/hazard.js";

const hazardRoutes: FastifyPluginAsync = async (server) => {
  server.post("/new", {
    schema: { body: NewHazardRequestSchema }
  }, async (req: FastifyRequest<{Body: NewHazardRequest}>, rep) => {
    const hazard = req.body;
    console.log(hazard);
  });
};
export default hazardRoutes;
