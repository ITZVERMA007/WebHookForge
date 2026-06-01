const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const WS_URL = `${protocol}//${window.location.host}`;
let ws = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_DELAY = 30000;

function connectWebSocket() {
    ws = new WebSocket(WS_URL);

    ws.onopen = () => {
        console.log('[WS] Connected to live feed');
        reconnectAttempts = 0;
        updateConnectionStatus(true);
        // We are on the global dashboard, so we don't need to send a specific relayId to subscribe
        // We want to see ALL webhooks
    };

    ws.onmessage = (event) => {
        try {
            const message = JSON.parse(event.data);

            if (message.type === 'new_webhook') {
                console.log('[WS] New webhook received!');

                // This keeps pagination and UI rendering perfectly in sync.
                if (typeof fetchWebhooks === 'function') {
                    fetchWebhooks(currentPage);
                }
            }
            else if (message.type === 'connected') {
                console.log(`[WS] ${message.message} (${message.clients} clients)`);
            }
        } catch (err) {
            console.error('[WS] Failed to parse message:', err);
        }
    };

    ws.onclose = () => {
        console.log('[WS] Disconnected');
        updateConnectionStatus(false);

        // Auto reconnection with exponential backoff
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), MAX_RECONNECT_DELAY);
        reconnectAttempts++;
        console.log(`[WS] Reconnecting in ${delay / 1000}s (attempt ${reconnectAttempts})`);
        setTimeout(connectWebSocket, delay);
    };

    ws.onerror = (err) => {
        console.error('[WS] Error:', err);
    };
}

function updateConnectionStatus(connected) {
    const dot = document.getElementById('connection-dot');
    const text = document.getElementById('connection-text');
    if (!dot || !text) return;

    if (connected) {
        dot.classList.add('connected');
        text.textContent = 'Live';
    } else {
        dot.classList.remove('connected');
        text.textContent = 'Disconnected';
    }
}

// Start the connection
connectWebSocket();