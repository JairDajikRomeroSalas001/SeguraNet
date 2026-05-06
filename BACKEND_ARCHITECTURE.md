# SeguraNet Backend - Arquitectura de Seguridad Estatal

**Fecha**: Abril 2026  
**Versión**: 1.0  
**Estado**: Plan Aprobado  
**Seguridad**: 8.5/10 (Nivel Estatal Peruano SGTD-PCM + Ley 29733)

---

## 📋 Tabla de Contenidos

1. [Contexto](#contexto)
2. [Stack Tecnológico](#stack-tecnológico)
3. [Arquitectura de Seguridad](#arquitectura-de-seguridad)
4. [Ocho Fases de Implementación](#ocho-fases)
5. [Estructura de Archivos](#estructura-de-archivos)
6. [Variables de Entorno](#variables-de-entorno)
7. [Cronograma](#cronograma)
8. [Pruebas de Seguridad](#pruebas-de-seguridad)

---

## Contexto

### Problema Raíz

SeguraNet actualmente **vive todo en el navegador** (localStorage + memoria RAM del módulo). No hay backend real:

- ❌ La clave AES de cifrado está **en el mismo localStorage** que los datos cifrados
- ❌ Las contraseñas se guardan en **texto plano** (solo cifradas en el blob)
- ❌ Los datos se pierden completamente al **recargar la página**
- ❌ Los audit logs son **modificables desde la consola**
- ❌ Credenciales admin hardcodeadas en el código: `admin1 / admin1`

### Objetivo

Diseñar e implementar un backend seguro, escalable y conforme a estándares estatales peruanos (SGTD-PCM, Ley 29733).

### Nivel de Seguridad Alcanzado

| Métrica | Actual | Post-Plan |
|---|---|---|
| Autenticación | 1/10 | 9/10 |
| Datos en reposo | 2/10 | 9/10 |
| Documentos PDF | 0/10 | 9/10 |
| Audit Logs | 2/10 | 8/10 |
| Control de Acceso | 3/10 | 8/10 |
| Persistencia | 0/10 | 10/10 |
| **Global** | **1.5/10** | **8.5/10** |

---

## Stack Tecnológico

### Por qué Firebase + Next.js

```yaml
Frontend:
  Framework: Next.js 15 (App Router)
  UI: React 19 + Shadcn/UI + Tailwind CSS

Backend:
  API: Next.js API Routes (en el mismo proyecto)
  Auth: Firebase Authentication (HttpOnly cookies)
  
Database:
  Datos: Firestore (documentos estructurados)
  Archivos: Firebase Storage (PDFs, imágenes)
  Secretos: Google Secret Manager (claves, API keys)

Encryption:
  Contraseñas: Argon2id
  PII Fields: AES-256-GCM (clave en Secret Manager)
  Audit Logs: HMAC-SHA256
  
Hosting:
  App Hosting: Firebase App Hosting (Next.js)
```

### Firebase vs Alternativas

| Aspecto | Firebase | PostgreSQL | Comentario |
|---|---|---|---|
| Ya instalado | ✅ | ❌ | Package.json + apphosting.yaml listos |
| Cifrado en reposo | ✅ Google | ✅ Manual | Firebase es automático |
| Escalabilidad | ✅ Ilimitada | ⚠️ Con costo | Firebase crece sin config |
| Documentos PDF | ✅ Storage | ⚠️ Blob grande | Firebase Storage optimizado |
| Costo operacional | ⚠️ Pay-as-you-go | ✅ Fijo | Para comisaría pequeña, Firebase es mejor |
| Integración MFA | ✅ Nativa | ❌ Manual | Firebase Auth ya tiene 2FA |

**Decisión**: Firebase es la opción correcta para este proyecto estatal.

---

## Arquitectura de Seguridad

### Diagrama de Flujo Completo

```
┌─────────────────────────────────────────────────────────┐
│                    NAVEGADOR DEL OFICIAL                │
│  - Sin localStorage (vacío por completo)                │
│  - Session vía HttpOnly Cookie (servidor lo valida)     │
│  - Requests siempre autenticados a /api/*               │
└────────────────────────┬────────────────────────────────┘
                         │ HTTPS obligatorio
                         ▼
┌─────────────────────────────────────────────────────────┐
│         NEXT.JS SERVER (Firebase App Hosting)           │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │ Middleware (Next.js Edge)                        │   │
│  │  - Valida cookie HttpOnly en CADA request        │   │
│  │  - Rate limiting (5 logins fallidos → bloqueo)   │   │
│  │  - Headers de seguridad (CSP, X-Frame-Options)   │   │
│  └──────────────────────────────────────────────────┘   │
│                         │                                │
│  ┌──────────────────────▼──────────────────────────┐   │
│  │ API Routes (/api/*)                            │   │
│  │  - POST   /api/auth/login (Argon2 verify)      │   │
│  │  - POST   /api/auth/logout (revoke cookies)    │   │
│  │  - GET    /api/cases (RBAC filtering)          │   │
│  │  - POST   /api/cases/:id/documents/request-... │   │
│  │  - GET    /api/cases/:id/documents/:docId/...  │   │
│  │  - POST   /api/audit (HMAC signing)            │   │
│  │  - POST   /api/external/reniec/validate        │   │
│  └──────────────────────────────────────────────────┘   │
│                         │                                │
│  Validación Zod + Seguridad de Tipos                    │
│  Logs a Firestore + HMAC verification                   │
└────────────────────────┬────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
  ┌──────────┐    ┌──────────────┐   ┌──────────────┐
  │ Firestore│    │FB Storage    │   │Secret Manager│
  │          │    │              │   │              │
  │ Documents│    │PDFs Seguranet│   │Claves AES    │
  │ Cases    │    │Imágenes      │   │HMAC Keys     │
  │ Audit    │    │Evidencia     │   │API Keys RENIEC
  │ Users    │    │              │   │              │
  │          │    │ NUNCA público│   │ Rotación     │
  │ RBAC     │    │ (Signed URLs)│   │ automática    │
  │ Rules    │    │ TTL: 15 min  │   │              │
  └──────────┘    └──────────────┘   └──────────────┘
     ▲ Cifrado        ▲ AES-256         ▲ Vault
     │ en reposo      │ en reposo       │ Secure
```

### Principios de Seguridad Implementados

1. **Zero Trust**: Cada request verificado, incluso de cliente interno
2. **Defense in Depth**: Múltiples capas (middleware → API → BD rules → encriptación)
3. **Least Privilege**: Roles granulares, oficiales ven solo sus casos
4. **Encryption Everywhere**: En tránsito (HTTPS) + en reposo (AES/Firestore) + en logs (HMAC)
5. **Audit Everything**: Logs inmutables con HMAC, WORM storage en Firestore
6. **No Secrets in Code**: Claves en Secret Manager, nunca en .env o localStorage

---

## Ocho Fases

### FASE 1: Firebase Admin + Autenticación Real (2-3 días)

**Objetivo**: Mover la autenticación del localStorage al servidor con Firebase.

#### 1.1 Firebase Admin SDK

**Archivo**: `src/lib/firebase/admin.ts`

- Inicializar Firebase Admin SDK con credenciales server-only
- Conectar a Firestore y Firebase Auth
- Crear helpers para operaciones de BD

```typescript
// src/lib/firebase/admin.ts
import * as admin from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// ⚠️ Nunca exportar o usar en cliente
const app = admin.initializeApp({
  credential: admin.credential.cert(/* credenciales de service account */)
});

export const auth = getAuth(app);
export const db = getFirestore(app);
```

#### 1.2 Session Cookies HttpOnly

**Archivo**: `src/app/api/auth/login/route.ts`

```typescript
// POST /api/auth/login
// Body: { username: string, password: string }
// Response: 200 (cookie set) | 401 | 429 (rate limit)

export async function POST(request: Request) {
  // 1. Valida username + password contra Firestore users/
  // 2. Verifica password con argon2.verify()
  // 3. Genera session cookie con Firebase Auth
  // 4. Cookie: HttpOnly, Secure, SameSite=Strict, Max-Age=3600
  // 5. Registra evento LOGIN en audit log con HMAC
  // 6. Rate limiting: 5 intentos fallidos → bloqueo 30 min
}
```

#### 1.3 Rutas de Auth

- `POST /api/auth/login` — Autenticación
- `POST /api/auth/logout` — Cierre de sesión
- `GET /api/auth/session` — Validación de sesión activa

#### 1.4 Middleware de Autenticación

**Archivo**: `src/middleware.ts`

```typescript
// src/middleware.ts (Next.js Edge Middleware)
export async function middleware(request: NextRequest) {
  // Para todas las rutas /api/* y /dashboard/*:
  // 1. Extrae session cookie
  // 2. Valida con Firebase Admin
  // 3. Si inválida: retorna 401
  // 4. Si válida: añade user al request context
}
```

---

### FASE 2: Migración de Datos a Firestore (3-4 días)

**Objetivo**: Mover casos de memoria RAM a Firestore.

#### 2.1 Colecciones Firestore

```javascript
// Firestore schema

users/{uid}
  username: string          ← unique index
  passwordHash: string      ← Argon2id
  fullName: string
  dni: string               ← cifrado con AES-256 de Secret Manager
  role: enum                ← 'superadmin' | 'oficial_operativo' | 'auditor' | 'readonly'
  isActive: boolean
  loginAttempts: number
  lockedUntil: Timestamp    ← null si no bloqueado
  createdAt: Timestamp
  updatedAt: Timestamp

cases/{id}
  caseNumber: string        ← unique index
  assignedOfficerUid: string
  createdByUid: string
  [todos los campos de PoliceCase...]
  isDeleted: boolean
  deletedAt: Timestamp      ← null si activo
  integrityHash: string     ← SHA-256 al crear
  createdAt: Timestamp
  updatedAt: Timestamp

audit_logs/{id}
  timestamp: Timestamp
  officerUid: string
  officerUsername: string
  action: enum
  resourceId: string        ← null para eventos globales
  details: string
  userAgent: string
  hmacSignature: string     ← HMAC-SHA256 verificable
  isValid: boolean          ← calculated field
```

#### 2.2 Security Rules de Firestore

```javascript
// firestore.rules

match /users/{uid} {
  allow read: if request.auth != null && (
    request.auth.uid == uid || 
    hasRole(request.auth.uid, 'superadmin')
  );
  allow write: if hasRole(request.auth.uid, 'superadmin');
}

match /cases/{caseId} {
  allow read: if request.auth != null && (
    resource.data.createdByUid == request.auth.uid ||
    hasRole(request.auth.uid, 'superadmin')
  );
  allow create: if request.auth != null && 
    hasRole(request.auth.uid, 'oficial_operativo');
  allow update: if request.auth != null && (
    resource.data.createdByUid == request.auth.uid ||
    hasRole(request.auth.uid, 'superadmin')
  );
}

match /audit_logs/{docId} {
  allow create: if request.auth != null;
  allow read: if request.auth != null && (
    hasRole(request.auth.uid, 'superadmin') ||
    hasRole(request.auth.uid, 'auditor')
  );
  allow update, delete: if false; // WORM: nunca modificar
}
```

#### 2.3 API Routes de Casos

- `GET /api/cases` — Lista con filtros y RBAC
- `POST /api/cases` — Crear nuevo caso
- `GET /api/cases/:id` — Detalle (registra VIEW_EXPEDIENT)
- `PUT /api/cases/:id` — Editar (requiere password confirm)
- `DELETE /api/cases/:id` — Soft delete
- `PATCH /api/cases/:id/status` — Cambiar estado

---

### FASE 3: Sistema de Documentos PDF (3-4 días)

**Objetivo**: Implementar almacenamiento seguro de PDFs y documentos adjuntos.

#### 3.1 Firebase Storage Structure

```
gs://seguranet-prod.appspot.com/
├── cases/
│   └── {caseId}/
│       └── documents/
│           └── {docId}/
│               └── {filename}.pdf
├── exports/
│   └── {userId}/
│       └── {timestamp}_backup.json
└── reports/
    └── {caseId}/
        └── {timestamp}_reporte.pdf
```

#### 3.2 Storage Security Rules

```javascript
// firebase.storage.rules

rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // NUNCA acceso público directo
    match /{allPaths=**} {
      allow read, write: if false;
    }
    // Solo Admin SDK (servidor) genera Signed URLs
  }
}
```

#### 3.3 Flujo Seguro de Subida

```
Cliente requests POST /api/cases/:id/documents/request-upload
  ↓
Servidor valida:
  - Permisos RBAC
  - Tipo MIME (solo PDF, JPG, PNG)
  - Tamaño (máx 50 MB)
  - Nombre de archivo (sanitiza)
  ↓
Servidor genera:
  - Firebase Storage Signed URL (PUT, exp 10 min)
  - Documento en Firestore (status: 'pending')
  ↓
Cliente sube a la Signed URL
  ↓
Cloud Function trigger (onFinalize):
  - Calcula SHA-256
  - Actualiza Firestore (status: 'ready')
  - Registra UPLOAD_DOCUMENT en audit log
```

#### 3.4 Flujo Seguro de Descarga

```
Cliente requests GET /api/cases/:id/documents/:docId/download
  ↓
Servidor valida RBAC
  ↓
Servidor genera:
  - Signed URL de descarga (GET, exp 15 min)
  - Registra VIEW_DOCUMENT en audit log
  ↓
Cliente descarga con la URL temporal
  (URL expira automáticamente)
```

#### 3.5 Rutas de Documentos

- `GET /api/cases/:id/documents` — Lista documentos del caso
- `POST /api/cases/:id/documents/request-upload` — Solicita URL de subida
- `GET /api/cases/:id/documents/:docId/download` — Genera URL de descarga
- `DELETE /api/cases/:id/documents/:docId` — Soft delete (no elimina archivo)

---

### FASE 4: Gestión de Claves y Cifrado (2-3 días)

**Objetivo**: Implementar criptografía server-side con claves en Secret Manager.

#### 4.1 Google Secret Manager

Crear secretos en Google Cloud Console:

```
seguranet-aes-master-key       ← 256 bits, para AES-256-GCM
seguranet-hmac-signing-key     ← 256 bits, para HMAC-SHA256
seguranet-argon2-pepper        ← string, pepper adicional para hash
reniec-api-key                 ← credencial RENIEC
mimp-api-key                   ← credencial MIMP
```

#### 4.2 Cifrado de Campos Sensibles

**Archivo**: `src/lib/security/field-encryption.ts`

```typescript
// Cifra ANTES de guardar en Firestore:
// - victim.dni, victim.phone, victim.street, ...
// - aggressor.dni, aggressor.phone, ...
// - user.dni
// - incidentDescription, incidentLocation

// Clave AES obtenida de Secret Manager:
const key = await secretManager.getSecret('seguranet-aes-master-key');

// Cifra con AES-256-GCM (genera IV aleatorio cada vez)
async function encryptField(plaintext: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(plaintext)
  );
  // Retorna: iv + ciphertext en base64
}
```

#### 4.3 HMAC para Audit Logs

**Archivo**: `src/lib/security/hmac.ts`

```typescript
// Firma cada audit log con HMAC para detectar alteraciones

const hmacKey = await secretManager.getSecret('seguranet-hmac-signing-key');

async function signAuditEntry(entry: AuditEntry): Promise<string> {
  const signature = await crypto.subtle.sign(
    'HMAC',
    hmacKey,
    new TextEncoder().encode(JSON.stringify(entry))
  );
  return Buffer.from(signature).toString('base64');
}

// Post-implementación, un Cloud Function verifica automáticamente
// que el HMAC siga siendo válido (detecta alteraciones)
```

---

### FASE 5: RBAC Granular (1-2 días)

**Objetivo**: Implementar control de acceso basado en roles.

#### 5.1 Roles del Sistema

| Rol | Descripción | Permisos |
|-----|-------------|----------|
| `superadmin` | Jefe de comisaría | Todo (usuarios, casos, logs) |
| `oficial_operativo` | Oficial de turno | CRUD sus propios casos |
| `auditor` | Revisor de auditoría | Solo lectura de logs |
| `readonly` | Observador | Lectura de casos asignados |

#### 5.2 Middleware RBAC

**Archivo**: `src/lib/middleware/rbac-middleware.ts`

```typescript
// requireRole(roles: Role[]) — middleware para API routes
// requireOwnerOrAdmin(ownerId: string) — verifica propiedad
// canManageCase(userId, caseId, userRole): boolean
```

#### 5.3 Frontend Auth Context Actualizado

**Archivo**: `src/components/auth-context.tsx` (reescrito)

```typescript
// Antes: localStorage + crypto en el navegador
// Ahora: solo llamadas a /api/auth/*

export function AuthProvider({ children }) {
  const [user, setUser] = useState<User | null>(null);
  
  useEffect(() => {
    // GET /api/auth/session para verificar cookie válida
    fetch('/api/auth/session')
      .then(r => r.json())
      .then(data => setUser(data.user));
  }, []);
  
  const login = async (username, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    // Cookie se establece automáticamente (HttpOnly)
    if (res.ok) setUser(await res.json());
  };
}
```

---

### FASE 6: Rate Limiting + Hardening (1-2 días)

**Objetivo**: Implementar rate limiting persistente y CSP endurecida.

#### 6.1 Rate Limiting en Firestore

**Archivo**: `src/lib/middleware/rate-limit.ts`

```typescript
// Guarda contadores en Firestore con TTL automático

// Login: 5 intentos fallidos → bloqueo 30 min
// API: 100 requests/min por usuario
// Export: 10 exports/hora

async function checkRateLimit(userId: string, action: string) {
  const counter = await db.collection('rate_limits')
    .doc(`${userId}_${action}`)
    .get();
  
  if (counter.data().count >= LIMIT) {
    throw new Error('Too many requests');
  }
}
```

#### 6.2 CSP Endurecida

**Archivo**: `next.config.ts` (actualizado)

```typescript
// Antes: Content-Security-Policy con unsafe-eval unsafe-inline
// Ahora:

headers: [
  {
    key: 'Content-Security-Policy',
    value: `
      default-src 'self';
      script-src 'self' https://cdn.firebase.com;
      connect-src 'self' https://*.firebaseio.com;
      img-src 'self' data: https:;
      font-src 'self' https://fonts.googleapis.com;
      style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
      frame-ancestors 'none';
      upgrade-insecure-requests;
      require-trusted-types-for 'script';
    `.replace(/\n/g, ' ')
  }
]
```

---

### FASE 7: APIs del Estado Peruano (2-3 días)

**Objetivo**: Preparar integración con RENIEC, MIMP y futuras APIs del Estado.

#### 7.1 Capa de Abstracción

**Archivo**: `src/lib/external-apis/base-client.ts`

```typescript
// Cliente HTTP con:
// - Retry automático (backoff exponencial)
// - Circuit breaker para APIs caídas
// - Logging de cada llamada al audit log
// - Timeout configurable

class ExternalAPIClient {
  private retryCount = 0;
  private maxRetries = 3;
  
  async request(url: string, options: RequestInit) {
    // Retry logic
    // Circuit breaker
    // Audit logging
    // Timeout handling
  }
}
```

#### 7.2 RENIEC Integration

**Archivo**: `src/lib/external-apis/reniec.ts`

```typescript
// Reemplaza el mock hardcodeado (2 DNIs solo)
// Conecta a API real de RENIEC del Estado Peruano

async function validateDni(dni: string) {
  // 1. Obtiene API Key de Secret Manager
  // 2. Llama a endpoint de RENIEC
  // 3. Registra la llamada en audit log
  // 4. Cachea resultado 30 minutos (offline resilient)
  // 5. Retorna: { valid: boolean, name: string }
}
```

#### 7.3 MIMP Integration (Placeholder)

**Archivo**: `src/lib/external-apis/mimp.ts`

```typescript
// Placeholder para futuras integraciones con MIMP
// (Ministerio de la Mujer)

// Métodos a implementar:
// - reportCriticalCase(caseId)
// - getCasesFromSistema(filters)
// - syncMeasuresOfProtection()
```

---

### FASE 8: Frontend Actualizado (3-4 días)

**Objetivo**: Actualizar componentes para consumir las nuevas APIs.

#### 8.1 Updates a Componentes

| Archivo | Cambio |
|---------|--------|
| `auth-context.tsx` | Eliminar localStorage, usar `/api/auth/*` |
| `store.ts` | Eliminar variable RAM, usar `/api/cases` |
| `case-registration-form.tsx` | Conectar DNI a `/api/external/reniec/validate` |
| `settings-view.tsx` | Backup desde `/api/backup`, no localStorage |

#### 8.2 Nuevo Componente: DocumentManager

**Archivo**: `src/components/cases/document-manager.tsx`

```typescript
// UI para listar, subir, descargar documentos de un caso

export function DocumentManager({ caseId }) {
  // Lista documentos
  // Formulario de subida con barra de progreso
  // Links de descarga (con URLs temporales)
  // Indicador de expiración de URLs
  // Modal para ver preview de PDF
}
```

---

## Estructura de Archivos

```
src/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/route.ts
│   │   │   ├── logout/route.ts
│   │   │   └── session/route.ts
│   │   ├── cases/
│   │   │   ├── route.ts
│   │   │   └── [id]/
│   │   │       ├── route.ts
│   │   │       ├── status/route.ts
│   │   │       └── documents/
│   │   │           ├── route.ts
│   │   │           ├── request-upload/route.ts
│   │   │           └── [docId]/
│   │   │               ├── route.ts
│   │   │               └── download/route.ts
│   │   ├── users/
│   │   │   ├── route.ts
│   │   │   └── [uid]/route.ts
│   │   ├── audit/route.ts
│   │   ├── backup/route.ts
│   │   ├── ai/classify/route.ts
│   │   └── external/
│   │       └── reniec/route.ts
│   └── middleware.ts
│
├── lib/
│   ├── firebase/
│   │   ├── admin.ts
│   │   ├── collections.ts
│   │   └── storage.ts
│   ├── security/
│   │   ├── password.ts
│   │   ├── hmac.ts
│   │   ├── field-encryption.ts
│   │   ├── kms.ts
│   │   └── file-validator.ts
│   ├── middleware/
│   │   ├── auth-middleware.ts
│   │   ├── rbac-middleware.ts
│   │   └── rate-limit.ts
│   └── external-apis/
│       ├── base-client.ts
│       ├── reniec.ts
│       └── mimp.ts
│
├── components/
│   └── cases/
│       ├── document-manager.tsx
│       └── (otros componentes existentes)
│
└── types/ (actualizado)
    └── backend.ts
```

---

## Variables de Entorno

### Firebase Admin (Server-side only)

```bash
FIREBASE_PROJECT_ID=seguranet-prod
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@seguranet-prod.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
```

### Firebase Client (Client-side, NEXT_PUBLIC_)

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=seguranet-prod.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=seguranet-prod
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=seguranet-prod.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

### Google AI

```bash
GOOGLE_GENAI_API_KEY=AIzaSy...
```

### Storage & Security

```bash
STORAGE_SIGNED_URL_EXPIRY_MINUTES=15
STORAGE_UPLOAD_URL_EXPIRY_MINUTES=10
STORAGE_MAX_FILE_SIZE_MB=50
SESSION_COOKIE_MAX_AGE=3600
```

### Secretos en Google Secret Manager (NO en .env)

- `seguranet-aes-master-key`
- `seguranet-hmac-signing-key`
- `seguranet-argon2-pepper`
- `reniec-api-key`
- `mimp-api-key`

---

## Cronograma

| Fase | Contenido | Días | Acumulado |
|------|-----------|------|-----------|
| 1 | Firebase Admin + Auth HttpOnly | 2-3 | 2-3 |
| 2 | API Casos + Firestore | 3-4 | 5-7 |
| 3 | Documentos PDF + Storage | 3-4 | 8-11 |
| 4 | Secret Manager + Cifrado | 2-3 | 10-14 |
| 5 | RBAC granular | 1-2 | 11-16 |
| 6 | Rate limiting + CSP | 1-2 | 12-18 |
| 7 | APIs del Estado (RENIEC) | 2-3 | 14-21 |
| 8 | Frontend actualizado | 3-4 | 17-25 |

**Total estimado**: 17-25 días de desarrollo

---

## Pruebas de Seguridad

### Autenticación y Sesiones

- [ ] `localStorage` está completamente vacío
- [ ] Recargar página mantiene sesión (cookie HttpOnly)
- [ ] 6 logins fallidos bloquea en Firestore (no se resetea al recargar)
- [ ] Request a `/api/cases` sin cookie retorna 401

### Datos y Permisos

- [ ] Modificar audit log en Firestore invalida su HMAC
- [ ] Oficial operativo NO puede ver casos de otro oficial
- [ ] Username "admin1" NO otorga privilegios si se crea como usuario normal
- [ ] Rotar clave AES en Secret Manager permite re-cifrar documentos
- [ ] Backup JSON está firmado con HMAC verificable

### Documentos PDF

- [ ] Subir `.exe` / `.js` retorna 400
- [ ] Subir archivo >50 MB retorna 413
- [ ] URL de descarga expira en máximo 15 minutos
- [ ] Acceso directo a Storage sin signed URL retorna 403
- [ ] Oficial sin permiso NO obtiene URL de documento ajeno
- [ ] Soft delete NO elimina archivo en Storage
- [ ] PDFs generados se guardan en Storage (no descarga directa)

---

## Checklist de Implementación

### Pre-implementación

- [ ] Crear proyecto Firebase en Google Cloud Console
- [ ] Obtener credenciales de service account
- [ ] Crear colecciones en Firestore (schema)
- [ ] Crear bucket en Firebase Storage
- [ ] Crear secretos en Secret Manager
- [ ] Clonar este documento como reference

### Fase por Fase

- [ ] Fase 1: Firebase Admin + Auth
- [ ] Fase 2: API Routes + Firestore
- [ ] Fase 3: Documentos PDF
- [ ] Fase 4: Secret Manager
- [ ] Fase 5: RBAC
- [ ] Fase 6: Rate limiting
- [ ] Fase 7: APIs del Estado
- [ ] Fase 8: Frontend

### Post-implementación

- [ ] Ejecutar todas las pruebas de seguridad
- [ ] Penetration testing (recomendado)
- [ ] Revisión de código de seguridad
- [ ] Documentación de API generada
- [ ] Training de oficiales en seguridad

---

## Contacto y Soporte

**Proyecto**: SeguraNet - Paucartambo Segura  
**Desarrollador**: Claude Code  
**Fecha**: Abril 2026  
**Versión**: 1.0 - Plan Aprobado

---

**Fin del documento**
