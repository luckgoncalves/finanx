-- Open Finance (Pluggy): conexões bancárias, vínculo de cartão e id externo para sync idempotente
CREATE TABLE "bank_connections" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'pluggy',
    "item_id" TEXT NOT NULL,
    "bank_name" TEXT,
    "status" TEXT,
    "last_sync_at" TIMESTAMP(3),
    "last_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "bank_connections_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "bank_connections_item_id_key" ON "bank_connections"("item_id");
CREATE INDEX "bank_connections_user_id_idx" ON "bank_connections"("user_id");
ALTER TABLE "bank_connections" ADD CONSTRAINT "bank_connections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "credit_cards" ADD COLUMN "pluggy_account_id" TEXT;
CREATE UNIQUE INDEX "credit_cards_pluggy_account_id_key" ON "credit_cards"("pluggy_account_id");

-- external_id já pode existir (migration 20260209000000_add_open_finance_linked_account)
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "external_id" TEXT;
CREATE UNIQUE INDEX "transactions_external_id_key" ON "transactions"("external_id");
