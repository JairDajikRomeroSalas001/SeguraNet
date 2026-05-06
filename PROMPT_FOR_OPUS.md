# Prompt para Claude Opus - Implementación Backend Local SeguraNet

**Copia este prompt EXACTAMENTE y pégalo en Claude Opus**

---

## 📋 PROMPT PARA OPUS

```
Eres un experto en Next.js 15, Prisma, TypeScript y seguridad backend.

Tu tarea: Implementar COMPLETAMENTE el backend local de SeguraNet.

CONTEXTO:
- Proyecto: SeguraNet (sistema de gestión de denuncias policiales)
- Environment: Desarrollo local con SQLite
- Stack: Next.js 15 API Routes + Prisma + SQLite
- Seguridad: Argon2id + JWT + HMAC-SHA256

ESPECIFICACIÓN TÉCNICA COMPLETA en: LOCAL_DEVELOPMENT_SPEC.md

ARCHIVOS A CREAR (27 total):

CARPETAS:
1. npx prisma init (si no existe)
2. Crear carpeta: /uploads (raíz del proyecto)
3. Crear carpeta: src/lib/prisma/
4. Crear carpeta: src/lib/security/
5. Crear carpeta: src/lib/middleware/
6. Crear carpeta: src/lib/storage/

ARCHIVOS PRISMA:
7. prisma/schema.prisma - esquema completo (está en LOCAL_DEVELOPMENT_SPEC.md)

LIBRERÍAS DE SEGURIDAD:
8. src/lib/prisma.ts - cliente Prisma singleton
9. src/lib/security/password.ts - Argon2id hash/verify
10. src/lib/security/jwt.ts - JWT tokens (sign/verify)
11. src/lib/security/hmac.ts - HMAC-SHA256 firma
12. src/lib/security/file-validator.ts - validación de archivos

LIBRERÍAS DE ALMACENAMIENTO:
13. src/lib/storage/local-storage.ts - filesystem local
14. src/lib/audit-logger.ts - registra a BD

MIDDLEWARE:
15. src/lib/middleware/auth-middleware.ts - verifica JWT
16. src/lib/middleware/rbac-middleware.ts - verifica permisos
17. src/lib/middleware/rate-limit.ts - límite de solicitudes
18. src/app/middleware.ts - Next.js middleware

AUTH API ROUTES:
19. src/app/api/auth/login/route.ts - POST login
20. src/app/api/auth/logout/route.ts - POST logout
21. src/app/api/auth/session/route.ts - GET sesión actual

CASES API ROUTES:
22. src/app/api/cases/route.ts - GET/POST lista casos
23. src/app/api/cases/[id]/route.ts - GET/PUT/DELETE caso
24. src/app/api/cases/[id]/status/route.ts - PATCH estado

DOCUMENTS API ROUTES:
25. src/app/api/cases/[id]/documents/route.ts - GET lista documentos
26. src/app/api/cases/[id]/documents/request-upload/route.ts - POST solicita upload
27. src/app/api/cases/[id]/documents/[docId]/route.ts - DELETE documento
28. src/app/api/cases/[id]/documents/[docId]/download/route.ts - GET descarga

USERS & ADMIN:
29. src/app/api/users/route.ts - GET/POST usuarios
30. src/app/api/users/[id]/route.ts - DELETE usuario

AUDITORÍA:
31. src/app/api/audit/route.ts - GET audit logs
32. src/app/api/backup/route.ts - GET backup JSON

REQUISITOS GENERALES:

Para CADA archivo:
✅ Validación con Zod de inputs
✅ Manejo de errores completo (try/catch)
✅ Logs a audit_logs para acciones críticas
✅ Verificación de permisos RBAC (superadmin, oficial, auditor)
✅ Respuestas JSON estructuradas
✅ Status codes HTTP correctos (200, 201, 400, 401, 403, 404, 429, 500)

AUTENTICACIÓN:
✅ POST /api/auth/login
   - Validar username/password contra Users
   - Comparar con Argon2id
   - Generar JWT
   - Guardar en HttpOnly cookie
   - Registrar LOGIN en audit_logs

✅ POST /api/auth/logout
   - Limpiar cookie
   - Registrar LOGOUT en audit_logs

✅ GET /api/auth/session
   - Verificar JWT en cookie
   - Retornar user data actual

CASOS:
✅ GET /api/cases?status=&riskLevel=&q=&page=&limit=
   - Filtrado por status, riskLevel, búsqueda de texto
   - RBAC: superadmin ve todos, oficiales ven solo los suyos
   - Paginación (10 items por página)

✅ POST /api/cases
   - Crear nuevo caso
   - Requiere: oficial_operativo o superadmin
   - Cifra campos sensibles: dni, phone, direcciones
   - Genera integrityHash (SHA-256)
   - Registra CREATE_EXPEDIENT en audit_logs

✅ GET /api/cases/:id
   - Obtener detalle de un caso
   - Registra VIEW_EXPEDIENT en audit_logs

✅ PUT /api/cases/:id
   - Actualizar caso completo
   - Requiere: ser dueño O superadmin
   - Requiere: re-verificación de password
   - Actualiza integrityHash

✅ DELETE /api/cases/:id (soft delete)
   - Pone isDeleted: true
   - Requiere: ser dueño O superadmin
   - Requiere: re-verificación de password

✅ PATCH /api/cases/:id/status
   - Actualiza solo el status
   - Requiere: ser dueño O superadmin
   - Requiere: re-verificación de password

DOCUMENTOS:
✅ GET /api/cases/:id/documents
   - Lista documentos del caso
   - Solo metadatos, sin URLs de descarga aún

✅ POST /api/cases/:id/documents/request-upload
   - Solicita permiso para subir documento
   - Valida: tipo MIME (PDF, JPG, PNG), tamaño (<50MB)
   - Retorna: path temporal para subida
   - Crea Document en BD con status: 'pending'

✅ POST /upload endpoint (o usar request-upload retornado)
   - Recibe archivo binario
   - Guarda en ./uploads/cases/{caseId}/documents/{docId}.{ext}
   - Calcula SHA-256 (integrityHash)
   - Actualiza Document: status: 'ready'
   - Registra UPLOAD_DOCUMENT en audit_logs

✅ GET /api/cases/:id/documents/:docId/download
   - Genera URL descargable temporal (15 minutos expiry)
   - O retorna el archivo directamente si está en local
   - Registra VIEW_DOCUMENT en audit_logs

✅ DELETE /api/cases/:id/documents/:docId
   - Soft delete: isDeleted: true
   - NO elimina archivo en ./uploads (preservación)
   - Registra DELETE_DOCUMENT en audit_logs

USUARIOS (solo superadmin):
✅ GET /api/users
   - Lista todos los usuarios
   - Solo superadmin

✅ POST /api/users
   - Crear nuevo usuario
   - Cifra el DNI
   - Hashea password con Argon2id
   - Asigna rol (superadmin, oficial_operativo, auditor, readonly)
   - Registra CREATE_USER en audit_logs

✅ DELETE /api/users/:id
   - Elimina usuario
   - Solo superadmin
   - No puede eliminar a si mismo
   - No puede eliminar superadmin

AUDITORÍA:
✅ GET /api/audit?officerId=&action=&startDate=&endDate=
   - Lista audit logs
   - Solo superadmin y auditor
   - Verificación de HMAC integrada

BACKUP:
✅ GET /api/backup
   - Genera JSON con todos los casos + audit logs
   - Solo superadmin
   - Requiere re-verificación de password
   - Firmado con HMAC

RATE LIMITING:
✅ Login: 5 intentos fallidos → bloqueo 30 minutos
✅ API: 100 requests/minuto por usuario
✅ Guarda en tabla RateLimit con TTL

CIFRADO DE DATOS:
✅ DNI: cifrar con AES-256 antes de guardar en BD
✅ Teléfono: cifrar con AES-256
✅ Direcciones: cifrar con AES-256
✅ Contraseñas: NUNCA guardar plaintext, solo Argon2id hash
✅ Audit logs: firmar con HMAC-SHA256

VARIABLES DE ENTORNO:
- DATABASE_URL (SQLite local: file:./seguranet.db)
- JWT_SECRET (64 chars hex)
- JWT_EXPIRY (3600 segundos)
- AES_MASTER_KEY (64 chars hex)
- HMAC_SIGNING_KEY (64 chars hex)
- ARGON2_PEPPER (string)
- UPLOAD_DIR (./uploads)
- MAX_FILE_SIZE_MB (50)
- SESSION_COOKIE_MAX_AGE (3600)
- RATE_LIMIT_LOGIN_ATTEMPTS (5)
- RATE_LIMIT_LOGIN_BLOCK_MINUTES (30)
- RATE_LIMIT_API_PER_MINUTE (100)
- BOOTSTRAP_ADMIN_USERNAME (admin1)
- BOOTSTRAP_ADMIN_PASSWORD (ChangeMeImmediately!2026)
- BOOTSTRAP_ADMIN_FULLNAME (MARCO ANTONIO CASAS SOLIS)
- BOOTSTRAP_ADMIN_DNI (98543265)

INSTRUCCIONES FINALES:

1. Crear todos los archivos
2. Ejecutar: npx prisma migrate dev --name init
3. Ejecutar: npx prisma db push
4. Ejecutar: npm run dev
5. Verificar: curl -X POST http://localhost:3000/api/auth/login \
   -H "Content-Type: application/json" \
   -d '{"username":"admin1","password":"ChangeMeImmediately!2026"}'
   Debe retornar: 200 + cookie

IMPORTANTE:
- TODO código en TypeScript con tipos completos
- NO usar 'any', especificar tipos
- Manejo de errores exhaustivo
- Logging a stdout y a BD (audit_logs)
- Comentarios solo en lógica compleja
- Sigue convenciones de Next.js 15 App Router

¿Entiendes la tarea? Cuando estés listo, implementa TODOS los archivos.
```

---

## 🎬 Cómo Usar Este Prompt

1. **Copia el prompt completo arriba** (desde "Eres un experto..." hasta "¿Entiendes la tarea?")
2. **Ve a Claude Opus** (https://claude.ai)
3. **Pega el prompt**
4. **Espera a que Opus genere todos los archivos**
5. **Copia cada archivo que genere a tu proyecto**

---

## ✅ Qué Esperar de Opus

Opus generará:
- ✅ 32 archivos TypeScript
- ✅ Schema Prisma
- ✅ Código funcional listo para copiar/pegar
- ✅ Validación con Zod
- ✅ Manejo de errores
- ✅ Comentarios en código complejo

---

## 📝 Después de Recibir Código de Opus

```bash
# 1. Copia todos los archivos a tu proyecto

# 2. Crea .env.local con variables
cp .env.example .env.local

# 3. Genera claves
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
# Pega en .env.local

# 4. Instala dependencias
npm install

# 5. Inicializa BD
npx prisma migrate dev --name init

# 6. Inicia servidor
npm run dev

# 7. Prueba login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin1","password":"ChangeMeImmediately!2026"}'
```

---

**Listo para pasar a Opus** 🚀
