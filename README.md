# SeguraNet - Paucartambo Segura

Sistema de gestión y registro de denuncias para la Comisaría de Paucartambo, Cusco. Desarrollado bajo estándares de seguridad digital del Estado Peruano (SGTD-PCM) y cumplimiento de la Ley 29733 de Protección de Datos Personales.

## Características de Seguridad (CISO Audit)
- **Cifrado AES-256-GCM**: Datos sensibles cifrados en reposo mediante Web Crypto API.
- **Trazabilidad (No Repudio)**: Logs de auditoría detallados para cada acción oficial.
- **Control de Acceso (RBAC)**: Gestión de permisos basada en roles y propiedad de expedientes.
- **Defensa en Profundidad**: Content Security Policy (CSP) estricta y protección contra fuerza bruta.
- **Privacidad**: Enmascaramiento automático de datos sensibles (DNI/Teléfonos) en vistas generales.

## Tecnologías
- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS.
- **UI Components**: Shadcn/UI, Lucide Icons.
- **Seguridad**: Web Crypto API.
- **Reportes**: jsPDF con firma oficial.

## Desarrollo
Para iniciar el servidor de desarrollo:
```bash
npm run dev
```

Desarrollado por **Codex Cusco**.
