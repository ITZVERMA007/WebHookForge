
const protocol = window.location.protocol === 'https:'? 'wss:':'ws:';
const WS_URL = `${protocol}//${window.location.host}`;
let ws = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_DELAY = 30000;

// Getting the webhooks for the relayId for the display
async function loadWebhooks(relayId){
    try {
        // Getting the response for the relayId
        const response = await fetch(`/api/webhooks?relay_id=${relayId}&limit=50`);
        const result = await response.json();

        if (result.data && result.data.length > 0) { 

            // Clearing the list first so that the duplicate webhooks doesn't appear on the screen
            const listEl = document.getElementById('webhook-list');
            if(listEl) listEl.innerHTML = '';
            // Newest first
            result.data.reverse().forEach(webhook =>{
                prependWebhook(webhook);
            });
        }
    } catch (err) {
        console.error("Failed to load webhooks",err);
    }
}

// Connect with the WebSocket server
function connectWebSocket(){
    ws = new WebSocket(WS_URL);

    ws.onopen = () => {
        console.log('[WS] Connected to live feed');
        reconnectAttempts = 0
        updateConnectionStatus(true);

        // Taking the relayId to display the webhook
        const relayId = window.location.pathname.split('/').filter(Boolean).pop();

        if(relayId) { 
            ws.send(JSON.stringify({
                type:"subscribe",
                relayId:relayId
            }));
            loadWebhooks(relayId);
            console.log(`[WS] Requested subscription to: ${relayId}`);
        }
        else{
            console.error('[WS] Could not find Relay ID in the URL');
        }
    };

    ws.onmessage = (event) =>{
        try {
            const message = JSON.parse(event.data);
            handleWebSocketMessage(message);
        } catch (err) {
            console.error('[WS] Failed to parse message:',err);
        }
    };

    ws.onclose = () => {
        console.log('[WS] Disconnected');
        updateConnectionStatus(false);

        // Auto reconnection with exponential backoff
        const delay = Math.min(1000 * Math.pow(2,reconnectAttempts),MAX_RECONNECT_DELAY);
        reconnectAttempts++;
        console.log(`[WS] Reconnecting in ${delay /1000}s (attempt ${reconnectAttempts})`);
        setTimeout(connectWebSocket,delay);
    };

    ws.onerror = (err) =>{
        console.error('[WS] Error:',err);
    };
}


function escapeHTML(str){
    if (typeof str !== 'string') return str;
    return str.replace(/[&<>'"]/g,function(match){
        const escape = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        };
        return escape[match];
    });
};
// Handle incoming WebSocket messages
function handleWebSocketMessage(message){
    switch(message.type){
        case 'connected':
            console.log(`[WS] ${message.message} (${message.clients} clients)`);
            break;

        case 'new_webhook':
            console.log('[WS] New webhook received:',message.payload.id);
            prependWebhook(message.payload);
            break;
        
        case 'webhook_deleted':
            console.log('[WS] Webhook deleted:',message.payload.id);
            const currentRelayId = window.location.pathname.split('/').filter(Boolean).pop();
            loadWebhooks(currentRelayId); // Refresh the list
            break;

        default:
            console.log('[WS] Unknown message type:',message.type);
    }
}

async function deleteSelectedWebhook(){
    const deleteBtn = document.getElementById('delete-btn');
    const targetId = deleteBtn.getAttribute('data-webhook-id');

    if (!targetId){
        console.error("No webhook selected to delete!");
        return;
    }

    try {
        const response = await fetch(`/api/webhooks/${targetId}`,{
            method: 'DELETE'
        });

        if (response.ok){
            console.log(`Successfully deleted ${targetId}`);

            // Clearing the details panel to remove the deleted webhook
            document.getElementById('detail-id').textContent='';
            document.getElementById('detail-body').textContent='(empty)';
            deleteBtn.removeAttribute('data-webhook-id');
        }
    }
    catch(err){
        console.error("Failed to delete webhook:",err);
    }
}


async function showDetail(webhookId) {
    try {
        // Fetch the exact webhook data from backend
        const response = await fetch(`/api/webhooks/${webhookId}`);
        const result = await response.json();

        // Ensure the backend actually returned data
        if (!result.success || !result.data) {
            console.error("[UI] Failed to load webhook details");
            return;
        }

        // Extract the actual webhook object 
        const webhook = result.data;

        // Update the basic text fields safely
        setText('detail-id', webhook.id);
        setText('detail-relay', `/w/${webhook.relayId || webhook.relay_id}`);
        setText('detail-method', webhook.method);
        setText('detail-status', webhook.status);
        setText('detail-ip', webhook.sourceIp || webhook.source_ip || 'unknown');

        // Safely format the date
        const dateObj = new Date(webhook.timestamp);
        const timeString = isNaN(dateObj.getTime()) ? 'Unknown Time' : dateObj.toLocaleString();
        setText('detail-time', timeString);

        // Printing the JSON
        setText('detail-headers', JSON.stringify(webhook.headers, null, 2));
        setText('detail-body', JSON.stringify(webhook.body, null, 2));

        // Unhide the panel
        document.getElementById('detail-panel').classList.add('active');

        const deleteBtn = document.getElementById('delete-btn'); 
        if (deleteBtn) {
            // This attaches the ID to the HTML element
            deleteBtn.setAttribute('data-webhook-id', webhook.id);
        }

    } catch (err) {
        console.error("[UI] Error fetching webhook details:", err);
    }
}

// Helper function to safely update DOM elements only if they exist
function setText(elementId, text) {
    const el = document.getElementById(elementId);
    if (el) {
        el.textContent = text;
    }
}


// Prepend new webhook to the top of the list
function prependWebhook(webhook) {
    const listEl = document.getElementById('webhook-list');

    if (!listEl) return; // Exit if element does not exist

    // Remove empty state if present
    const emptyState = listEl.querySelector('.empty-state');
    if (emptyState) listEl.innerHTML = '';

    const cardHtml = `
        <div class="webhook-card" onclick="showDetail('${escapeHTML(webhook.id)}')" style="animation: fadeIn 0.3s ease-out;">
            <div class="webhook-card-header">
                <div>
                    <span class="webhook-method">${escapeHTML(webhook.method)}</span>
                    <span class="webhook-relay">/w/${escapeHTML(webhook.relayId)}</span>
                </div>
                <span class="webhook-status status-${escapeHTML(webhook.status)}">${escapeHTML(webhook.status)}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
                <span class="webhook-id">${escapeHTML(webhook.relayId || webhook.relay_id)}</span>
                <span class="webhook-time">just now</span>
            </div>
        </div>`;

    listEl.insertAdjacentHTML('afterbegin', cardHtml);

    // This prevents loading multiple webhooks on top at a time
    if (listEl.children.length > 50){
        listEl.lastElementChild.remove();
    }

    // Update the total count
    const statTotal = document.getElementById('stat-total');
    if (statTotal) {
    const current = parseInt(statTotal.textContent) || 0;
    statTotal.textContent = current + 1;
    }
}


// Update the connection status indicator
function updateConnectionStatus(connected){
    const dot = document.getElementById('connection-dot');
    const text = document.getElementById('connection-text');

    if (!dot || !text) return;

    if (connected){
        dot.classList.add('connected');
        text.textContent = 'Live';
    }
    else{
        dot.classList.remove('connected');
        text.textContent = 'Disconnected';
    }
}

connectWebSocket();