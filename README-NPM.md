# WebHookForge 🪝

[![npm version](https://img.shields.io/npm/v/webhookforge.svg?style=flat-square)](https://www.npmjs.com/package/webhookforge)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-brightgreen?style=flat-square)](https://nodejs.org)

A local CLI for catching, inspecting, and replaying webhooks during development.  
Zero-config tunnels. No cloud dependencies. No noise.

---

## The Problem

When Stripe, Razorpay, or GitHub sends a webhook to your app, your local
server is invisible to them. Your backend runs on `localhost` — and the
internet cannot reach `localhost`.

WebHookForge fixes this — spin up a secure public tunnel, open the
dashboard, and watch every incoming payload land in real time. If your
handler breaks, replay the exact webhook with one click. No waiting for
the external service to send another event.

---

## Features

- **Zero-Config Tunnels** — Automatically provisions a secure public HTTPS
  tunnel via Ngrok. No manual setup, no copy-pasting URLs.
- **Raw Network Truth** — Captures exact HTTP headers, raw JSON bodies, and
  cryptographic signatures (e.g. `Stripe-Signature`) before any parsing.
  What you see is exactly what hit your server.
- **Live WebSocket Dashboard** — Every webhook appears in your browser the
  millisecond it arrives. No refreshing required.
- **One-Click Replay** — Re-trigger any saved payload against your backend
  with one click — exact headers, exact body, exact signature intact.
- **Resilient Local Storage** — Backed by a local SQLite database. Your
  webhook history survives restarts. Wipe it clean with one command when done.
- **Clean Terminal** — Built with Commander.js. Internal server noise is
  silenced so your terminal only shows what matters.

---

## Requirements

| Requirement | Details |
|---|---|
| Node.js | v18.0.0 or higher |
| Ngrok account | Free tier works — [sign up here](https://ngrok.com) |
| Ngrok auth token | Get yours from the [Ngrok dashboard](https://dashboard.ngrok.com/get-started/your-authtoken) |

---

## Installation

```bash
npm install -g webhookforge
```

---

## Quick Start

**Step 1 — Save your Ngrok auth token**

```bash
webhookforge auth <YOUR_NGROK_AUTH_TOKEN>
```

This stores your token locally on your machine. You only need to do this once.  
Get your token at [dashboard.ngrok.com](https://dashboard.ngrok.com/get-started/your-authtoken).

**Step 2 — Start WebHookForge**

```bash
webhookforge listen
```

You'll see:

```
✔  Database ready
✔  Server running on http://localhost:3000
✔  Ngrok tunnel established

   Public relay URL  →  https://abc123.ngrok-free.app
   Dashboard         →  http://localhost:3000
```

**Step 3 — Point your service at the relay URL**

Copy the public relay URL from your terminal and paste it into your
Stripe, Razorpay, or GitHub webhook settings.

WebHookForge generates a unique relay ID automatically. Your full
webhook endpoint will look like this:

```
https://abc123.ngrok-free.app/w/<relay-id>
```

The `<relay-id>` is shown in your dashboard once the tunnel is live.

**Step 4 — Open the dashboard**

Navigate to `http://localhost:3000` in your browser.  
Every incoming webhook appears here in real time.

---

## Commands

```bash
webhookforge auth <token>          # Save your Ngrok auth token (run once)
webhookforge listen                # Start server, tunnel, and dashboard
webhookforge clear                 # Delete all stored webhooks from local DB
webhookforge --version             # Show installed version
webhookforge --help                # Show all available commands
```

## Flags

```bash
webhookforge listen --port <number>   # Run on a custom port (default: 3000)
```

---

## How Replay Works

1. Open the dashboard at `http://localhost:3000`
2. Click any stored webhook to expand it
3. Click **Replay**
4. WebHookForge re-sends the exact payload — same headers, same body,
   same cryptographic signature — to your local backend
5. Check your server logs for the result

No need to wait for Stripe or GitHub to send another test event.

---

## Full Documentation

Complete architecture, integration guides:  
→ [github.com/ITZVERMA007/WebHookForge](https://github.com/ITZVERMA007/WebHookForge)

---

## License

MIT © [Parth Verma](https://github.com/ITZVERMA007)
