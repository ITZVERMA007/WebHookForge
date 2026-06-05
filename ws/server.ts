import { WebSocketServer, WebSocket } from "ws";
import { Server as HttpServer } from 'http';

// Extend websocket type to include isAlive flag for the heartbeat(ping/pong)
export interface ExtWebSocket extends WebSocket {
    isAlive: boolean;
    subscribedRelayId?: string;
};

// Storing connected clients in a set
export const clients = new Set<WebSocket>();

export function setUpWebSocket(server: HttpServer): WebSocketServer {

    // Add maximum payload to prevent memory-exhaustion attack
    const wss = new WebSocketServer({
        server,
        maxPayload: 64 * 1024
    });

    wss.on('connection', (ws: ExtWebSocket) => {
        // Mark as alive upon connection
        ws.isAlive = true;
        // New client added
        clients.add(ws);
        console.log(`WS Client connected (${clients.size} total)`);

        // Welcome message for the client
        ws.send(JSON.stringify({
            type: "connected",
            message: "Connected to WebHookForge live feed",
            clients: clients.size
        }));

        // Listen for the pong response from the client to keep the connection open
        ws.on('pong', () => {
            ws.isAlive = true;
        });

        // Handle incoming requests from the client
        ws.on("message", (data: Buffer) => {
            try {
                const payload = JSON.parse(data.toString());

                // Hold the subscribe event from the client
                if (payload.type === 'subscribe' && payload.relayId) {

                    // Attach relayId for this specific connection
                    const extWs = ws as ExtWebSocket;
                    extWs.subscribedRelayId = payload.relayId;

                    console.log(`[WS] Client subscribed to relay: ${payload.relayId}`);

                    // Confirmation to the client
                    ws.send(JSON.stringify({
                        type: "subscribed",
                        message: `Successfully susbscribed to /w/${payload.relayId}`
                    }));

                    return;
                }
                console.log(`[WS] Received other message:`, payload);
            }
            catch (err) {
                console.error('[WS] Invalid JSON received');
            }
        });

        // Handle disconnection, removing from set
        ws.on('close', () => {
            clients.delete(ws);
            console.log(`[WS] Client disconnected (${clients.size} remaining)`);
        });

        // Handle errors
        ws.on('error', (err: Error) => {
            console.error('[WS] Client error:', err.message);
            clients.delete(ws);
        });
    });

    // This is the heartbeat implementation to check whether a connection is still alive or not and remove the dead connections 
    const interval = setInterval(() => {
        wss.clients.forEach((client) => {
            const extWs = client as ExtWebSocket;
            if (extWs.isAlive === false) {
                clients.delete(extWs);
                return extWs.terminate();
            }

            extWs.isAlive = false;
            extWs.ping();
        });
    }, 30000);

    // Clear the interval if the server completely shuts down
    wss.on('close', () => {
        clearInterval(interval);
    });

    return wss;
}

