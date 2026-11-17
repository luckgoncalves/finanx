-- CreateTable
CREATE TABLE "linked_accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'pluggy',
    "external_item_id" TEXT NOT NULL,
    "institution_name" TEXT NOT NULL,
    "institution_id" TEXT,
    "type" TEXT NOT NULL DEFAULT 'CREDIT_CARD',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "last_synced_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "linked_accounts_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN "source" TEXT DEFAULT 'manual',
ADD COLUMN "external_id" TEXT,
ADD COLUMN "linked_account_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "linked_accounts_user_id_external_item_id_key" ON "linked_accounts"("user_id", "external_item_id");

-- CreateIndex
CREATE INDEX "linked_accounts_user_id_idx" ON "linked_accounts"("user_id");

-- CreateIndex
CREATE INDEX "linked_accounts_external_item_id_idx" ON "linked_accounts"("external_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_user_id_external_id_key" ON "transactions"("user_id", "external_id");

-- CreateIndex
CREATE INDEX "transactions_linked_account_id_idx" ON "transactions"("linked_account_id");

-- AddForeignKey
ALTER TABLE "linked_accounts" ADD CONSTRAINT "linked_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_linked_account_id_fkey" FOREIGN KEY ("linked_account_id") REFERENCES "linked_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
