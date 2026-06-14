# WebHookForge 🪝


[![npm version](https://img.shields.io/npm/v/webhookforge?color=blue&label=npm)](https://www.npmjs.com/package/webhookforge)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-brightgreen)](https://nodejs.org)
[![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20Mac%20%7C%20Linux-lightgrey)](#)

**A zero-config local CLI for catching, inspecting, and replaying webhooks during development.**

No cloud. No external database. Runs entirely on your machine.

[Installation](#installation) · [Quick Start](#quick-start) · [Features](#features) · [Usage](#usage) · [NPM Package](https://www.npmjs.com/package/webhookforge)


---

## The Problem

When Stripe, Razorpay, or GitHub sends a webhook to your app, your local
server is invisible to them. Your backend runs on `localhost` — and the
internet cannot reach `localhost`.

The typical workaround is painful:

1. Open a tunnel manually, copy the URL, paste it into Stripe's dashboard
2. Trigger a test event and hope your handler runs correctly
3. If it fails, wait for another event — or set up retries you don't have time for
4. Scatter `console.log` everywhere trying to see what was actually sent

That's 20–30 minutes of setup before you've written a single line of business logic.

**WebHookForge gives you a better option.**

---

## What It Does

Spin up one command. Get a live public URL, a real-time dashboard, and
persistent webhook storage — all running locally on your machine.

```bash
webhookforge listen
```

That's it. WebHookForge handles everything else.

---

## Features

#### 🔌 Zero-Config Tunnels
Automatically provisions a secure public HTTPS tunnel via the Ngrok API.
No manual setup, no copy-pasting URLs — the public relay address is printed
to your terminal the moment the CLI starts.

#### 🔬 The Raw Network Truth
Captures exact HTTP headers, raw JSON bodies, and cryptographic signatures
(e.g. `Stripe-Signature`, `X-Hub-Signature-256`) before any parsing occurs.
What you see is exactly what hit your server — byte for byte.

#### ⚡ Live WebSocket Dashboard
Every incoming webhook appears in your browser the millisecond it arrives.
No polling, no refreshing. Powered by a persistent WebSocket connection
between the server and the UI.

#### 🔁 One-Click Replay
Stored a webhook you need to test against updated handler logic?
Re-trigger any saved payload against your actual backend with one click.
Exact headers, exact body, exact signature — nothing is modified.

#### 💾 Resilient Local Storage
Backed by a SQLite database stored in your home directory with automated
Prisma migrations that run on startup. Your webhook history persists across
CLI restarts. Wipe everything clean with one command when you're done.

#### 🖥️ Clean Terminal Output
Built with Commander.js. Background UI traffic and internal server logs are
silenced so your terminal only shows what matters — incoming payloads and
relay activity.

---

## Requirements

| Requirement | Version |
|---|---|
| Node.js | 18.0.0 or higher |
| npm | 8.0.0 or higher |
| Ngrok account | Free tier works — [sign up here](https://ngrok.com) |
| Ngrok Auth Token | Get yours from the [Ngrok dashboard](https://dashboard.ngrok.com/get-started/your-authtoken) |

---

## Installation

Install WebHookForge globally via npm:

```bash
npm install -g webhookforge
```

Verify the installation:

```bash
webhookforge --version
```

---

## Quick Start

**Step 1 — Save your Ngrok auth token**

```bash
webhookforge auth <YOUR_NGROK_AUTH_TOKEN>
```

Get your token from [dashboard.ngrok.com](https://dashboard.ngrok.com/get-started/your-authtoken).
This is stored locally on your machine and never leaves it.

**Step 2 — Start WebHookForge**

```bash
webhookforge listen
```

You'll see output like this:

```
✔  Database ready
✔  Server running on http://localhost:3000
✔  Ngrok tunnel established

   Public relay URL:
   https://abc123.ngrok-free.app/w/relay

   Dashboard:
   http://localhost:3000

   Listening for webhooks...
```

**Step 3 — Point your service at the relay URL**

Copy the public relay URL and paste it into your Stripe, Razorpay, or GitHub
webhook settings. WebHookForge catches everything from there.

**Step 4 — Open the dashboard**

Navigate to `http://localhost:3000` in your browser. Every webhook that
arrives will appear here in real time.

---

## Usage

### Commands

```bash
webhookforge start                          # Start the server, tunnel, and dashboard
webhookforge auth <YOUR_NGROK_AUTH_TOKEN>   # Save your Ngrok auth token locally
webhookforge clear                          # Delete all stored webhooks
webhookforge --help                         # Show all available commands
webhookforge --version                      # Show current version
```

### Replaying a Webhook

1. Open the dashboard at `http://localhost:3000`
2. Click on any stored webhook to expand it
3. Click **Replay** — WebHookForge re-sends the exact payload to your local backend
4. Check your server logs for the result

### Integrating with Stripe

1. Run `webhookforge listen` and copy the public relay URL
2. Go to **Stripe Dashboard**
3. Paste the relay URL
4. Send a test event from Stripe
5. Watch it arrive instantly on the WebHookForge dashboard

Works identically with Razorpay, GitHub, Shopify, and any service that sends HTTP webhooks.

---

## Architecture

WebHookForge runs entirely on your local machine. No cloud services,
no external databases, no data leaves your computer.

```
External Service (Stripe / Razorpay / GitHub)
        │
        │  POST request
        ▼
  Ngrok Tunnel (public HTTPS URL)
        │
        │  forwards to
        ▼
  Express Server (localhost:3000)
        │
   ┌────┴────┐
   │         │
   ▼         ▼
SQLite    WebSocket
Database  Server
(stored   │
locally)  │  broadcasts to
          ▼
    Browser Dashboard
          │
          │  replay click
          ▼
  Your Local Backend
```

| Layer | Technology | Why |
|---|---|---|
| CLI | Commander.js | Lightweight, composable command structure |
| Server | Node.js + Express | Non-blocking I/O |
| Tunneling | Ngrok API | Programmatic tunnel management without a separate process |
| Real-time | WebSockets (`ws`) | Persistent push — no polling overhead |
| Database | SQLite | Zero external dependencies, runs embedded |
| ORM | Prisma | Automated local migrations, type-safe queries |
| Language | TypeScript | Type safety across CLI, server, and DB layer |

---

## License

MIT © [Parth Verma](https://github.com/ITZVERMA007)
