# SeguraNet - Paucartambo Segura

Sistema de gestión y registro de denuncias para la Comisaría de Paucartambo, Cusco. Desarrollado con estándares de seguridad SGTD-PCM y cumplimiento de la Ley 29733.

## Tecnologías
- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS.
- **UI Components**: Shadcn/UI, Lucide Icons.
- **Seguridad**: Web Crypto API (AES-256-GCM), RBAC, Audit Logging.
- **Reportes**: jsPDF con soporte para firmas oficiales.

## Configuración de Seguridad
Este sistema implementa:
- Cifrado de datos en reposo.
- Trazabilidad total de acciones por oficial.
- Protección contra ataques de fuerza bruta.
- Gestión de sesiones por inactividad.

## Desarrollo
Para iniciar el servidor de desarrollo:
```bash
npm run dev
```

Desarrollado por **Codex Cusco**.