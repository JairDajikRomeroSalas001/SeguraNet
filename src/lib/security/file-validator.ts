import 'server-only';

const ALLOWED_MIME = new Set(['application/pdf', 'image/jpeg', 'image/png']);
const FORBIDDEN_EXT = /\.(exe|js|sh|bat|cmd|ps1|vbs|jar|msi|dll|so|app|scr)$/i;

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  sanitizedFilename?: string;
}

export function validateFileUpload(
  filename: string,
  mimeType: string,
  sizeBytes: number,
): FileValidationResult {
  if (!filename || filename.length > 255) {
    return { valid: false, error: 'Nombre de archivo inválido' };
  }
  if (FORBIDDEN_EXT.test(filename)) {
    return { valid: false, error: 'Extensión de archivo prohibida' };
  }
  if (!ALLOWED_MIME.has(mimeType)) {
    return { valid: false, error: `Tipo MIME no permitido: ${mimeType}` };
  }
  const maxBytes = Number(process.env.STORAGE_MAX_FILE_SIZE_MB ?? 50) * 1024 * 1024;
  if (sizeBytes <= 0 || sizeBytes > maxBytes) {
    return { valid: false, error: `Tamaño debe estar entre 1 byte y ${maxBytes} bytes` };
  }
  const sanitized = filename
    .replace(/[/\\]/g, '_')
    .replace(/[^a-zA-Z0-9._\-\s]/g, '_')
    .replace(/\s+/g, '_')
    .slice(0, 200);
  if (!sanitized || sanitized === '_') {
    return { valid: false, error: 'Nombre de archivo no quedó válido tras sanitización' };
  }
  return { valid: true, sanitizedFilename: sanitized };
}
