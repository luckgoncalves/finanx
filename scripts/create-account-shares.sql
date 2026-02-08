-- Cria a tabela account_shares (Compartilhamento de conta)
-- Rode UMA VEZ no seu banco. Exemplo:
--   npx prisma db execute --file scripts/create-account-shares.sql
-- Ou com psql: psql $DATABASE_URL -f scripts/create-account-shares.sql

CREATE TABLE IF NOT EXISTS "account_shares" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "viewer_id" TEXT,
    "invitee_email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "account_shares_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "account_shares_token_key" ON "account_shares"("token");
CREATE INDEX IF NOT EXISTS "account_shares_owner_id_idx" ON "account_shares"("owner_id");
CREATE INDEX IF NOT EXISTS "account_shares_viewer_id_idx" ON "account_shares"("viewer_id");
CREATE INDEX IF NOT EXISTS "account_shares_status_idx" ON "account_shares"("status");

ALTER TABLE "account_shares" DROP CONSTRAINT IF EXISTS "account_shares_owner_id_fkey";
ALTER TABLE "account_shares" ADD CONSTRAINT "account_shares_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "account_shares" DROP CONSTRAINT IF EXISTS "account_shares_viewer_id_fkey";
ALTER TABLE "account_shares" ADD CONSTRAINT "account_shares_viewer_id_fkey" FOREIGN KEY ("viewer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
