-- CreateTable
CREATE TABLE "WaChatMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "waMessageId" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "fromMe" BOOLEAN NOT NULL,
    "timestamp" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "WaGreeting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientWhatsapp" TEXT NOT NULL,
    "lastGreetingAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "WaHandoff" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientWhatsapp" TEXT NOT NULL,
    "muteUntil" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "WaChatMessage_waMessageId_key" ON "WaChatMessage"("waMessageId");

-- CreateIndex
CREATE UNIQUE INDEX "WaGreeting_clientWhatsapp_key" ON "WaGreeting"("clientWhatsapp");

-- CreateIndex
CREATE UNIQUE INDEX "WaHandoff_clientWhatsapp_key" ON "WaHandoff"("clientWhatsapp");
