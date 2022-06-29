import { fastify, FastifyPluginAsync } from 'fastify';
import { pino } from 'pino';

const port = 3000;
const logger = pino();

const server = fastify({logger});

const apiRoute: FastifyPluginAsync = async (server) => {
  server.get('/ping', async (_request, _reply) => {
    return "Pong!";
  });
};
server.register(apiRoute, {prefix: '/api/v1'})

await server.listen({port});
