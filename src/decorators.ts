import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

export default class Decorators {
  register(server: FastifyInstance<never>) {
    server.setNotFoundHandler(this.notFound);
  }
  notFound(request: FastifyRequest, reply: FastifyReply) {
    reply.code(404).send({code: 404, error: "Resource Not Found"});
  }
}
