import swagger from 'swagger-ui-express';
import openapiDocument from '../docs/openapi.json' with { type: 'json' };

export default async (app) => {
  app.use('/docs', swagger.serve, swagger.setup(openapiDocument));
};