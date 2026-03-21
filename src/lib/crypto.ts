
/**
 * Utilidades criptográficas utilizando Web Crypto API.
 * Garantiza la integridad de los datos sensibles antes del tránsito.
 */

export async function generateDataHash(data: any): Promise<string> {
  const msgUint8 = new TextEncoder().encode(JSON.stringify(data));
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function maskDni(dni: string): string {
  if (!dni || dni.length < 8) return dni;
  return `${dni.substring(0, 3)}****${dni.substring(7)}`;
}

export function maskPhone(phone: string): string {
  if (!phone || phone.length < 9) return phone;
  return `${phone.substring(0, 3)}***${phone.substring(6)}`;
}
