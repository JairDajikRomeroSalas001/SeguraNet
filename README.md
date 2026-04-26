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