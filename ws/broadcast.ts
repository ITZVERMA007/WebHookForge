import { WebSocket } from "ws";
import { clients,ExtWebSocket } from "./server";

// Broadcast message to all connected clients or specific client
export function broadcast(
    type:string,
    payload:unknown,
    targetRelayId?: string    
):void {
    const message = JSON.stringify({
        type,
        payload,
        timestamp : new Date().toISOString()
    });

    let sent = 0;
    let failed = 0;

    for (const client of clients){
        const extClient = client as ExtWebSocket;

        const isOpen = extClient.readyState === WebSocket.OPEN;
        const isTargeted = !targetRelayId || extClient.subscribedRelayId === targetRelayId;
        
        if(isOpen && isTargeted){
            try {
                extClient.send(message);
                sent++;
            } catch (err) {
                console.error('[WS] Failed to send to client:',(err as Error).message);
                clients.delete(client);
                failed++;
            }
        }
    }

    if (sent > 0){
        console.log(`[WS] Broadcast ${type} to ${sent} clients`);
    }
}