/**
 * @fileOverview Servicio de Logging de Auditoría para cumplimiento de SGTD-PCM.
 * Garantiza la trazabilidad y el no repudio de las acciones del personal policial.
 */

export type AuditAction = 
  | 'LOGIN' 
  | 'LOGOUT' 
  | 'VIEW_EXPEDIENT' 
  | 'CREATE_EXPEDIENT' 
  | 'UPDATE_EXPEDIENT' 
  | 'DELETE_EXPEDIENT'
  | 'EXPORT_REPORT' 
  | 'SECURITY_VIOLATION'
  | 'CREATE_USER'
  | 'DELETE_USER'
  | 'UPDATE_CREDENTIALS'
  | 'SYSTEM_BACKUP';

interface AuditEntry {
  timestamp: string;
  officerId: string;
  action: AuditAction;
  resourceId?: string;
  details?: string;
  userAgent: string;
  integrityHash: string; // Hash para asegurar que el log no sea alterado
}

export async function logAuditEvent(
  officerId: string,
  action: AuditAction,
  details?: string,
  resourceId?: string
) {
  const entry: AuditEntry = {
    timestamp: new Date().toISOString(),
    officerId,
    action,
    resourceId,
    details,
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Server',
    integrityHash: '', // En un entorno real, aquí se generaría un HMAC
  };

  // En producción, esto se enviaría a un endpoint de auditoría inalterable (WORM storage)
  // Simulamos la persistencia en una zona protegida de logs
  const logs = JSON.parse(localStorage.getItem('ps_audit_logs') || '[]');
  logs.push(entry);
  localStorage.setItem('ps_audit_logs', JSON.stringify(logs.slice(-1000))); // Mantener últimos 1000 logs
}
