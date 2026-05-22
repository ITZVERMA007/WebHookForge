import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import path from "path";
import webhookRouter from './routes/webhook';
import webhooksRouter from './routes/webhooks';
import { notFoundHandler,errorHandler } from './middleware/error';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

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
app.use(express.static(path.join(__dirname,'public')));

// Routes
app.use('/', webhookRouter);
app.use('/api',webhooksRouter);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Erro Handling

app.use(notFoundHandler); // 404 Error
app.use(errorHandler); // 500 error

// Server starting
const PORT = parseInt(process.env.PORT || '3000', 10);

const server = app.listen(PORT, () => {
    console.log('');
    console.log('WebhookForge is running');
    console.log(`http://localhost:${PORT}`);
    console.log('');
    console.log('Try sending a test webhook:');
    console.log(`curl -X POST http://localhost:${PORT}/w/test123`);
    console.log(`-H "Content-Type: application/json"`);
    console.log(`-d '{"event":"ping"}'`);
    console.log('');
});

export default app;