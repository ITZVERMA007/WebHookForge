import { Response, Request, Router, NextFunction } from "express";
import * as db from "../db.js";


const router = Router();

// Function to return paginated list of webhooks 
router.get('/webhooks', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 20));

        const offset = (page - 1) * limit;
        const relayId = req.query.relay_id as string | undefined;

        let webhooks;
        let total: number;

        if (relayId) {
            // Parallely getting the outputs
            [webhooks, total] = await Promise.all([
                db.getByRelayId(relayId, limit, offset),
                db.countByRelayId(relayId)
            ]);
        }
        else {
            [webhooks, total] = await Promise.all([
                db.getAll(limit, offset),
                db.count()
            ]);
        }

        res.status(200).json({
            data: webhooks,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasNext: page * limit < total,
                hasPrev: page > 1
            }
        });
    }
    catch (error) {
        next(error); // Helping to call the error handler
    }
});


// Function to return details a single webhook
router.get('/webhooks/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const webhook = await db.getById(req.params.id as string);

        if (!webhook) {
            res.status(404).json({
                error: "Not Found",
                message: `Webhook with id ${req.params.id} does not exist`
            });
            return;
        }
        res.status(200).json({
            success: true,
            data: webhook
        });

    } catch (error) {
        next(error);
    }

});


// Function to delete a webhook 
router.delete('/webhooks/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await db.deleteById(req.params.id as string);

        if (result.changes === 0) {
            res.status(404).json({
                error: "Not Found",
                message: `Webhook with id ${req.params.id} does not exist`
            });
            return;
        }

        res.status(204).end();
    } catch (error) {
        next(error);
    }
});

export default router;