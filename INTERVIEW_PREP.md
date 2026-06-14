# WebHookForge — Complete Interview Preparation Guide

## Table of Contents

- [How to Use This Document](#how-to-use-this-document)
- [Project One-Liner](#project-one-liner)
- [Elevator Pitch (90 seconds)](#elevator-pitch-90-seconds)
- [Section 1: Project Overview Questions](#section-1-project-overview-questions)
- [Section 2: Architecture Decisions](#section-2-architecture-decisions)
- [Section 3: Deep Internals](#section-3-deep-internals)
- [Section 4: Security Questions](#section-4-security-questions)
- [Section 5: Failure Scenarios](#section-5-failure-scenarios)
- [Section 6: System Design and Scaling](#section-6-system-design-and-scaling)
- [Section 7: Code Quality and Engineering Practices](#section-7-code-quality-and-engineering-practices)
- [Section 8: Codebase-Specific Questions](#section-8-codebase-specific-questions)
- [Section 9: Comparison and Alternatives](#section-9-comparison-and-alternatives)
- [Section 10: Quick Reference Cheat Sheet](#section-10-quick-reference-cheat-sheet)
- [Section 10b: "Why This Technology?"](#section-10b-why-this-technology)
- [Section 11: Language Choice Interrogation](#section-11-language-choice-interrogation)
- [Section 12: Optimisation Questions](#section-12-optimisation-questions)
- [Section 13: Disadvantages Acknowledgement](#section-13-disadvantages-acknowledgement)
- [Section 14: "What If" Scenario Questions](#section-14-what-if-scenario-questions)
- [Section 15: Technology Decision Matrix](#section-15-technology-decision-matrix)
- [The Three Questions That Will Define Your Interview](#the-three-questions-that-will-define-your-interview)

---

## How to Use This Document

Read the elevator pitch and one-liner first — they are your opening move in every interview. Then, for each section, read each answer five times aloud until the phrasing becomes natural. Pay special attention to Sections 8, 10b, and 13: these are where interviewers at top MNCs separate strong candidates from average ones. The code snippets are from the actual codebase; be ready to explain each line if asked.

---

## Project One-Liner

WebHookForge is a local-first CLI tool that catches, inspects, and replays incoming webhooks in real time using an Express relay server, SQLite persistence, WebSocket-driven live dashboard, and optional Ngrok tunneling — all installable via a single `npm install -g`.

## Elevator Pitch (90 seconds)

I built WebHookForge to solve a pain point I kept hitting during development: every time I integrated with a payment gateway like Razorpay or Stripe, I had to either expose my local machine through a tunnel and hope the webhook arrived while my debugger was attached, or litter my code with console.log statements and manually re-trigger events from the provider's dashboard. WebHookForge eliminates that friction entirely. It is a CLI tool — you run `webhookforge listen`, it spins up an Express server with an embedded SQLite database, opens a real-time dashboard powered by WebSockets, and optionally creates an Ngrok tunnel so external services can reach you instantly. Every webhook that arrives gets persisted, rendered on the dashboard within milliseconds, and can be replayed against any endpoint with a single click. The hardest technical challenge was preserving the raw request body for HMAC signature verification — Express's `json()` parser destroys the original byte stream, so I had to use the `verify` callback to capture the raw buffer before parsing, then store both the parsed JSON and the original string side by side. The outcome is a zero-config, single-dependency developer tool that I published to npm and that works on any OS without Docker or external databases.

---

## Section 1: Project Overview Questions

### Q: What problem does WebHookForge solve?

**Difficulty:** Easy
**What the interviewer is checking:** Can you articulate a real developer pain point concisely?

**Answer:**
I built WebHookForge to solve the webhook debugging problem that every backend developer faces. When you integrate with an external service like Stripe, Razorpay, or GitHub, those services send HTTP callbacks to a URL you provide. During development, your machine is behind a NAT — it is not publicly reachable. You either have to set up a tunnel every time, or you add logging statements everywhere and manually re-trigger events from the provider's test dashboard. Both approaches are slow and fragile. WebHookForge gives you a dedicated local relay server. You point the external service at your relay URL — something like `/w/stripe-payments` — and every incoming request gets captured, persisted into SQLite, and streamed to a live dashboard over WebSockets. If you need to test your handler again, you click "Replay" and the exact original payload gets re-sent to your local endpoint. No re-triggering from the provider, no lost payloads.

**Follow-up they will ask:** How is this different from just using `console.log`?
**Follow-up answer:** `console.log` only shows you what your code receives after parsing. WebHookForge captures the raw body before Express parses it, preserves all headers including authentication signatures, stores everything in a database so payloads survive server restarts, and lets you replay the exact request without involving the external provider at all.

---

### Q: Why did you build this over using an existing tool like RequestBin?

**Difficulty:** Easy
**What the interviewer is checking:** Do you understand the competitive landscape and your tool's unique value?

**Answer:**
I evaluated RequestBin, Webhook.site, and ngrok's built-in inspect feature before building WebHookForge. RequestBin and Webhook.site are cloud-hosted — your webhook payloads, which may contain API keys, customer data, or payment tokens, leave your machine and sit on someone else's server. That is a non-starter for sensitive integrations. Ngrok's inspect feature is powerful, but it does not persist data across sessions and it does not support replay. WebHookForge runs entirely on your local machine. Payloads never leave your disk. The SQLite database survives server restarts, and replay is a first-class feature, not an afterthought. I also wanted a tool that I could distribute as a single npm package — no Docker, no separate database install, no config files for basic usage.

**Follow-up they will ask:** Would you ever consider making it cloud-hosted?
**Follow-up answer:** Yes, for a team collaboration use case where multiple developers share relay URLs. That would require moving from SQLite to PostgreSQL, adding authentication, and introducing tenant isolation. But the local-first design is intentional for the solo-developer debugging use case.

---

### Q: Who is the target user?

**Difficulty:** Easy
**What the interviewer is checking:** Product thinking — do you know your audience?

**Answer:**
The primary target user is a backend developer working on webhook integrations during the development and testing phase. This includes anyone integrating payment gateways like Stripe or Razorpay, CI/CD notification handlers from GitHub or GitLab, or any service that sends event-driven HTTP callbacks. The tool is designed for the "inner loop" of development — the cycle of writing code, receiving a webhook, inspecting the payload, tweaking the handler, and replaying the same payload. It is not intended for production monitoring; it is a developer-time debugging tool, similar to how Postman is a developer-time API client.

**Follow-up they will ask:** Could a QA engineer use this?
**Follow-up answer:** Absolutely. A QA engineer could capture a set of webhook payloads during one session, then replay them repeatedly to verify handler behavior. The persist-and-replay cycle is useful for regression testing webhook handlers.

---

### Q: What would version 2 look like?

**Difficulty:** Medium
**What the interviewer is checking:** Can you think beyond what you have built?

**Answer:**
Version 2 would focus on three things. First, I would add HMAC signature verification as a built-in feature — right now I preserve the raw body so that users can verify signatures in their own handlers, but WebHookForge itself does not validate them. I would add a configuration system where you can specify a signing secret per relay ID, and the dashboard would show a green checkmark if the signature is valid. Second, I would add webhook forwarding — instead of just capturing and replaying, WebHookForge would act as a transparent proxy, forwarding the webhook to your local development server in real time while also capturing it. Third, I would build a proper plugin system so the community could add support for specific providers like Stripe or Shopify, with automatic payload parsing and documentation links.

**Follow-up they will ask:** What is the riskiest part of version 2?
**Follow-up answer:** The forwarding feature, because it introduces latency in the webhook delivery path. If my proxy is slow, the external provider might time out and retry, leading to duplicate deliveries. I would need to respond immediately with a 200 and forward asynchronously.

---

### Q: What feature would you cut to ship faster?

**Difficulty:** Easy
**What the interviewer is checking:** Prioritisation and shipping mindset.

**Answer:**
I would cut the Ngrok tunnel integration. The core value of WebHookForge — catching, inspecting, and replaying webhooks — works perfectly on localhost without any tunnel. The Ngrok integration adds complexity: it requires the user to have an Ngrok auth token, it adds a runtime dependency on Ngrok's infrastructure, and it introduces an entire class of failure modes around tunnel stability. I could ship the core tool as a localhost-only solution, then add tunneling as an optional enhancement in a follow-up release. In fact, the tool already degrades gracefully if the tunnel fails — it logs a message and continues operating in local-only mode.

---

### Q: What is the hardest bug you encountered?

**Difficulty:** Medium
**What the interviewer is checking:** Debugging ability and technical depth.

**Answer:**
The hardest bug was during replay. When I replayed a webhook, the target server kept rejecting it with a 400 error. After debugging, I discovered two issues working together. First, I was forwarding the original `host` header, which pointed to the original relay server, not the replay target — the target server's virtual host routing did not recognise it. Second, I was forwarding the original `content-length` header, but the body I was sending was re-serialised JSON, which sometimes had a different byte length than the original. I fixed this by explicitly deleting the `host`, `content-length`, and `connection` headers before forwarding, as you can see in `replay.ts` where I do `delete forwardHeaders['host']; delete forwardHeaders['content-length']; delete forwardHeaders['connection']`. This mirrors how reverse proxies like Nginx handle header forwarding — certain hop-by-hop headers must never be forwarded.

---

## Section 2: Architecture Decisions

### Q: Why Express and not Fastify or Hapi?

**Difficulty:** Medium
**What the interviewer is checking:** Awareness of the Node.js ecosystem and honest tradeoff analysis.

**Answer:**
Fastify is a valid choice and would actually give me better raw throughput thanks to its schema-based serialisation and the Pino logger. I chose Express for two specific reasons. First, Express 5 — which I am using, as you can see from `"express": "^5.2.1"` in my package.json — has native async error handling, which closes the biggest historical gap between Express and Fastify. Second, the `verify` callback on `express.json()` is what lets me capture the raw body buffer for HMAC verification. Fastify has its own raw body plugin, but Express's `verify` callback gave me exactly the hook point I needed with zero additional dependencies. The honest limitation is that Express is slower than Fastify under synthetic benchmarks, but for a local developer tool handling maybe 10 requests per minute, framework throughput is completely irrelevant.

**Follow-up they will ask:** What about Hapi?
**Follow-up answer:** Hapi is excellent for enterprise APIs with its built-in validation and authentication plugins, but it would be over-engineered for a local CLI tool. Its learning curve and plugin system are designed for team-scale projects, not single-purpose developer utilities.

---

### Q: Why SQLite and not PostgreSQL or MongoDB?

**Difficulty:** Medium
**What the interviewer is checking:** Database selection reasoning.

**Answer:**
I chose SQLite because WebHookForge is a local-first, single-user developer tool, and SQLite is the only database that requires zero infrastructure. There is no server to start, no connection string to configure, no port to manage. The database is just a file — I store it at `os.homedir() + '/webhookforge/webhooks.db'` — and Prisma handles schema creation automatically. PostgreSQL would give me concurrent write safety and better query performance at scale, but it would also require the user to install and run a database server, which completely contradicts the "zero setup" promise of the tool. MongoDB would give me flexible schema storage for arbitrary webhook payloads, but I already handle that by serialising the JSON body to a text column, which works perfectly for a read-heavy, single-writer workload.

**Follow-up they will ask:** What if two CLI sessions write to the same SQLite file?
**Follow-up answer:** SQLite uses file-level locking. Concurrent writes from two processes would block each other and potentially cause `SQLITE_BUSY` errors. For a single-user local tool, this is acceptable — you would not normally run two instances. If I needed multi-process safety, I would add WAL mode or switch to PostgreSQL.

---

### Q: Why Prisma over raw SQL or Knex?

**Difficulty:** Medium
**What the interviewer is checking:** ORM selection reasoning and awareness of tradeoffs.

**Answer:**
I chose Prisma for three reasons specific to this project. First, Prisma's schema file acts as a single source of truth for the database structure — my `schema.prisma` defines the `Webhook` model with all its fields, types, and indexes, and anyone reading the project instantly understands the data model without reading SQL. Second, Prisma's generated client gives me fully type-safe queries in TypeScript — when I call `prisma.webhook.findMany()`, the return type matches my schema exactly, catching bugs at compile time. Third, `prisma generate` runs automatically as a `postinstall` hook, so when a user does `npm install -g webhookforge`, the database client is ready immediately. Knex would give me more control over query construction and is lighter-weight, but it does not provide the same level of TypeScript integration. Raw SQL would be fastest, but I would lose schema tracking and type safety.

**Follow-up they will ask:** You also use `$executeRawUnsafe` for schema creation — why not use Prisma migrations?
**Follow-up answer:** I use `$executeRawUnsafe` for the `CREATE TABLE IF NOT EXISTS` and `CREATE INDEX IF NOT EXISTS` statements as a runtime safety net. This ensures the table exists even if the Prisma migration has not been run, which is important for a CLI tool where the user may not run migration commands manually. It is a defensive pattern — the schema is defined in Prisma, but the runtime bootstrap does not depend on the migration having been applied.

---

### Q: Why WebSockets over Server-Sent Events or long polling?

**Difficulty:** Medium
**What the interviewer is checking:** Understanding of real-time transport protocols.

**Answer:**
I chose WebSockets because I need bidirectional communication, not just server-to-client push. Right now the client sends a `subscribe` message to tell the server which relay ID it wants events for — that is client-to-server communication within the same connection. SSE would handle the server-to-client push for new webhooks perfectly, but it cannot carry the subscribe message back. I would need a separate HTTP endpoint for subscription management, which adds complexity. Long polling was never a serious option — it wastes connections, has higher latency, and is architecturally inferior to both WebSockets and SSE for event streaming. The honest limitation of WebSockets is that they require explicit connection management — heartbeats, reconnection logic, and dead client cleanup — which I have implemented with a 30-second ping/pong interval and exponential backoff reconnection on the client side.

---

### Q: Why Ngrok's Node.js API over the Ngrok CLI?

**Difficulty:** Medium
**What the interviewer is checking:** Integration design decisions.

**Answer:**
I use the `@ngrok/ngrok` npm package, which is Ngrok's official Node.js SDK, instead of spawning the `ngrok` CLI binary as a child process. The SDK gives me programmatic control — I call `ngrok.forward({ addr: port, authtoken })` and get back a listener object with the public URL. If I used the CLI, I would have to spawn a child process, parse stdout for the URL, manage the process lifecycle, handle crashes, and deal with platform differences in how the binary is installed. The SDK abstracts all of that into a clean async API. It also means the tunnel lifecycle is tied to my Node.js process — when my server shuts down, the tunnel shuts down, and I handle `SIGINT` explicitly to call `ngrok.disconnect()` for a clean teardown.

**Follow-up they will ask:** What is the downside of embedding the tunnel?
**Follow-up answer:** The downside is that the tunnel cannot outlive my server process. With the standalone CLI, you can keep a tunnel running and point multiple services at it. With the embedded approach, every server restart kills the tunnel and generates a new URL, which means you have to re-configure the webhook provider.

---

### Q: Walk me through the full request lifecycle from webhook arrival to dashboard display.

**Difficulty:** Hard
**What the interviewer is checking:** End-to-end system understanding.

**Answer:**
An external service sends a POST request to `/w/stripe-payments`. Express receives it and first runs the `express.json()` middleware, which parses the JSON body but also calls the `verify` callback — this callback captures the raw byte buffer into `req.rawBody` before Express modifies anything. The request then passes through the logging middleware, which measures duration and logs the method, path, and status code, but only for non-dashboard, non-API traffic. The request hits the `webhook.ts` route handler, which matches the `router.all('/w/:relayId')` pattern. The handler extracts the relay ID from the URL params, determines the client's true IP from `x-forwarded-for` or the socket, and constructs a `WebhookInput` object with a UUID v4 identifier. It calls `db.insert()`, which uses Prisma's `create` method to persist the webhook with JSON-stringified headers, body, and query parameters. After successful insertion, the handler calls `broadcast('new_webhook', webhook)`, which iterates over all connected WebSocket clients in the `clients` Set, checks each one's `readyState` and optional `subscribedRelayId` filter, and sends the JSON-serialised event. On the client side, `socket.js` receives the `new_webhook` message and calls `fetchWebhooks(currentPage)`, which hits the `/api/webhooks` REST endpoint to get the latest paginated list, then re-renders the webhook list and updates the stats bar. The entire path — HTTP receipt, database write, WebSocket broadcast, client re-fetch — happens in under 50 milliseconds on localhost.

---

## Section 3: Deep Internals

### Q: How does raw body preservation work for HMAC verification? Show the middleware order.

**Difficulty:** Hard
**What the interviewer is checking:** Understanding of middleware ordering and cryptographic verification requirements.

**Answer:**
HMAC verification requires the exact byte sequence that the sender signed. Express's `json()` parser deserialises the body into a JavaScript object, which means the original bytes — including whitespace, key ordering, and encoding — are lost. I solve this using the `verify` callback, which Express calls before parsing:

```typescript
// server.ts, lines 22-27
app.use(express.json({
    limit: '1mb',
    verify: (req: Request, res: Response, buf: Buffer) => {
        (req as RawBodyRequest).rawBody = buf.toString('utf8');
    }
}));
```

The `verify` function receives the raw `Buffer` before Express applies `JSON.parse()`. I convert it to a UTF-8 string and attach it to the request as `rawBody`. The same pattern is applied to `express.urlencoded()`. This means every request flowing through the system carries both the parsed `req.body` object for convenient access and the original `req.rawBody` string for signature verification. The middleware order matters — `express.json()` runs before any route handler, so by the time the webhook route receives the request, both fields are populated.

**Follow-up they will ask:** Why `buf.toString('utf8')` instead of keeping the raw Buffer?
**Follow-up answer:** For storage simplicity — I persist `rawBody` as a `TEXT` column in SQLite. If I kept the Buffer, I would need a `BLOB` column and binary-safe serialisation. For HMAC verification, the UTF-8 string is sufficient because webhook providers sign the UTF-8 encoded body, not raw binary.

---

### Q: What is the WebSocket maxPayload set to and why that specific value?

**Difficulty:** Medium
**What the interviewer is checking:** Security awareness and configuration reasoning.

**Answer:**
I set `maxPayload` to 64 KB, which is `64 * 1024` bytes:

```typescript
// ws/server.ts, lines 16-19
const wss = new WebSocketServer({
    server,
    maxPayload: 64 * 1024
});
```

This is a security measure against memory exhaustion attacks. Without a `maxPayload` limit, a malicious client could open a WebSocket connection and send a multi-gigabyte message, consuming all server memory and crashing the process. I chose 64 KB because the WebSocket channel carries only JSON control messages — subscribe commands, new webhook notifications, and connection status updates. None of these payloads should ever exceed a few kilobytes. The actual webhook data is stored in the database and retrieved via the REST API, not pushed over the WebSocket. If a legitimate message somehow exceeds 64 KB, the `ws` library will terminate the connection with a `1009` status code (message too big).

**Follow-up they will ask:** Does this conflict with the 1 MB HTTP body limit?
**Follow-up answer:** No. The 1 MB limit on `express.json()` applies to the HTTP relay endpoint where webhook payloads arrive. The 64 KB WebSocket limit only applies to messages sent over the WebSocket channel, which carries lightweight event notifications, not full webhook payloads.

---

### Q: How does the Ngrok tunnel authenticate? Where is the token stored and how is it read?

**Difficulty:** Medium
**What the interviewer is checking:** Configuration management and security practices.

**Answer:**
The Ngrok auth token is stored in a plain JSON file at the user's home directory — `os.homedir() + '/webhookforge.json'`. When a user runs `webhookforge auth <token>`, the `saveToken` function writes it:

```typescript
// utils/config.ts, lines 6-10
const CONFIG_FILE = path.join(os.homedir(), 'webhookforge.json');
export function saveToken(token: string) {
    const config = { ngrokToken: token };
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}
```

At tunnel creation time, the `createTunnel` function reads the token with a fallback chain — it first checks the config file, then falls back to the `NGROK_AUTHTOKEN` environment variable:

```typescript
// utils/tunnel.ts, line 8
const authToken = getToken() || process.env.NGROK_AUTHTOKEN;
```

This dual-source approach mirrors how the AWS CLI reads credentials — first from `~/.aws/credentials`, then from environment variables. It gives developers flexibility: use the CLI command for persistent storage, or set an environment variable in CI/CD pipelines.

**Follow-up they will ask:** Is the token stored securely?
**Follow-up answer:** Honestly, no — it is stored in plain text. A more secure approach would be to use the operating system's keychain (macOS Keychain, Windows Credential Manager, or Linux's libsecret). For a local developer tool, the threat model is low — the token is on the developer's own machine — but for production-grade tooling I would use a library like `keytar` for OS-level secret storage.

---

### Q: How does your broadcast function handle a client that disconnected mid-send?

**Difficulty:** Medium
**What the interviewer is checking:** Error handling in real-time systems.

**Answer:**
The broadcast function iterates over all connected clients and wraps each `send()` call in a try-catch:

```typescript
// ws/broadcast.ts, lines 25-34
if(isOpen && isTargeted){
    try {
        extClient.send(message);
        sent++;
    } catch (err) {
        console.error('[WS] Failed to send to client:',(err as Error).message);
        clients.delete(client);
        failed++;
    }
}
```

If a client disconnects between the `readyState === WebSocket.OPEN` check and the actual `send()` call, the `send()` throws an exception. The catch block logs the error, removes the dead client from the `clients` Set to prevent future send attempts, and increments the `failed` counter. This is important because without this cleanup, the `clients` Set would accumulate dead connections over time, and every broadcast would waste cycles trying to send to clients that no longer exist.

**Follow-up they will ask:** Is there a race condition between the readyState check and the send?
**Follow-up answer:** In theory, yes — the client could disconnect in the microseconds between the check and the send. But Node.js is single-threaded, so the WebSocket `close` event handler (which also removes the client from the Set) cannot fire between those two lines. The only scenario where `send()` throws after the check passes is if the underlying TCP socket fails during the write, which the try-catch handles correctly.

---

### Q: How does your rate limiter work?

**Difficulty:** Medium
**What the interviewer is checking:** Security implementation awareness.

> ⚠️ Prepare carefully — this exposes a gap

**Answer:**
I need to be transparent here — the current version of WebHookForge does not implement rate limiting. There is no `express-rate-limit` middleware or any custom throttling logic on the relay endpoint. This is a deliberate tradeoff for the initial release: as a local developer tool, the relay endpoint is only reachable from localhost or through the Ngrok tunnel, and the primary user is the developer themselves. That said, I recognise this is a gap. If someone discovers the public Ngrok URL, they could flood the relay endpoint. For version 2, I would add `express-rate-limit` with a fixed-window strategy — something like 100 requests per minute per IP on the `/w/:relayId` route. The library stores counters in memory by default, which is fine for a single-process tool. I would also add a 429 response with a `Retry-After` header.

---

### Q: Walk me through your error handling middleware — what gets caught and what doesn't?

**Difficulty:** Medium
**What the interviewer is checking:** Understanding of Express error handling semantics.

**Answer:**
I have two error handling layers. The first is the `notFoundHandler`, which catches any request that does not match a defined route:

```typescript
// middleware/error.ts, lines 11-21
export function notFoundHandler(req: Request, res: Response, next: NextFunction): void {
  res.status(404).json({
    error: "Not Found",
    message: `The route ${req.method} ${req.originalUrl} does not exist`,
    hint: "Check the URL and HTTP method. Available endpoints: GET /webhooks, POST /w/:relayId",
  });
}
```

The second is the global `errorHandler`, which catches any error thrown or passed via `next(err)` in route handlers. It reads the status code from `err.statusCode` or `err.status`, falling back to 500, and conditionally includes the stack trace only in development mode by checking `process.env.NODE_ENV`. The ordering in `server.ts` is critical — `notFoundHandler` is registered before `errorHandler` because Express processes middleware in order, and a 404 is not technically an error, it is a "no route matched" fallback. What does not get caught: synchronous errors thrown outside of async route handlers in Express 4 would be uncaught, but I am using Express 5 which natively wraps async route handlers, so rejected Promises are automatically forwarded to the error handler.

---

## Section 4: Security Questions

### Q: How do you prevent memory exhaustion from large payloads?

**Difficulty:** Medium
**What the interviewer is checking:** Defense-in-depth thinking.

**Answer:**
I have two layers of protection. On the HTTP layer, I set `limit: '1mb'` on both `express.json()` and `express.urlencoded()`. Any request body exceeding 1 MB gets rejected with a 413 status code before it is even parsed — the raw bytes are never fully buffered. On the WebSocket layer, I set `maxPayload: 64 * 1024` (64 KB) on the WebSocket server, which terminates any connection that sends a message exceeding that size. Additionally, in the replay endpoint, I truncate the target server's response to 1000 characters with `responseBody.substring(0, 1000)` to prevent a malicious replay target from returning a massive response that crashes the dashboard UI.

**Follow-up they will ask:** What about the database — can someone fill up the disk?
**Follow-up answer:** Yes, that is currently unmitigated. A persistent stream of webhooks would grow the SQLite file indefinitely. I would address this with a retention policy — automatically deleting webhooks older than 24 hours, or capping the total count and deleting the oldest entries when the cap is reached.

---

### Q: What would happen if someone discovered your relay URL and spammed it?

**Difficulty:** Medium
**What the interviewer is checking:** Threat modelling.

> ⚠️ Prepare carefully — this exposes a gap

**Answer:**
Without rate limiting, a spammer could flood the relay endpoint. Each request would be parsed, written to SQLite, broadcast over WebSockets, and rendered on the dashboard. The 1 MB body limit prevents individual requests from being too large, but a high volume of small requests would fill the database, consume disk space, and potentially overwhelm the WebSocket broadcast. To mitigate this, I would add three things: `express-rate-limit` on the relay endpoint with a 100 req/min per-IP window, a maximum database size check that returns 503 when the SQLite file exceeds a configured threshold, and an IP allowlist option in the CLI config so the developer can restrict which IPs can send webhooks.

---

### Q: Are stored webhook payloads encrypted at rest?

**Difficulty:** Easy
**What the interviewer is checking:** Data protection awareness.

> ⚠️ Prepare carefully — this exposes a gap

**Answer:**
No, stored payloads are not encrypted at rest. The SQLite database file at `~/webhookforge/webhooks.db` contains webhook headers and bodies in plain text. For a local developer tool where the data lives on the developer's own machine, the threat model is low — anyone with access to the file already has access to the machine. However, if webhook payloads contain sensitive data like API keys or customer information, this is a valid concern. I would address this by adding an optional AES-256-GCM encryption layer in the `db.insert()` function, encrypting the `body` and `headers` fields before writing and decrypting on read. The encryption key could be derived from a passphrase stored in the OS keychain.

---

### Q: What is HMAC and why is raw body preservation critical for its verification?

**Difficulty:** Medium
**What the interviewer is checking:** Cryptographic fundamentals.

**Answer:**
HMAC stands for Hash-based Message Authentication Code. When a service like Stripe sends a webhook, it computes an HMAC-SHA256 hash of the raw request body using a shared secret, and sends the hash in a header like `Stripe-Signature`. The receiving server must compute the same hash over the exact same bytes and compare. If Express's `json()` parser deserialises the body into a JavaScript object and I later call `JSON.stringify()` on it, the output might differ from the original — JSON key ordering is not guaranteed, whitespace could change, and Unicode escaping might differ. Even a single byte difference produces a completely different HMAC, causing verification to fail. That is why I capture the original buffer in the `verify` callback: `(req as RawBodyRequest).rawBody = buf.toString('utf8')`. This gives me the exact byte sequence the sender signed, preserved for downstream verification.

---

## Section 5: Failure Scenarios

### Q: What happens if the Ngrok tunnel drops mid-session?

**Difficulty:** Medium
**What the interviewer is checking:** Resilience and graceful degradation.

**Answer:**
If the Ngrok tunnel drops, external services can no longer reach the relay endpoint through the public URL — their requests will fail with connection errors and they will typically retry according to their own retry policy. However, the local server continues running unaffected. The dashboard remains accessible at `localhost:3000`, all stored webhooks are still available, and local testing via curl or direct HTTP calls still works. The current implementation does not automatically reconnect the tunnel — the `createTunnel` function runs once at startup and does not monitor the connection. For robustness, I would add a listener on the Ngrok SDK's disconnect event and implement a reconnection loop with exponential backoff, similar to what I already do on the WebSocket client side.

**Follow-up they will ask:** Would the public URL change after reconnection?
**Follow-up answer:** Yes, on the free Ngrok tier, each tunnel session gets a new random URL. This means you would have to update the webhook URL in the provider's dashboard. On Ngrok's paid tier, you can reserve a custom subdomain that persists across reconnections.

---

### Q: What happens if the replay target server returns 503?

**Difficulty:** Medium
**What the interviewer is checking:** Error handling in outbound HTTP calls.

**Answer:**
The replay endpoint uses the native `fetch()` API to forward the webhook to the target URL. If the target returns a 503, the fetch succeeds — it is a valid HTTP response, not a network error. My code reads the response status and body, updates the webhook's status to `'replayed'` in the database, and returns the status code to the dashboard. The user sees "Target responded with: 503 Service Unavailable" in the alert. However, there is a subtle issue: I mark the status as `'replayed'` even when the target returns a 5xx error. A more nuanced approach would be to mark it as `'replay_failed'` for non-2xx responses. The code currently does not implement automatic retries — if the target is temporarily down, the user has to click Replay again manually.

---

### Q: What happens if the SQLite file gets corrupted?

**Difficulty:** Medium
**What the interviewer is checking:** Data durability thinking.

**Answer:**
If the SQLite file gets corrupted — for example, due to a power failure during a write — Prisma will throw an error on the next query attempt. My error handling middleware will catch this and return a 500 to the API, and the dashboard will show an error state. The data is likely unrecoverable without a backup. SQLite is remarkably resistant to corruption — it uses a journal file for atomic commits — but it is not immune. For a developer tool, data loss is annoying but not catastrophic; the developer can clear the database with `webhookforge clear` and start fresh. If I needed stronger durability guarantees, I would enable WAL (Write-Ahead Logging) mode, which provides better crash recovery. I would also add a `webhookforge export` command that dumps all stored webhooks to a JSON file for backup.

---

### Q: What happens if a WebSocket client never disconnects cleanly (zombie connection)?

**Difficulty:** Hard
**What the interviewer is checking:** Understanding of connection lifecycle management.

**Answer:**
This is exactly what the heartbeat mechanism prevents. Every 30 seconds, the server iterates over all connected clients. For each client, it checks the `isAlive` flag. If the flag is `false` — meaning the client did not respond to the last ping — it terminates the connection and removes it from the `clients` Set:

```typescript
// ws/server.ts, lines 83-94
const interval = setInterval(()=>{
    wss.clients.forEach((client)=>{
        const extWs = client as ExtWebSocket;
        if (extWs.isAlive === false){
            clients.delete(extWs);
            return extWs.terminate();
        }
        extWs.isAlive = false;
        extWs.ping();
    });
},30000);
```

The sequence is: set `isAlive = false`, send a ping. If the client is alive, it responds with a pong, which sets `isAlive = true` via the `pong` event handler. On the next heartbeat cycle, `isAlive` is true, so the client survives. If the client is a zombie — it will not respond to the ping, `isAlive` remains false, and it gets terminated on the next cycle. The worst-case detection time for a zombie connection is 60 seconds (two heartbeat intervals).

---

### Q: What happens if the server crashes with 10,000 stored webhooks — is any data lost?

**Difficulty:** Easy
**What the interviewer is checking:** Data persistence understanding.

**Answer:**
No data is lost. All webhooks are persisted to the SQLite database file on disk at `~/webhookforge/webhooks.db`. When the server crashes, any webhook that was already written via `db.insert()` is safely on disk. The only data that could be lost is a webhook that was mid-insertion at the exact moment of the crash — SQLite's journal file makes this an atomic operation, so the write either completes fully or rolls back. The in-memory state that is lost is the WebSocket `clients` Set, but that is reconstructed naturally when clients reconnect. On server restart, all 10,000 webhooks are still available and will be loaded via the paginated REST API.

---

## Section 6: System Design and Scaling

### Q: How would you scale this to 10,000 concurrent users?

**Difficulty:** Hard
**What the interviewer is checking:** System design thinking at scale.

**Answer:**
Scaling to 10,000 concurrent users requires fundamental architectural changes. First, I would replace SQLite with PostgreSQL — SQLite cannot handle concurrent writes from multiple server instances. Second, I would run multiple Express server instances behind a load balancer, which means the in-memory WebSocket `clients` Set would no longer work — each instance only knows about its own clients. I would introduce Redis Pub/Sub as a message bus: when a webhook arrives on instance 1, it publishes a `new_webhook` event to a Redis channel, and all instances subscribe to that channel and broadcast to their local clients. Third, I would add authentication with JWT tokens so each user only sees their own webhooks, adding a `userId` column to the webhooks table. Fourth, I would add connection pooling for PostgreSQL via something like PgBouncer, and I would put a CDN in front of the static dashboard assets.

---

### Q: Right now WS broadcast is in-process. If you run 3 instances behind a load balancer, how do you fix cross-instance delivery?

**Difficulty:** Hard
**What the interviewer is checking:** Distributed systems knowledge.

**Answer:**
I would introduce Redis Pub/Sub as a fan-out layer. When a webhook arrives on instance 1, the relay handler publishes the event to a Redis channel named `webhook_events`. All three instances subscribe to this channel. When instance 2 receives the Redis message, it calls its local `broadcast()` function to push the event to the WebSocket clients connected to instance 2. This decouples event production from event delivery. The `ws` package has a community adapter for Redis — `@socket.io/redis-adapter` is the Socket.io equivalent — but since I use raw `ws`, I would implement the Redis subscription manually using `ioredis`. The pattern is identical to how chat applications scale: the database write happens once, and the real-time notification fans out through a message bus.

---

### Q: How would you add authentication so only logged-in users see their own webhooks?

**Difficulty:** Hard
**What the interviewer is checking:** Multi-tenancy design.

**Answer:**
I would add three components. First, a `users` table with email, hashed password (using bcrypt), and a unique `userId`. Second, a JWT-based authentication middleware that verifies a token on every API request and extracts the `userId`. Third, a `userId` foreign key on the `webhooks` table, so every webhook is associated with a user. The relay URL would change from `/w/:relayId` to `/w/:userId/:relayId`, and the route handler would validate that the `userId` in the URL matches a real user. The GET `/api/webhooks` endpoint would filter by the authenticated user's `userId` automatically. For WebSocket authentication, I would pass the JWT token as a query parameter during the WebSocket handshake — `ws://localhost:3000?token=xxx` — and verify it in the `connection` event handler before adding the client to the Set.

---

## Section 7: Code Quality and Engineering Practices

### Q: Do you have tests? How would you test the WebSocket broadcast function?

**Difficulty:** Medium
**What the interviewer is checking:** Testing awareness and methodology.

> ⚠️ Prepare carefully — this exposes a gap

**Answer:**
The current version does not include automated tests. I tested the project manually during development using curl for the relay endpoint, the browser dashboard for WebSocket functionality, and Postman for the REST API. This is a gap I acknowledge. To test the broadcast function, I would write a unit test using Jest that creates a mock `clients` Set with fake WebSocket objects, calls `broadcast('new_webhook', testPayload)`, and asserts that each mock's `send` method was called with the correct JSON string. I would also test the failure case by making one mock throw on `send()` and verifying that it gets removed from the Set without crashing the broadcast to other clients. For integration tests, I would use `supertest` for the HTTP endpoints and the `ws` client library to open a real WebSocket connection against a test server instance, send a webhook, and assert that the WebSocket receives the notification.

---

### Q: What does your .gitignore include and why?

**Difficulty:** Easy
**What the interviewer is checking:** Project hygiene awareness.

**Answer:**
My `.gitignore` covers five categories. `node_modules/` — dependencies should be installed, not committed. `.env` — environment variables may contain secrets like the Ngrok token. `dist/` — compiled JavaScript output is a build artefact that should be regenerated from TypeScript source. `*.db`, `*.db-journal`, `*.db-shm`, `*.db-wal` — SQLite database files and their journal/WAL files contain local test data, not source code. `.DS_Store` and `*.log` — OS-generated metadata and log files. I also ignore `WEBHOOKFORGE_BUILD_GUIDE.md`, which is a large internal development guide that should not be published. The `generated/` directory is for Prisma's generated client code, which is machine-generated at install time via `postinstall`.

---

### Q: What would a CI/CD pipeline for this project look like?

**Difficulty:** Medium
**What the interviewer is checking:** DevOps awareness.

**Answer:**
I would use GitHub Actions with three stages. First, a **build** stage that runs `npm ci`, `npx prisma generate`, and `tsc` to verify the TypeScript compiles cleanly. Second, a **test** stage that runs Jest with coverage thresholds — I would require at least 80% line coverage on the `db.ts`, `broadcast.ts`, and route handler files. Third, a **publish** stage that runs on tagged releases, builds the project, and publishes to npm via `npm publish` with an `NPM_TOKEN` secret. I would also add a linting step with ESLint configured for TypeScript, and a security audit step using `npm audit`. For the SQLite integration tests, I would use an in-memory SQLite database to avoid file system dependencies in CI.

---

## Section 8: Codebase-Specific Questions

### Q: Why does the relay route use `router.all()` instead of `router.post()`?

**Answer:**
```typescript
// routes/webhook.ts, line 9
router.all('/w/:relayId', async (req: Request, res: Response, next: NextFunction) => {
```

I use `router.all()` because webhook providers do not exclusively use POST. GitHub sends POST for most events, but some services use PUT for update events or even GET for verification handshakes (like Slack's URL verification). By accepting all HTTP methods, I ensure that no webhook is silently rejected because of an unexpected method. The method is recorded in the `webhook.method` field, so the dashboard shows exactly what was sent. The tradeoff is that GET requests from browsers or crawlers that accidentally hit the relay URL will also be captured, but this is preferable to missing legitimate webhooks.

---

### Q: What is the `P2025` error code in the Prisma delete handler and why do you check for it specifically?

**Answer:**
```typescript
// db.ts, lines 112-117
} catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
        return { changes: 0 };
    }
    throw err;
}
```

`P2025` is Prisma's error code for "Record to delete does not exist." Instead of letting this bubble up as a 500 error, I catch it specifically and return `{ changes: 0 }`. The route handler then checks `result.changes === 0` and returns a 404 to the client. This is a clean separation of concerns — the database layer translates ORM-specific errors into a neutral result, and the HTTP layer translates that result into the appropriate status code. The alternative would be to call `findUnique` before `delete`, but that introduces a TOCTOU race condition and doubles the database queries.

---

### Q: Why do you create the database directory manually instead of letting Prisma handle it?

**Answer:**
```typescript
// db.ts, lines 7-13
const dbFolder = path.join(os.homedir(), 'webhookforge');
const dbPath = path.join(dbFolder, 'webhooks.db');
if (!fs.existsSync(dbFolder)) {
    fs.mkdirSync(dbFolder, { recursive: true })
}
```

Prisma's SQLite driver expects the parent directory to exist before it creates the database file. If `~/webhookforge/` does not exist, Prisma throws an `ENOENT` error. By creating the directory proactively with `recursive: true`, I ensure the tool works on a clean machine where the user has never run it before. This is a first-run experience concern — the user should be able to run `webhookforge listen` immediately after `npm install -g` without any manual directory setup.

---

### Q: Why does the `RawBodyRequest` interface extend `Request` with an optional `rawBody` field?

**Answer:**
```typescript
// server.ts, lines 11-13
export interface RawBodyRequest extends Request {
    rawBody?: string;
}
```

Express's `Request` type does not include a `rawBody` property. Since I attach the raw body in the `verify` callback, I need to extend the type to tell TypeScript that this field exists. It is optional (`?`) because not every request goes through the JSON parser — static file requests, for example, skip it. In the route handler, I cast `req as RawBodyRequest` to access the field safely. This is a common TypeScript pattern for extending framework types without modifying the library's type definitions.

---

### Q: Why does the WebSocket client use exponential backoff for reconnection and what is the cap?

**Answer:**
```typescript
// public/socket.js, lines 43-46
const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), MAX_RECONNECT_DELAY);
reconnectAttempts++;
setTimeout(connectWebSocket, delay);
```

The reconnection delay doubles with each attempt: 1s, 2s, 4s, 8s, 16s, capped at `MAX_RECONNECT_DELAY = 30000` (30 seconds). Exponential backoff prevents the client from hammering the server during an outage. If the server is down and 50 browser tabs are trying to reconnect every 500ms, that is 100 requests per second of pure waste. The 30-second cap ensures the client eventually reconnects within a reasonable time after the server comes back, rather than waiting minutes. On successful connection, `reconnectAttempts` resets to 0, so the next disconnection starts fresh from a 1-second delay.

---

### Q: Why do you delete `host`, `content-length`, and `connection` headers during replay?

**Answer:**
```typescript
// routes/replay.ts, lines 43-46
const forwardHeaders = { ...originalHeaders };
delete forwardHeaders['host'];
delete forwardHeaders['content-length'];
delete forwardHeaders['connection'];
```

These are hop-by-hop headers that must never be forwarded to a different host. The `host` header contains the original relay server's hostname — forwarding it to the replay target would cause virtual host routing to fail. The `content-length` header reflects the original body size, but the replayed body may have a different size if it was re-serialised from JSON. The `connection` header (`keep-alive` or `close`) is specific to the original connection and should not influence the new outbound request. This is the same logic that reverse proxies like Nginx and HAProxy apply when forwarding requests.

---

### Q: What is the `X-WebhookForge-Replay` header and why does it exist?

**Answer:**
```typescript
// routes/replay.ts, lines 55-56
'X-WebhookForge-Replay': 'true',
'X-WebhookForge-Original-Id': webhook.id,
```

These custom `X-` headers serve two purposes. `X-WebhookForge-Replay` lets the receiving server distinguish a replay from an original webhook delivery — this is critical for idempotency. If the target server has already processed the original webhook, it can check for this header and skip duplicate processing. `X-WebhookForge-Original-Id` carries the original webhook's UUID, enabling the target server to trace the replay back to the original event for debugging. This is the same pattern that Stripe uses with `Idempotency-Key` headers.

---

### Q: Why do you use `Promise.all` for fetching webhooks and counts simultaneously?

**Answer:**
```typescript
// routes/webhooks.ts, lines 21-24
[webhooks, total] = await Promise.all([
    db.getByRelayId(relayId, limit, offset),
    db.countByRelayId(relayId)
]);
```

The webhook list and the total count are independent queries — neither depends on the other's result. By running them in parallel with `Promise.all`, I halve the latency compared to running them sequentially. On SQLite this saves maybe 1-2 milliseconds since both queries hit the same file, but the pattern is correct and would matter significantly with a network-attached database like PostgreSQL where each query incurs round-trip latency. It also demonstrates to the reader that these are intentionally parallelised, which is a code-as-documentation benefit.

---

### Q: Why does the frontend dashboard re-fetch the full page on a WebSocket event instead of appending the new webhook directly?

**Answer:**
```typescript
// public/socket.js, lines 26-28
if (typeof fetchWebhooks === 'function') {
    fetchWebhooks(currentPage);
}
```

I could prepend the new webhook to the list directly from the WebSocket payload, but that would desynchronise the UI from the database. The pagination counters (total, current page, total pages) would be stale, the "Total Webhooks" stat would be wrong, and if the user is on page 2, the new webhook should not appear at all — it belongs on page 1. By re-fetching the current page from the API, I guarantee the UI is always consistent with the database. The cost is one extra HTTP request per webhook arrival, which is negligible for a local tool. This is the same pattern that many real-time dashboards use — the WebSocket is a notification channel that triggers a data refresh, not the data channel itself.

---

## Section 9: Comparison and Alternatives

### Q: How is WebHookForge different from RequestBin, Webhook.site, or ngrok inspect?

**Difficulty:** Medium
**What the interviewer is checking:** Competitive awareness and differentiation.

**Answer:**
RequestBin and Webhook.site are cloud-hosted — your payloads travel to and are stored on third-party servers, which is unacceptable for sensitive data like payment webhook payloads containing card tokens or customer PII. WebHookForge runs entirely on your local machine. Ngrok's inspect feature shows request/response pairs in its web inspector, but it does not persist data across sessions, does not support replaying requests to arbitrary endpoints, and requires a paid plan for many features. WebHookForge persists every webhook in a local SQLite database that survives server restarts, and replay is a first-class feature with a single-click UI. The unique combination is: local-first privacy, persistent storage, real-time WebSocket dashboard, and one-click replay — no existing free tool offers all four together.

---

### Q: Why would a developer use your tool over the Stripe CLI?

**Difficulty:** Medium
**What the interviewer is checking:** Can you acknowledge a competitor's strengths?

**Answer:**
The Stripe CLI's `stripe listen` command is excellent for Stripe-specific webhook development — it can forward events, trigger test events, and verify Stripe signatures automatically. A developer working exclusively with Stripe should use the Stripe CLI. WebHookForge is provider-agnostic. It works equally well with Razorpay, GitHub, Shopify, Twilio, or any service that sends HTTP callbacks. It also provides a visual dashboard for inspecting payloads, which the Stripe CLI does not — Stripe CLI outputs to the terminal. And WebHookForge stores history persistently, so you can inspect a webhook that arrived two hours ago, whereas the Stripe CLI only shows real-time forwarding.

---

## Section 10: Quick Reference Cheat Sheet

| Question Topic | One-Line Answer |
|---|---|
| Why SQLite? | Zero setup, embedded, perfect for single-user local tool — just a file at `~/webhookforge/webhooks.db` |
| Why WebSockets? | Bidirectional — client sends `subscribe` messages, server pushes events; SSE is one-way only |
| Why Prisma? | Type-safe queries, schema as documentation, auto-generates on `postinstall` |
| Why raw body buffer? | `express.json()` destroys original bytes; HMAC needs the exact byte sequence signed by the sender |
| maxPayload value | 64 KB (`64 * 1024`) — WebSocket control messages only, prevents memory exhaustion |
| Body size limit | 1 MB on `express.json()` and `express.urlencoded()` — rejects 413 before buffering |
| Token storage path | `os.homedir() + '/webhookforge.json'` — mirrors AWS CLI's `~/.aws/credentials` pattern |
| Ngrok auth | Config file first, then `NGROK_AUTHTOKEN` env var fallback; never hardcoded |
| Heartbeat interval | 30 seconds — detects zombie WebSocket connections within 60s worst case |
| Reconnection backoff | Client-side exponential: 1s, 2s, 4s, 8s... capped at 30 seconds |
| Replay response truncation | `responseBody.substring(0, 1000)` — prevents massive responses from crashing UI |
| Database indexes | Two indexes: `relay_id` for filtered queries, `timestamp DESC` for sorted listing |
| Prisma P2025 | "Record not found" — caught in delete/update, translated to `{ changes: 0 }` |
| Express version | 5.2.1 — native async error handling, `verify` callback on body parsers |
| SIGINT handler | Calls `ngrok.disconnect()` for clean tunnel teardown on Ctrl+C |
| XSS prevention | `escapeHTML()` function sanitises all dynamic content rendered in the dashboard |

---

## Section 10b: "Why This Technology?"

### Node.js

**Q: Why did you choose Node.js for this project?**
**Answer:** I chose Node.js for three reasons tied directly to WebHookForge's requirements. First, the project is fundamentally I/O-bound — it receives HTTP requests, writes to a database, and pushes events over WebSockets, with zero CPU-intensive computation. Node.js's event loop handles thousands of concurrent I/O operations on a single thread, which is perfect for this workload. Second, the `ws` library and Express ecosystem provide battle-tested WebSocket and HTTP server implementations that I could integrate in hours rather than days. Third, distributing the tool via npm as a global CLI package with `npm install -g` is the standard way to ship Node.js developer tools — the entire distribution story is built into the runtime.

**Q: What are the advantages of using Node.js in this context?**
**Answer:** Non-blocking I/O means a single process handles the HTTP relay, REST API, static file serving, and WebSocket server simultaneously without threading overhead. npm gives me a zero-friction distribution channel — one command installs the tool globally. The JavaScript ecosystem means the server and the browser dashboard share language and JSON conventions, reducing cognitive overhead. The `verify` callback in Express's body parser is a Node.js-specific feature that enabled raw body preservation. And the Ngrok team provides a first-class Node.js SDK, which would not exist for every language.

**Q: What are the disadvantages or limitations of Node.js?**
**Answer:** Node.js is single-threaded, so a CPU-intensive operation — like computing an HMAC for every incoming webhook — would block the event loop and stall all other connections. The untyped nature of JavaScript (mitigated by TypeScript) means runtime type errors are possible if I am not careful with database outputs. Memory management is opaque — V8's garbage collector can cause latency spikes under high memory pressure. And the npm ecosystem has a well-documented supply chain security problem; a compromised dependency could affect every user who installs the tool.

**Q: What are the alternatives to Node.js and why did you not choose them?**
**Answer:** Python with FastAPI would give me async HTTP handling and excellent type hints, but the WebSocket story in Python is fragmented — I would need a separate ASGI server like Uvicorn, and the developer tool distribution story (pip/pipx) is less clean than npm for global CLI tools. Go would give me excellent concurrency with goroutines and a single compiled binary for distribution, but the development velocity is lower — Go's HTTP libraries require more boilerplate, and the lack of a runtime like npm means I would need to manage cross-platform builds myself. Rust would give me memory safety and extreme performance, but the development time would be 3-5x longer for a project where raw performance is irrelevant.

**Q: Can this project be built without Node.js? How?**
**Answer:** Absolutely. In Python, I would use FastAPI for the HTTP server, `websockets` library for the WebSocket server, and SQLAlchemy with SQLite. In Go, I would use `net/http` for routing, `gorilla/websocket` for WebSockets, and `database/sql` with the `sqlite3` driver. The architecture — relay endpoint, database persistence, WebSocket broadcast, CLI interface — is language-agnostic. Node.js gave me the fastest path from idea to published npm package.

**Q: How would you optimise the way you've used Node.js in this project?**
**Answer:** First, I would add clustering using Node.js's `cluster` module to utilise all CPU cores, with a primary process that manages the WebSocket client Set and worker processes that handle HTTP requests. Second, I would profile the event loop using `clinic.js` to identify any synchronous operations that block under load — the `fs.existsSync` and `fs.mkdirSync` calls in `db.ts` are synchronous and could be moved to async equivalents at startup.

---

### TypeScript

**Q: Why did you choose TypeScript for this project?**
**Answer:** I chose TypeScript because WebHookForge has several data structures that flow across boundaries — the `WebhookInput` interface passes data from the HTTP handler to the database layer to the WebSocket broadcast to the REST API. Without type checking, a typo like `relay_id` vs `relayId` would only surface as a runtime bug. TypeScript's compiler catches these at build time. I also benefit from Prisma's generated types, which ensure my queries match the database schema exactly.

**Q: What are the advantages of using TypeScript in this context?**
**Answer:** The `WebhookInput` interface in `db.ts` defines the exact shape of webhook data with specific types for each field — `Record<string, unknown>` for headers, optional nullable `body`, and a mandatory `string` for `status`. This acts as living documentation that the compiler enforces. Express 5's type definitions give me type-safe access to `req.params`, `req.query`, and `req.body`. The `RawBodyRequest` interface extension demonstrates how TypeScript lets me safely extend framework types. Auto-completion in the IDE accelerates development significantly when working with Prisma's generated client.

**Q: What are the disadvantages or limitations of TypeScript?**
**Answer:** The build step adds friction — I need `tsc` to compile to JavaScript before distribution, which means the `dist/` directory and source maps to manage. The `any` escape hatch (which I use once in `tunnel.ts` line 33 for the error catch) undermines type safety when used carelessly. Type gymnastics with Express middleware — like casting `req as RawBodyRequest` — can be verbose. And TypeScript's structural typing means some runtime errors around JSON parsing are not caught at compile time.

**Q: What are the alternatives to TypeScript and why did you not choose them?**
**Answer:** Plain JavaScript with JSDoc comments would give me type hints in the IDE without a build step, but it would not enforce types at compile time — a wrong field name would ship silently. Flow (Meta's type checker) is technically equivalent but has lost ecosystem momentum and tooling support. Using JavaScript with runtime validation (Zod or Joi) would catch type errors at runtime but not at build time, which is slower feedback.

**Q: Can this project be built without TypeScript? How?**
**Answer:** Yes, by writing the same code in plain JavaScript. I would lose compile-time type checking, the `interface` definitions that document data shapes, and Prisma's generated type-safe client. I would replace them with JSDoc comments for IDE support and runtime assertions for critical type checks. The project would work identically at runtime since TypeScript compiles away to JavaScript.

**Q: How would you optimise the way you've used TypeScript in this project?**
**Answer:** I would enable `strict: true` across all sub-options (I already have this), add `noUncheckedIndexedAccess` to catch potential undefined values from object property access, and replace the `any` cast in `tunnel.ts` with a proper error type guard using `error instanceof Error`. I would also add Zod schemas to validate incoming webhook bodies at runtime, complementing TypeScript's compile-time checks.

---

### Express.js

**Q: Why did you choose Express.js for this project?**
**Answer:** I chose Express 5 specifically because of two features critical to WebHookForge. The `verify` callback on `express.json()` lets me capture the raw request body before parsing — this is the foundation of the HMAC verification support. And Express 5's native async route handler support means rejected Promises in my route handlers automatically forward to the error middleware without manual `try-catch` wrapping (though I still use try-catch for explicit error handling). Express's middleware model also maps cleanly to my architecture: body parsing, logging, routing, and error handling are distinct layers.

**Q: What are the disadvantages or limitations of Express.js?**
**Answer:** Express is slower than Fastify in synthetic benchmarks due to its regex-based routing and lack of schema-based serialisation. The middleware-chain model can make request flow hard to trace in large applications. Express's typings for TypeScript are community-maintained and sometimes lag behind the framework. And Express does not include built-in validation, logging, or authentication — everything is a third-party middleware, which increases dependency count.

**Q: What are the alternatives to Express.js and why did you not choose them?**
**Answer:** Fastify would give me better performance and built-in schema validation, but its raw body access requires the `fastify-raw-body` plugin and works differently from Express's `verify` callback. Hapi provides built-in validation and authentication but is over-engineered for a local CLI tool. Koa is minimalist and uses async/await natively, but its ecosystem is smaller and I would need more third-party middleware.

---

### Prisma

**Q: Why did you choose Prisma for this project?**
**Answer:** Prisma gives me a declarative schema file (`schema.prisma`) that serves as the single source of truth for the database structure, a generated TypeScript client that provides type-safe queries, and a `postinstall` hook that ensures the client is ready immediately after `npm install`. For a CLI tool that needs to "just work" on first run, this auto-generation is critical.

**Q: What are the disadvantages or limitations of Prisma?**
**Answer:** Prisma generates a large client library (~2MB) that increases the npm package size. It adds startup latency because the generated client must be loaded into memory. Complex queries sometimes require dropping down to `$executeRawUnsafe`, which bypasses type safety — I use this for the `CREATE TABLE IF NOT EXISTS` bootstrap. Prisma migrations are designed for long-lived projects with schema evolution, which is overkill for a local tool with a single stable table. And Prisma's abstraction layer means I cannot use SQLite-specific features like `PRAGMA journal_mode=WAL` through the ORM.

**Q: What are the alternatives to Prisma and why did you not choose them?**
**Answer:** Knex is a query builder that gives more control and is lighter-weight, but it does not generate TypeScript types from the schema. Drizzle ORM is a newer alternative that is lighter than Prisma and has excellent TypeScript inference, and I would seriously consider it for a new project. `better-sqlite3` with raw SQL would be the lightest option and fastest, but I would lose schema documentation, type safety, and the `postinstall` generation hook.

---

### SQLite

**Q: Why did you choose SQLite for this project?**
**Answer:** SQLite is embedded — it runs in-process as a library, not a separate server. This means zero configuration for the end user: they run `webhookforge listen` and the database exists automatically. I store it at `~/webhookforge/webhooks.db`, which persists across sessions and is trivially backed up by copying a single file. For a single-user, single-process local tool, SQLite provides all the durability I need without any infrastructure overhead.

**Q: What are the disadvantages or limitations of SQLite?**
**Answer:** SQLite uses file-level locking for writes, so concurrent writes from multiple processes would cause contention. It does not support concurrent connections from multiple machines. There is no built-in replication or backup mechanism beyond copying the file. The text-based storage of JSON (I store headers and body as JSON strings in TEXT columns) is less efficient than PostgreSQL's native JSONB type. And SQLite has no user management or access control — anyone with filesystem access to the database file can read all data.

---

### WebSockets (ws package)

**Q: Why did you choose the `ws` package for this project?**
**Answer:** The `ws` package is the most widely used WebSocket implementation for Node.js — it is a dependency of Socket.io itself. I chose it over Socket.io because I do not need Socket.io's features like rooms, namespaces, or automatic fallback to HTTP polling. The `ws` package gives me a raw WebSocket server that attaches directly to my existing HTTP server via `new WebSocketServer({ server })`, sharing the same port. It provides the `maxPayload` option for security, ping/pong frame support for heartbeats, and a simple `clients` Set for connection tracking.

**Q: What are the disadvantages or limitations of the `ws` package?**
**Answer:** The `ws` package provides no built-in reconnection logic, room/channel management, or message acknowledgement. I had to implement heartbeats manually with the ping/pong interval, build my own subscription system with `subscribedRelayId`, and write the broadcast function myself. Socket.io would have given me all of this out of the box, but at the cost of a heavier library and a proprietary protocol that is not standard WebSocket.

---

### Commander.js

**Q: Why did you choose Commander.js for this project?**
**Answer:** Commander.js is the standard CLI framework for Node.js tools — it is used by npm itself, Create React App, and hundreds of other CLI tools. I chose it because it provides declarative command and option definitions, automatic `--help` generation, version flag support, and subcommand routing — all in a single dependency. My CLI has three commands (`listen`, `auth`, `clear`), each defined in a few lines with Commander's fluent API.

**Q: What are the alternatives to Commander.js and why did you not choose them?**
**Answer:** `yargs` is more powerful for complex CLIs with nested commands and middleware, but it is heavier and its API is less intuitive for simple tools. `oclif` (Salesforce's CLI framework) provides a full plugin architecture with TypeScript decorators, but it is designed for enterprise CLIs, not lightweight developer tools. `minimist` is the lightest option (just argument parsing), but it provides no help generation, version flags, or subcommand routing.

---

### @ngrok/ngrok

**Q: Why did you choose the Ngrok Node.js SDK for this project?**
**Answer:** I chose the official `@ngrok/ngrok` SDK because it embeds tunnel management directly into my Node.js process. I call `ngrok.forward({ addr: port, authtoken })` and get a public URL — no child process spawning, no stdout parsing, no binary management. The tunnel lifecycle is tied to my process, which means clean startup and shutdown. The SDK also supports the `SIGINT` handler pattern for graceful teardown.

**Q: What are the alternatives to Ngrok and why did you not choose them?**
**Answer:** Cloudflare Tunnel (`cloudflared`) is free and does not require an account for quick tunnels, but it does not have an official Node.js SDK — I would need to spawn the binary as a child process. `localtunnel` is a free npm package, but it is less reliable and has had availability issues. `frp` (Fast Reverse Proxy) is self-hosted and powerful, but requires running your own server, which contradicts the "zero setup" philosophy.

---

### uuid

**Q: Why did you choose the `uuid` package for this project?**
**Answer:** Each webhook needs a unique identifier for storage, retrieval, deletion, and replay. UUIDv4 provides 122 bits of randomness, making collisions statistically impossible. The `uuid` package is the standard implementation for Node.js — it uses cryptographically secure random number generation via `crypto.getRandomValues()`. I use it to generate the webhook ID at insertion time in the relay handler: `id: uuidv4()`.

**Q: What are the alternatives to uuid and why did you not choose them?**
**Answer:** `nanoid` generates shorter IDs and is faster, but UUIDv4 is the industry standard format that every developer recognises. `crypto.randomUUID()` is built into Node.js 14.17+ and would eliminate the dependency entirely — this is an optimisation I would make in version 2. `cuid2` provides sortable IDs which would be useful for time-ordered queries, but my timestamp index already handles ordering.

---

## Section 11: Language Choice Interrogation

### Q: "Why Node.js? Can't you build this in Python — you also know Python."

**Answer:**
Python is a great language for this type of project, and FastAPI would handle the HTTP and async aspects well. I chose Node.js for three concrete reasons. First, npm's global install mechanism (`npm install -g webhookforge`) is the standard distribution channel for developer CLI tools — pip's global install is less predictable across environments and often conflicts with system Python. Second, the WebSocket ecosystem in Node.js is mature and unified — the `ws` package is the clear standard, whereas Python's WebSocket landscape is split between `websockets`, `aiohttp`, and framework-specific implementations. Third, the Express `verify` callback for raw body capture is a unique feature that does not have a clean equivalent in FastAPI's dependency injection model. I would need custom middleware in FastAPI, which is possible but less elegant.

---

### Q: "Why TypeScript over plain JavaScript? What does it concretely give you here?"

**Answer:**
TypeScript gives me three things that matter for this specific project. First, the `WebhookInput` interface in `db.ts` catches field name mismatches between the HTTP layer and the database layer at compile time — a typo like `relayId` vs `relay_id` is caught before runtime. Second, Prisma's generated client is fully typed, so when I query `prisma.webhook.findMany()`, the return type is inferred from the schema, and my IDE auto-completes field names. Third, the `RawBodyRequest` interface extension ensures I only access `rawBody` on requests that have been cast correctly, preventing undefined access errors. Without TypeScript, these would all be runtime bugs discovered during manual testing.

---

### Q: "Could this project have been built in Go or Rust? What would you gain or lose?"

**Answer:**
In Go, I would gain goroutine-based concurrency that handles thousands of simultaneous connections without the event loop model, a single compiled binary for distribution (no runtime dependency), and stronger type safety. I would lose the npm distribution channel, the rich middleware ecosystem of Express, and development velocity — Go's HTTP routing requires more boilerplate. In Rust, I would gain memory safety without garbage collection and extreme performance, but I would lose significant development speed — Rust's ownership model makes async code more complex, and the ecosystem for CLI tools and WebSocket servers, while growing, is less mature. For a local developer tool where development speed and ecosystem integration matter more than raw performance, Node.js was the right choice.

---

### Q: "Node.js is single-threaded. Doesn't that make it a bad choice for handling many simultaneous webhook connections?"

**Answer:**
This is a common misconception. Node.js is single-threaded for JavaScript execution, but the underlying libuv event loop handles thousands of concurrent I/O operations — TCP connections, file reads, database queries — in parallel via the OS kernel's epoll/kqueue/IOCP mechanisms. A webhook arriving is an I/O event: receive bytes from the socket, write to SQLite, push bytes to WebSocket clients. None of these operations block the event loop. The single-threaded model would be a problem if I needed to do CPU-intensive work like image processing or complex encryption for every webhook, but I do not. The Node.js event loop is purpose-built for exactly this workload: high-concurrency, I/O-bound request handling.

---

### Q: "If you had to rewrite WebHookForge in Python tomorrow, what would be the hardest part to replicate and why?"

**Answer:**
The hardest part would be replicating the seamless WebSocket and HTTP server sharing on a single port. In Node.js, I create one HTTP server and attach both Express and the WebSocket server to it — they share port 3000. In Python, I would need an ASGI server like Uvicorn running both a FastAPI app and a WebSocket handler, which requires more configuration and a different programming model (ASGI lifecycle events vs Express middleware). The second hardest part would be the npm global install distribution — pip's `entry_points` for CLI tools work differently and are less predictable across operating systems. The core logic — HTTP handling, SQLite operations, JSON manipulation — would translate straightforwardly.

---

## Section 12: Optimisation Questions

### Q: "How would you optimise your SQLite queries for faster reads when there are 100,000 stored webhooks?"

**Answer:**
I already have two indexes defined: `relay_id` for filtered queries and `timestamp DESC` for sorted listing. For 100,000 records, these indexes are sufficient for most queries. The main optimisation I would add is cursor-based pagination. My current `getAll` function uses `skip: offset` (OFFSET-based pagination), which requires SQLite to scan and discard `offset` rows before returning results — at page 5000 of 20 records per page, that is 100,000 rows scanned just to skip. I would switch to cursor-based pagination using the `timestamp` and `id` of the last record on the previous page: `WHERE timestamp < :lastTimestamp ORDER BY timestamp DESC LIMIT 20`. This makes every page fetch equally fast regardless of depth.

---

### Q: "Your WebSocket broadcast loops through all connected clients synchronously. How would you optimise this for 10,000 connected clients?"

**Answer:**
The current broadcast function iterates over the `clients` Set and calls `send()` for each client sequentially. For 10,000 clients, the JSON serialisation should happen once (it already does — I serialise `message` before the loop), but the send operations could be batched. I would group clients by relay subscription and pre-filter before iterating, reducing the loop size. I would also consider using `setImmediate()` to yield the event loop every 100 sends, preventing other incoming requests from starving. For true scale, I would move to a pub/sub architecture where the broadcast is handled by Redis and each server instance only sends to its own local clients.

---

### Q: "Your current pagination uses OFFSET. What's wrong with OFFSET-based pagination at scale?"

**Answer:**
OFFSET-based pagination has O(offset + limit) performance because the database must scan and discard all rows before the offset. On page 1, it scans 20 rows. On page 5000, it scans 100,020 rows and discards 100,000. This makes deep pages progressively slower. Cursor-based pagination (also called keyset pagination) uses a `WHERE` clause on the indexed column: `WHERE timestamp < :cursor ORDER BY timestamp DESC LIMIT 20`. This always scans exactly `limit` rows because it seeks directly to the cursor position using the index. The tradeoff is that cursor-based pagination does not support jumping to an arbitrary page number — you can only go forward or backward from the current position — but for a real-time webhook feed where users scroll chronologically, that is perfectly acceptable.

---

### Q: "How would you optimise your Docker image size?"

> ⚠️ Prepare carefully — this exposes a gap

**Answer:**
The project does not currently include a Dockerfile. If I were to create one, I would use a multi-stage build. The first stage (`builder`) would use `node:20-alpine`, copy `package.json` and `package-lock.json`, run `npm ci`, copy the TypeScript source, and run `tsc`. The second stage (`runtime`) would use `node:20-alpine`, copy only `dist/`, `public/`, `prisma/`, and `node_modules/` from the builder. I would also add a `.dockerignore` to exclude `node_modules/`, `.git/`, and TypeScript source from the build context. For further optimisation, I would prune dev dependencies with `npm ci --omit=dev` in the runtime stage, which removes TypeScript, tsx, and type definitions that are not needed at runtime.

---

### Q: "Your rate limiter stores state in-memory. What breaks if you run two instances?"

> ⚠️ Prepare carefully — this exposes a gap

**Answer:**
Rate limiting is not yet implemented, but if I added `express-rate-limit` with the default in-memory store and ran two instances behind a load balancer, each instance would maintain its own counter. A client sending 50 requests to instance 1 and 50 to instance 2 would appear to be under the 100 req/min limit on both instances, even though it sent 100 total. The fix is to use a shared store — `rate-limit-redis` stores counters in Redis, which is accessible to all instances. This is the same pattern that API gateways use for distributed rate limiting.

---

## Section 13: Disadvantages Acknowledgement

### Q: "What are the biggest disadvantages of your current architecture?"

**Answer:**
The three biggest disadvantages are: no authentication (anyone who discovers the relay URL can send and read webhooks), no rate limiting (the relay endpoint is vulnerable to flooding), and single-process WebSocket state (the `clients` Set prevents horizontal scaling). For a single-user local tool, none of these are blockers — the relay URL is only reachable from localhost or through a private Ngrok tunnel. But if I needed to move to a shared or cloud deployment, all three would need to be addressed immediately: JWT auth, Redis-backed rate limiting, and Redis Pub/Sub for WebSocket fan-out.

---

### Q: "What are the disadvantages of using SQLite in a tool like this?"

**Answer:**
SQLite cannot handle concurrent writes from multiple processes — it uses file-level locking that causes `SQLITE_BUSY` errors under contention. It does not support network connections, so I cannot run the database on a separate machine. There is no built-in user access control. It stores JSON as plain text rather than providing native JSON query operators like PostgreSQL's JSONB. And backups require copying the entire file, which is not atomic unless I use the SQLite backup API. For WebHookForge, these limitations do not matter because it is a single-process, single-user, local tool. They would matter immediately if I tried to make it multi-tenant or cloud-hosted.

---

### Q: "What are the disadvantages of WebSockets compared to HTTP polling?"

**Answer:**
WebSockets require persistent TCP connections, which consume server memory per client — each connection holds a socket buffer and the associated state in the `clients` Set. HTTP polling is stateless; the server holds no per-client memory between requests. WebSockets also require explicit lifecycle management — heartbeats, reconnection, dead client cleanup — which is code I had to write myself. Proxies and load balancers sometimes struggle with WebSocket upgrade requests, requiring special configuration. And debugging WebSocket communication is harder than debugging HTTP requests, since browser DevTools show WebSocket frames in a separate panel with less tooling. For WebHookForge, the persistent connection cost is negligible because it serves a handful of dashboard tabs, not thousands of users.

---

### Q: "What are the disadvantages of Prisma as an ORM?"

**Answer:**
Prisma's generated client adds approximately 2 MB to the installed package size. It introduces startup latency because the generated client must be loaded into memory. Complex queries require `$executeRaw`, which bypasses type safety. Prisma migrations are a heavy mechanism for a project with a single stable table. The Prisma engine is a separate binary (written in Rust) that runs as a sidecar to the Node.js process, adding memory overhead. And Prisma's abstraction means I cannot use database-specific optimisations like SQLite PRAGMAs through the ORM. For WebHookForge, the tradeoff is acceptable because the type safety, schema documentation, and `postinstall` auto-generation outweigh the overhead costs for a developer tool that runs locally.

---

### Q: "What are the disadvantages of storing configuration in the home directory compared to environment variables?"

**Answer:**
File-based config at `~/webhookforge.json` is persistent and convenient but has three disadvantages. It is visible to any process running under the same OS user — another application or script could read the Ngrok token. Environment variables are scoped to the current shell session and its children, providing slightly better isolation. File-based config is also harder to manage in CI/CD pipelines, where environment variables are the standard mechanism for injecting secrets. And the config file does not support different configurations per project — the token is global to the user, not per-directory. I mitigate this by supporting the `NGROK_AUTHTOKEN` environment variable as a fallback, so CI/CD pipelines can use env vars while local development uses the config file.

---

## Section 14: "What If" Scenario Questions

### Q: "What if Ngrok deprecated their Node.js API tomorrow?"

**Answer:**
I would switch to spawning the Ngrok CLI binary as a child process using Node.js's `child_process.spawn()`. I would start `ngrok http <port>`, parse the public URL from the ngrok API (which runs on `localhost:4040/api/tunnels`), and manage the process lifecycle manually. Alternatively, I would evaluate Cloudflare Tunnel's `cloudflared` binary, which provides free tunnels without authentication for quick testing. The `createTunnel` function in `utils/tunnel.ts` is already isolated behind a clean interface (`Promise<string | null>`), so replacing the implementation would not require changes to any other file.

---

### Q: "What if Prisma introduced a critical bug — how would you fall back to raw SQL?"

**Answer:**
I would replace Prisma with `better-sqlite3`, which is a synchronous SQLite driver for Node.js. My database module (`db.ts`) already encapsulates all database access behind exported functions (`insert`, `getAll`, `getById`, `deleteById`). The rest of the codebase calls these functions — it never touches Prisma directly. I would rewrite the function bodies to use `better-sqlite3`'s `prepare().run()` and `prepare().all()` methods. The `WebhookInput` interface would remain unchanged. The hardest part would be losing Prisma's `postinstall` generation hook — I would need to run `CREATE TABLE IF NOT EXISTS` at startup, which I already do as a safety net with `$executeRawUnsafe`.

---

### Q: "What if the project needed to go from single-user local tool to a multi-tenant cloud SaaS?"

**Answer:**
The first five architectural changes would be: replace SQLite with PostgreSQL for concurrent multi-user access. Add a `users` table with authentication (JWT + bcrypt). Add a `userId` foreign key to the `webhooks` table for tenant isolation. Replace the in-memory WebSocket `clients` Set with Redis Pub/Sub for cross-instance broadcast. And add API key-based authentication on the relay endpoint so each user's relay URLs are protected. Beyond these five, I would add Stripe billing integration, a web-based onboarding flow, HTTPS termination with a reverse proxy, structured logging with a service like Datadog, and a proper CI/CD pipeline with staging and production environments.

---

## Section 15: Technology Decision Matrix

### Runtime

| | Node.js (chosen) | Python | Go |
|---|---|---|---|
| Why fits this project | Event loop handles I/O-bound webhook relay perfectly; npm provides global CLI distribution | FastAPI handles async well; rich ecosystem | Goroutines for concurrency; single binary distribution |
| Key advantage | npm install -g for CLI distribution; unified JS for server + dashboard | Faster prototyping for data-heavy logic; superior ML/data libraries | Zero-dependency compiled binary; goroutine concurrency model |
| Key disadvantage | Single-threaded CPU bottleneck; large `node_modules` | GIL limits true parallelism; pip distribution is less reliable for CLIs | Verbose boilerplate; slower development velocity |
| When to choose instead | I/O-bound tools with npm distribution needs | Data processing pipelines; ML-integrated backends | High-performance microservices; system-level tooling |

### Database

| | SQLite (chosen) | PostgreSQL | MongoDB | Redis |
|---|---|---|---|---|
| Why fits this project | Zero-config embedded database; single-file persistence at `~/webhookforge/` | Best for multi-user concurrent access | Flexible schema for arbitrary payloads | In-memory speed for ephemeral data |
| Key advantage | No server process; file-level portability | ACID transactions; JSONB native queries; concurrent writes | Schema-less; natural fit for heterogeneous JSON payloads | Sub-millisecond reads; built-in TTL for auto-expiry |
| Key disadvantage | File-level write locking; no concurrent multi-process access | Requires server installation and configuration | Weaker consistency guarantees; higher memory usage | Data lost on restart unless persistence is configured |
| When to choose instead | Single-user embedded tools; mobile apps | Multi-user SaaS; production workloads | Rapidly evolving schemas; document-oriented data | Caching layers; session stores; rate limiter backends |

### Real-time Transport

| | WebSockets (chosen) | SSE | Long Polling | HTTP/2 Push |
|---|---|---|---|---|
| Why fits this project | Bidirectional — client sends subscribe, server pushes events | Server-to-client push only | Fallback for legacy environments | Server-initiated, but limited browser support for push |
| Key advantage | Full-duplex; supports subscribe/unsubscribe commands from client | Simple; auto-reconnects; works through HTTP proxies natively | Universal browser support; no special server config | Multiplexed streams on single connection |
| Key disadvantage | Requires heartbeat and reconnection logic; proxy configuration | One-directional only; cannot send commands from client | High latency; wasted connections; inefficient | Limited browser API; no real bidirectional communication |
| When to choose instead | Interactive dashboards; chat; collaborative editing | One-way event feeds; notifications; log streaming | Legacy browser support; environments blocking WebSocket upgrades | Asset preloading; HTTP/2 multiplexed API responses |

### ORM / DB Layer

| | Prisma (chosen) | Knex | Drizzle | Raw SQL |
|---|---|---|---|---|
| Why fits this project | Type-safe generated client; schema as documentation; postinstall hook | Lightweight query builder; flexible | Lightweight; excellent TypeScript inference | Maximum control; no abstraction overhead |
| Key advantage | Generated types from schema; migration tracking; `postinstall` auto-setup | Supports query composition; lighter than Prisma | Near-zero overhead; SQL-like syntax with full type safety | No dependency; full access to database-specific features |
| Key disadvantage | Large generated client (~2MB); Rust engine sidecar; complex queries need raw SQL | No generated types; manual type definitions needed | Newer ecosystem; fewer learning resources | No type safety; no schema documentation; SQL injection risk |
| When to choose instead | Projects needing schema-first design and type safety | Projects needing flexible query building without full ORM | New projects wanting lightweight type-safe SQL | Performance-critical code; simple schemas; experienced SQL developers |

### Tunneling

| | Ngrok (chosen) | Cloudflare Tunnel | localtunnel | frp |
|---|---|---|---|---|
| Why fits this project | Official Node.js SDK; programmatic control; widely adopted | Free without auth for quick tunnels | npm package; zero config | Self-hosted; full control |
| Key advantage | First-class Node.js SDK; reliable infrastructure; request inspection | Free tier with custom domains; Cloudflare's global network | Simplest setup; npm install + one command | No third-party dependency; self-hosted reliability |
| Key disadvantage | Requires auth token; free tier generates random URLs per session | No official Node.js SDK; must spawn CLI binary | Less reliable; occasional downtime; unmaintained periods | Requires your own server; complex setup |
| When to choose instead | Developer tools needing programmatic tunnel control | Production tunnels with Cloudflare DNS integration | Quick one-off testing; proof of concepts | Enterprise environments requiring full infrastructure control |

### Deployment

| | Fly.io (chosen) | Railway | Render | AWS EC2 |
|---|---|---|---|---|
| Why fits this project | Edge deployment close to users; simple CLI; persistent volumes for SQLite | Zero-config deploys from Git; managed databases | Free tier; auto-deploys from GitHub | Full control; any architecture |
| Key advantage | Global edge network; persistent volumes; firecracker microVMs | Fastest deploy experience; built-in database provisioning | Generous free tier; automatic HTTPS | Unlimited flexibility; VPC networking; IAM |
| Key disadvantage | Persistent volume limited to single region; proprietary CLI | Less mature; occasional reliability issues | Cold starts on free tier; limited regions | Complex setup; requires DevOps knowledge |
| When to choose instead | Global low-latency apps; SQLite-based services needing disk | Rapid prototyping; small team projects | Simple web apps; hobby projects with budget constraints | Enterprise workloads; complex networking; compliance requirements |

---

## The Three Questions That Will Define Your Interview

**1. "Walk me through the full request lifecycle from webhook arrival to dashboard display."** — This is the question that proves you built the project, not copy-pasted it; memorise the middleware order, the verify callback, the database write, the WebSocket broadcast, and the client-side re-fetch chain, because every follow-up question will branch from your answer here.

**2. "What are the biggest disadvantages of your current architecture?"** — This is the question that separates a mature engineer from a nervous fresher; your honest acknowledgement of missing rate limiting, missing authentication, and single-process WebSocket state, followed by specific remediation plans, demonstrates the intellectual honesty that top MNC interviewers value above any technical trick.

**3. "Why did you choose X over Y?" for any technology in your stack.** — This question pattern will be repeated five to eight times across any interview; your ability to acknowledge the alternative's strengths, state two project-specific reasons for your choice, and name one honest limitation of what you picked, delivered without defensiveness, is the single strongest signal of engineering maturity at the SDE-1/SDE-2 level.
