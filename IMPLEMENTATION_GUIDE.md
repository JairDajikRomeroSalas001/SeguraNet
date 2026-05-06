# SeguraNet Backend - Guía de Implementación

**Documento**: Instrucciones paso a paso para implementar el backend seguro  
**Estado**: Listo para iniciar  
**Tiempo estimado**: 17-25 días  

---

## ⚠️ ANTES DE EMPEZAR

1. **Lee** `BACKEND_ARCHITECTURE.md` completamente
2. **Crea** un proyecto Firebase en Google Cloud Console
3. **Obtén** las credenciales de service account
4. **Asigna** un desarrollador senior de seguridad para revisar

---

## PASO 0: Preparación del Entorno

### 0.1 Crear Proyecto Firebase

```bash
# Ir a https://console.firebase.google.com
# Crear proyecto: "seguranet-prod"
# Región: us-central1 (Google Cloud)
```

### 0.2 Habilitar Servicios Firebase

```bash
# En Firebase Console:
# ✅ Authentication
# ✅ Firestore Database
# ✅ Storage
# ✅ App Hosting
```

### 0.3 Descargar Credenciales

```bash
# Firebase Console → Project Settings → Service Accounts
# Descargar JSON y extraer los campos:
# - project_id
# - client_email
# - private_key
```

### 0.4 Crear Secret Manager

```bash
# Google Cloud Console → Secret Manager
# Crear secretos:
# - seguranet-aes-master-key (256 bits, generado con: openssl rand -hex 32)
# - seguranet-hmac-signing-key (256 bits)
# - seguranet-argon2-pepper (string aleatorio)
```

### 0.5 Instalar Dependencias

```bash
npm install argon2        # Hash de contraseñas
npm install firebase-admin # SDK servidor (ya en package.json)
npm install zod           # Validación (ya en package.json)
npm install dotenv        # Variables de entorno
```

---

## FASE 1: Firebase Admin + Autenticación (2-3 días)

### Paso 1.1: Crear `src/lib/firebase/admin.ts`

```typescript
// src/lib/firebase/admin.ts
import * as admin from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Inicializar con credenciales de environment
const app = admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
});

export const auth = getAuth(app);
export const db = getFirestore(app);
```

### Paso 1.2: Crear `src/lib/security/password.ts`

```typescript
// src/lib/security/password.ts
import argon2 from 'argon2';

const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 65536,    // 64 MB
  timeCost: 3,          // 3 iteraciones
  parallelism: 4,
};

export async function hashPassword(password: string): Promise<string> {
  // Obtener pepper de Secret Manager (TODO en paso 1.4)
  const pepper = await getSecret('seguranet-argon2-pepper');
  return argon2.hash(password + pepper, ARGON2_OPTIONS);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  const pepper = await getSecret('seguranet-argon2-pepper');
  return argon2.verify(hash, password + pepper);
}
```

### Paso 1.3: Crear `src/lib/security/kms.ts`

```typescript
// src/lib/security/kms.ts
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

const client = new SecretManagerServiceClient();

export async function getSecret(secretName: string): Promise<string> {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const name = `projects/${projectId}/secrets/${secretName}/versions/latest`;
  
  const [version] = await client.accessSecretVersion({ name });
  const secretValue = version.payload?.data?.toString() || '';
  
  return secretValue;
}

// Cachear secretos en memory con TTL de 1 hora
const secretCache = new Map<string, { value: string; expiry: number }>();

export async function getSecretCached(secretName: string): Promise<string> {
  const cached = secretCache.get(secretName);
  if (cached && cached.expiry > Date.now()) {
    return cached.value;
  }
  
  const value = await getSecret(secretName);
  secretCache.set(secretName, {
    value,
    expiry: Date.now() + 3600000, // 1 hora
  });
  
  return value;
}
```

### Paso 1.4: Crear `src/app/api/auth/login/route.ts`

```typescript
// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/firebase/admin';
import { verifyPassword } from '@/lib/security/password';
import { logAuditEvent } from '@/lib/audit-logger';

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = loginSchema.parse(body);
    
    // 1. Obtener usuario de Firestore
    const userSnapshot = await db
      .collection('users')
      .where('username', '==', username)
      .limit(1)
      .get();
    
    if (userSnapshot.empty) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    const userData = userSnapshot.docs[0].data();
    const uid = userSnapshot.docs[0].id;
    
    // 2. Verificar contraseña
    const passwordValid = await verifyPassword(password, userData.passwordHash);
    if (!passwordValid) {
      // Incrementar intentos fallidos
      await db.collection('users').doc(uid).update({
        loginAttempts: (userData.loginAttempts || 0) + 1,
      });
      
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    // 3. Crear sesión (Firebase Auth custom token)
    const customToken = await auth.createCustomToken(uid);
    
    // 4. Establecer HttpOnly cookie
    const response = NextResponse.json(
      { 
        user: {
          uid,
          username: userData.username,
          fullName: userData.fullName,
          role: userData.role,
        }
      },
      { status: 200 }
    );
    
    response.cookies.set('session', customToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: parseInt(process.env.SESSION_COOKIE_MAX_AGE || '3600'),
      path: '/',
    });
    
    // 5. Registrar en audit log
    await logAuditEvent({
      officerUid: uid,
      action: 'LOGIN',
      details: `User ${username} logged in`,
      userAgent: request.headers.get('user-agent') || '',
    });
    
    // 6. Resetear intentos fallidos
    await db.collection('users').doc(uid).update({
      loginAttempts: 0,
      lastLogin: new Date(),
    });
    
    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Paso 1.5: Crear `src/middleware.ts`

```typescript
// src/middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/firebase/admin';

export async function middleware(request: NextRequest) {
  // Proteger rutas /api/* y /dashboard/*
  const isProtectedRoute = 
    request.nextUrl.pathname.startsWith('/api') ||
    request.nextUrl.pathname.startsWith('/dashboard');
  
  if (!isProtectedRoute) {
    return NextResponse.next();
  }
  
  const sessionCookie = request.cookies.get('session')?.value;
  
  if (!sessionCookie) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  try {
    const decodedToken = await auth.verifyIdToken(sessionCookie);
    // Pasar usuario al request context
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', decodedToken.uid);
    requestHeaders.set('x-user-role', decodedToken.role || 'user');
    
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
}

export const config = {
  matcher: ['/api/:path*', '/dashboard/:path*'],
};
```

### Paso 1.6: Crear `src/app/api/auth/logout/route.ts` y `session/route.ts`

(Ver `BACKEND_ARCHITECTURE.md` para detalles)

### ✅ Checkpoint 1

```bash
# Verificar:
# - POST /api/auth/login con credenciales válidas → 200 + cookie
# - POST /api/auth/login con credenciales inválidas → 401
# - GET /api/auth/session con cookie válida → 200 + user data
# - GET /api/auth/session sin cookie → 401
```

---

## FASE 2: Firestore + API Routes de Casos (3-4 días)

### Paso 2.1: Crear Colecciones en Firestore

En Firebase Console → Firestore Database:

```
Crear colección: users
  Crear documento: user1 (uid)
    username: "admin1"
    passwordHash: (Argon2id hash)
    fullName: "MARCO ANTONIO CASAS SOLIS"
    dni: (cifrado)
    role: "superadmin"
    isActive: true
    createdAt: NOW
    ...

Crear colección: cases
  (vacío, se poblará vía API)

Crear colección: audit_logs
  (vacío, se poblará vía API)
```

### Paso 2.2: Crear `src/app/api/cases/route.ts`

```typescript
// src/app/api/cases/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/admin';

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  const userRole = request.headers.get('x-user-role');
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Construir query según rol
  let query = db.collection('cases').where('isDeleted', '==', false);
  
  if (userRole !== 'superadmin') {
    // Oficiales normales ven solo sus casos
    query = query.where('createdByUid', '==', userId);
  }
  
  const snapshot = await query.get();
  const cases = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));
  
  return NextResponse.json(cases);
}

export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  const userRole = request.headers.get('x-user-role');
  
  // Solo oficial_operativo o superadmin pueden crear
  if (!['oficial_operativo', 'superadmin'].includes(userRole!)) {
    return NextResponse.json(
      { error: 'Forbidden' },
      { status: 403 }
    );
  }
  
  const caseData = await request.json();
  
  const newCase = {
    ...caseData,
    id: crypto.randomUUID(),
    createdByUid: userId,
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  await db.collection('cases').doc(newCase.id).set(newCase);
  
  // Registrar en audit log
  await logAuditEvent({
    officerUid: userId,
    action: 'CREATE_EXPEDIENT',
    resourceId: newCase.id,
  });
  
  return NextResponse.json(newCase, { status: 201 });
}
```

### Paso 2.3: Crear `src/app/api/cases/[id]/route.ts`

(Ver `BACKEND_ARCHITECTURE.md` para detalles completos)

### ✅ Checkpoint 2

```bash
# Verificar:
# - GET /api/cases con sesión válida → lista casos (filtrado por rol)
# - POST /api/cases con datos válidos → 201 + case created
# - GET /api/cases/:id → 200 + detalle caso
# - PUT /api/cases/:id con password confirm → 200 + actualizado
# - DELETE /api/cases/:id (soft delete) → 200
```

---

## FASE 3: Firebase Storage + Documentos (3-4 días)

### Paso 3.1: Crear Storage Rules

Firebase Console → Storage → Rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // NUNCA acceso público
    match /{allPaths=**} {
      allow read, write: if false;
    }
    // Solo Admin SDK puede leer/escribir
  }
}
```

### Paso 3.2: Crear `src/lib/security/file-validator.ts`

```typescript
// src/lib/security/file-validator.ts
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
];

const MAX_FILE_SIZE = 52_428_800; // 50 MB

export function validateFileUpload(
  filename: string,
  mimeType: string,
  sizeBytes: number
): { valid: boolean; error?: string } {
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    return { valid: false, error: 'Invalid file type' };
  }
  
  if (sizeBytes > MAX_FILE_SIZE) {
    return { valid: false, error: 'File too large' };
  }
  
  // Sanitizar filename
  const sanitized = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  if (!sanitized) {
    return { valid: false, error: 'Invalid filename' };
  }
  
  return { valid: true };
}
```

### Paso 3.3: Crear `src/lib/firebase/storage.ts`

```typescript
// src/lib/firebase/storage.ts
import { getStorage } from 'firebase-admin/storage';
import { v4 as uuidv4 } from 'uuid';

const storage = getStorage();

export async function generateUploadSignedUrl(
  caseId: string,
  fileName: string,
  expiryMinutes = 10
): Promise<string> {
  const docId = uuidv4();
  const filePath = `cases/${caseId}/documents/${docId}/${fileName}`;
  
  const bucket = storage.bucket();
  const file = bucket.file(filePath);
  
  const [signedUrl] = await file.getSignedUrl({
    version: 'v4',
    action: 'write',
    expires: Date.now() + expiryMinutes * 60 * 1000,
  });
  
  return signedUrl;
}

export async function generateDownloadSignedUrl(
  filePath: string,
  expiryMinutes = 15
): Promise<string> {
  const bucket = storage.bucket();
  const file = bucket.file(filePath);
  
  const [signedUrl] = await file.getSignedUrl({
    version: 'v4',
    action: 'read',
    expires: Date.now() + expiryMinutes * 60 * 1000,
  });
  
  return signedUrl;
}
```

### Paso 3.4: Crear `src/app/api/cases/[id]/documents/request-upload/route.ts`

```typescript
// src/app/api/cases/[id]/documents/request-upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/admin';
import { validateFileUpload } from '@/lib/security/file-validator';
import { generateUploadSignedUrl } from '@/lib/firebase/storage';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = request.headers.get('x-user-id');
  const { caseId } = params;
  const { filename, mimeType, sizeBytes, documentType, description } = 
    await request.json();
  
  // Validar archivo
  const validation = validateFileUpload(filename, mimeType, sizeBytes);
  if (!validation.valid) {
    return NextResponse.json(
      { error: validation.error },
      { status: 400 }
    );
  }
  
  // Verificar permisos al caso
  const caseDoc = await db.collection('cases').doc(caseId).get();
  if (!caseDoc.exists) {
    return NextResponse.json({ error: 'Case not found' }, { status: 404 });
  }
  
  const caseData = caseDoc.data();
  const userRole = request.headers.get('x-user-role');
  
  if (
    userRole !== 'superadmin' &&
    caseData.createdByUid !== userId
  ) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  // Generar signed URL para subida
  const signedUrl = await generateUploadSignedUrl(caseId, filename);
  const docId = crypto.randomUUID();
  
  // Crear documento en Firestore (status: pending)
  const docRef = db
    .collection('cases')
    .doc(caseId)
    .collection('documents')
    .doc(docId);
  
  await docRef.set({
    id: docId,
    caseId,
    uploadedByUid: userId,
    filename,
    mimeType,
    sizeBytes,
    documentType,
    description,
    status: 'pending',
    uploadedAt: new Date(),
    integrityHash: '', // Se calculará después de la subida
  });
  
  return NextResponse.json({
    docId,
    signedUrl,
    expiryMinutes: 10,
  });
}
```

### Paso 3.5: Crear `src/app/api/cases/[id]/documents/[docId]/download/route.ts`

(Ver `BACKEND_ARCHITECTURE.md` para detalles)

### ✅ Checkpoint 3

```bash
# Verificar:
# - POST /api/cases/:id/documents/request-upload → genera signed URL
# - Subir PDF a la signed URL → se guarda en Storage
# - GET /api/cases/:id/documents/:docId/download → genera download URL
# - Descargar con download URL → archivo descargado exitosamente
# - Acceso directo a Storage sin signed URL → 403
```

---

## FASES 4-8

Para completar las fases 4-8 (HMAC, RBAC, Rate Limiting, APIs del Estado, Frontend), sigue los detalles en `BACKEND_ARCHITECTURE.md`.

---

## Verificación Final

Ejecutar todas las pruebas de seguridad listadas en `BACKEND_ARCHITECTURE.md` sección "Pruebas de Seguridad".

---

## Troubleshooting

### "Cannot find module 'firebase-admin'"
```bash
npm install firebase-admin
```

### "Secret not found in Secret Manager"
```bash
# Verificar en Google Cloud Console → Secret Manager
# que los secretos existan y tengan permisos de acceso
```

### "CORS error calling RENIEC API"
```typescript
// Usar fetch server-side, no client-side
// O configurar CORS headers en la respuesta
```

---

## Contacto

Para preguntas de seguridad: seguridad@codexcusco.com
Para soporte técnico: soporte@codexcusco.com

---

**Documento generado**: Abril 2026  
**Estado**: Listo para implementación
