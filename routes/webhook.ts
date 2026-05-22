import { Router, Request, Response } from 'express';
import { Prisma } from '../generated/prisma/client';
import { v4 as uuidv4 } from 'uuid';
import * as db from '../db';

const router = Router();

router.post('/w/:relayId', async (req: Request, res: Response) => {
    const { relayId } = req.params;

    const webhook: db.WebhookInput = {
        id: uuidv4(),
        relay_id: relayId as string,
        method: req.method,
        headers: req.headers as Prisma.InputJsonObject,
        body: req.body as Prisma.InputJsonObject,
        query: req.query as Prisma.InputJsonObject,
        source_ip: req.ip || req.socket?.remoteAddress || null,
        timestamp: new Date().toISOString(),
        status: "received"
    };

    try {
        await db.insert(webhook);
        console.log(`[WEBHOOK]Received on relay ${relayId} -> ${webhook.id}`);

        res.status(200).json({
            success: true,
            id: webhook.id,
            message: `Webhook received on relay ${relayId}`
        });
    } catch (err) {
        const error = err as Error;
        console.error(`[WEBHOOK] Failed to store:`, error.message);
        res.status(500).json({
            success: false,
            message: "Failed to store webhook"
        });

    }
});

export default router;