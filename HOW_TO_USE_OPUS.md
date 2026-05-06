# Cómo Usar Opus para Implementar el Backend

**Guía paso a paso para generar TODO el código con Claude Opus**

---

## 📋 Paso 1: Preparar el Prompt

### A. Abre el archivo de prompt
```
Abre: d:\Asistencia program\SeguraNet\PROMPT_FOR_OPUS.md
```

### B. Copia el prompt completo
```
Selecciona TODOS los párrafos entre:
  "Eres un experto en Next.js 15..."
  
  hasta
  
  "¿Entiendes la tarea? Cuando estés listo, implementa..."

Copia (Ctrl+C)
```

---

## 🤖 Paso 2: Acceder a Claude Opus

### A. Ve a Claude.ai

```
URL: https://claude.ai
```

### B. Inicia sesión
```
Email: sateliteelcr7@gmail.com
```

### C. Crea nueva conversación
```
Click en: "+ New Chat"
```

### D. Asegúrate de que esté Opus
```
En la esquina superior derecha, verifica:
"Claude 3.5 Opus" o "Claude Opus"

Si dice otra cosa, click ahí y selecciona "Claude Opus"
```

---

## 📤 Paso 3: Pegar el Prompt

### A. Pega el contenido
```
Click en el cuadro de texto de chat
Pega (Ctrl+V) todo el prompt
```

### B. Envía el mensaje
```
Click en el botón "Send" (o Enter)

Opus comenzará a pensar y generar código...
```

---

## ⏳ Paso 4: Esperar y Copiar Código

Opus generará los archivos así:

```
Genará algo como:

"Entiendo la tarea completamente. Voy a crear..."

Luego código dentro de bloques:

```typescript
// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';
...
```

### Para CADA archivo que vea:

**A. Copia el código**
```
Selecciona TODO el código (dentro del bloque)
Ctrl+C
```

**B. Crea el archivo en tu proyecto**
```
Ruta exacta: src/lib/prisma.ts (según lo que diga Opus)
Ctrl+V el código
Guarda (Ctrl+S)
```

**C. Repite para CADA archivo**
```
32 archivos totales
Sí, son muchos, pero es trabajo 1 sola vez
```

---

## 🗂️ Estructura de Copia

Opus genrará archivos en ESTE ORDEN aproximadamente:

```
1. prisma/schema.prisma
2. src/lib/prisma.ts
3. src/lib/security/password.ts
4. src/lib/security/jwt.ts
5. src/lib/security/hmac.ts
6. src/lib/security/file-validator.ts
7. src/lib/storage/local-storage.ts
8. src/lib/audit-logger.ts
9. src/lib/middleware/auth-middleware.ts
10. src/lib/middleware/rbac-middleware.ts
11. src/lib/middleware/rate-limit.ts
12. src/app/middleware.ts
13-19. src/app/api/auth/* (login, logout, session)
20-24. src/app/api/cases/* (lista, detalle, status)
25-28. src/app/api/cases/[id]/documents/* (upload, descarga)
29-31. src/app/api/users/* + audit + backup
```

---

## ✅ Paso 5: Después de Copiar Todo

### A. Crea archivo .env.local

```
En la RAÍZ del proyecto (junto a package.json):

Nuevo archivo: .env.local

Contenido (copia de .env.example pero con valores):
```

```bash
# Database Local
DATABASE_URL="file:./seguranet.db"

# JWT Secret (genera: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_SECRET=tu_valor_aqui_64_caracteres_hex
JWT_EXPIRY=3600

# AES Key (genera igual)
AES_MASTER_KEY=tu_valor_aqui_64_caracteres_hex

# HMAC Key (genera igual)
HMAC_SIGNING_KEY=tu_valor_aqui_64_caracteres_hex

# Pepper
ARGON2_PEPPER=mi_pepper_secreto

# Storage
UPLOAD_DIR=./uploads
MAX_FILE_SIZE_MB=50

# Session
SESSION_COOKIE_MAX_AGE=3600
SESSION_COOKIE_NAME=seguranet_session

# Rate Limiting
RATE_LIMIT_LOGIN_ATTEMPTS=5
RATE_LIMIT_LOGIN_BLOCK_MINUTES=30
RATE_LIMIT_API_PER_MINUTE=100

# Bootstrap Admin
BOOTSTRAP_ADMIN_USERNAME=admin1
BOOTSTRAP_ADMIN_PASSWORD=ChangeMeImmediately!2026
BOOTSTRAP_ADMIN_FULLNAME=MARCO ANTONIO CASAS SOLIS
BOOTSTRAP_ADMIN_DNI=98543265

# Google AI (por ahora vacío)
GOOGLE_GENAI_API_KEY=

# Feature Flags
ENABLE_RENIEC_VALIDATION=false
ENABLE_MIMP_SYNC=false
```

### B. Instala dependencias
```bash
# En terminal, en la raíz del proyecto
npm install
```

### C. Crea carpeta uploads
```bash
mkdir uploads
```

### D. Inicializa la base de datos
```bash
# En terminal
npx prisma migrate dev --name init
```

### E. Inicia el servidor
```bash
npm run dev
```

---

## 🧪 Paso 6: Verifica que Todo Funciona

### A. Abre otra terminal

```bash
# Prueba login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin1","password":"ChangeMeImmediately!2026"}'
```

### B. Respuesta esperada
```json
{
  "success": true,
  "user": {
    "id": "...",
    "username": "admin1",
    "fullName": "MARCO ANTONIO CASAS SOLIS",
    "role": "superadmin"
  }
}
```

### C. Si funciona ✅
```
La cookie se estableció automáticamente
El backend está listo
```

### D. Si no funciona ❌
```
Verifica:
1. ¿Están todos los archivos creados?
2. ¿Corriste: npx prisma migrate dev --name init?
3. ¿Existe .env.local con DATABASE_URL?
4. ¿Dice npm run dev que el servidor está en puerto 3000?
```

---

## 📝 Checklist de Copia

Marca conforme copies cada grupo:

```
PRISMA:
[ ] prisma/schema.prisma

LIBRERÍAS DE SEGURIDAD:
[ ] src/lib/prisma.ts
[ ] src/lib/security/password.ts
[ ] src/lib/security/jwt.ts
[ ] src/lib/security/hmac.ts
[ ] src/lib/security/file-validator.ts

ALMACENAMIENTO Y AUDITORÍA:
[ ] src/lib/storage/local-storage.ts
[ ] src/lib/audit-logger.ts

MIDDLEWARE:
[ ] src/lib/middleware/auth-middleware.ts
[ ] src/lib/middleware/rbac-middleware.ts
[ ] src/lib/middleware/rate-limit.ts
[ ] src/app/middleware.ts

AUTH ROUTES:
[ ] src/app/api/auth/login/route.ts
[ ] src/app/api/auth/logout/route.ts
[ ] src/app/api/auth/session/route.ts

CASES ROUTES:
[ ] src/app/api/cases/route.ts
[ ] src/app/api/cases/[id]/route.ts
[ ] src/app/api/cases/[id]/status/route.ts

DOCUMENTS ROUTES:
[ ] src/app/api/cases/[id]/documents/route.ts
[ ] src/app/api/cases/[id]/documents/request-upload/route.ts
[ ] src/app/api/cases/[id]/documents/[docId]/route.ts
[ ] src/app/api/cases/[id]/documents/[docId]/download/route.ts

USERS ROUTES:
[ ] src/app/api/users/route.ts
[ ] src/app/api/users/[id]/route.ts

ADMIN ROUTES:
[ ] src/app/api/audit/route.ts
[ ] src/app/api/backup/route.ts

CONFIGURACIÓN:
[ ] .env.local creado
[ ] package.json tiene todas las dependencias
[ ] npx prisma migrate dev --name init ejecutado
[ ] npm run dev funciona

VERIFICACIÓN:
[ ] curl al login retorna 200
[ ] BD seguranet.db existe
[ ] Carpeta uploads/ existe
```

---

## 💡 Consejos Prácticos

### Si Opus es muy lento
```
- Divide el prompt en 2 partes
- Primera parte: archivos de seguridad + prisma
- Segunda parte: API routes
```

### Si Opus genera algo incompleto
```
- Responde en el chat: "Continúa con los siguientes archivos..."
- Opus seguirá generando
```

### Si necesitas cambiar algo
```
- Pregunta a Opus en el mismo chat
- Ejemplo: "¿Cómo cambio X de Y?"
- Opus responderá con el código corregido
```

### Si un archivo está mal
```
- Edítalo manualmente en tu editor
- O pide a Opus que genere solo ese archivo de nuevo
```

---

## 🚀 Después de Todo

Una vez que TODO funciona:

```
Tu proyecto tiene:
✅ Backend completo en local
✅ SQLite como BD
✅ JWT para autenticación
✅ HMAC para firma de logs
✅ Argon2id para contraseñas
✅ Almacenamiento local de PDFs
✅ Auditoría completa

Listo para:
✅ Usar la interfaz frontend
✅ Probar casos, usuarios, documentos
✅ Desarrollo diario
```

---

## 📧 Preguntas Frecuentes

### ¿Cuántos archivos son?
```
32 archivos TypeScript
1 archivo prisma/schema.prisma
1 archivo .env.local
Total: 34 cambios
```

### ¿Cuánto tiempo toma?
```
Opus genera: 5-10 minutos
Copiar código: 15-20 minutos
Setup DB: 2-3 minutos
Total: ~30 minutos
```

### ¿Puedo hacer cambios después?
```
SÍ, absolutamente
El código está diseñado para ser modificable
Puedes cambiar lógica, agregar features, etc.
```

### ¿Y si tengo un error después?
```
1. Lee el mensaje de error en terminal
2. Busca el archivo mencionado
3. Verifica el código
4. Pide a Opus que lo arregle en el chat
```

---

**¡Listo! Ahora ve a Claude Opus y pega el prompt.** 🚀

