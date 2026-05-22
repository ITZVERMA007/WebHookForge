-- CreateTable
CREATE TABLE "webhooks" (
    "id" TEXT NOT NULL,
    "relay_id" TEXT NOT NULL,
    "method" TEXT NOT NULL DEFAULT 'POST',
    "headers" JSONB NOT NULL,
    "body" JSONB,
    "query" JSONB,
    "source_ip" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'received',

    CONSTRAINT "webhooks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "webhooks_relay_id_idx" ON "webhooks"("relay_id");

-- CreateIndex
CREATE INDEX "webhooks_timestamp_idx" ON "webhooks"("timestamp" DESC);
