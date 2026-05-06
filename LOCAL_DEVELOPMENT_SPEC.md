# SeguraNet - Especificación para Desarrollo Local

**Propósito**: Implementación backend 100% local con SQLite  
**Para pasar a**: Claude Opus (implementación automática)  
**Ambiente**: Desarrollo local  
**Migración a nube**: Fase posterior (cambio mínimo de drivers)

---

## 🎯 Stack Local (Simplificado)

```
Frontend:        Next.js 15 + React 19 (SIN CAMBIOS)
Backend:         Next.js API Routes (SIN CAMBIOS)
Database:        SQLite3 (archivo local: seguranet.db)
ORM:             Prisma (abstracción de BD)
Auth:            JWT + HttpOnly cookies
Storage:         Filesystem local (/uploads)
Secretos:        Variables de entorno (.env.local)
```

### Por qué Prisma + SQLite

```
✅ Prisma abstrae la BD → fácil migrar a PostgreSQL después
✅ SQLite no necesita servidor
✅ Archivo único: seguranet.db
✅ 0 configuración
✅ Perfecto para desarrollo local
```

---

## 📦 Instalación de Dependencias

```bash
# Instalar todo lo necesario
npm install \
  @prisma/client \
  prisma \
  argon2 \
  jsonwebtoken \
  zod \
  dotenv \
  crypto

# Inicializar Prisma
npx prisma init
```

---

## 📁 Estructura de Archivos a Crear

```
src/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/route.ts          [NUEVO]
│   │   │   ├── logout/route.ts         [NUEVO]
│   │   │   └── session/route.ts        [NUEVO]
│   │   ├── cases/
│   │   │   ├── route.ts                [NUEVO]
│   │   │   └── [id]/
│   │   │       ├── route.ts            [NUEVO]
│   │   │       ├── status/route.ts     [NUEVO]
│   │   │       └── documents/
│   │   │           ├── route.ts        [NUEVO]
│   │   │           ├── request-upload/route.ts [NUEVO]
│   │   │           └── [docId]/
│   │   │               ├── route.ts
│   │   │               └── download/route.ts
│   │   ├── users/
│   │   │   ├── route.ts                [NUEVO]
│   │   │   └── [id]/route.ts           [NUEVO]
│   │   ├── audit/route.ts              [NUEVO]
│   │   └── backup/route.ts             [NUEVO]
│   └── middleware.ts                   [NUEVO]
│
├── lib/
│   ├── prisma.ts                       [NUEVO - cliente Prisma]
│   ├── security/
│   │   ├── password.ts                 [NUEVO - Argon2]
│   │   ├── jwt.ts                      [NUEVO - JWT tokens]
│   │   ├── hmac.ts                     [NUEVO - firma logs]
│   │   └── file-validator.ts           [NUEVO]
│   ├── middleware/
│   │   ├── auth-middleware.ts          [NUEVO]
│   │   ├── rbac-middleware.ts          [NUEVO]
│   │   └── rate-limit.ts               [NUEVO]
│   ├── storage/
│   │   └── local-storage.ts            [NUEVO - filesystem]
│   └── audit-logger.ts                 [MODIFICADO]
│
├── types/
│   └── index.ts                        [NUEVO - tipos Prisma]
│
└── prisma/
    └── schema.prisma                   [NUEVO - definición de BD]

uploads/                                [NUEVO - carpeta PDFs locales]
├── cases/
│   └── {caseId}/
│       └── documents/
│           └── {docId}.pdf

seguranet.db                            [NUEVO - archivo SQLite local]
.env.local                              [NUEVO - credenciales locales]
```

---

## 🗄️ Prisma Schema (seguranet/schema.prisma)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model User {
  id                String    @id @default(cuid())
  username          String    @unique
  passwordHash      String
  fullName          String
  dni               String    // Será cifrado antes de guardar
  role              String    @default("oficial_operativo") // superadmin | oficial_operativo | auditor | readonly
  isActive          Boolean   @default(true)
  loginAttempts     Int       @default(0)
  lockedUntil       DateTime?
  lastLogin         DateTime?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  createdBy         String?
  
  cases             PoliceCase[]
  auditLogs         AuditLog[]
  documents         Document[]
}

model PoliceCase {
  id                    String    @id @default(cuid())
  caseNumber            String    @unique
  assignedOfficerId     String
  assignedOfficer       User      @relation(fields: [assignedOfficerId], references: [id])
  createdByUserId       String
  createdByUser         User      @relation(fields: [createdByUserId], references: [id], name: "CaseCreator")
  
  // Paso 1: Datos del Expediente
  origin                String
  entryDate             String
  entryTime             String
  
  // Paso 2: Datos de Personas (JSON)
  victimName            String
  victimDni             String    // Cifrado
  victimPhone           String    // Cifrado
  victimStreet          String
  victimNumber          String
  victimDistrict        String
  victimReference       String?
  
  aggressorName         String
  aggressorDni          String    // Cifrado
  aggressorPhone        String    // Cifrado
  aggressorStreet       String
  aggressorNumber       String
  aggressorDistrict     String
  aggressorReference    String?
  
  // Paso 3: Clasificación
  violenceType          String
  riskLevel             String    // Leve | Moderado | Severo | Muy Severo
  
  // Paso 4: Detalles
  incidentDescription   String
  incidentDate          String
  incidentTime          String
  incidentLocation      String
  riskFactors           String    // JSON array
  additionalObservations String?
  
  // Estado
  status                String    @default("Pendiente")
  tags                  String    // JSON array
  
  // Auditoría
  isDeleted             Boolean   @default(false)
  deletedAt             DateTime?
  deletedByUserId       String?
  integrityHash         String?   // SHA-256
  
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  
  documents             Document[]
  auditLogs             AuditLog[]
}

model Document {
  id                String    @id @default(cuid())
  caseId            String
  case              PoliceCase @relation(fields: [caseId], references: [id], onDelete: Cascade)
  uploadedByUserId  String
  uploadedByUser    User      @relation(fields: [uploadedByUserId], references: [id])
  
  filename          String
  localPath         String    // /uploads/cases/{caseId}/documents/{docId}.pdf
  mimeType          String
  sizeBytes         Int
  documentType      String    // denuncia | medida_proteccion | informe_medico | etc
  description       String?
  
  integrityHash     String    // SHA-256
  isDeleted         Boolean   @default(false)
  deletedAt         DateTime?
  deletedByUserId   String?
  
  uploadedAt        DateTime  @default(now())
  
  @@index([caseId])
}

model AuditLog {
  id                String    @id @default(cuid())
  timestamp         DateTime  @default(now())
  officerId         String
  officer           User      @relation(fields: [officerId], references: [id])
  action            String    // LOGIN | CREATE_EXPEDIENT | etc
  resourceId        String?   // ID del caso si aplica
  details           String?
  userAgent         String?
  ipHash            String?   // hash SHA-256 para privacidad
  hmacSignature     String?   // HMAC-SHA256 para verificación
  
  @@index([officerId])
  @@index([timestamp])
}

model RateLimit {
  id                String    @id @default(cuid())
  userId            String
  action            String    // login | api | export
  attempts          Int       @default(0)
  lockedUntil       DateTime?
  createdAt         DateTime  @default(now())
  expiresAt         DateTime  // TTL para limpiar automáticamente
  
  @@unique([userId, action])
}
```

---

## 🔑 Variables de Entorno Locales (.env.local)

```bash
# Database Local
DATABASE_URL="file:./seguranet.db"

# JWT Secret (genera con: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_SECRET=tu_jwt_secret_super_seguro_de_64_caracteres_hex
JWT_EXPIRY=3600

# Secretos de Cifrado (genera con: openssl rand -hex 32)
AES_MASTER_KEY=00000000000000000000000000000000
HMAC_SIGNING_KEY=11111111111111111111111111111111
ARGON2_PEPPER=tu_pepper_aleatorio

# Storage Local
UPLOAD_DIR=./uploads
MAX_FILE_SIZE_MB=50

# Session
SESSION_COOKIE_MAX_AGE=3600
SESSION_COOKIE_NAME=seguranet_session

# Rate Limiting
RATE_LIMIT_LOGIN_ATTEMPTS=5
RATE_LIMIT_LOGIN_BLOCK_MINUTES=30
RATE_LIMIT_API_PER_MINUTE=100

# Bootstrap Admin (crear automáticamente en DB vacía)
BOOTSTRAP_ADMIN_USERNAME=admin1
BOOTSTRAP_ADMIN_PASSWORD=ChangeMeImmediately!2026
BOOTSTRAP_ADMIN_FULLNAME=MARCO ANTONIO CASAS SOLIS
BOOTSTRAP_ADMIN_DNI=98543265

# Genkit / Google AI
GOOGLE_GENAI_API_KEY=

# Feature Flags
ENABLE_RENIEC_VALIDATION=false
ENABLE_MIMP_SYNC=false
```

---

## 🛠️ Instrucciones para Opus

### Lo que Opus debe hacer:

```
1. CREAR schema.prisma (arriba está el contenido)
2. CREAR src/lib/prisma.ts - cliente singleton
3. CREAR src/lib/security/password.ts - Argon2id
4. CREAR src/lib/security/jwt.ts - JWT tokens
5. CREAR src/lib/security/hmac.ts - HMAC firma
6. CREAR src/lib/security/file-validator.ts
7. CREAR src/lib/storage/local-storage.ts - filesystem
8. CREAR src/lib/middleware/auth-middleware.ts
9. CREAR src/lib/middleware/rbac-middleware.ts
10. CREAR src/lib/middleware/rate-limit.ts
11. CREAR src/app/middleware.ts - Next.js middleware
12. CREAR src/app/api/auth/login/route.ts
13. CREAR src/app/api/auth/logout/route.ts
14. CREAR src/app/api/auth/session/route.ts
15. CREAR src/app/api/cases/route.ts
16. CREAR src/app/api/cases/[id]/route.ts
17. CREAR src/app/api/cases/[id]/status/route.ts
18. CREAR src/app/api/cases/[id]/documents/route.ts
19. CREAR src/app/api/cases/[id]/documents/request-upload/route.ts
20. CREAR src/app/api/cases/[id]/documents/[docId]/route.ts
21. CREAR src/app/api/cases/[id]/documents/[docId]/download/route.ts
22. CREAR src/app/api/users/route.ts
23. CREAR src/app/api/users/[id]/route.ts
24. CREAR src/app/api/audit/route.ts
25. CREAR src/app/api/backup/route.ts
26. CREAR src/lib/audit-logger.ts (envía a DB)
27. CREAR carpeta uploads/ (raíz del proyecto)
```

### Comandos que Opus debe ejecutar al finalizar:

```bash
npx prisma migrate dev --name init
npx prisma db push
npm run dev
```

---

## ✅ Verificación Post-Implementación

```bash
# 1. Verificar BD creada
ls -la seguranet.db

# 2. Verificar Prisma
npx prisma studio

# 3. Pruebas
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin1","password":"ChangeMeImmediately!2026"}'

# Debe retornar: 200 + cookie de sesión
```

---

## 📋 Resumen para Opus

**Prompt que le pasarás a Opus:**

```
Eres un experto en Next.js 15, Prisma y seguridad backend.

Implementa COMPLETAMENTE el backend de SeguraNet en LOCAL usando:
- Database: SQLite con Prisma
- Auth: JWT + HttpOnly cookies
- Security: Argon2id, HMAC-SHA256
- Storage: Filesystem local

Archivos a crear: [lista de 27 archivos arriba]

Schema Prisma está en este documento.

IMPORTANTE:
- NO uses Firebase, solo SQLite local
- Los PDFs se guardan en ./uploads/{caseId}/documents/
- Bootstrap admin "admin1" automáticamente en BD vacía
- Cifra DNI y teléfono con AES-256 antes de guardar
- HMAC firma cada audit log
- Rate limiting en tabla RateLimit
- Soft delete para casos (isDeleted: true)
- Autenticación con JWT en cookies HttpOnly

Cuando termines:
1. npx prisma migrate dev --name init
2. npx prisma db push
3. npm run dev
4. Verifica: curl test a POST /api/auth/login

Todos los archivos deben tener:
- Validación con Zod
- Manejo de errores completo
- Logs a audit_logs
- Verificación de permisos RBAC
```

---

## 🔄 Migración a Nube (Después)

Cuando quieras migrar a PostgreSQL en nube:

```prisma
// Solo cambiar en schema.prisma:
datasource db {
  provider = "postgresql"  // ← cambiar de "sqlite" a "postgresql"
  url      = env("DATABASE_URL")
}

// DATABASE_URL en .env.production:
DATABASE_URL="postgresql://user:pass@host:5432/seguranet"

// Comando de migración:
npx prisma migrate deploy
```

**Casi sin cambios en el código.** ✅

---

## 📌 Importante

- ✅ SQLite es monousuario (bien para dev local)
- ✅ Migrará fácil a PostgreSQL después
- ✅ Todo funciona offline
- ✅ Cero costo
- ✅ Archivo seguranet.db tiene todo

---

**Estado**: Listo para pasar a Opus
