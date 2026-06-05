import { PrismaClient, Prisma } from '@prisma/client';
import path from 'path';
import fs from 'fs';
import os from 'os';

// Creating the folder in the user's home directory
const dbFolder = path.join(os.homedir(), 'webhookforge');
const dbPath = path.join(dbFolder, 'webhooks.db');

// Ensuring SQLite url uses forward slashes so prisma doesn't break on windows
const prismaUrl = `file:${dbPath.replace(/\\/g, '/')}`;

// Ensuring that the folder exists before Prisma tries to use the folder
if (!fs.existsSync(dbFolder)) {
    fs.mkdirSync(dbFolder, { recursive: true })
}

const prisma = new PrismaClient({
    log: ['error'],
    datasources: {
        db: {
            url: prismaUrl
        }
    }
});

const dbReady = (async () => {
    try {
        await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "webhooks" (
            "id" TEXT NOT NULL PRIMARY KEY,
            "relay_id" TEXT NOT NULL,
            "method" TEXT NOT NULL DEFAULT 'POST',
            "headers" TEXT NOT NULL,
            "body" TEXT,
            "rawBody" TEXT,
            "query" TEXT,
            "source_ip" TEXT,
            "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "status" TEXT NOT NULL DEFAULT 'received'
        );
    `);
        await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "webhooks_relay_id_idx" ON "webhooks"("relay_id");
    `);
        await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "webhooks_timestamp_idx" ON "webhooks"("timestamp" DESC);
    `);

        await prisma.$disconnect();
        await prisma.$connect();
    } catch (error) {
        console.error('\n [DB] Failed to verify schema. Error:', error);
    }
})(); // Immediately Invoked Function Expression


// Interface for the webhook
export interface WebhookInput {
    id: string;
    relay_id: string;
    method: string;
    headers: Record<string, unknown>;
    body?: Record<string, unknown> | null;
    rawBody?: string | null;
    query?: Record<string, unknown> | null;
    source_ip: string | null;
    timestamp: string;
    status: string;
}

interface DbResult {
    changes: number;
}

// Parse SQLite Strings back to JSON 
function formatWebhookData(webhook: any) {
    if (!webhook) return null;
    return {
        ...webhook,
        headers: webhook.headers ? JSON.parse(webhook.headers) : {},
        body: webhook.body ? JSON.parse(webhook.body) : null,
        query: webhook.query ? JSON.parse(webhook.query) : null,
        rawBody: webhook.rawBody || null,
    };
}

// Function to insert a new webhook into the database
export async function insert(webhook: WebhookInput): Promise<DbResult> {
    await dbReady;
    await prisma.webhook.create({
        data: {
            id: webhook.id,
            relayId: webhook.relay_id,
            method: webhook.method,
            // Convert JSON objects to strings for SQLite
            headers: JSON.stringify(webhook.headers),
            body: webhook.body ? JSON.stringify(webhook.body) : undefined,
            rawBody: webhook.rawBody || undefined,
            query: webhook.query ? JSON.stringify(webhook.query) : undefined,
            sourceIp: webhook.source_ip,
            timestamp: new Date(webhook.timestamp),
            status: webhook.status,
        },
    });
    return { changes: 1 };
}

// Function to get all webhooks with pagination
export async function getAll(limit: number = 20, offset: number = 0) {
    await dbReady;
    const webhooks = await prisma.webhook.findMany({
        orderBy: { timestamp: 'desc' },
        take: limit,
        skip: offset,
    });
    return webhooks.map(formatWebhookData);
}

// Function to get webhook by its id
export async function getById(id: string) {
    await dbReady;
    const webhook = await prisma.webhook.findUnique({
        where: { id },
    });
    return formatWebhookData(webhook);
}

// Function to get all webhooks for a specific relay ID
export async function getByRelayId(relayId: string, limit: number = 20, offset: number = 0) {
    await dbReady;
    const webhooks = await prisma.webhook.findMany({
        where: { relayId },
        orderBy: { timestamp: 'desc' },
        take: limit,
        skip: offset,
    });
    return webhooks.map(formatWebhookData);
}

// Function to delete a webhook by its ID
export async function deleteById(id: string): Promise<DbResult> {
    await dbReady;
    try {
        await prisma.webhook.delete({
            where: { id },
        });
        return { changes: 1 };
    } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
            return { changes: 0 };
        }
        throw err;
    }
}

// Function to delete all webhooks
export async function deleteAll(): Promise<DbResult> {
    await dbReady;
    try {
        const result = await prisma.webhook.deleteMany({});
        return { changes: result.count };
    } catch (err) {
        console.error('[DB] Failed to delete all webhooks', err);
        throw err;
    }
}

// Function to get total count of all webhooks 
export async function count(): Promise<number> {
    await dbReady;
    return await prisma.webhook.count();
}

// Function to get total count for a relayId
export async function countByRelayId(relayId: string) {
    await dbReady;
    return await prisma.webhook.count({
        where: { relayId }
    })
}

// Function to update the status of a webhook
export async function updateStatus(id: string, status: string): Promise<DbResult> {
    await dbReady;
    try {
        await prisma.webhook.update({
            where: { id },
            data: { status },
        });
        return { changes: 1 };
    } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
            return { changes: 0 };
        }
        throw err;
    }
}

export const raw = prisma;