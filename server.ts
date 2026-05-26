import express, { Request, Response, NextFunction } from 'express';
import path from "path";
import webhookRouter from './routes/webhook.js';
import webhooksRouter from './routes/webhooks.js';
import replayRouter from './routes/replay.js';
import { notFoundHandler,errorHandler } from './middleware/error.js';
import { fileURLToPath } from 'url';
import { setUpWebSocket } from './ws/server.js';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);// we are creating the server to attach the websocket to it and hence the CLI will be calling the server

// Middleware
app.use(express.json({
    limit: '1mb' // Bodies less <= 1mb
}));
app.use(express.urlencoded({ extended: true }));

// Middleware to log info for every request
app.use((req: Request, res: Response, next: NextFunction) => {
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
app.use(express.static(path.join(__dirname,'../public')));

// Routes
app.use('/', webhookRouter);
app.use('/api',webhooksRouter);
app.use('/api',replayRouter);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(),uptime:process.uptime() });
});

// Erro Handling

app.use(notFoundHandler); // 404 Error
app.use(errorHandler); // 500 error

// Attaching WebSocket to the same HTTP server
setUpWebSocket(server);

export {app,server};