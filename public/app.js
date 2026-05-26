// 1. State Management
let currentPage = 1;
const limit = 20;


// 2. DOM Elements
const listEl = document.getElementById('webhook-list');
const detailEl = document.getElementById('detail-panel');
const paginationEl = document.getElementById('pagination');
const statTotal = document.getElementById('stat-total');
const statPage = document.getElementById('stat-page');


// 3. Security Utility: Prevent XSS Attacks
function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str).replace(/[&<>'"]/g, tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
    }[tag]));
}


// Fetch webhooks from the API
async function fetchWebhooks(page = 1) {
    try {
        const response = await fetch(`/api/webhooks?page=${page}&limit=${limit}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);

        const data = await response.json();
        renderWebhooks(data.data);
        renderPagination(data.pagination);
        
        statTotal.textContent = data.pagination.total;
        statPage.textContent = `${data.pagination.page} / ${data.pagination.totalPages || 1}`;
        currentPage = page;
    } catch (err) {
        console.error('Failed to fetch webhooks:', err);
        listEl.innerHTML = `<div class="empty-state"><h2>Error</h2><p>${escapeHTML(err.message)}</p></div>`;
    }
}


// Show webhook detail
async function showDetail(id) {
    try {
        const response = await fetch(`/api/webhooks/${id}`);
        if (!response.ok) throw new Error('Webhook not found');
        const json = await response.json();
        const wh = json.data;

        // Safe rendering with escapeHTML for untrusted, dynamic inputs
        detailEl.innerHTML = `
            <div class="detail-section">
                <h3>Webhook Info</h3>
                <p><strong>ID:</strong> ${escapeHTML(wh.id)}</p>
                <p><strong>Relay:</strong> /w/${escapeHTML(wh.relayId || wh.relay_id)}</p>
                <p><strong>Method:</strong> ${escapeHTML(wh.method)}</p>
                <p><strong>Status:</strong> <span class="webhook-status status-${escapeHTML(wh.status)}">${escapeHTML(wh.status)}</span></p>
                <p><strong>Time:</strong> ${new Date(wh.timestamp).toLocaleString()}</p>
                <p><strong>Source IP:</strong> ${escapeHTML(wh.sourceIp || wh.source_ip || 'unknown')}</p>
            </div>
            <div class="detail-section">
                <h3>Headers</h3>
                <pre>${escapeHTML(JSON.stringify(wh.headers, null, 2))}</pre>
            </div>
            <div class="detail-section">
                <h3>Body</h3>
                <pre>${wh.body ? escapeHTML(JSON.stringify(wh.body, null, 2)) : '(empty)'}</pre>
            </div>
            ${wh.query && Object.keys(wh.query).length > 0 ? `
            <div class="detail-section">
                <h3>Query Parameters</h3>
                <pre>${escapeHTML(JSON.stringify(wh.query, null, 2))}</pre>
            </div>` : ''}
            <div class="btn-group">
                <button class="btn btn-primary" onclick="replayWebhook('${escapeHTML(wh.id)}', event)">🔄 Replay</button>
                <button class="btn btn-danger" onclick="deleteWebhook('${escapeHTML(wh.id)}', event)">🗑️ Delete</button>
            </div>`;

        detailEl.classList.add('active');
        detailEl.scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
        console.error('Failed to load webhook detail:', err);
        alert(`Error loading detail: ${err.message}`);
    }
}


// Delete a webhook
async function deleteWebhook(id, event) {
    if (!confirm('Delete this webhook?')) return;
    
    // UI Safeguard: Loading feedback & preventing double clicks
    const btn = event.target;
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = 'Deleting!';

    try {
        const response = await fetch(`/api/webhooks/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error(`HTTP ${response.status}: Failed to delete`);

        detailEl.classList.remove('active');
        await fetchWebhooks(currentPage);
    } catch (err) {
        console.error('Failed to delete webhook:', err);
        alert(`Failed to delete webhook: ${err.message}`);
        
        // Reset button on failure
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

// Replay a webhook
async function replayWebhook(id, event) {
    const targetUrl = prompt('Enter the target URL to replay this webhook to:');
    if (!targetUrl) return;

    // UI Safeguard: Loading feedback & preventing double clicks
    const btn = event.target;
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = 'Replaying!';

    try {
        const response = await fetch(`/api/webhooks/${id}/replay`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ target_url: targetUrl })
        });
        
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || `Server returned ${response.status}`);

        alert(`Replayed successfully!\n\nTarget responded with: ${result.replay.status} ${result.replay.statusText}`);
        await fetchWebhooks(currentPage);
    } catch (err) {
        console.error('Replay execution failed:', err);
        alert(`Replay failed: ${err.message}`);
    } finally {
        // Reset button state regardless of success or failure
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}


// Render webhook list
function renderWebhooks(webhooks) {
    if (webhooks.length === 0) {
        listEl.innerHTML = `
            <div class="empty-state">
                <h2>No webhooks yet</h2>
                <p>Send your first webhook to get started:</p>
                <code>curl -X POST http://${window.location.host}/w/test -H "Content-Type: application/json" -d '{"event":"ping"}'</code>
            </div>`;
        return;
    }

    listEl.innerHTML = webhooks.map(wh => `
        <div class="webhook-card" onclick="showDetail('${escapeHTML(wh.id)}')">
            <div class="webhook-card-header">
                <div>
                    <span class="webhook-method">${escapeHTML(wh.method)}</span>
                    <span class="webhook-relay">/w/${escapeHTML(wh.relayId || wh.relay_id)}</span>
                </div>
                <span class="webhook-status status-${escapeHTML(wh.status)}">${escapeHTML(wh.status)}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
                <span class="webhook-id">${escapeHTML(wh.id)}</span>
                <span class="webhook-time">${escapeHTML(formatTime(wh.timestamp))}</span>
            </div>
        </div>
    `).join('');
}

// Render pagination controls
function renderPagination(pagination) {
    if (pagination.totalPages <= 1) { paginationEl.innerHTML = ''; return; }

    let html = '';
    if (pagination.hasPrev) {
        html += `<button class="btn btn-primary" onclick="fetchWebhooks(${pagination.page - 1})">← Previous</button>`;
    }
    html += `<span style="padding: 0.5rem; color: var(--text-secondary);">Page ${pagination.page} of ${pagination.totalPages}</span>`;
    if (pagination.hasNext) {
        html += `<button class="btn btn-primary" onclick="fetchWebhooks(${pagination.page + 1})">Next →</button>`;
    }
    paginationEl.innerHTML = html;
}

// Format timestamp
function formatTime(isoString) {
    const date = new Date(isoString);
    const now = new Date();
    const diffSecs = Math.floor((now - date) / 1000);
    if (diffSecs < 60) return `${diffSecs}s ago`;
    if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)}m ago`;
    if (diffSecs < 86400) return `${Math.floor(diffSecs / 3600)}h ago`;
    return date.toLocaleDateString();
}

// Initial Load
fetchWebhooks(1);