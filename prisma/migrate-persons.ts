/**
 * Script de migración: Columnas planas de víctima/agresor → tabla CasePerson
 *
 * Ejecutar UNA sola vez ANTES de `npx prisma db push --accept-data-loss`.
 * Este script:
 *   1. Crea la tabla CasePerson si no existe (SQLite).
 *   2. Lee los datos existentes de las columnas planas (ya cifrados).
 *   3. Los copia como registros CasePerson SIN descifrar ni re-cifrar.
 *
 * Uso:
 *   npx tsx prisma/migrate-persons.ts
 *
 * IMPORTANTE: Hacer backup de la BD antes de ejecutar.
 */

import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

interface OldCaseRow {
  id: string;
  victimName: string;
  victimDni: string;
  victimPhone: string;
  victimStreet: string;
  victimNumber: string;
  victimDistrict: string;
  victimAnnex: string;
  victimCommunity: string;
  victimReference: string;
  aggressorName: string;
  aggressorDni: string;
  aggressorPhone: string;
  aggressorStreet: string;
  aggressorNumber: string;
  aggressorDistrict: string;
  aggressorAnnex: string;
  aggressorCommunity: string;
  aggressorReference: string;
}

async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  MIGRACIÓN: Columnas planas → Tabla CasePerson');
  console.log('═══════════════════════════════════════════════════════\n');

  // Paso 1: Crear la tabla CasePerson si no existe (SQLite)
  console.log('1️⃣  Verificando/creando tabla CasePerson...');
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "CasePerson" (
      "id"        TEXT NOT NULL PRIMARY KEY,
      "caseId"    TEXT NOT NULL,
      "role"      TEXT NOT NULL,
      "sortOrder" INTEGER NOT NULL DEFAULT 0,
      "name"      TEXT NOT NULL,
      "dni"       TEXT NOT NULL,
      "phone"     TEXT NOT NULL,
      "street"    TEXT NOT NULL DEFAULT '',
      "number"    TEXT NOT NULL DEFAULT '',
      "district"  TEXT NOT NULL,
      "annex"     TEXT NOT NULL DEFAULT '',
      "community" TEXT NOT NULL DEFAULT '',
      "reference" TEXT NOT NULL DEFAULT '',
      CONSTRAINT "CasePerson_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )
  `);

  // Crear índices si no existen
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "CasePerson_caseId_idx" ON "CasePerson"("caseId")`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "CasePerson_role_idx" ON "CasePerson"("role")`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "CasePerson_caseId_role_sortOrder_idx" ON "CasePerson"("caseId", "role", "sortOrder")`);
  console.log('   ✓ Tabla CasePerson lista.\n');

  // Paso 2: Leer datos de las columnas antiguas
  let rows: OldCaseRow[];
  try {
    rows = await prisma.$queryRawUnsafe<OldCaseRow[]>(`
      SELECT id, victimName, victimDni, victimPhone, victimStreet, victimNumber,
             victimDistrict, victimAnnex, victimCommunity, victimReference,
             aggressorName, aggressorDni, aggressorPhone, aggressorStreet, aggressorNumber,
             aggressorDistrict, aggressorAnnex, aggressorCommunity, aggressorReference
      FROM "Case"
      WHERE isDeleted = 0
    `);
  } catch (err) {
    console.log('⚠️  Las columnas antiguas ya no existen — la migración ya se ejecutó.');
    console.log('   Puede ejecutar `npx prisma db push --accept-data-loss` de forma segura.');
    console.log('   Error:', (err as Error).message);
    process.exit(0);
  }

  if (rows.length === 0) {
    console.log('ℹ️  No hay casos existentes para migrar.');
    console.log('   Puede ejecutar `npx prisma db push --accept-data-loss` de forma segura.');
    process.exit(0);
  }

  console.log(`2️⃣  Encontrados ${rows.length} casos para migrar.\n`);

  let migrated = 0;
  let skipped = 0;

  for (const row of rows) {
    // Verificar si ya tiene personas asociadas (evitar duplicar en re-ejecuciones)
    const existing = await prisma.$queryRawUnsafe<{ cnt: number }[]>(
      `SELECT COUNT(*) as cnt FROM "CasePerson" WHERE "caseId" = ?`,
      row.id,
    );
    if (existing[0]?.cnt > 0) {
      skipped++;
      continue;
    }

    // Insertar víctima
    await prisma.$executeRawUnsafe(
      `INSERT INTO "CasePerson" ("id","caseId","role","sortOrder","name","dni","phone","street","number","district","annex","community","reference")
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      randomUUID(), row.id, 'victim', 0,
      row.victimName, row.victimDni, row.victimPhone,
      row.victimStreet ?? '', row.victimNumber ?? '',
      row.victimDistrict,
      row.victimAnnex ?? '', row.victimCommunity ?? '',
      row.victimReference ?? '',
    );

    // Insertar agresor
    await prisma.$executeRawUnsafe(
      `INSERT INTO "CasePerson" ("id","caseId","role","sortOrder","name","dni","phone","street","number","district","annex","community","reference")
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      randomUUID(), row.id, 'aggressor', 0,
      row.aggressorName, row.aggressorDni, row.aggressorPhone,
      row.aggressorStreet ?? '', row.aggressorNumber ?? '',
      row.aggressorDistrict,
      row.aggressorAnnex ?? '', row.aggressorCommunity ?? '',
      row.aggressorReference ?? '',
    );

    migrated++;
    if (migrated % 50 === 0) {
      console.log(`   → ${migrated} casos migrados...`);
    }
  }

  console.log('\n═══════════════════════════════════════════════════════');
  console.log(`  ✓ Migración completada`);
  console.log(`    • Casos migrados:  ${migrated}`);
  console.log(`    • Casos omitidos:  ${skipped} (ya tenían personas)`);
  console.log(`    • Registros CasePerson creados: ${migrated * 2}`);
  console.log('═══════════════════════════════════════════════════════\n');
  console.log('SIGUIENTE PASO:');
  console.log('  npx prisma db push --accept-data-loss');
  console.log('  (Esto eliminará las columnas planas antiguas y sincronizará el schema.)\n');
}

main()
  .catch(err => {
    console.error('❌ Error fatal:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
