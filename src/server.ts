/**
 * Custom server implementation for Next.js with Socket.IO
 */
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { initializeSocketIO } from '@/services/messaging/messagingService';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

// Prepare Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  // Create HTTP server
  const server = createServer(async (req, res) => {
    try {
      // Parse URL
      const parsedUrl = parse(req.url!, true);
      
      // Let Next.js handle the request
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling request:', err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  });
  
  // Initialize Socket.IO
  initializeSocketIO(server);
  
  // Start server
  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
