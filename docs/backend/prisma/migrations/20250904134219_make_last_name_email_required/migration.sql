/*
  Warnings:

  - Made the column `email` on table `lead` required. This step will fail if there are existing NULL values in that column.
  - Made the column `lastName` on table `lead` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_lead" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "jobTitle" TEXT,
    "countryCode" TEXT,
    "companyName" TEXT,
    "message" TEXT
);
INSERT INTO "new_lead" ("companyName", "countryCode", "createdAt", "email", "firstName", "id", "jobTitle", "lastName", "message", "updatedAt") SELECT "companyName", "countryCode", "createdAt", "email", "firstName", "id", "jobTitle", "lastName", "message", "updatedAt" FROM "lead";
DROP TABLE "lead";
ALTER TABLE "new_lead" RENAME TO "lead";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
