# WebHookForge 

[![npm version](https://img.shields.io/npm/v/webhookforge.svg?style=flat-square)](https://www.npmjs.com/package/webhookforge)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

A local CLI tool for catching, inspecting, and replaying webhooks during development.

Zero-config tunnels. No `.env` files. No noise.

---

## The Problem

When an external API (Stripe, Razorpay) sends a webhook to your local machine, you have two options: expose your machine to the internet via a tunnel, or add `console.log` everywhere and hope you catch it. Neither is great.

**WebHookForge** gives you a third option — spin up a local relay server, open the dashboard, and watch every incoming payload land in real time. If something goes wrong, replay it with one click.

---

## Features

- **Zero-Config Tunnels** — Automatically provisions a secure, public HTTPS tunnel via Ngrok so external APIs can reach your local machine instantly.
- **The Raw Network Truth** — Captures exact HTTP headers, raw JSON bodies, and cryptographic signatures (e.g., `Stripe-Signature`) so you know exactly what is hitting your server.
- **Live WebSocket Dashboard** — Webhooks appear in your browser the millisecond they arrive. No refreshing required.
- **One-Click Replay** — Re-trigger any saved payload against your actual backend logic whenever you need to.
- **Resilient Storage** — Backed by a local SQLite database with automated Prisma migrations. Wipe the database with one click when you are done.
- **Clean CLI** — Built with Commander.js. Background UI traffic is silenced so the terminal only shows the logs that matter.

---

## Architecture & Tech Stack

WebHookForge is built to be lightweight and run entirely on the user's machine without external database dependencies.

* **CLI Framework:** Commander.js
* **Backend:** Node.js / Express
* **Database:** SQLite (Stored locally in the user's home directory)
* **ORM:** Prisma (Handles dynamic schema generation)
* **Real-Time Streaming:** WebSockets
* **Public Tunnels:** Ngrok API

---

## Installation (For End Users)

```bash
npm install -g webhookforge
