-- CreateTable
CREATE TABLE "Card" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "player" TEXT NOT NULL,
    "year" TEXT NOT NULL,
    "set" TEXT NOT NULL,
    "variant" TEXT,
    "serialNumber" TEXT,
    "isRookie" BOOLEAN NOT NULL DEFAULT false,
    "condition" TEXT NOT NULL DEFAULT 'NM',
    "priceLow" INTEGER,
    "priceHigh" INTEGER,
    "askingPrice" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "listingUrl" TEXT,
    "notes" TEXT,
    "imageUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "Card_status_idx" ON "Card"("status");

-- CreateIndex
CREATE INDEX "Card_player_idx" ON "Card"("player");
