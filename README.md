# SeguraNet - Paucartambo Segura 🛡️

Sistema de gestión y registro de denuncias para la Comisaría de Paucartambo, Cusco. Desarrollado bajo estándares de seguridad digital del Estado Peruano (SGTD-PCM) y cumplimiento de la Ley 29733.

## 🔒 Arquitectura de Seguridad (CISO Audit)

- **Cifrado AES-256-GCM**: Datos sensibles cifrados en reposo mediante Web Crypto API.
- **Trazabilidad (No Repudio)**: Logs de auditoría detallados para cada acción oficial (Ver, Crear, Editar, Borrar).
- **Control de Acceso (RBAC)**: Gestión de permisos basada en propiedad de expedientes y roles de administrador.
- **Privacidad por Diseño**: Enmascaramiento automático de DNI y datos personales en vistas generales.
- **Seguridad de Sesión**: Cierre automático por inactividad (5 min) y validación de Fingerprint (User-Agent).

## 🚀 Tecnologías

- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS.
- **UI Components**: Shadcn/UI, Lucide Icons.
- **Seguridad**: Web Crypto API, Criptografía Simétrica.
- **Reportes**: jsPDF con formato oficial PNP.

## 🛠️ Instalación y Uso

1. Clonar el repositorio:
   ```bash
   git clone https://github.com/CodexCusco/SeguraNet.git
   ```
2. Instalar dependencias:
   ```bash
   npm install
   ```
3. Iniciar desarrollo:
   ```bash
   npm run dev
   ```

## 👮 Acceso Inicial (Modo Admin)
- **Usuario**: `admin1`
- **Contraseña**: `admin1`
- **Identidad**: MARCO ANTONIO CASAS SOLIS

---
Desarrollado por **Codex Cusco** - Innovación para la Seguridad Ciudadana.

## Despliegue: Hostinger (MySQL) + Vercel

Pasos resumidos para poner en producción usando la base de datos MySQL de Hostinger y desplegar en Vercel:

1. Crea la base de datos y el usuario en Hostinger. Anota `HOST`, `USER`, `PASSWORD`, `PORT` y `DATABASE`.
2. Construye la `DATABASE_URL` con formato:

   `mysql://USER:PASSWORD@HOST:PORT/DATABASE`

3. No subir tus secretos al repositorio. Crea un archivo local `.env.local` (no versionado) o configura variables en Vercel.

4. En el repositorio tienes un workflow de GitHub Actions (`.github/workflows/prisma-migrate.yml`) que aplica las migraciones automáticamente cuando haya un `push` a `main` o cuando lo ejecutes manualmente. Para que funcione:

   - Ve a `Settings -> Secrets and variables -> Actions` en GitHub y crea el secreto `DATABASE_URL` con la cadena de conexión de Hostinger.
   - Si prefieres ejecutar migraciones manualmente desde tu máquina (con acceso a la DB), puedes correr:

     ```bash
     npx prisma migrate deploy
     ```

5. En Vercel -> tu proyecto -> Settings -> Environment Variables, añade:
   - `DATABASE_URL` (cadena de Hostinger)
   - `JWT_SECRET`, `AES_MASTER_KEY`, `HMAC_SIGNING_KEY`, `ARGON2_PEPPER`
   - Variables de storage si usas S3/Supabase (recomendado para `uploads/`).

6. Storage de archivos: Vercel no persiste `uploads/`. Configura un almacenamiento externo (S3 / Supabase Storage / Cloudflare R2). Actualiza la lógica de upload para usar el SDK correspondiente.

7. Prueba localmente apuntando a la DB remota creando `.env.local` (ejemplos en `.env.local.example`) y ejecutando:

   ```bash
   npm ci
   npx prisma generate
   npx prisma migrate deploy   # aplica migraciones ya generadas
   npm run dev
   ```

Si quieres, puedo:
- Generar el GitHub Action (ya creado en el repo) y ayudarte a configurar el secreto `DATABASE_URL` en GitHub.
- Crear un Action para ejecutar `npx prisma db push` o tareas de backup.
- Implementar integración con Supabase Storage para archivos.
