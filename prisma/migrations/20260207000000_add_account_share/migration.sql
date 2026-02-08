-- CreateTable
CREATE TABLE "account_shares" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "viewer_id" TEXT,
    "invitee_email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "account_shares_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "account_shares_token_key" ON "account_shares"("token");

-- CreateIndex
CREATE INDEX "account_shares_owner_id_idx" ON "account_shares"("owner_id");

-- CreateIndex
CREATE INDEX "account_shares_viewer_id_idx" ON "account_shares"("viewer_id");

-- CreateIndex
CREATE INDEX "account_shares_status_idx" ON "account_shares"("status");

-- AddForeignKey
ALTER TABLE "account_shares" ADD CONSTRAINT "account_shares_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_shares" ADD CONSTRAINT "account_shares_viewer_id_fkey" FOREIGN KEY ("viewer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
