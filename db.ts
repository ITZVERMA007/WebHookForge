import { PrismaClient, Prisma } from './generated/prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

// Initialising the connection pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10, // prevents connection exhaustion
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
    adapter,
    log: ['info', 'warn', 'error'],
});

console.log('[DB] Prisma client initialised');

export interface WebhookInput {
    id: string;
    relay_id: string;
    method: string;
    headers: Prisma.InputJsonObject;
    body?: Prisma.InputJsonObject | null;
    query?: Prisma.InputJsonObject | null;
    source_ip: string | null;
    timestamp: string;
    status: string;
}

interface DbResult {
    changes: number;
}


// Function to insert a new webhook into the database
export async function insert(webhook: WebhookInput):
    Promise<DbResult> {
    await prisma.webhook.create({
        data: {
            id: webhook.id,
            relayId: webhook.relay_id,
            method: webhook.method,
            headers: webhook.headers,
            body: webhook.body || undefined,
            query: webhook.query || undefined,
            sourceIp: webhook.source_ip,
            timestamp: new Date(webhook.timestamp),
            status: webhook.status,
        },
    });
    return { changes: 1 };
}


// Function to get all webhooks with pagination
export async function getAll(limit: number = 20, offset: number = 0) {
    return prisma.webhook.findMany({
        orderBy: { timestamp: 'desc' },
        take: limit,
        skip: offset,
    });
}


// Function to get webhook by it's id
export async function getById(id: string) {
    return prisma.webhook.findUnique({
        where: { id },
    });
}


// Function to get all webhooks for a specific relay ID
export async function getByRelayId(relayId: string, limit: number = 20, offset: number = 0) {
    return prisma.webhook.findMany({
        where: { relayId },
        orderBy: { timestamp: 'desc' },
        take: limit,
        skip: offset,
    });
}


// Function to delete a webhook by it's ID
export async function deleteById(id: string): Promise<DbResult> {
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


// Function to get total count of all webhooks 
export async function count(): Promise<number> {
    return await prisma.webhook.count();
}


// Function to get total count for a relayId
export async function countByRelayId(relayId: string) {
    return await prisma.webhook.count({
        where: { relayId }
    })
}

// Function to update the status of a webhook
export async function updateStatus(id: string, status: string): Promise<DbResult> {
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