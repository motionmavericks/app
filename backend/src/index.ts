import './instrument.js';
import { build } from './app.js';

async function start() {
  const port = Number(process.env.PORT || 3000);
  
  // Build app with production logger
  const app = await build({ 
    logger: { level: process.env.LOG_LEVEL || 'info' } 
  });

  try {
    await app.listen({ port, host: '0.0.0.0' });
    console.log(`Server listening on http://0.0.0.0:${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();