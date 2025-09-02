import Fastify, { FastifyInstance } from 'fastify';

interface BuildOptions {
  logger?: boolean;
}

export async function build(opts: BuildOptions = {}): Promise<FastifyInstance> {
  const app = Fastify(opts);

  // Health check endpoint
  app.get('/api/health', async (request, reply) => {
    reply.send({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Presign endpoint with proper validation
  app.post('/api/presign', async (request, reply) => {
    const body = request.body as any;
    
    if (!body.key) {
      reply.code(400).send({ error: 'Missing key' });
      return;
    }

    if (!body.contentType) {
      reply.code(400).send({ error: 'Missing contentType' });
      return;
    }

    // Validate content type
    const validContentTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'application/octet-stream'];
    if (!validContentTypes.includes(body.contentType)) {
      reply.code(400).send({ error: 'Invalid content type' });
      return;
    }

    // Validate key format (no path traversal)
    if (body.key.includes('..') || body.key.includes('/etc/') || body.key.startsWith('/')) {
      reply.code(400).send({ error: 'Invalid key format' });
      return;
    }

    // Enforce size limits (10GB max)
    if (body.contentLength && body.contentLength > 10737418240) {
      reply.code(400).send({ error: 'File size exceeds maximum allowed size' });
      return;
    }

    // Mock presigned URL response (would normally use S3)
    reply.send({
      url: `https://s3.example.com/upload/${body.key}`,
      key: body.key,
      expiresIn: 3600
    });
  });

  // Promote endpoint with proper validation
  app.post('/api/promote', async (request, reply) => {
    const body = request.body as any;
    
    if (!body.stagingKey) {
      reply.code(400).send({ error: 'Missing stagingKey' });
      return;
    }

    // Validate stagingKey format (no path traversal)
    if (body.stagingKey.includes('..') || body.stagingKey.includes('/etc/') || body.stagingKey.startsWith('/')) {
      reply.code(400).send({ error: 'Invalid stagingKey format' });
      return;
    }

    // Check authentication in production
    if (process.env.NODE_ENV === 'production') {
      const auth = (request.headers as any).authorization;
      if (!auth) {
        reply.code(401).send({ error: 'Authentication required' });
        return;
      }
    }

    // Validate metadata if provided
    if (body.metadata && typeof body.metadata !== 'object') {
      reply.code(400).send({ error: 'Invalid metadata format' });
      return;
    }

    // Generate master key
    const masterKey = body.stagingKey.replace('uploads/', 'masters/');
    const assetId = Math.random().toString(36).substring(7);

    // Mock promote response
    reply.send({
      stagingKey: body.stagingKey,
      masterKey: masterKey,
      assetId: assetId,
      status: 'promoted',
      previewJobId: Math.random().toString(36).substring(7)
    });
  });

  return app;
}
