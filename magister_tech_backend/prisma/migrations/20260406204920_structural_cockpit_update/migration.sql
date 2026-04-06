/*
  Warnings:

  - You are about to drop the `FeedPost` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PipelineLead` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `bio` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `color` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `instagram` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `linkedin` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `photo` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `whatsapp` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `budget` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `clientEmail` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `clientLead` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `clientWhatsapp` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `color` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `goals` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `internalLead` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `metas` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `plan` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `progress` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `summary` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `imageUrl` on the `Content` table. All the data in the column will be lost.
  - You are about to drop the column `archived` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `origin` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `participants` on the `Event` table. All the data in the column will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "FeedPost";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "PipelineLead";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Fatura" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contratoId" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "valor" REAL NOT NULL,
    "vencimento" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "paidAt" DATETIME,
    "descricao" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Fatura_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "Contract" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Fatura_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "action" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'BACKLOG',
    "priority" TEXT NOT NULL DEFAULT 'MEDIA',
    "deadline" DATETIME,
    "checklist" TEXT,
    "tags" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "tipo" TEXT NOT NULL DEFAULT 'tarefa',
    "masterSeen" BOOLEAN NOT NULL DEFAULT false,
    "assigneeId" TEXT,
    "projectId" TEXT,
    "clientId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Task_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Task_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Task_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Task" ("assigneeId", "checklist", "clientId", "createdAt", "deadline", "description", "id", "order", "priority", "projectId", "status", "tags", "title", "updatedAt") SELECT "assigneeId", "checklist", "clientId", "createdAt", "deadline", "description", "id", "order", "priority", "projectId", "status", "tags", "title", "updatedAt" FROM "Task";
DROP TABLE "Task";
ALTER TABLE "new_Task" RENAME TO "Task";
CREATE TABLE "new_Transaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "dueDate" DATETIME NOT NULL,
    "paidAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "category" TEXT,
    "costCenter" TEXT,
    "recurrence" BOOLEAN NOT NULL DEFAULT false,
    "recurringType" TEXT,
    "isFixedExpense" BOOLEAN NOT NULL DEFAULT false,
    "employeeId" TEXT,
    "observations" TEXT,
    "clientId" TEXT,
    "contractId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Transaction_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Transaction_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Transaction" ("amount", "category", "clientId", "contractId", "costCenter", "createdAt", "description", "dueDate", "id", "observations", "paidAt", "recurrence", "status", "type", "updatedAt") SELECT "amount", "category", "clientId", "contractId", "costCenter", "createdAt", "description", "dueDate", "id", "observations", "paidAt", "recurrence", "status", "type", "updatedAt" FROM "Transaction";
DROP TABLE "Transaction";
ALTER TABLE "new_Transaction" RENAME TO "Transaction";
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'COLABORADOR',
    "sector" TEXT,
    "phone" TEXT,
    "avatar" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("avatar", "createdAt", "email", "id", "isActive", "name", "password", "phone", "role", "sector", "updatedAt") SELECT "avatar", "createdAt", "email", "id", "isActive", "name", "password", "phone", "role", "sector", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE TABLE "new_Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'marketing',
    "status" TEXT NOT NULL DEFAULT 'EM_ANDAMENTO',
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME,
    "description" TEXT,
    "deliverables" TEXT,
    "observations" TEXT,
    "coreColors" TEXT,
    "fontFamily" TEXT,
    "socialMediaLinks" TEXT,
    "mandatoryRules" TEXT,
    "organogramData" TEXT,
    "clientId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Project_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Project" ("clientId", "createdAt", "deliverables", "description", "endDate", "id", "name", "observations", "startDate", "status", "type", "updatedAt") SELECT "clientId", "createdAt", "deliverables", "description", "endDate", "id", "name", "observations", "startDate", "status", "type", "updatedAt" FROM "Project";
DROP TABLE "Project";
ALTER TABLE "new_Project" RENAME TO "Project";
CREATE TABLE "new_Content" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "caption" TEXT,
    "platform" TEXT NOT NULL DEFAULT 'instagram',
    "status" TEXT NOT NULL DEFAULT 'IDEIA',
    "publishAt" DATETIME,
    "campaign" TEXT,
    "fileUrl" TEXT,
    "observations" TEXT,
    "versao" INTEGER NOT NULL DEFAULT 1,
    "aprovadoEm" DATETIME,
    "comentarios" TEXT,
    "clientId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "projectId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Content_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Content_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Content_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Content" ("authorId", "campaign", "caption", "clientId", "createdAt", "fileUrl", "id", "observations", "platform", "projectId", "publishAt", "status", "title", "updatedAt") SELECT "authorId", "campaign", "caption", "clientId", "createdAt", "fileUrl", "id", "observations", "platform", "projectId", "publishAt", "status", "title", "updatedAt" FROM "Content";
DROP TABLE "Content";
ALTER TABLE "new_Content" RENAME TO "Content";
CREATE TABLE "new_Client" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "company" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "cnpj" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ATIVO',
    "briefing" TEXT,
    "scope" TEXT,
    "strategies" TEXT,
    "observations" TEXT,
    "segment" TEXT,
    "responsible" TEXT,
    "healthScore" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Client" ("briefing", "cnpj", "company", "createdAt", "email", "id", "name", "observations", "phone", "responsible", "scope", "segment", "status", "strategies", "updatedAt") SELECT "briefing", "cnpj", "company", "createdAt", "email", "id", "name", "observations", "phone", "responsible", "scope", "segment", "status", "strategies", "updatedAt" FROM "Client";
DROP TABLE "Client";
ALTER TABLE "new_Client" RENAME TO "Client";
CREATE TABLE "new_Event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'INTERNO',
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME,
    "allDay" BOOLEAN NOT NULL DEFAULT false,
    "location" TEXT,
    "color" TEXT,
    "clientId" TEXT,
    "userId" TEXT,
    "projectId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Event_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Event_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Event_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Event" ("allDay", "clientId", "color", "createdAt", "description", "endDate", "id", "location", "projectId", "startDate", "title", "type", "updatedAt", "userId") SELECT "allDay", "clientId", "color", "createdAt", "description", "endDate", "id", "location", "projectId", "startDate", "title", "type", "updatedAt", "userId" FROM "Event";
DROP TABLE "Event";
ALTER TABLE "new_Event" RENAME TO "Event";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
