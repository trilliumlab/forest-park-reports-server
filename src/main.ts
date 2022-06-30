import { fastify } from 'fastify';
import { pino } from 'pino';

import apiRoutes from './routes/api.js';

const port = 3000;

const logger = pino();
const server = fastify({logger});

server.register(apiRoutes, {prefix: '/api/v1'})

await server.listen({port});
