import { FastifyPluginAsync, FastifyRequest } from "fastify";
import { NewHazardRequest, NewHazardRequestSchema } from "../models/hazard.js";
import { v1 as uuidv1} from 'uuid';

const hazardRoutes: FastifyPluginAsync = async (server) => {
  server.post("/new", {
    schema: { body: NewHazardRequestSchema }
  }, async (req: FastifyRequest<{Body: NewHazardRequest}>, rep) => {
    const hazard = req.body;
    console.log(hazard);
    return {
      uuid: uuidv1(),
      time: new Date().toISOString(),
      ...hazard
    }
  });
};
export default hazardRoutes;
