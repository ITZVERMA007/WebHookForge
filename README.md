# WebHookForge

A local CLI tool for catching, inspecting, and replaying webhooks during development.

No tunnels. No config files. No noise.

---

## The problem

When an external API sends a webhook to your local machine, you have two options: expose your machine to the internet via a tunnel, or add `console.log` everywhere and hope you catch it. Neither is great.

WebHookForge gives you a third option — spin up a local relay server, open the dashboard, and watch every incoming payload land in real time. If something goes wrong, replay it with one click.

---

## Features

- **No setup required** — backed by SQLite. No `.env` files, no Docker, no external database.
- **Live dashboard** — webhooks appear in your browser the moment they arrive, streamed over WebSocket.
- **Replay any request** — re-trigger any saved payload against your backend whenever you need to.
- **Resilient connection** — exponential backoff reconnection, heartbeats, and payload size limiting built in.
- **Clean CLI** — built with Commander.js, works exactly how you'd expect a CLI tool to work.

---

## Installation

```bash
npm install -g webhookforge-parth
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
```

---

## License

MIT

[![npm version](https://img.shields.io/npm/v/webhookforge-parth.svg?style=flat-square)](https://www.npmjs.com/package/webhookforge-parth)
