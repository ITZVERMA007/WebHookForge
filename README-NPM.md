# WebHookForge

A local CLI tool for catching, inspecting, and replaying webhooks during development.

Zero-config tunnels. No `.env` files. No noise.

---

## The problem

When an external API sends a webhook to your local machine, you have two options: expose your machine to the internet via a tunnel, or add `console.log` everywhere and hope you catch it. Neither is great.

WebHookForge gives you a third option — spin up a local relay server, open the dashboard, and watch every incoming payload land in real time. If something goes wrong, replay it with one click.

---

## Features

- **Zero-Config Tunnels** — Automatically provisions a secure, public HTTPS tunnel via Ngrok so external APIs can reach your local machine instantly.
- **The Raw Network Truth** — Captures the exact HTTP headers, raw JSON bodies, and cryptographic signatures (e.g., `Stripe-Signature`) so you know exactly what is hitting your server.
- **Live WebSocket Dashboard** — Webhooks appear in your browser the millisecond they arrive. No refreshing required.
- **One-Click Replay** — Re-trigger any saved payload against your actual backend logic whenever you need to.
- **Resilient Storage** — Backed by a local SQLite database. Restart your computer without losing your test data, and wipe the database clean with one click when you are done.
- **Clean CLI** — Built with Commander.js. Background UI traffic is silenced so your terminal only shows the logs that matter.

---

## Installation

```bash
npm install -g webhookforge
```

---

## Usage

```bash
webhookforge listen
```

Then point your webhook provider to:

```
http://localhost:3000/w/<your-id>
```

Open `http://localhost:3000` in your browser to see the dashboard.

---

## Options

```
webhookforge listen --port <number>   Run on a custom port (default: 3000)
webhookforge --help                   Show available commands
webhookforge --version                Show the installed version
webhookforge auth <your-token>        Token to create the Ngrok tunnel 
webhookforge clear                    This is used to remove all webhooks stored
```

---

## License

MIT

[![npm version](https://img.shields.io/npm/v/webhookforge.svg?style=flat-square)](https://www.npmjs.com/package/webhookforge)
