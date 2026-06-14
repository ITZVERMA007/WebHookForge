# 🔨 WebHookForge — Complete Build Guide

> **Build a local developer CLI tool for capturing, inspecting, and replaying webhooks — from scratch in 4 weeks.**
> Stack: Node.js · Express · TypeScript · PostgreSQL · Prisma ORM · WebSockets · Commander.js
> Time: 1–2 hrs/day · Ship a globally installable CLI tool by Week 4.

---

## Table of Contents

1. [What Are We Building & Why?](#1-what-are-we-building--why)
2. [Prerequisites & Environment Setup](#2-prerequisites--environment-setup)
3. [System Architecture Deep Dive](#3-system-architecture-deep-dive)
4. [Week 1 — Receive & Store Webhooks](#4-week-1--receive--store-webhooks)
5. [Week 2 — REST API + Basic Dashboard](#5-week-2--rest-api--basic-dashboard)
6. [Week 3 — WebSockets — Live Updates](#6-week-3--websockets--live-updates)
7. [Week 4 — Replay & Package as a CLI Tool](#7-week-4--replay--package-as-a-cli-tool)
8. [Final Folder Structure](#8-final-folder-structure)
9. [Glossary of Backend Concepts](#9-glossary-of-backend-concepts)
10. [Troubleshooting & Common Mistakes](#10-troubleshooting--common-mistakes)
11. [What to Learn Next](#11-what-to-learn-next)

---

## 1. What Are We Building & Why?

### The Problem

When you integrate with external services (Stripe for payments, GitHub for CI/CD, Twilio for SMS), those services need a way to **notify your server** when something happens. They do this by sending an HTTP POST request to a URL you provide — this is called a **webhook**.

But during development:
- You can't easily inspect what data Stripe sent you
- If your server was down, that webhook is **gone forever**
- You can't replay a webhook to test your handler again
- You have no visibility into what's arriving in real-time

### The Solution — WebHookForge

WebHookForge is a **local developer CLI tool** that you run on your own machine to bypass firewalls and test webhooks locally. Any service POSTs to your local relay URL, and WebHookForge:

1. **Captures** the full request (headers, body, method, timestamp)
2. **Stores** it in a database so nothing is lost
3. **Broadcasts** it live to your dashboard via WebSockets
4. **Lets you replay** it to any target URL for re-testing

Think of it as **Postman + request logger + real-time dashboard** in one tool — like Stripe CLI or Ngrok, but built by you.

### Why This Project is Perfect for Learning Backend

| Concept | Where You'll Use It |
|---|---|
| HTTP request/response cycle | Every single route |
| REST API design | GET, POST, DELETE endpoints |
| Database operations (CRUD) | Prisma ORM with PostgreSQL for every webhook |
| Middleware pattern | Error handling |
| Real-time communication | WebSocket server |
| Server as HTTP client | Replay (outbound requests) |
| CLI tool packaging | Commander.js + npm link |
| Environment configuration | dotenv, .env files |

---

## 2. Prerequisites & Environment Setup

### What You Need Installed

#### 1. Node.js (v18 or later)

Node.js is a **JavaScript runtime** — it lets you run JavaScript and TypeScript outside a browser, on your server. We'll use **TypeScript** throughout this project for type safety and a better developer experience.

```bash
# Check if you have Node installed
node --version    # Should show v18.x.x or higher
npm --version     # npm comes with Node — should show 9.x or higher
```

**If not installed:** Download from [nodejs.org](https://nodejs.org/) — pick the **LTS** (Long Term Support) version.

> **💡 What is npm?** npm (Node Package Manager) is like an app store for JavaScript libraries. When we type `npm install express`, npm downloads the Express library and all *its* dependencies into a `node_modules/` folder in your project.

#### 2. A Code Editor

Use **VS Code** — it has the best Node.js support with built-in terminal, debugging, and extensions.

Recommended VS Code extensions:
- **ESLint** — catches code mistakes
- **REST Client** — test API endpoints without leaving VS Code
- **Prisma** — syntax highlighting, auto-completion, and formatting for `.prisma` schema files (official extension by Prisma)
- **PostgreSQL Explorer** — inspect your database visually (e.g., *ckolkman.vscode-postgres*)

#### 3. curl (for testing)

curl is a command-line tool to make HTTP requests. It comes pre-installed on macOS/Linux. On Windows, use PowerShell's `Invoke-WebRequest` or install curl via Git Bash.

```bash
# Test that curl works
curl --version
```

**Windows alternative using PowerShell:**
```powershell
# PowerShell equivalent of curl
Invoke-RestMethod -Method POST -Uri "http://localhost:3000/w/test" -ContentType "application/json" -Body '{"event":"ping"}'
```

#### 4. PostgreSQL (required)

You need a running PostgreSQL server. You can either:
- **Install locally:** Download from [postgresql.org](https://www.postgresql.org/download/)
- **Use Docker:** `docker run --name webhookforge-pg -e POSTGRES_PASSWORD=secret -e POSTGRES_DB=webhookforge -p 5432:5432 -d postgres:16-alpine`
- **Use a cloud provider:** [Neon](https://neon.tech), [Supabase](https://supabase.com), or [Railway](https://railway.app) offer free tiers

```bash
# Check if psql CLI is available (comes with PostgreSQL)
psql --version
```

> **💡 Easiest option for beginners:** Use the Docker command above. It gives you a fully configured PostgreSQL instance with zero setup. Just make sure Docker Desktop is running first.

---

### Initialize the Project

Open your terminal and run:

```bash
# Navigate to your project directory
cd e:\WebHookForge

# Initialize a new Node.js project
npm init -y
```

> **⚠️ What does `npm init -y` do?**
> It creates a `package.json` file — the manifest of your project. The `-y` flag accepts all defaults.
> `package.json` tracks:
> - Your project's name, version, and description
> - All dependencies (libraries your code needs)
> - Scripts (shortcuts like `npm start`)

Your `package.json` will look like this:

```json
{
  "name": "webhookforge",
  "version": "1.0.0",
  "description": "A webhook relay and debugger",
  "main": "server.ts",
  "scripts": {
    "start": "tsx server.ts",
    "dev": "tsx watch server.ts",
    "build": "tsc",
    "start:prod": "node dist/server.js"
  },
  "keywords": ["webhook", "relay", "debugger"],
  "author": "Your Name",
  "license": "MIT"
}
```

> **💡 Tip:** Edit `package.json` manually to add the scripts shown above.
> - `npm start` runs your server using `tsx` (a fast TypeScript executor)
> - `npm run dev` runs with `tsx watch` which auto-restarts when you change `.ts` files
> - `npm run build` compiles TypeScript to JavaScript for production
> - `npm run start:prod` runs the compiled JavaScript output

### Create a `.gitignore`

```gitignore
node_modules/
.env
dist/
```

> **📝 Why exclude these?**
> - `node_modules/` — contains thousands of files; anyone can regenerate them with `npm install`
> - `.env` — contains secrets (API keys, database credentials, ports); never commit secrets
> - `dist/` — compiled JavaScript output from TypeScript; regenerated by `npm run build`

### Create `tsconfig.json`

This configures the TypeScript compiler for our project:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "strict": true,
    "outDir": "./dist",
    "rootDir": ".",
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true
  },
  "include": ["**/*.ts"],
  "exclude": ["node_modules", "dist", "public"]
}
```

> **⚠️ What is `tsconfig.json`?**
>
> This file tells TypeScript how to compile your code. Key options:
> - `"strict": true` — enables all strict type-checking options (catches more bugs at compile time)
> - `"target": "ES2022"` — compile to modern JavaScript (Node 18+ supports this)
> - `"module": "ES2022"` — use ESM `import`/`export` syntax
> - `"outDir": "./dist"` — compiled JavaScript goes into a `dist/` folder
> - `"esModuleInterop": true` — allows `import express from 'express'` syntax with CommonJS packages

---

## 3. System Architecture Deep Dive

Before writing a single line of code, let's understand how every piece connects.

### Request Flow Diagram

```
┌──────────────────────┐
│   External Service   │   (Stripe, GitHub, your curl command)
│   sends POST to      │
│   /w/:relayId        │
└─────────┬────────────┘
          │
          ▼
┌──────────────────────┐
│   Express Server     │   server.js (port 3000)
│   ┌────────────────┐ │
│   │  Middleware     │ │   1. Parse JSON body
│   │  (body parser) │ │
│   └───────┬────────┘ │
│           ▼          │
│   ┌────────────────┐ │
│   │  Router        │ │   2. Match URL to handler
│   │  /w/:relayId   │ │   3. Extract relayId from URL
│   └───────┬────────┘ │
│           ▼          │
│   ┌────────────────┐ │
│   │  Route Handler │ │   4. Build webhook object
│   │  webhook.js    │ │   5. Save to database
│   └───────┬────────┘ │
│           │          │
│           ├──────────┼──▶  PostgreSQL DB      (persistent storage)
│           │          │
│           ├──────────┼──▶  WebSocket Server  (live broadcast)
│           │          │
│           ▼          │
│   ┌────────────────┐ │
│   │  Response 200  │ │   6. Tell sender "got it"
│   └────────────────┘ │
└──────────────────────┘
          │
          ▼
┌──────────────────────┐
│   Browser Dashboard  │   public/index.html
│   - Fetches via REST │   GET /webhooks
│   - Live via WS      │   ws://localhost:3000
│   - Replay button    │   POST /webhooks/:id/replay
└──────────────────────┘
```

### Component Breakdown

| Component | Technology | File(s) | Responsibility |
|---|---|---|---|
| **HTTP Server** | Express.js | `server.ts` | Accept connections, route requests |
| **Database** | Prisma ORM + PostgreSQL | `prisma/schema.prisma`, `db.ts` | Persist webhook data with type-safe queries |
| **Webhook Receiver** | Express Router | `routes/webhook.ts` | Capture incoming POSTs |
| **REST API** | Express Router | `routes/webhooks.ts` | List, get, delete webhooks |
| **WebSocket** | ws library | `ws/server.ts`, `ws/broadcast.ts` | Real-time push to browsers |
| **Replay Engine** | Built-in fetch | `routes/replay.ts` | Re-send webhooks to targets |
| **Error Handler** | Express middleware | `middleware/error.ts` | Consistent error responses |
| **Dashboard** | Vanilla HTML/JS | `public/` | UI for humans |
| **CLI** | Commander.js | `cli.ts` | Parse commands, start server |

---

## 4. Week 1 — Receive & Store Webhooks

### 🎯 Goal

> Any service can POST to your relay URL. The request is saved to a database. You can verify it in the terminal.

### What You'll Learn This Week

- How an HTTP request is structured (method, headers, body)
- How Express receives and parses requests
- What middleware is and why it matters
- How to create a PostgreSQL database and write SQL
- How environment variables keep your config flexible

---

### Step 1: Install Dependencies

```bash
npm install express dotenv uuid @prisma/client
npm install --save-dev prisma typescript tsx @types/node @types/express @types/uuid
```

Let's understand each package:

| Package | What It Does | Why We Need It |
|---|---|---|
| `express` | Web framework for Node.js | Handles HTTP routing, middleware, responses |
| `@prisma/client` | Auto-generated, type-safe database client | Provides intuitive methods like `prisma.webhook.create()` instead of raw SQL |
| `prisma` (dev) | Prisma CLI for migrations & schema management | Generates the client, runs migrations, provides Prisma Studio GUI |
| `dotenv` | Loads `.env` files | Keeps secrets/config out of code |
| `uuid` | Generates unique IDs | Every webhook gets a unique identifier |
| `typescript` (dev) | The TypeScript compiler | Compiles `.ts` files to JavaScript for production |
| `tsx` (dev) | TypeScript executor for Node.js | Runs `.ts` files directly during development — no compile step needed |
| `@types/node` (dev) | Type definitions for Node.js | Gives TypeScript knowledge of `process`, `Buffer`, `__dirname`, etc. |
| `@types/express` (dev) | Type definitions for Express | Gives TypeScript knowledge of `Request`, `Response`, `Router`, etc. |
| `@types/uuid` (dev) | Type definitions for uuid | Gives TypeScript knowledge of `v4()` and other uuid functions |

> **📝 Why Prisma ORM?**
> Prisma is a modern ORM (Object-Relational Mapper) for Node.js. Instead of writing raw SQL queries, you define your database schema in a `.prisma` file and interact with the database using type-safe JavaScript methods. Prisma handles connection pooling, query building, SQL injection prevention, and database migrations automatically. It's used in production by thousands of companies.

After installing, initialize Prisma in your project:

```bash
npx prisma init
```

> **⚠️ What does `npx prisma init` do?**
>
> It creates two things:
> - `prisma/schema.prisma` — The Prisma schema file where you define your database models
> - `.env` — A file with a placeholder `DATABASE_URL` (if one doesn't already exist)
>
> The `prisma/` folder is where all your database schema and migration files live.

---

### Step 2: Create the Environment File

**File: `.env`**

```env
PORT=3000
DATABASE_URL=postgresql://postgres:secret@localhost:5432/webhookforge
```

> **⚠️ What are environment variables?**
>
> Environment variables are key-value pairs that configure your application **without hardcoding values**.
>
> Why? Because:
> - In **development**, your database might be at `postgresql://postgres:secret@localhost:5432/webhookforge`
> - In **production**, it might be a cloud-hosted URL like `postgresql://user:pass@cloud-host:5432/webhookforge?sslmode=require`
> - You should **never** commit secrets (API keys, passwords, database credentials) to git
>
> The `dotenv` package reads your `.env` file and loads those values into `process.env`, which is a global object available everywhere in your Node.js code.
>
> **💡 The `DATABASE_URL` format:** `postgresql://username:password@host:port/database_name`
> This is called a **connection string** — it contains everything needed to connect to your PostgreSQL instance.

**How it works under the hood:**

```typescript
// Before dotenv
console.log(process.env.PORT);         // undefined
console.log(process.env.DATABASE_URL); // undefined

// After import 'dotenv/config'
console.log(process.env.PORT);         // "3000" (always a string!)
console.log(process.env.DATABASE_URL); // "postgresql://postgres:secret@localhost:5432/webhookforge"
```

---

### Step 3: Define the Database Schema

**File: `prisma/schema.prisma`**

```prisma
// prisma/schema.prisma
// This file defines the structure of our database.
// Think of it as a blueprint for a spreadsheet — but written in Prisma's
// schema language instead of raw SQL.

// ── Data Source ──
// Tells Prisma which database to connect to.
// The url comes from the DATABASE_URL environment variable.
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ── Generator ──
// Tells Prisma to generate a JavaScript client
// that we'll import in our code.
generator client {
  provider = "prisma-client-js"
}

// ── Webhook Model ──
// Each model becomes a table in the database.
// Each field becomes a column.
model Webhook {
  id        String   @id                          // Unique ID (UUID), primary key
  relayId   String   @map("relay_id")             // The relay channel this webhook came through
  method    String   @default("POST")             // HTTP method (POST, PUT, etc.)
  headers   Json                                  // Request headers (stored as PostgreSQL JSONB)
  body      Json?                                 // Request body (nullable — some requests have no body)
  query     Json?                                 // Query parameters
  sourceIp  String?  @map("source_ip")            // IP address of the sender
  timestamp DateTime @default(now())              // Timestamp with timezone (auto-set to current time)
  status    String   @default("received")         // Status: received, replayed, failed

  // ── Indexes ──
  // Speed up lookups by relay_id and sorting by timestamp
  @@index([relayId])
  @@index([timestamp(sort: Desc)])

  // ── Table Mapping ──
  // Use lowercase "webhooks" as the actual table name in PostgreSQL
  @@map("webhooks")
}
```

**After writing the schema, run your first migration:**

```bash
npx prisma migrate dev --name init
```

> **⚠️ What does `npx prisma migrate dev` do?**
>
> 1. Reads your `prisma/schema.prisma` file
> 2. Generates the SQL to create/update your database tables
> 3. Applies that SQL to your database
> 4. Generates the Prisma Client (`@prisma/client`) with methods matching your models
>
> The `--name init` flag gives this migration a human-readable name. Migration files are saved in `prisma/migrations/` — you should commit these to git.

> **📝 Prisma Schema Concepts Explained:**
>
> **`datasource db`** — Tells Prisma which database engine to use and where to find it. The `env("DATABASE_URL")` reads from your `.env` file.
>
> **`generator client`** — Instructs Prisma to generate a JavaScript/TypeScript client. After running `npx prisma generate`, you get auto-generated functions like `prisma.webhook.create()`, `prisma.webhook.findMany()`, etc.
>
> **`model Webhook`** — Defines a database table. The model name is PascalCase by convention. We use `@@map("webhooks")` to keep the actual table name lowercase.
>
> **`@id`** — Marks this field as the primary key. No two rows can have the same `id`.
>
> **`@default("POST")`** — If you don't specify a value, it automatically becomes `"POST"`. Same idea as SQL's `DEFAULT`.
>
> **`Json`** — Maps to PostgreSQL's `JSONB` type. Prisma automatically serializes/deserializes JSON, so you work with plain JavaScript objects in your code.
>
> **`DateTime`** — Maps to PostgreSQL's `TIMESTAMPTZ`. `@default(now())` auto-sets the timestamp when a row is created.
>
> **`@map("relay_id")`** — Prisma fields use `camelCase` (JavaScript convention), but the actual database column uses `snake_case` (SQL convention). `@map` bridges the two.
>
> **`@@index([relayId])`** — Creates a database index for fast lookups. Without an index on `relayId`, the database would scan every single row to find matches. With an index, it jumps directly to the right rows.
>
> **`?` (nullable)** — A `?` after the type means the field can be `null`. Fields without `?` are required (`NOT NULL` in SQL).

---

### Step 4: Create the Database Module

**File: `db.ts`**

```typescript
// db.ts
// This module handles all database operations.
// We create a Prisma client once and export async functions
// that other files can import.

import { PrismaClient, Prisma } from '@prisma/client';

// ──────────────────────────────────────────────
// Create the Prisma Client
// ──────────────────────────────────────────────
// PrismaClient manages the database connection for you.
// It automatically handles connection pooling (reusing connections),
// query building, and SQL injection prevention.
//
// Think of it like a personal assistant:
//   - Without Prisma: You write raw SQL, manage connections, parse results.
//   - With Prisma: You call methods like prisma.webhook.create() and get back typed objects.

const prisma = new PrismaClient({
    log: ['info', 'warn', 'error'],  // Log database activity for debugging
});

// ──────────────────────────────────────────────
// No manual schema initialization needed!
// ──────────────────────────────────────────────
// Unlike raw SQL where you'd read a schema.sql file and run it,
// Prisma handles this through migrations:
//   npx prisma migrate dev --name init
//
// This command reads your prisma/schema.prisma file,
// generates the SQL, and applies it to your database.
// It only needs to run once (or when you change the schema).

console.log('[DB] Prisma client initialized');

// ──────────────────────────────────────────────
// Type for webhook input data
// ──────────────────────────────────────────────
// TypeScript interfaces describe the shape of objects.
// This tells the compiler exactly what fields insert() expects.

interface WebhookInput {
    id: string;
    relay_id: string;
    method: string;
    headers: Record<string, unknown>;
    body?: Record<string, unknown> | null;
    query?: Record<string, unknown> | null;
    source_ip: string | null;
    timestamp: string;
    status: string;
}

interface DbResult {
    changes: number;
}

// ──────────────────────────────────────────────
// Export functions (the public API of this module)
// ──────────────────────────────────────────────
// All functions are ASYNC because database queries
// go over the network to the PostgreSQL server.
// We use await to wait for the database response.

/**
 * Insert a new webhook into the database.
 */
export async function insert(webhook: WebhookInput): Promise<DbResult> {
    await prisma.webhook.create({
        data: {
            id: webhook.id,
            relayId: webhook.relay_id,
            method: webhook.method,
            headers: webhook.headers,
            body: webhook.body || undefined,
            query: webhook.query || undefined,
            sourceIp: webhook.source_ip,
            timestamp: webhook.timestamp,
            status: webhook.status,
        },
    });
    return { changes: 1 };
}

/**
 * Get all webhooks with pagination.
 */
export async function getAll(limit: number = 20, offset: number = 0) {
    return prisma.webhook.findMany({
        orderBy: { timestamp: 'desc' },
        take: limit,
        skip: offset,
    });
}

/**
 * Get a single webhook by its ID.
 */
export async function getById(id: string) {
    return prisma.webhook.findUnique({
        where: { id },
    });
}

/**
 * Get all webhooks for a specific relay ID.
 */
export async function getByRelayId(relayId: string, limit: number = 20, offset: number = 0) {
    return prisma.webhook.findMany({
        where: { relayId },
        orderBy: { timestamp: 'desc' },
        take: limit,
        skip: offset,
    });
}

/**
 * Delete a webhook by its ID.
 */
export async function deleteById(id: string): Promise<DbResult> {
    try {
        await prisma.webhook.delete({
            where: { id },
        });
        return { changes: 1 };
    } catch (err) {
        // Prisma throws a typed error if the record doesn't exist
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
            return { changes: 0 };
        }
        throw err;
    }
}

/**
 * Get total count of all webhooks.
 */
export async function count(): Promise<number> {
    return prisma.webhook.count();
}

/**
 * Update the status of a webhook (e.g., after replay).
 */
export async function updateStatus(id: string, status: string): Promise<DbResult> {
    try {
        await prisma.webhook.update({
            where: { id },
            data: { status },
        });
        return { changes: 1 };
    } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
            return { changes: 0 };
        }
        throw err;
    }
}

// Expose the raw Prisma client for advanced use (transactions, etc.)
export const raw = prisma;
```

> **⚠️ Key Concept: SQL Injection — Why Prisma Is Safe by Default**
>
> With raw SQL, you must manually prevent SQL injection:
> ```javascript
> // ❌ DANGEROUS — SQL Injection vulnerability!
> pool.query(`SELECT * FROM webhooks WHERE id = '${userInput}'`);
> // If userInput = "'; DROP TABLE webhooks; --"
> // The database would DELETE YOUR ENTIRE TABLE
> ```
> **With Prisma, injection is impossible by design.** You never write SQL strings — you pass typed objects:
> ```typescript
> // ✅ SAFE — Prisma builds parameterized queries automatically
> prisma.webhook.findUnique({ where: { id: userInput } });
> // Prisma converts this to: SELECT * FROM webhooks WHERE id = $1
> // with userInput safely passed as a parameter
> ```
> Prisma generates parameterized SQL under the hood, so you can't accidentally introduce injection vulnerabilities.

> **💡 Why are all db functions `async`?**
>
> PostgreSQL is a **client-server** database — your Node.js app sends queries over the network to a separate database process. This takes time (even if it's just milliseconds), so we use **async/await** to avoid blocking the entire server while waiting for a response.
>
> ```typescript
> // Without async — the server FREEZES while waiting for the database
> const result = prisma.webhook.findMany();  // ❌ Returns a Promise, not data!
>
> // With async/await — the server handles other requests while waiting
> const result = await prisma.webhook.findMany();  // ✅ Waits properly, returns data
> ```
>
> Every function in `db.ts` is `async`, so every route handler that calls them must also be `async` and use `await`.

> **💡 Understanding `import` / `export`**
>
> In TypeScript (and modern JavaScript), every file is a **module**. By default, nothing inside a file is accessible from outside.
> `export` is how you make things public, and `import` is how you bring them in:
>
> ```typescript
> // db.ts exports functions
> export async function insert(webhook: WebhookInput) { ... }
> export async function getAll(limit: number = 20) { ... }
>
> // server.ts imports them
> import * as db from './db.js';
> db.insert(webhook);  // Works!
> db.raw;              // Also accessible (the Prisma client)!
> ```

> **💡 Prisma vs Raw SQL — Side by Side**
>
> | Operation | Raw SQL (`pg`) | Prisma |
> |---|---|---|
> | Insert | `pool.query('INSERT INTO webhooks (...) VALUES ($1, $2)', [id, relay_id])` | `prisma.webhook.create({ data: { id, relayId } })` |
> | Select all | `pool.query('SELECT * FROM webhooks ORDER BY timestamp DESC LIMIT $1', [20])` | `prisma.webhook.findMany({ orderBy: { timestamp: 'desc' }, take: 20 })` |
> | Find one | `pool.query('SELECT * FROM webhooks WHERE id = $1', [id])` | `prisma.webhook.findUnique({ where: { id } })` |
> | Update | `pool.query('UPDATE webhooks SET status = $1 WHERE id = $2', [status, id])` | `prisma.webhook.update({ where: { id }, data: { status } })` |
> | Delete | `pool.query('DELETE FROM webhooks WHERE id = $1', [id])` | `prisma.webhook.delete({ where: { id } })` |
> | Count | `pool.query('SELECT COUNT(*) FROM webhooks')` | `prisma.webhook.count()` |
>
> Notice how Prisma reads like plain English — no SQL syntax to memorize, no `$1`/`$2` placeholders, and the results are already typed TypeScript objects (no need for `result.rows`).

---

### Step 5: Create the Webhook Route

**File: `routes/webhook.ts`**

```typescript
// routes/webhook.ts
// This file handles incoming webhook POST requests.
// URL pattern: POST /w/:relayId
//
// :relayId is a "route parameter" — a dynamic part of the URL.
// Example: POST /w/stripe-payments → relayId = "stripe-payments"
//          POST /w/github-ci       → relayId = "github-ci"

import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import * as db from '../db.js';

// Create a new Router instance
// A Router is like a mini Express app that handles a subset of routes
const router = Router();

/**
 * POST /w/:relayId
 *
 * Receives a webhook from any external service.
 * Captures the full request and stores it in the database.
 *
 * How HTTP requests work:
 * ┌─────────────────────────────────────────────────┐
 * │  POST /w/stripe-payments HTTP/1.1               │ ← Request Line
 * │  Host: localhost:3000                            │ ← Header
 * │  Content-Type: application/json                  │ ← Header
 * │  X-Stripe-Signature: whsec_abc123               │ ← Header
 * │                                                  │
 * │  {"event": "payment.completed", "amount": 4999}  │ ← Body
 * └─────────────────────────────────────────────────┘
 *
 * Our job: capture ALL of this and save it.
 */
router.post('/w/:relayId', async (req: Request, res: Response) => {
    // req.params contains route parameters
    // For URL /w/stripe-payments → req.params.relayId = "stripe-payments"
    const { relayId } = req.params;

    // Build the webhook object
    // Note: We pass headers, body, and query as plain objects.
    // PostgreSQL's JSONB columns handle JSON serialization automatically.
    const webhook = {
        id: uuidv4(),                           // Generate a unique ID
        relay_id: relayId,                       // Which relay channel
        method: req.method,                       // "POST" (or whatever was sent)
        headers: req.headers as Record<string, unknown>,  // All headers (stored as JSONB)
        body: req.body as Record<string, unknown>,        // Request body (stored as JSONB)
        query: req.query as Record<string, unknown>,      // URL query params (stored as JSONB)
        source_ip: req.ip || req.socket?.remoteAddress || null, // Sender's IP address
        timestamp: new Date().toISOString(),       // Current time in ISO format
        status: 'received'                         // Initial status
    };

    // Save to database
    try {
        await db.insert(webhook);
        console.log(`[WEBHOOK] Received on relay "${relayId}" → ${webhook.id}`);

        // Respond with 200 OK and the webhook ID
        // We return the ID so the sender knows we saved it
        res.status(200).json({
            success: true,
            id: webhook.id,
            message: `Webhook received on relay "${relayId}"`
        });
    } catch (err) {
        const error = err as Error;
        console.error(`[WEBHOOK] Failed to store:`, error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to store webhook'
        });
    }
});

export default router;
```

> **📝 Understanding the Request Object (`req`)**
>
> Express gives your route handler a `req` (request) object with everything about the incoming request:
>
> | Property | What It Contains | Example |
> |---|---|---|
> | `req.method` | HTTP method | `"POST"` |
> | `req.params` | URL path parameters | `{ relayId: "stripe" }` |
> | `req.query` | URL query parameters | `{ page: "1" }` for `/w/x?page=1` |
> | `req.headers` | All HTTP headers | `{ "content-type": "application/json" }` |
> | `req.body` | Parsed request body | `{ event: "ping" }` |
> | `req.ip` | Client's IP address | `"127.0.0.1"` |
>
> **Understanding the Response Object (`res`)**
>
> | Method | What It Does | Example |
> |---|---|---|
> | `res.status(200)` | Set HTTP status code | `200` = OK, `404` = Not Found |
> | `res.json({...})` | Send JSON response | Auto-sets `Content-Type: application/json` |
> | `res.send("text")` | Send plain text | For simple responses |

---

### Step 6: Create the Server Entry Point

**File: `server.ts`**

```typescript
// server.ts
// This is the entry point of our application.
// It creates the Express app, wires up middleware and routes,
// and starts listening for incoming HTTP requests.

// ──────────────────────────────────────────────
// 1. Load environment variables FIRST
// ──────────────────────────────────────────────
// This must be at the very top, before any other imports,
// because other modules (like db.ts) might read process.env
import 'dotenv/config';

// ──────────────────────────────────────────────
// 2. Import dependencies
// ──────────────────────────────────────────────
import express, { Request, Response, NextFunction } from 'express';
import webhookRouter from './routes/webhook.js';

// ──────────────────────────────────────────────
// 3. Create the Express application
// ──────────────────────────────────────────────
const app = express();

// ──────────────────────────────────────────────
// 4. Register Middleware
// ──────────────────────────────────────────────
// Middleware functions run BEFORE your route handlers.
// They sit in the middle of the request-response cycle.
//
// Request → [Middleware 1] → [Middleware 2] → [Route Handler] → Response
//

// Parse JSON bodies
// Without this, req.body would be undefined for JSON requests
app.use(express.json({
    limit: '1mb'   // Reject bodies larger than 1 MB
}));

// Parse URL-encoded bodies (form submissions)
app.use(express.urlencoded({ extended: true }));

// Simple request logger middleware
// This runs for EVERY request and logs useful info
app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();

    // When the response finishes, log the duration
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(
            `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} → ${res.statusCode} (${duration}ms)`
        );
    });

    // IMPORTANT: call next() to pass control to the next middleware/route
    // Without next(), the request would hang forever
    next();
});

// ──────────────────────────────────────────────
// 5. Register Routes
// ──────────────────────────────────────────────
app.use('/', webhookRouter);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ──────────────────────────────────────────────
// 6. Start the Server
// ──────────────────────────────────────────────
const PORT: number = parseInt(process.env.PORT || '3000', 10);

const server = app.listen(PORT, () => {
    console.log('');
    console.log('╔═══════════════════════════════════════════╗');
    console.log('║         🔨 WebHookForge is running        ║');
    console.log(`║         http://localhost:${PORT}             ║`);
    console.log('╚═══════════════════════════════════════════╝');
    console.log('');
    console.log('  Try sending a test webhook:');
    console.log(`  curl -X POST http://localhost:${PORT}/w/test123 \\`);
    console.log(`       -H "Content-Type: application/json" \\`);
    console.log(`       -d '{"event":"ping"}'`);
    console.log('');
});

// Export the server and app for later use (WebSocket attachment in Week 3)
export { app, server };
```

> **⚠️ The Middleware Pipeline — How Express Processes Requests**
>
> Express processes a request by running through a chain of middleware functions in order:
>
> ```
> Incoming Request
>     │
>     ▼
> ┌─────────────────────┐
> │  express.json()      │   Parse JSON body
> │  Reads raw bytes,    │   Parses them as JSON
> │  Puts result in      │   Sets req.body = {...}
> │  req.body            │
> └─────────┬───────────┘
>           │ next()
>           ▼
> ┌─────────────────────┐
> │  Request Logger      │   Logs method, URL, status
> │  Custom middleware   │   Measures response time
> └─────────┬───────────┘
>           │ next()
>           ▼
> ┌─────────────────────┐
> │  Router              │   Matches URL to handler
> │  POST /w/:relayId    │   Runs the handler function
> │  Sends response      │
> └─────────────────────┘
> ```
>
> **Critical Rule:** Every middleware MUST either:
> 1. Call `next()` to pass to the next middleware, OR
> 2. Send a response (e.g., `res.json(...)`)
>
> If it does neither, the request hangs forever and the client times out.

---

### Step 7: Test Week 1

**Before starting the server, make sure you've run the migration:**
```bash
# Generate the database tables from your Prisma schema
npx prisma migrate dev --name init
```

```bash
# Start the server
npm run dev

# In a NEW terminal, send a test webhook
curl -X POST http://localhost:3000/w/test123 \
  -H "Content-Type: application/json" \
  -d '{"event":"ping","data":{"user":"parth"}}'
```

**On Windows PowerShell:**
```powershell
Invoke-RestMethod -Method POST `
  -Uri "http://localhost:3000/w/test123" `
  -ContentType "application/json" `
  -Body '{"event":"ping","data":{"user":"parth"}}'
```

**Expected output in your server terminal:**
```
[DB] Prisma client initialized
╔═══════════════════════════════════════════╗
║         🔨 WebHookForge is running        ║
║         http://localhost:3000             ║
╚═══════════════════════════════════════════╝

[WEBHOOK] Received on relay "test123" → 550e8400-e29b-41d4-a716-446655440000
[2026-04-22T16:35:00.000Z] POST /w/test123 → 200 (5ms)
```

**Expected response from curl:**
```json
{
  "success": true,
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Webhook received on relay \"test123\""
}
```

**Verify the database using Prisma Studio (built-in GUI):**
```bash
npx prisma studio
```

> **💡 Prisma Studio** opens a web-based database browser at `http://localhost:5555`. You can view, filter, and edit your data visually — no need to write SQL queries or install a separate database GUI tool.

> **🎉 Congratulations!** You've built the core of your backend:
> - An HTTP server that accepts requests
> - A middleware pipeline that processes them
> - A route handler that captures data
> - A database that persists it
>
> This is how 90% of backend applications work at their core.

### Week 1 Key Concepts Summary

| Concept | What You Learned | Why It Matters |
|---|---|---|
| **HTTP Lifecycle** | Request = method + headers + body → Server processes → Response = status + body | Every web API is built on this cycle |
| **Express Middleware** | Functions that process requests in a chain via `next()` | Separation of concerns — each middleware does one thing |
| **Prisma ORM** | Define schema in `.prisma`, query with `prisma.webhook.create()` / `findMany()` — no raw SQL needed | Type-safe, readable database access used in production everywhere |
| **Migrations** | `npx prisma migrate dev` generates and applies database changes from your schema | Schema changes are tracked, versioned, and reproducible |
| **Environment Variables** | `.env` + `dotenv` → `process.env.KEY` | Never hardcode config/secrets |
| **TypeScript** | Type annotations, `import`/`export`, `tsconfig.json` | Catches bugs at compile time, better IDE support |
| **UUIDs** | Universally unique identifiers for each webhook | No collisions, even across servers |
| **Route Parameters** | `/w/:relayId` → `req.params.relayId` | Dynamic URLs without separate routes |

---

## 5. Week 2 — REST API + Basic Dashboard

### 🎯 Goal

> Browse stored webhooks via API. A simple HTML page fetches and renders them.

### What You'll Learn This Week

- REST API design principles (resources, verbs, status codes)
- Pagination with LIMIT and OFFSET
- Serving static files with Express
- Fetch API for making requests from the browser
- Error handling middleware pattern

---

### Step 1: Create the REST API Routes

**File: `routes/webhooks.ts`** (note the plural — `webhooks` not `webhook`)

```typescript
// routes/webhooks.ts
// REST API for reading, querying, and deleting stored webhooks.
//
// REST (Representational State Transfer) principles:
//   - Resources are nouns: /webhooks (not /getWebhooks)
//   - HTTP verbs define actions: GET (read), POST (create), DELETE (remove)
//   - Status codes communicate results: 200 (ok), 404 (not found), 400 (bad request)
//
// Routes:
//   GET    /webhooks          → List all webhooks (paginated)
//   GET    /webhooks/:id      → Get a single webhook by ID
//   DELETE /webhooks/:id      → Delete a webhook by ID

import { Router, Request, Response } from 'express';
import * as db from '../db.js';
const router = Router();

/**
 * GET /webhooks
 * Returns a paginated list of webhooks, most recent first.
 *
 * Query Parameters:
 *   ?page=1        → Which page (default: 1)
 *   ?limit=20      → Items per page (default: 20, max: 100)
 *   ?relay_id=xyz  → Filter by relay ID (optional)
 *
 * Pagination Example:
 *   You have 50 webhooks, limit=20
 *   Page 1: items 1-20   (OFFSET 0)
 *   Page 2: items 21-40  (OFFSET 20)
 *   Page 3: items 41-50  (OFFSET 40)
 *
 *   OFFSET = (page - 1) * limit
 */
router.get('/webhooks', async (req: Request, res: Response) => {
    // Parse query parameters with defaults
    // parseInt converts string "2" to number 2
    // The || operator provides a fallback if parseInt returns NaN
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 20));
    const offset = (page - 1) * limit;
    const relayId = req.query.relay_id as string | undefined;

    let webhooks;
    let total: number;

    if (relayId) {
        // Filter by relay ID
        webhooks = await db.getByRelayId(relayId, limit, offset);
        // For simplicity, we'll use total count (you could add a filtered count)
        total = await db.count();
    } else {
        // Get all webhooks
        webhooks = await db.getAll(limit, offset);
        total = await db.count();
    }

    // No need to JSON.parse — PostgreSQL JSONB columns return parsed objects automatically!

    // Return paginated response with metadata
    res.json({
        data: webhooks,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasNext: page * limit < total,
            hasPrev: page > 1
        }
    });
});

/**
 * GET /webhooks/:id
 * Returns a single webhook with full details.
 *
 * URL Parameters:
 *   :id → The webhook UUID
 *
 * Status Codes:
 *   200 → Found and returned
 *   404 → Not found
 */
router.get('/webhooks/:id', async (req: Request, res: Response) => {
    const webhook = await db.getById(req.params.id);

    if (!webhook) {
        // 404 Not Found — the resource doesn't exist
        res.status(404).json({
            error: 'Not Found',
            message: `Webhook with id "${req.params.id}" does not exist`
        });
        return;
    }

    // No need to JSON.parse — PostgreSQL JSONB columns return parsed objects automatically!
    res.json(webhook);
});

/**
 * DELETE /webhooks/:id
 * Removes a webhook from the database.
 *
 * Status Codes:
 *   200 → Successfully deleted
 *   404 → Not found (nothing to delete)
 *
 * Idempotency:
 *   In REST, DELETE should be idempotent — calling it twice
 *   should have the same effect as calling it once.
 *   We return 404 on the second call (the resource is already gone).
 */
router.delete('/webhooks/:id', async (req: Request, res: Response) => {
    const result = await db.deleteById(req.params.id);

    if (result.changes === 0) {
        res.status(404).json({
            error: 'Not Found',
            message: `Webhook with id "${req.params.id}" does not exist`
        });
        return;
    }

    res.json({
        success: true,
        message: `Webhook "${req.params.id}" deleted`
    });
});

export default router;
```

> **📝 REST API Design Principles**
>
> | Principle | Meaning | Example |
> |---|---|---|
> | **Resources are nouns** | URLs represent things, not actions | `/webhooks` not `/getWebhooks` |
> | **HTTP verbs are actions** | GET=read, POST=create, PUT=update, DELETE=remove | `GET /webhooks` reads, `DELETE /webhooks/123` removes |
> | **Status codes communicate** | Numbers tell the client what happened | `200`=OK, `404`=Not found, `400`=Bad request, `500`=Server error |
> | **Stateless** | Each request contains all info needed | Don't rely on "the client already logged in" |
> | **Idempotent** | Same request multiple times = same result | `GET` and `DELETE` should be idempotent |

> **💡 HTTP Status Codes You Must Know**
>
> | Code | Name | When to Use |
> |---|---|---|
> | `200` | OK | Request succeeded |
> | `201` | Created | New resource was created |
> | `204` | No Content | Success, but nothing to return |
> | `400` | Bad Request | Client sent invalid data |
> | `401` | Unauthorized | Not authenticated (no credentials) |
> | `403` | Forbidden | Authenticated but not allowed |
> | `404` | Not Found | Resource doesn't exist |
> | `429` | Too Many Requests | Rate limit exceeded |
> | `500` | Internal Server Error | Something broke on the server |

---

### Step 2: Create Error Handling Middleware

**File: `middleware/error.ts`**

```typescript
// middleware/error.ts
// Centralized error handling middleware.
//
// In Express, error-handling middleware has FOUR parameters: (err, req, res, next)
// Express knows it's an error handler because of the 4 parameters.
// Regular middleware has 3: (req, res, next)
//
// When you call next(err) from any route, Express skips all remaining
// regular middleware and jumps directly to error handlers.

import { Request, Response, NextFunction } from 'express';

// Custom error interface for HTTP errors with status codes
interface HttpError extends Error {
    statusCode?: number;
    status?: number;
}

/**
 * Handle 404 — No route matched the request.
 * This middleware runs if no route handler sent a response.
 */
export function notFoundHandler(req: Request, res: Response, next: NextFunction): void {
    res.status(404).json({
        error: 'Not Found',
        message: `The route ${req.method} ${req.originalUrl} does not exist`,
        hint: 'Check the URL and HTTP method. Available endpoints: GET /webhooks, POST /w/:relayId'
    });
}

/**
 * Global error handler — catches all unhandled errors.
 * Must have exactly 4 parameters for Express to recognize it.
 */
export function errorHandler(err: HttpError, req: Request, res: Response, next: NextFunction): void {
    // Log the full error for debugging (server-side only)
    console.error(`[ERROR] ${req.method} ${req.originalUrl}:`, err);

    // Determine the status code
    const statusCode = err.statusCode || err.status || 500;

    // Send a clean error response to the client
    // NEVER expose stack traces in production!
    res.status(statusCode).json({
        error: err.name || 'Internal Server Error',
        message: err.message || 'Something went wrong',
        // Only include stack trace in development
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
}
```

> **🔴 Security: Never expose error stack traces in production!**
>
> Stack traces reveal your file structure, line numbers, and internal logic.
> An attacker could use this to find vulnerabilities.
>
> ```javascript
> // ❌ In production response:
> { "stack": "Error: DB failed\n    at /app/db.js:42:11\n    at ..." }
>
> // ✅ In production response:
> { "error": "Internal Server Error", "message": "Something went wrong" }
> ```

---

### Step 3: Update server.ts — Add New Routes

Update your `server.ts` to include the new routes and error handlers:

```typescript
// server.ts — UPDATED for Week 2
// Add these lines to your existing server.ts

import 'dotenv/config';

import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import webhookRouter from './routes/webhook.js';
import webhooksRouter from './routes/webhooks.js';    // ← NEW
import { notFoundHandler, errorHandler } from './middleware/error.js';  // ← NEW

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ── Middleware ──
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logger
app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(
            `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} → ${res.statusCode} (${duration}ms)`
        );
    });
    next();
});

// ── Static files (Dashboard) ──                           ← NEW
// express.static() serves files from a directory.
// Any file in public/ becomes accessible via URL:
//   public/index.html → http://localhost:3000/index.html
//   public/app.js     → http://localhost:3000/app.js
app.use(express.static(path.join(__dirname, 'public')));

// ── Routes ──
app.use('/', webhookRouter);       // POST /w/:relayId
app.use('/api', webhooksRouter);   // GET/DELETE /api/webhooks         ← NEW

// Health check
app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Error Handling ──                                      ← NEW
app.use(notFoundHandler);    // 404 for unmatched routes
app.use(errorHandler);       // 500 for uncaught errors

// ── Start Server ──
const PORT: number = parseInt(process.env.PORT || '3000', 10);
const server = app.listen(PORT, () => {
    console.log('');
    console.log('╔═══════════════════════════════════════════╗');
    console.log('║         🔨 WebHookForge is running        ║');
    console.log(`║         http://localhost:${PORT}             ║`);
    console.log('╚═══════════════════════════════════════════╝');
    console.log('');
});

export { app, server };
```

> **📝 Why `/api/webhooks` instead of just `/webhooks`?**
>
> We prefix API routes with `/api` to separate them from static file serving.
> Without it, `GET /webhooks` could conflict with a `public/webhooks.html` file.
> The `/api` prefix is a common convention:
> - `/api/webhooks` → JSON API response
> - `/` → Serves the HTML dashboard (public/index.html)
>
> **💡 Note on `__dirname` in ESM:** In CommonJS, `__dirname` is a built-in global. In ESM (which TypeScript uses), it doesn't exist. We recreate it using `fileURLToPath(import.meta.url)`.

---

### Step 4: Build the Dashboard

**File: `public/index.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WebHookForge — Dashboard</title>
    <style>
        /* ── CSS Reset + Variables ── */
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
            --bg-primary: #0a0a0f;
            --bg-secondary: #12121a;
            --bg-card: #1a1a2e;
            --border: #2a2a3e;
            --text-primary: #e4e4f0;
            --text-secondary: #8888a0;
            --accent: #6c63ff;
            --accent-hover: #5a52e0;
            --success: #4ade80;
            --danger: #ef4444;
            --warning: #fbbf24;
            --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
            --font-sans: 'Inter', -apple-system, sans-serif;
            --radius: 12px;
        }

        body {
            font-family: var(--font-sans);
            background: var(--bg-primary);
            color: var(--text-primary);
            line-height: 1.6;
            min-height: 100vh;
        }

        /* ── Header ── */
        header {
            background: var(--bg-secondary);
            border-bottom: 1px solid var(--border);
            padding: 1rem 2rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        header h1 {
            font-size: 1.5rem;
            background: linear-gradient(135deg, var(--accent), #a78bfa);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        #connection-status {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.85rem;
            color: var(--text-secondary);
        }

        #connection-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: var(--danger);
            transition: background 0.3s;
        }

        #connection-dot.connected {
            background: var(--success);
            box-shadow: 0 0 8px var(--success);
        }

        /* ── Stats Bar ── */
        .stats-bar {
            display: flex;
            gap: 1rem;
            padding: 1rem 2rem;
            background: var(--bg-secondary);
            border-bottom: 1px solid var(--border);
        }

        .stat {
            background: var(--bg-card);
            padding: 0.75rem 1.25rem;
            border-radius: var(--radius);
            border: 1px solid var(--border);
        }

        .stat-label {
            font-size: 0.75rem;
            color: var(--text-secondary);
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }

        .stat-value {
            font-size: 1.25rem;
            font-weight: 700;
            color: var(--accent);
        }

        /* ── Main Content ── */
        main {
            max-width: 1200px;
            margin: 2rem auto;
            padding: 0 2rem;
        }

        /* ── Webhook List ── */
        #webhook-list {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
        }

        .webhook-card {
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: var(--radius);
            padding: 1rem 1.25rem;
            cursor: pointer;
            transition: border-color 0.2s, transform 0.2s;
        }

        .webhook-card:hover {
            border-color: var(--accent);
            transform: translateY(-1px);
        }

        .webhook-card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 0.5rem;
        }

        .webhook-method {
            font-family: var(--font-mono);
            font-size: 0.75rem;
            font-weight: 700;
            padding: 0.2rem 0.5rem;
            border-radius: 4px;
            background: var(--accent);
            color: white;
        }

        .webhook-relay {
            font-family: var(--font-mono);
            font-size: 0.85rem;
            color: var(--text-primary);
        }

        .webhook-time {
            font-size: 0.8rem;
            color: var(--text-secondary);
        }

        .webhook-id {
            font-family: var(--font-mono);
            font-size: 0.7rem;
            color: var(--text-secondary);
        }

        .webhook-status {
            font-size: 0.7rem;
            padding: 0.15rem 0.4rem;
            border-radius: 4px;
        }

        .status-received { background: rgba(74, 222, 128, 0.15); color: var(--success); }
        .status-replayed { background: rgba(108, 99, 255, 0.15); color: var(--accent); }
        .status-failed   { background: rgba(239, 68, 68, 0.15); color: var(--danger); }

        /* ── Detail Panel ── */
        .detail-panel {
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: var(--radius);
            padding: 1.5rem;
            margin-top: 1rem;
            display: none;
        }

        .detail-panel.active { display: block; }

        .detail-section { margin-bottom: 1rem; }

        .detail-section h3 {
            font-size: 0.85rem;
            color: var(--text-secondary);
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 0.5rem;
        }

        pre {
            background: var(--bg-primary);
            padding: 1rem;
            border-radius: 8px;
            overflow-x: auto;
            font-family: var(--font-mono);
            font-size: 0.8rem;
            line-height: 1.5;
            border: 1px solid var(--border);
        }

        /* ── Buttons ── */
        .btn {
            padding: 0.5rem 1rem;
            border: none;
            border-radius: 8px;
            font-size: 0.85rem;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.2s, transform 0.1s;
        }

        .btn:active { transform: scale(0.97); }

        .btn-primary { background: var(--accent); color: white; }
        .btn-primary:hover { background: var(--accent-hover); }
        .btn-danger { background: transparent; border: 1px solid var(--danger); color: var(--danger); }
        .btn-danger:hover { background: rgba(239, 68, 68, 0.1); }
        .btn-group { display: flex; gap: 0.5rem; margin-top: 1rem; }

        /* ── Empty State ── */
        .empty-state { text-align: center; padding: 4rem 2rem; color: var(--text-secondary); }
        .empty-state h2 { margin-bottom: 0.5rem; color: var(--text-primary); }
        .empty-state code {
            display: inline-block;
            background: var(--bg-card);
            padding: 0.75rem 1rem;
            border-radius: 8px;
            font-family: var(--font-mono);
            font-size: 0.8rem;
            margin-top: 1rem;
            border: 1px solid var(--border);
        }

        /* ── Pagination ── */
        .pagination { display: flex; justify-content: center; gap: 0.5rem; margin-top: 2rem; }

        /* ── Animations ── */
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(8px); }
            to   { opacity: 1; transform: translateY(0); }
        }
        .webhook-card { animation: fadeIn 0.3s ease-out; }
    </style>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
</head>
<body>
    <header>
        <h1>🔨 WebHookForge</h1>
        <div id="connection-status">
            <div id="connection-dot"></div>
            <span id="connection-text">Disconnected</span>
        </div>
    </header>

    <div class="stats-bar">
        <div class="stat">
            <div class="stat-label">Total Webhooks</div>
            <div class="stat-value" id="stat-total">–</div>
        </div>
        <div class="stat">
            <div class="stat-label">Current Page</div>
            <div class="stat-value" id="stat-page">–</div>
        </div>
    </div>

    <main>
        <div id="webhook-list"></div>
        <div id="detail-panel" class="detail-panel"></div>
        <div class="pagination" id="pagination"></div>
    </main>

    <script src="app.js"></script>
    <!-- socket.js will be added in Week 3 -->
</body>
</html>
```

**File: `public/app.js`**

```javascript
// public/app.js
// Client-side JavaScript for the WebHookForge dashboard.
// This runs in the BROWSER, not in Node.js.
// It uses the Fetch API to talk to our Express server.

// ── State ──
let currentPage = 1;
const limit = 20;

// ── DOM Elements ──
const listEl = document.getElementById('webhook-list');
const detailEl = document.getElementById('detail-panel');
const paginationEl = document.getElementById('pagination');
const statTotal = document.getElementById('stat-total');
const statPage = document.getElementById('stat-page');

// ──────────────────────────────────────────────
// Fetch webhooks from the API
// ──────────────────────────────────────────────
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
        listEl.innerHTML = `<div class="empty-state"><h2>⚠️ Error</h2><p>${err.message}</p></div>`;
    }
}

// ──────────────────────────────────────────────
// Render webhook list
// ──────────────────────────────────────────────
function renderWebhooks(webhooks) {
    if (webhooks.length === 0) {
        listEl.innerHTML = `
            <div class="empty-state">
                <h2>No webhooks yet</h2>
                <p>Send your first webhook to get started:</p>
                <code>curl -X POST http://localhost:3000/w/test -H "Content-Type: application/json" -d '{"event":"ping"}'</code>
            </div>`;
        return;
    }

    listEl.innerHTML = webhooks.map(wh => `
        <div class="webhook-card" onclick="showDetail('${wh.id}')">
            <div class="webhook-card-header">
                <div>
                    <span class="webhook-method">${wh.method}</span>
                    <span class="webhook-relay">/w/${wh.relay_id}</span>
                </div>
                <span class="webhook-status status-${wh.status}">${wh.status}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
                <span class="webhook-id">${wh.id}</span>
                <span class="webhook-time">${formatTime(wh.timestamp)}</span>
            </div>
        </div>
    `).join('');
}

// ──────────────────────────────────────────────
// Show webhook detail
// ──────────────────────────────────────────────
async function showDetail(id) {
    try {
        const response = await fetch(`/api/webhooks/${id}`);
        if (!response.ok) throw new Error('Webhook not found');
        const wh = await response.json();

        detailEl.innerHTML = `
            <div class="detail-section">
                <h3>Webhook Info</h3>
                <p><strong>ID:</strong> ${wh.id}</p>
                <p><strong>Relay:</strong> /w/${wh.relay_id}</p>
                <p><strong>Method:</strong> ${wh.method}</p>
                <p><strong>Status:</strong> <span class="webhook-status status-${wh.status}">${wh.status}</span></p>
                <p><strong>Time:</strong> ${new Date(wh.timestamp).toLocaleString()}</p>
                <p><strong>Source IP:</strong> ${wh.source_ip || 'unknown'}</p>
            </div>
            <div class="detail-section">
                <h3>Headers</h3>
                <pre>${JSON.stringify(wh.headers, null, 2)}</pre>
            </div>
            <div class="detail-section">
                <h3>Body</h3>
                <pre>${wh.body ? JSON.stringify(wh.body, null, 2) : '(empty)'}</pre>
            </div>
            ${wh.query && Object.keys(wh.query).length > 0 ? `
            <div class="detail-section">
                <h3>Query Parameters</h3>
                <pre>${JSON.stringify(wh.query, null, 2)}</pre>
            </div>` : ''}
            <div class="btn-group">
                <button class="btn btn-primary" onclick="replayWebhook('${wh.id}')">🔄 Replay</button>
                <button class="btn btn-danger" onclick="deleteWebhook('${wh.id}')">🗑️ Delete</button>
            </div>`;

        detailEl.classList.add('active');
        detailEl.scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
        console.error('Failed to load webhook detail:', err);
    }
}

// ──────────────────────────────────────────────
// Delete a webhook
// ──────────────────────────────────────────────
async function deleteWebhook(id) {
    if (!confirm('Delete this webhook?')) return;
    try {
        const response = await fetch(`/api/webhooks/${id}`, { method: 'DELETE' });
        if (response.ok) {
            detailEl.classList.remove('active');
            fetchWebhooks(currentPage);
        }
    } catch (err) {
        console.error('Failed to delete webhook:', err);
    }
}

// ──────────────────────────────────────────────
// Replay a webhook (Week 4 feature — wired up early)
// ──────────────────────────────────────────────
async function replayWebhook(id) {
    const targetUrl = prompt('Enter the target URL to replay this webhook to:');
    if (!targetUrl) return;

    try {
        const response = await fetch(`/api/webhooks/${id}/replay`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ target_url: targetUrl })
        });
        const result = await response.json();

        if (response.ok) {
            alert(`✅ Replayed successfully!\n\nTarget responded with: ${result.replay.status} ${result.replay.statusText}`);
            fetchWebhooks(currentPage);
        } else {
            alert(`❌ Replay failed: ${result.message}`);
        }
    } catch (err) {
        alert(`❌ Error: ${err.message}`);
    }
}

// ──────────────────────────────────────────────
// Render pagination controls
// ──────────────────────────────────────────────
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

// ──────────────────────────────────────────────
// Utility: format timestamp
// ──────────────────────────────────────────────
function formatTime(isoString) {
    const date = new Date(isoString);
    const now = new Date();
    const diffSecs = Math.floor((now - date) / 1000);
    if (diffSecs < 60) return `${diffSecs}s ago`;
    if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)}m ago`;
    if (diffSecs < 86400) return `${Math.floor(diffSecs / 3600)}h ago`;
    return date.toLocaleDateString();
}

// ── Initial Load ──
fetchWebhooks(1);
```

> **📝 Understanding `async/await` and Promises**
>
> The Fetch API is **asynchronous** — it sends a request and doesn't wait for the response. Instead, it returns a **Promise** — an object that represents a future value.
>
> ```javascript
> // Promise with .then() (old way)
> fetch('/api/webhooks')
>     .then(response => response.json())
>     .then(data => console.log(data))
>     .catch(err => console.error(err));
>
> // async/await (modern way — same thing, but easier to read)
> async function loadData() {
>     try {
>         const response = await fetch('/api/webhooks');
>         const data = await response.json();
>         console.log(data);
>     } catch (err) {
>         console.error(err);
>     }
> }
> ```
>
> `await` pauses the function until the Promise resolves. The function must be marked `async` to use `await`.

---

### Step 5: Test Week 2

```bash
# Start the server
npm run dev

# Send a few test webhooks
curl -X POST http://localhost:3000/w/stripe -H "Content-Type: application/json" -d '{"event":"payment.completed","amount":4999}'
curl -X POST http://localhost:3000/w/github -H "Content-Type: application/json" -d '{"event":"push","branch":"main"}'
curl -X POST http://localhost:3000/w/stripe -H "Content-Type: application/json" -d '{"event":"invoice.created","customer":"cus_123"}'

# Test the REST API
curl http://localhost:3000/api/webhooks                   # List all
curl http://localhost:3000/api/webhooks?limit=2            # Paginated
curl "http://localhost:3000/api/webhooks?relay_id=stripe"  # Filtered
curl http://localhost:3000/api/webhooks/<paste-an-id-here> # Get one

# Open the dashboard in your browser
# Navigate to: http://localhost:3000
```

### Week 2 Key Concepts Summary

| Concept | What You Learned | Why It Matters |
|---|---|---|
| **REST Design** | Resources, HTTP verbs, idempotency | Universal API pattern used everywhere |
| **Query Parameters** | `?page=2&limit=10` for filtering/pagination | Keep URLs clean, parameters optional |
| **Pagination** | LIMIT + OFFSET in SQL | Without it, listing 1M records would crash your server |
| **Status Codes** | 200, 400, 404, 500 — each means something specific | Clients depend on these to handle responses correctly |
| **Error Handling** | Centralized error middleware with 4 parameters | Consistent error format across the entire API |
| **Static Files** | `express.static()` serves HTML, CSS, JS from a folder | Your API server can also serve your frontend |
| **Fetch API** | Browser-side HTTP requests with `async/await` | How frontend talks to backend |

---

## 6. Week 3 — WebSockets — Live Updates

### 🎯 Goal

> New webhook arrives → dashboard updates instantly, zero refresh.

### What You'll Learn This Week

- The gap between HTTP and persistent connections
- WebSocket protocol and how it works
- Server-side state management (tracking connected clients)
- Event-driven programming
- Memory leak prevention

---

### Concept: HTTP vs WebSocket

```
── HTTP ──────────────────────────────────────────────────
Client: "Hey server, any new webhooks?"    → GET /api/webhooks
Server: "Here are 5 webhooks"             → 200 OK
(Connection closed)

Client: "Hey server, any new webhooks?"    → GET /api/webhooks (2 seconds later)
Server: "Same 5 webhooks, nothing new"    → 200 OK
(Connection closed)

Client: "Hey server, any new webhooks?"    → GET /api/webhooks (2 seconds later)
Server: "Here are 6 webhooks now!"        → 200 OK
(Connection closed)

Problem: Constant polling wastes bandwidth. Updates are delayed by polling interval.

── WebSocket ──────────────────────────────────────────────
Client: "Hey server, let's keep this line open"  → Upgrade: websocket
Server: "Sure, connection upgraded"               → 101 Switching Protocols
(Connection stays open!)

... 30 seconds of silence ...

Server: "New webhook just arrived!"                → push to client
Client: (Instantly updates DOM, no request needed)

... 5 minutes later ...

Server: "Another one!"                            → push to client
Client: (Instant update again)

Advantage: Zero delay, zero wasted requests.
```

---

### Step 1: Install the WebSocket Library

```bash
npm install ws
npm install --save-dev @types/ws
```

> **📝 Why `ws` and not Socket.io?**
>
> Socket.io is a higher-level library that adds features like automatic reconnection, fallbacks, and rooms. It's great for complex apps, but it hides how WebSockets actually work.
>
> `ws` is the raw WebSocket implementation. You'll understand exactly what happens at the protocol level. You can always "graduate" to Socket.io later.

---

### Step 2: Create the WebSocket Server

**File: `ws/server.ts`**

```typescript
// ws/server.ts
// WebSocket server setup.
//
// WebSockets provide a full-duplex (two-way) communication channel
// over a single TCP connection. Unlike HTTP (request-response),
// either side can send a message at any time.
//
// How the upgrade works:
// 1. Client sends a normal HTTP request with special headers:
//    GET / HTTP/1.1
//    Upgrade: websocket
//    Connection: Upgrade
//
// 2. Server responds:
//    HTTP/1.1 101 Switching Protocols
//    Upgrade: websocket
//
// 3. The TCP connection is now a WebSocket — both sides can send frames.

import { WebSocketServer, WebSocket } from 'ws';
import { Server as HttpServer } from 'http';

// We store all connected clients in a Set
// Set is like an Array but:
//   - No duplicates
//   - O(1) add/delete (vs O(n) for arrays)
//   - Perfect for "current participants"
export const clients = new Set<WebSocket>();

/**
 * Attach a WebSocket server to an existing HTTP server.
 *
 * Why attach to the same server?
 * - We reuse the same port (3000)
 * - The HTTP server handles the initial upgrade request
 * - No need to open a separate port for WebSocket
 */
export function setupWebSocket(server: HttpServer): WebSocketServer {
    const wss = new WebSocketServer({ server });

    wss.on('connection', (ws: WebSocket) => {
        // A new client connected
        clients.add(ws);
        console.log(`[WS] Client connected (${clients.size} total)`);

        // Send a welcome message
        ws.send(JSON.stringify({
            type: 'connected',
            message: 'Connected to WebHookForge live feed',
            clients: clients.size
        }));

        // Handle incoming messages from the client (optional)
        ws.on('message', (data: Buffer) => {
            try {
                const message = JSON.parse(data.toString());
                console.log(`[WS] Received from client:`, message);
            } catch (err) {
                const error = err as Error;
                console.error('[WS] Invalid message:', error.message);
            }
        });

        // Handle disconnection
        // CRITICAL: Always remove from the Set to prevent memory leaks!
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

    console.log('[WS] WebSocket server attached');
    return wss;
}
```

> **🔴 Memory Leaks — Why Cleanup Matters**
>
> Every time a client connects, we add it to `clients`. If we forget to remove it on disconnect:
>
> ```
> Hour 1: 50 connections, 50 in Set
> Hour 2: 100 connections (50 disconnected), 100 in Set  ← 50 are dead!
> Hour 8: 400 dead references in Set, server slowing down
> Day 7:  Thousands of dead references → server crashes (out of memory)
> ```
>
> **Always clean up** when connections close:
> ```javascript
> ws.on('close', () => clients.delete(ws));
> ws.on('error', () => clients.delete(ws));
> ```

---

### Step 3: Create the Broadcast Module

**File: `ws/broadcast.ts`**

```typescript
// ws/broadcast.ts
// Broadcasts messages to all connected WebSocket clients.
//
// This module is used by the webhook route to push
// new webhooks to all browser dashboards instantly.

import { WebSocket } from 'ws';
import { clients } from './server.js';

/**
 * Broadcast a message to all connected WebSocket clients.
 */
export function broadcast(type: string, payload: Record<string, unknown>): void {
    const message = JSON.stringify({ type, payload, timestamp: new Date().toISOString() });

    let sent = 0;
    let failed = 0;

    for (const client of clients) {
        // WebSocket ready states:
        //   0 = CONNECTING (not ready yet)
        //   1 = OPEN (ready to send)
        //   2 = CLOSING (shutting down)
        //   3 = CLOSED (done)
        if (client.readyState === WebSocket.OPEN) {
            try {
                client.send(message);
                sent++;
            } catch (err) {
                console.error('[WS] Failed to send to client:', (err as Error).message);
                clients.delete(client);
                failed++;
            }
        }
    }

    if (sent > 0) {
        console.log(`[WS] Broadcast "${type}" to ${sent} client(s)`);
    }
}
```

---

### Step 4: Update the Webhook Route — Add Broadcasting

Update **`routes/webhook.ts`** to broadcast new webhooks:

```typescript
// routes/webhook.ts — UPDATED for Week 3
// Add broadcasting after storing the webhook

import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import * as db from '../db.js';
import { broadcast } from '../ws/broadcast.js';  // ← NEW

const router = Router();

router.post('/w/:relayId', async (req: Request, res: Response) => {
    const { relayId } = req.params;

    const webhook = {
        id: uuidv4(),
        relay_id: relayId,
        method: req.method,
        headers: req.headers as Record<string, unknown>,
        body: req.body as Record<string, unknown>,
        query: req.query as Record<string, unknown>,
        source_ip: req.ip || req.socket?.remoteAddress || null,
        timestamp: new Date().toISOString(),
        status: 'received'
    };

    try {
        await db.insert(webhook);
        console.log(`[WEBHOOK] Received on relay "${relayId}" → ${webhook.id}`);

        // ── NEW: Broadcast to all connected dashboards ──
        // No need to parse — objects are already in their native form
        broadcast('new_webhook', webhook);

        res.status(200).json({
            success: true,
            id: webhook.id,
            message: `Webhook received on relay "${relayId}"`
        });
    } catch (err) {
        const error = err as Error;
        console.error(`[WEBHOOK] Failed to store:`, error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to store webhook'
        });
    }
});

export default router;
```

---

### Step 5: Update server.ts — Attach WebSocket

```typescript
// server.ts — UPDATED for Week 3
// Add WebSocket setup after starting the HTTP server

import 'dotenv/config';

import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import webhookRouter from './routes/webhook.js';
import webhooksRouter from './routes/webhooks.js';
import { notFoundHandler, errorHandler } from './middleware/error.js';
import { setupWebSocket } from './ws/server.js';  // ← NEW

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ── Middleware ──
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(
            `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} → ${res.statusCode} (${duration}ms)`
        );
    });
    next();
});

// ── Static Files ──
app.use(express.static(path.join(__dirname, 'public')));

// ── Routes ──
app.use('/', webhookRouter);
app.use('/api', webhooksRouter);

app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Error Handling ──
app.use(notFoundHandler);
app.use(errorHandler);

// ── Start Server ──
const PORT: number = parseInt(process.env.PORT || '3000', 10);
const server = app.listen(PORT, () => {
    console.log('');
    console.log('╔═══════════════════════════════════════════╗');
    console.log('║         🔨 WebHookForge is running        ║');
    console.log(`║         http://localhost:${PORT}             ║`);
    console.log('╚═══════════════════════════════════════════╝');
    console.log('');
});

// ── Attach WebSocket to the same HTTP server ──         ← NEW
setupWebSocket(server);

export { app, server };
```

---

### Step 6: Create the Client-Side WebSocket

**File: `public/socket.js`**

```javascript
// public/socket.js
// Client-side WebSocket connection.
// Connects to the server and handles real-time webhook events.

const WS_URL = `ws://${window.location.host}`;
let ws = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_DELAY = 30000; // 30 seconds max

/**
 * Connect to the WebSocket server.
 *
 * WebSocket lifecycle:
 *   1. new WebSocket(url) → Opens connection
 *   2. ws.onopen         → Connection established
 *   3. ws.onmessage      → Server sent us data
 *   4. ws.onclose        → Connection closed
 *   5. ws.onerror        → Something went wrong
 */
function connectWebSocket() {
    ws = new WebSocket(WS_URL);

    ws.onopen = () => {
        console.log('[WS] Connected to live feed');
        reconnectAttempts = 0;
        updateConnectionStatus(true);
    };

    ws.onmessage = (event) => {
        try {
            const message = JSON.parse(event.data);
            handleWebSocketMessage(message);
        } catch (err) {
            console.error('[WS] Failed to parse message:', err);
        }
    };

    ws.onclose = () => {
        console.log('[WS] Disconnected');
        updateConnectionStatus(false);

        // Auto-reconnect with exponential backoff
        // Each failed attempt waits longer: 1s, 2s, 4s, 8s, 16s, 30s, 30s...
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), MAX_RECONNECT_DELAY);
        reconnectAttempts++;
        console.log(`[WS] Reconnecting in ${delay / 1000}s (attempt ${reconnectAttempts})...`);
        setTimeout(connectWebSocket, delay);
    };

    ws.onerror = (err) => {
        console.error('[WS] Error:', err);
    };
}

/**
 * Handle incoming WebSocket messages.
 */
function handleWebSocketMessage(message) {
    switch (message.type) {
        case 'connected':
            console.log(`[WS] ${message.message} (${message.clients} clients)`);
            break;

        case 'new_webhook':
            console.log('[WS] New webhook received:', message.payload.id);
            prependWebhook(message.payload);
            break;

        case 'webhook_deleted':
            console.log('[WS] Webhook deleted:', message.payload.id);
            fetchWebhooks(currentPage); // Refresh the list
            break;

        default:
            console.log('[WS] Unknown message type:', message.type);
    }
}

/**
 * Prepend a new webhook to the top of the list.
 * This is how real-time feels "instant" — we don't refetch the API,
 * we just add the new item directly to the DOM.
 */
function prependWebhook(webhook) {
    const listEl = document.getElementById('webhook-list');

    // Remove empty state if present
    const emptyState = listEl.querySelector('.empty-state');
    if (emptyState) listEl.innerHTML = '';

    const cardHtml = `
        <div class="webhook-card" onclick="showDetail('${webhook.id}')" style="animation: fadeIn 0.3s ease-out;">
            <div class="webhook-card-header">
                <div>
                    <span class="webhook-method">${webhook.method}</span>
                    <span class="webhook-relay">/w/${webhook.relay_id}</span>
                </div>
                <span class="webhook-status status-${webhook.status}">${webhook.status}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
                <span class="webhook-id">${webhook.id}</span>
                <span class="webhook-time">just now</span>
            </div>
        </div>`;

    listEl.insertAdjacentHTML('afterbegin', cardHtml);

    // Update the total count
    const statTotal = document.getElementById('stat-total');
    const current = parseInt(statTotal.textContent) || 0;
    statTotal.textContent = current + 1;
}

/**
 * Update the connection status indicator.
 */
function updateConnectionStatus(connected) {
    const dot = document.getElementById('connection-dot');
    const text = document.getElementById('connection-text');

    if (connected) {
        dot.classList.add('connected');
        text.textContent = 'Live';
    } else {
        dot.classList.remove('connected');
        text.textContent = 'Disconnected';
    }
}

// ── Auto-connect on page load ──
connectWebSocket();
```

**Update `public/index.html`** — add the socket script before `</body>`:

```html
    <script src="app.js"></script>
    <script src="socket.js"></script>   <!-- ADD THIS LINE -->
</body>
```

> **💡 Exponential Backoff — Smart Reconnection**
>
> When the WebSocket disconnects, we don't try to reconnect immediately and continuously.
> That would flood the server if it's having trouble.
>
> Instead, we use **exponential backoff**:
> ```
> Attempt 1: wait 1 second
> Attempt 2: wait 2 seconds
> Attempt 3: wait 4 seconds
> Attempt 4: wait 8 seconds
> Attempt 5: wait 16 seconds
> Attempt 6+: wait 30 seconds (cap)
> ```
>
> This is a standard pattern used by every major app (Chrome, Slack, Discord).

---

### Step 7: Test Week 3

```bash
# Start the server
npm run dev

# Open http://localhost:3000 in TWO browser tabs

# In a terminal, send a webhook
curl -X POST http://localhost:3000/w/live-test -H "Content-Type: application/json" -d '{"event":"real-time"}'

# Watch BOTH browser tabs update instantly! 🎉
```

### Week 3 Key Concepts Summary

| Concept | What You Learned | Why It Matters |
|---|---|---|
| **WebSocket vs HTTP** | HTTP = request-response; WS = persistent two-way channel | Real-time apps need persistent connections |
| **Server-side state** | `Set` of connected clients, managed lifecycle | Server must track who's connected |
| **Event-driven code** | `ws.on('message')`, `ws.on('close')` | Async events trigger handlers |
| **Memory leaks** | Always `.delete()` from Set on disconnect | Dead references accumulate and crash servers |
| **Exponential backoff** | 1s, 2s, 4s, 8s... reconnection delays | Standard resilience pattern |
| **DOM manipulation** | `insertAdjacentHTML` to prepend new items | Faster than full page refresh |

---

## 7. Week 4 — Replay & Package as a CLI Tool

### 🎯 Goal

> Replay any webhook to a target URL. Package the entire project as a globally installable CLI tool.

### What You'll Learn This Week

- Making outbound HTTP requests (server as a client)
- Refactoring a server for CLI consumption
- Building CLI tools with Commander.js
- npm linking and global package distribution

---

### Step 1: Create the Replay Route

**File: `routes/replay.ts`**

```typescript
// routes/replay.ts
// Replays a stored webhook to a target URL.
//
// This is where your server acts as an HTTP CLIENT, not a server.
// It reads a stored webhook from the database and sends it
// to whatever URL the user specifies.
//
// This is incredibly useful:
//   - Your webhook handler had a bug? Fix the bug, replay the webhook.
//   - Need to test with the exact same data Stripe sent? Replay it.
//   - Want to forward webhooks to a different service? Replay it.

import { Router, Request, Response } from 'express';
import * as db from '../db.js';
const router = Router();

/**
 * POST /webhooks/:id/replay
 *
 * Request body:
 *   { "target_url": "http://localhost:4000/my-handler" }
 *
 * What this does:
 *   1. Finds the original webhook in the database
 *   2. Sends an HTTP POST to the target_url with the original headers + body
 *   3. Updates the webhook status to 'replayed' or 'failed'
 *   4. Returns the target's response
 */
router.post('/webhooks/:id/replay', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { target_url } = req.body as { target_url?: string };

    // ── Validation ──
    if (!target_url) {
        res.status(400).json({
            error: 'Bad Request',
            message: 'Missing "target_url" in request body'
        });
        return;
    }

    // Validate URL format
    try {
        new URL(target_url); // Throws if invalid
    } catch {
        res.status(400).json({
            error: 'Bad Request',
            message: `Invalid URL: "${target_url}"`
        });
        return;
    }

    // ── Find the webhook ──
    const webhook = await db.getById(id);
    if (!webhook) {
        res.status(404).json({
            error: 'Not Found',
            message: `Webhook "${id}" not found`
        });
        return;
    }

    // ── Replay it ──
    try {
        // No need to JSON.parse — PostgreSQL JSONB returns parsed objects
        const originalHeaders = webhook.headers as Record<string, string>;
        const originalBody = webhook.body;

        // Build the outbound request
        // We forward the original headers but remove some that don't make sense
        // to forward (like 'host' which would refer to OUR server)
        const forwardHeaders = { ...originalHeaders };
        delete forwardHeaders['host'];
        delete forwardHeaders['content-length']; // fetch will recalculate
        delete forwardHeaders['connection'];

        // Make the outbound HTTP request using fetch (built into Node 18+)
        const response = await fetch(target_url, {
            method: webhook.method || 'POST',
            headers: {
                'Content-Type': originalHeaders['content-type'] || 'application/json',
                'X-WebhookForge-Replay': 'true',
                'X-WebhookForge-Original-Id': webhook.id,
            },
            body: JSON.stringify(originalBody),
        });

        // Read the target's response
        const responseBody = await response.text();

        // Update the webhook status
        await db.updateStatus(id, 'replayed');

        console.log(`[REPLAY] Webhook ${id} → ${target_url} (${response.status})`);

        res.json({
            success: true,
            replay: {
                target_url,
                status: response.status,
                statusText: response.statusText,
                response: responseBody.substring(0, 1000),
            }
        });

    } catch (err) {
        // The outbound request failed (target server down, DNS error, etc.)
        await db.updateStatus(id, 'failed');

        const error = err as Error;
        console.error(`[REPLAY] Failed: ${id} → ${target_url}:`, error.message);

        res.status(502).json({
            error: 'Bad Gateway',
            message: `Failed to reach target URL: ${error.message}`,
            target_url
        });
    }
});

export default router;
```

> **📝 Status Code 502 — Bad Gateway**
>
> When our server tries to call another server (the target URL) and it fails, we return **502 Bad Gateway**. This means:
> "I tried to proxy your request to another server, but that server didn't cooperate."
>
> This is different from 500 (our server broke) — with 502, the problem is with the target.

---

### Step 2: Refactor server.ts for CLI Consumption

Up until now, `server.ts` has been calling `app.listen()` at the bottom of the file to start the HTTP server. But now that we're packaging this as a CLI tool, the **CLI entry point** (`cli.ts`) needs to be the one that starts the server — so it can control the port via command-line flags.

We need to refactor `server.ts` to **only set up the Express app and export it**, without actually starting the server.

**File: `server.ts` — FINAL VERSION**

```typescript
// server.ts — FINAL VERSION
// Express app setup. Exports the app for CLI consumption.
//
// No app.listen() here! The CLI (cli.ts) handles starting the server.
// This separation lets the CLI control the port, startup banner, etc.

import 'dotenv/config';

import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

// Routes
import webhookRouter from './routes/webhook.js';
import webhooksRouter from './routes/webhooks.js';
import replayRouter from './routes/replay.js';

// Middleware
import { notFoundHandler, errorHandler } from './middleware/error.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ── Global Middleware ──
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logger
app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(
            `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} → ${res.statusCode} (${duration}ms)`
        );
    });
    next();
});

// ── Static Files ──
app.use(express.static(path.join(__dirname, 'public')));

// ── Routes ──
app.use('/', webhookRouter);          // POST /w/:relayId
app.use('/api', webhooksRouter);      // GET/DELETE /api/webhooks
app.use('/api', replayRouter);        // POST /api/webhooks/:id/replay

// Health check
app.get('/health', (req: Request, res: Response) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// ── Error Handling ──
app.use(notFoundHandler);
app.use(errorHandler);

// No app.listen() here! The CLI (cli.ts) handles starting the server.
export { app };
```

> **📝 Why remove `app.listen()`?**
>
> Previously, `server.ts` did everything: set up middleware, routes, AND started the server. Now we're splitting that responsibility:
> - `server.ts` → Sets up the Express app (middleware, routes, error handling)
> - `cli.ts` → Starts the server, controls the port, prints the banner
>
> This is a common pattern in professional Node.js projects. It makes the app easier to test (you can import `app` without starting a server) and more flexible (the CLI can add flags like `--port`).

---

### Step 3: Install CLI Dependencies

```bash
npm install commander
```

**What is Commander.js?**

Commander.js is a complete solution for building Node.js command-line interfaces. It handles argument parsing, help text generation, subcommands, and options — all the tedious parts of building a CLI. It's used by some of the most popular tools in the JavaScript ecosystem, including webpack, ESLint, and TypeScript itself.

---

### Step 4: Create the CLI Entry Point

**File: `cli.ts`**

```typescript
#!/usr/bin/env node
// cli.ts
// The command-line interface entry point for WebHookForge.
// This file is what runs when a user types `webhookforge` in their terminal.
//
// The shebang (#!/usr/bin/env node) tells the OS to run this file
// with Node.js, making it executable as a standalone command.

import 'dotenv/config';
import { Command } from 'commander';
import { app } from './server.js';
import { setupWebSocket } from './ws/server.js';
import http from 'http';

const program = new Command();

program
    .name('webhookforge')
    .description('🔨 WebHookForge — A local CLI tool for capturing, inspecting, and replaying webhooks.')
    .version('1.0.0');

program
    .command('listen')
    .description('Start the WebHookForge server to capture incoming webhooks.')
    .option('-p, --port <number>', 'Port to listen on', '3000')
    .action((options) => {
        const PORT = parseInt(options.port, 10);

        const server = http.createServer(app);

        // Attach WebSocket to the HTTP server
        setupWebSocket(server);

        server.listen(PORT, () => {
            console.log('');
            console.log('╔═══════════════════════════════════════════╗');
            console.log('║         🔨 WebHookForge is running        ║');
            console.log(`║         http://localhost:${PORT}             ║`);
            console.log('╚═══════════════════════════════════════════╝');
            console.log('');
            console.log('  Try sending a test webhook:');
            console.log(`  curl -X POST http://localhost:${PORT}/w/test123 \\`);
            console.log(`       -H "Content-Type: application/json" \\`);
            console.log(`       -d '{"event":"ping"}'`);
            console.log('');
            console.log('  Dashboard: http://localhost:' + PORT);
            console.log('  Press Ctrl+C to stop.');
            console.log('');
        });
    });

program.parse();
```

> **📝 Understanding the Shebang Line: `#!/usr/bin/env node`**
>
> The **shebang** (`#!`) is a Unix convention. When you make a file executable and run it directly (e.g., `./cli.js`), the operating system reads the first line to figure out *which program* should interpret the file.
>
> `#!/usr/bin/env node` says: "Find `node` on the system PATH and use it to run this file." This is more portable than hardcoding `/usr/local/bin/node` because Node.js might be installed in different locations on different machines.
>
> On Windows, npm handles this differently — it creates a `.cmd` wrapper script that calls `node` for you.

> **📝 Commander's `.command()` → `.option()` → `.action()` Pattern**
>
> Commander uses a builder pattern to define commands:
> - `.command('listen')` — Defines a subcommand. Users will type `webhookforge listen`.
> - `.option('-p, --port <number>', ...)` — Adds a flag. Users can type `webhookforge listen --port 4000`.
> - `.action((options) => { ... })` — The function that runs when this command is invoked.
>
> Commander also auto-generates help text. Running `webhookforge --help` will show all available commands and options.

> **📝 Why `http.createServer(app)` instead of `app.listen()`?**
>
> `app.listen(PORT)` is a shortcut that internally calls `http.createServer(app).listen(PORT)`. We use the longer form because we need a reference to the raw HTTP `server` object — WebSocket needs to attach to it.
>
> ```typescript
> // Short version (what we used before):
> const server = app.listen(PORT);  // Returns the http.Server
> setupWebSocket(server);
>
> // Explicit version (what we use now):
> const server = http.createServer(app);  // Create server separately
> setupWebSocket(server);                  // Attach WebSocket
> server.listen(PORT);                     // Then start listening
> ```
>
> Both are equivalent. The explicit version makes the flow clearer and gives us more control.

---

### Step 5: Update package.json

Now we need to tell npm about our CLI command. Update your `package.json`:

```json
{
  "name": "webhookforge",
  "version": "1.0.0",
  "description": "A local CLI tool for capturing, inspecting, and replaying webhooks",
  "main": "dist/server.js",
  "type": "module",
  "bin": {
    "webhookforge": "./dist/cli.js"
  },
  "scripts": {
    "start": "node dist/cli.js listen",
    "dev": "tsx watch cli.ts listen",
    "build": "tsc"
  },
  "keywords": ["webhook", "relay", "debugger", "cli"],
  "author": "Your Name",
  "license": "MIT"
}
```

> **📝 What does the `"bin"` field do?**
>
> The `"bin"` object in `package.json` tells npm: *"When someone installs this package globally, create a system-wide command called `webhookforge` that runs `dist/cli.js`."*
>
> ```json
> "bin": {
>     "webhookforge": "./dist/cli.js"
> }
> ```
>
> This is the exact same mechanism that tools like `eslint`, `prettier`, and `tsc` use. When you ran `npm install -g typescript`, npm created a global `tsc` command that points to TypeScript's CLI entry point — just like we're doing here.
>
> After `npm link` or `npm install -g`, you'll be able to type `webhookforge listen` from *any* directory on your machine.

---

### Step 6: Local Testing with npm link

Now let's build and test the CLI locally:

```bash
# 1. Compile TypeScript to JavaScript
npm run build

# 2. Copy public assets to dist (TypeScript compiler doesn't handle non-TS files)
# On Windows PowerShell:
Copy-Item -Recurse -Force public dist/public
# On macOS/Linux:
# cp -r public dist/public

# 3. Link the package globally
npm link

# 4. Now you can run it from anywhere!
webhookforge listen
webhookforge listen --port 4000
webhookforge --help
webhookforge --version
```

> **📝 What is `npm link`?**
>
> `npm link` creates a **symlink** (shortcut) from the global `node_modules` folder to your local project directory. This means:
>
> - The `webhookforge` command becomes available system-wide
> - Any changes you make and recompile (`npm run build`) are **immediately** available — no need to re-install
> - It's the standard way to test CLI tools during development
>
> To remove the global link later:
> ```bash
> npm unlink -g webhookforge
> ```

---

### Step 7: Test Week 4

```bash
# Start the server using the CLI
webhookforge listen

# In another terminal, start a simple echo server to replay to:
npx -y http-echo-server 4000

# Send a test webhook
curl -X POST http://localhost:3000/w/test-replay \
  -H "Content-Type: application/json" \
  -d '{"event":"payment.completed","amount":4999}'

# Note the webhook ID from the response, then replay it:
curl -X POST http://localhost:3000/api/webhooks/<WEBHOOK_ID>/replay \
  -H "Content-Type: application/json" \
  -d '{"target_url":"http://localhost:4000"}'

# The echo server should print the replayed webhook!
```

**Test the CLI flags:**

```bash
# Run on a custom port
webhookforge listen --port 4000

# View help
webhookforge --help

# Check version
webhookforge --version
```

### Week 4 Key Concepts Summary

| Concept | What You Learned | Why It Matters |
|---|---|---|
| **Outbound HTTP** | Server as a client — making requests TO other servers | APIs talk to APIs; microservices communicate this way |
| **Input Validation** | Check URLs, reject bad data with 400 | Never trust user input |
| **CLI with Commander** | Build professional CLIs with commands, options, help text | Most Node.js dev tools are CLIs |
| **Shebang** | `#!/usr/bin/env node` makes a file executable | How all CLI tools work on Unix systems |
| **npm link** | Symlink your package globally for local testing | Test your CLI before publishing |
| **npm bin** | `package.json` "bin" field registers global commands | How tools like `eslint`, `tsc`, and `prettier` install |
| **502 Bad Gateway** | When your server can't reach an upstream server | Important for proxy/relay services |

---

## 8. Final Folder Structure

```
webhookforge/
├── cli.ts                  ← CLI entry point (shebang + Commander)
├── server.ts               ← Express app setup (no listen — exported for CLI)
├── db.ts                   ← Prisma client wrapper + query functions
├── tsconfig.json           ← TypeScript compiler configuration
├── package.json            ← Project manifest + "bin" field for CLI
├── .env                    ← PORT, DATABASE_URL (gitignored)
├── .gitignore              ← Exclude node_modules, .env, dist/
│
├── prisma/
│   ├── schema.prisma       ← Database schema (models, indexes, config)
│   └── migrations/         ← Auto-generated SQL migration files
│
├── routes/
│   ├── webhook.ts          ← POST /w/:relayId (receive webhooks)
│   ├── webhooks.ts         ← GET/DELETE /api/webhooks (REST API)
│   └── replay.ts           ← POST /api/webhooks/:id/replay
│
├── middleware/
│   └── error.ts            ← 404 handler + global error handler
│
├── ws/
│   ├── server.ts           ← WebSocket server setup
│   └── broadcast.ts        ← Emit to all connected clients
│
├── dist/                   ← Compiled JavaScript output (gitignored)
│
└── public/                 ← Browser code (stays as plain JavaScript)
    ├── index.html           ← Dashboard HTML
    ├── app.js               ← Fetch API + DOM rendering
    └── socket.js            ← WebSocket client (live updates)
```

---

## 9. Glossary of Backend Concepts

### HTTP & Networking

| Term | Definition |
|---|---|
| **HTTP** | HyperText Transfer Protocol — the foundation of web communication. Request-response model. |
| **HTTPS** | HTTP over TLS/SSL — encrypted HTTP. The padlock in your browser. |
| **TCP** | Transmission Control Protocol — the reliable transport layer under HTTP. Guarantees delivery and order. |
| **IP Address** | A numeric address for a device on the internet (e.g., `192.168.1.1`). |
| **Port** | A number (0–65535) that identifies a specific process on a machine. HTTP uses 80, HTTPS uses 443. |
| **DNS** | Domain Name System — translates `example.com` to an IP address. |
| **Request** | What the client sends: method + URL + headers + body. |
| **Response** | What the server sends back: status code + headers + body. |
| **Header** | Key-value metadata in a request/response (e.g., `Content-Type: application/json`). |
| **Body** | The payload of a request/response. Usually JSON for APIs. |
| **Query String** | Key-value pairs in the URL after `?` (e.g., `?page=2&limit=10`). |
| **Route Parameter** | Dynamic part of a URL path (e.g., `:id` in `/webhooks/:id`). |

### Node.js & Express

| Term | Definition |
|---|---|
| **Runtime** | The environment that executes your code. Node.js is a JavaScript/TypeScript runtime. |
| **npm** | Node Package Manager — installs libraries from the npm registry. |
| **package.json** | The manifest file listing your project's dependencies, scripts, and metadata. |
| **node_modules** | Directory where npm installs all dependency code. Never commit this. |
| **Middleware** | A function that processes requests in the Express pipeline. Has `(req, res, next)` signature. |
| **Router** | A mini Express app that groups related routes together. |
| **Static Files** | Files served as-is (HTML, CSS, JS, images) without processing. |
| **`import`** | ESM syntax to bring in modules. Used in TypeScript and modern JavaScript. |
| **`export`** | ESM syntax to make things in a file accessible to other files. |
| **`tsx`** | A fast TypeScript executor for Node.js. Runs `.ts` files directly without a compile step. |
| **`tsconfig.json`** | Configuration file for the TypeScript compiler. Controls strictness, target, and output. |

### Database

| Term | Definition |
|---|---|
| **SQL** | Structured Query Language — the language for relational databases. |
| **PostgreSQL** | A powerful, open-source relational database with advanced features like JSONB, full-text search, and ACID compliance. |
| **ORM** | Object-Relational Mapper — a library that lets you interact with a database using your programming language's objects instead of raw SQL. |
| **Prisma** | A modern ORM for Node.js/TypeScript. You define your schema in a `.prisma` file and query with auto-generated, type-safe methods. |
| **Prisma Client** | The auto-generated database client created by `npx prisma generate`. Provides methods like `prisma.webhook.create()`, `findMany()`, etc. |
| **Prisma Schema** | The `prisma/schema.prisma` file where you define your data models, database provider, and generators. |
| **Migration** | A versioned change to your database schema. Prisma generates migration SQL files automatically from your schema changes. |
| **Connection String** | A URL containing all info to connect to a database: `postgresql://user:pass@host:port/dbname`. |
| **Table** | A structured collection of rows and columns (like a spreadsheet). |
| **Row** | A single record in a table (one webhook). |
| **Column** | A field in a table (id, relay_id, body, etc.). |
| **PRIMARY KEY** | A column that uniquely identifies each row. Defined with `@id` in Prisma. |
| **INDEX** | A data structure that speeds up lookups on a column. Defined with `@@index` in Prisma. |
| **JSONB** | PostgreSQL's binary JSON type — stores JSON and allows querying inside it. Maps to Prisma's `Json` type. |
| **CRUD** | Create, Read, Update, Delete — the four basic database operations. |
| **SQL Injection** | An attack where malicious SQL is inserted via user input. Prisma prevents this automatically. |

### Real-Time

| Term | Definition |
|---|---|
| **WebSocket** | A protocol for full-duplex, persistent communication over a single TCP connection. |
| **Polling** | Repeatedly asking the server "anything new?" at intervals. Wasteful. |
| **Full-Duplex** | Both sides can send messages simultaneously (unlike HTTP's request-response). |
| **Broadcast** | Sending a message to ALL connected clients. |
| **Connection Upgrade** | HTTP converts to WebSocket via a `101 Switching Protocols` response. |

### CLI & npm Publishing

| Term | Definition |
|---|---|
| **CLI** | Command-Line Interface — a tool you interact with via terminal commands (e.g., `git`, `npm`, `eslint`). |
| **Shebang** | The `#!/usr/bin/env node` line at the top of a script. Tells the OS which interpreter to use. |
| **Commander.js** | A popular Node.js library for building command-line tools with commands, options, and auto-generated help text. |
| **npm link** | Creates a symlink from the global `node_modules` to your local project for testing CLI tools locally. |
| **npm publish** | Uploads your package to the npm registry so anyone can install it with `npm install -g yourpackage`. |
| **npx** | Runs a package from the npm registry without installing it globally. Example: `npx webhookforge listen`. |
| **Semantic Versioning** | Version numbers follow `MAJOR.MINOR.PATCH` (e.g., `1.2.3`). Major = breaking changes, minor = new features, patch = bug fixes. |
| **bin field** | The `"bin"` key in `package.json` that maps command names to executable files. |

---

## 10. Troubleshooting & Common Mistakes

### "Cannot find module 'express'"

```bash
# You forgot to install dependencies
npm install
```

### "EADDRINUSE: address already in use :::3000"

```bash
# Another process is using port 3000
# Find it (Windows):
netstat -ano | findstr :3000
# Kill it:
taskkill /PID <PID_NUMBER> /F

# Or use a different port in .env:
PORT=3001
```

### "req.body is undefined"

```typescript
// You forgot to add the JSON parser middleware
// Make sure this line is BEFORE your routes:
app.use(express.json());
```

### "The table `public.webhooks` does not exist" or Prisma migration errors

```bash
# You haven't run the Prisma migration yet.
# Make sure:
# 1. PostgreSQL is running
# 2. Your DATABASE_URL in .env is correct
# 3. Run the migration:
npx prisma migrate dev --name init

# If you see "drift detected" errors, reset the database:
npx prisma migrate reset
# WARNING: This deletes ALL data!
```

### "Cannot find module '@prisma/client'"

```bash
# The Prisma client hasn't been generated.
# Run this after installing dependencies or changing the schema:
npx prisma generate
```

### WebSocket not connecting

```typescript
// Check that you're connecting to the right URL
// The WS_URL auto-detects port from window.location.host:
const WS_URL = `ws://${window.location.host}`;
```

### TypeScript compilation errors

```bash
# If you see type errors, make sure all @types packages are installed:
npm install --save-dev @types/node @types/express @types/uuid @types/ws

# Rebuild Prisma client (regenerates types):
npx prisma generate

# If __dirname errors, add ESM helpers to your file:
import { fileURLToPath } from 'url';
import path from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
```

---

## 11. What to Learn Next

After completing WebHookForge, you've built a solid backend foundation. Here's where to go next:

### Level Up This Project

- [ ] **Authentication** — Add API keys so only you can access the dashboard
- [ ] **Webhook Signature Verification** — Validate that webhooks really came from Stripe/GitHub
- [ ] **Multi-relay Dashboard** — Filter the dashboard by relay ID
- [ ] **Retry Logic** — Automatically retry failed replays with exponential backoff
- [ ] **Webhook TTL** — Auto-delete webhooks older than 7 days (use Prisma's `deleteMany` with date filters)
- [ ] **Export** — Download webhooks as JSON/CSV
- [ ] **Search** — Full-text search across webhook bodies
- [ ] **Prisma Relations** — Add a `Relay` model and create a one-to-many relationship with `Webhook`

### Learn Next Technologies

| Technology | Why | When |
|---|---|---|
| **Redis** | In-memory cache, pub/sub, rate limiting at scale | When you need speed + distributed state |
| **JWT Authentication** | Stateless auth tokens for APIs | For any multi-user app |
| **Testing (Vitest/Jest)** | Automated tests for reliability | Start with unit tests for `db.ts` |
| **CI/CD (GitHub Actions)** | Automated testing and deployment | After you have tests |
| **npm publish** | Publish your CLI to the npm registry | Share your tool with the world |
| **npx distribution** | Let users run your tool without installing: `npx webhookforge listen` | Zero-friction tool distribution |
| **Semantic Versioning** | Major.Minor.Patch version strategy | Professional package management |
| **Prisma Advanced** | Relations, middleware, transactions, raw SQL escape hatch | When your data model grows complex |
| **tRPC** | End-to-end type safety between frontend and backend | When your frontend is also TypeScript |

---

> **📝 Resume Bullet (copy-paste ready)**
>
> Built **WebHookForge** — a locally-installable CLI tool for webhook capture, real-time inspection, and replay. Packaged as a global npm command using Commander.js. TypeScript · Node.js · Express · PostgreSQL · Prisma ORM · WebSockets · Commander.js

---

*Happy building!* 🔨
