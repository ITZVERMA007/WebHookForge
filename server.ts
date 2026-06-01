import express, { Request, Response, NextFunction } from 'express';
import path from "path";
import webhookRouter from './routes/webhook.js';
import webhooksRouter from './routes/webhooks.js';
import replayRouter from './routes/replay.js';
import { notFoundHandler, errorHandler } from './middleware/error.js';
import { fileURLToPath } from 'url';
import { setUpWebSocket } from './ws/server.js';
import http from 'http';

export interface RawBodyRequest extends Request {
    rawBody?: string;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);// we are creating the server to attach the websocket to it and hence the CLI will be calling the server

// Middlewares
app.use(express.json({
    limit: '1mb', // Bodies less <= 1mb
    verify: (req: Request, res: Response, buf: Buffer) => {
        (req as RawBodyRequest).rawBody = buf.toString('utf8'); // Taking exact byte-stream before express parses it
    }
}));

app.use(express.urlencoded({
    extended: true,
    limit: '1mb',
    verify: (req: Request, res: Response, buf: Buffer) => {
        (req as RawBodyRequest).rawBody = buf.toString('utf8');
    }
}));

app.get('/favicon.ico', (req, res) => {
    res.status(204).end()
});

// Middleware to log info for every request
app.use((req: Request, res: Response, next: NextFunction) => {

    // Ignore dashboard UI and Internal API logs
    const isDashboardTraffic = req.path === '/' || req.path.endsWith('.js') || req.path.endsWith('.css');
    const isInternalApi = req.path.startsWith('/api/');

    if (isDashboardTraffic || isInternalApi) {
        return next(); // Skip logging and move further
    }

    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(
            `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`
        );
    });

    next();
});


// Static file 
app.use(express.static(path.join(__dirname, '../public')));

// Routes
app.use('/', webhookRouter);
app.use('/api', webhooksRouter);
app.use('/api', replayRouter);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), uptime: process.uptime() });
});

// Error Handling

app.use(notFoundHandler); // 404 Error
app.use(errorHandler); // 500 error

// Attaching WebSocket to the same HTTP server
setUpWebSocket(server);

export { app, server };