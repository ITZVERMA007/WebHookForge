import {Router, Response,Request} from "express";
import * as db from "../db";
const router = Router();

router.post('/webhooks/:id/replay',async(req:Request,res:Response)=>{
    const {id}  = req.params;
    const {target_url} = req.body as {target_url?: string};

    if(!target_url){
        res.status(400).json({
            error:"Bad Request",
            message:"Missing target_url in request body"
        });
        return;
    }

    // Validating the URL format
    try { 
        // Expects proper URL
        new URL(target_url);
    } catch (err) {
        res.status(400).json({
            error:"Bad Request",
            message: `Invalid URL: ${target_url}`
        });
        return;
    }

    // Finding the webhook
    try{
        const webhook = await db.getById(id as string);
        if (!webhook){
            res.status(404).json({
                error:'Not Found',
                message:`Webhook ${id} not found`
            });
            return;
        }

        const originalHeaders = webhook.headers as Record<string,string>;
        const originalBody = webhook.body;

        // Forwarding original headers but removing some of the headers that does not make much of the sense
        const forwardHeaders = {...originalHeaders};
        delete forwardHeaders['host'];
        delete forwardHeaders['content-length'];
        delete forwardHeaders['connection']

        const response = await fetch(target_url,{
            method:webhook.method || 'POST',
            headers:{
                ...forwardHeaders,
                'Content-Type':originalHeaders
                ['content-type'] || 'application/json',
                'X-WebhookForge-Replay':'true',
                'X-WebhookForge-Original-Id':webhook.id,
            },
            body: JSON.stringify(originalBody),
        });

        // Reading target's response
        const responseBody = await response.text();

        await db.updateStatus(id as string, 'replayed');

        console.log(`[REPLAY] Webhook ${id} -> ${target_url} (${response.status})`);

        res.json({
            success:true,
            replay:{
                target_url,
                status:response.status,
                statusText:response.statusText,
                response: responseBody.substring(0,1000),
            }
        });

    } catch (err) {
        await db.updateStatus(id as string,'failed');

        const error = err as Error;
        console.error(`[REPLAY] Failed:${id} -> ${target_url}:`,error.message);

        res.status(502).json({
            error:"Bad Gateway",
            message:`Failed to reach target URL: ${error.message}`,target_url
        });
    }
});

export default router;