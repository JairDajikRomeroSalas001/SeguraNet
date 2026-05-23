-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Case" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "caseNumber" TEXT NOT NULL,
    "assignedOfficer" TEXT NOT NULL,
    "origin" TEXT NOT NULL,
    "entryDate" TEXT NOT NULL,
    "entryTime" TEXT NOT NULL,
    "victimName" TEXT NOT NULL,
    "victimDni" TEXT NOT NULL,
    "victimPhone" TEXT NOT NULL,
    "victimStreet" TEXT NOT NULL,
    "victimNumber" TEXT NOT NULL,
    "victimDistrict" TEXT NOT NULL,
    "victimAnnex" TEXT NOT NULL DEFAULT '',
    "victimCommunity" TEXT NOT NULL DEFAULT '',
    "victimReference" TEXT NOT NULL,
    "aggressorName" TEXT NOT NULL,
    "aggressorDni" TEXT NOT NULL,
    "aggressorPhone" TEXT NOT NULL,
    "aggressorStreet" TEXT NOT NULL,
    "aggressorNumber" TEXT NOT NULL,
    "aggressorDistrict" TEXT NOT NULL,
    "aggressorAnnex" TEXT NOT NULL DEFAULT '',
    "aggressorCommunity" TEXT NOT NULL DEFAULT '',
    "aggressorReference" TEXT NOT NULL,
    "violenceType" TEXT NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "incidentDescription" TEXT NOT NULL,
    "incidentDate" TEXT NOT NULL,
    "incidentTime" TEXT NOT NULL,
    "incidentLocation" TEXT NOT NULL,
    "riskFactors" TEXT NOT NULL DEFAULT '[]',
    "additionalObservations" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'Pendiente',
    "tags" TEXT NOT NULL DEFAULT '[]',
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" DATETIME,
    "integrityHash" TEXT NOT NULL,
    "createdByUid" TEXT NOT NULL,
    "createdByUsername" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Case_createdByUid_fkey" FOREIGN KEY ("createdByUid") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Case" ("additionalObservations", "aggressorDistrict", "aggressorDni", "aggressorName", "aggressorNumber", "aggressorPhone", "aggressorReference", "aggressorStreet", "assignedOfficer", "caseNumber", "createdAt", "createdByUid", "createdByUsername", "deletedAt", "entryDate", "entryTime", "id", "incidentDate", "incidentDescription", "incidentLocation", "incidentTime", "integrityHash", "isDeleted", "origin", "riskFactors", "riskLevel", "status", "tags", "updatedAt", "victimDistrict", "victimDni", "victimName", "victimNumber", "victimPhone", "victimReference", "victimStreet", "violenceType") SELECT "additionalObservations", "aggressorDistrict", "aggressorDni", "aggressorName", "aggressorNumber", "aggressorPhone", "aggressorReference", "aggressorStreet", "assignedOfficer", "caseNumber", "createdAt", "createdByUid", "createdByUsername", "deletedAt", "entryDate", "entryTime", "id", "incidentDate", "incidentDescription", "incidentLocation", "incidentTime", "integrityHash", "isDeleted", "origin", "riskFactors", "riskLevel", "status", "tags", "updatedAt", "victimDistrict", "victimDni", "victimName", "victimNumber", "victimPhone", "victimReference", "victimStreet", "violenceType" FROM "Case";
DROP TABLE "Case";
ALTER TABLE "new_Case" RENAME TO "Case";
CREATE UNIQUE INDEX "Case_caseNumber_key" ON "Case"("caseNumber");
CREATE INDEX "Case_createdByUid_idx" ON "Case"("createdByUid");
CREATE INDEX "Case_status_idx" ON "Case"("status");
CREATE INDEX "Case_isDeleted_idx" ON "Case"("isDeleted");
CREATE INDEX "Case_createdAt_idx" ON "Case"("createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
