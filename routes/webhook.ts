import { Router, Request, Response, NextFunction, raw } from 'express';
import { v4 as uuidv4 } from 'uuid';
import * as db from '../db.js';
import { broadcast } from '../ws/broadcast.js';

const router = Router();

router.all('/w/:relayId', async (req: Request, res: Response,next:NextFunction) => {
    const { relayId } = req.params;

    const rawIp = req.headers['x-forwarded-for'] || req.ip || req.socket?.remoteAddress;
    const trueIp = Array.isArray(rawIp) ? rawIp[0] : rawIp;

    const webhook: db.WebhookInput = {
        id: uuidv4(),
        relay_id: relayId as string,
        method: req.method,
        headers: req.headers as Record<string, unknown>,
        body: req.body as Record<string, unknown> | null,
        query: req.query as Record<string, unknown> | null,
        source_ip: trueIp as string || null,
        timestamp: new Date().toISOString(),
        status: "received"
    };

    try {
        await db.insert(webhook);
        console.log(`[WEBHOOK]Received on relay ${relayId} -> ${webhook.id}`);

        broadcast('new_webhook',webhook);
        res.status(200).json({
            success: true,
            id: webhook.id,
            message: `Webhook received on relay ${relayId}`
        });
    } catch (err) {
        next(err)
    }
});

export default router;