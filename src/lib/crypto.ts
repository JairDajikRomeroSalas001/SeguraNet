/**
 * Utilidades criptográficas avanzadas utilizando Web Crypto API.
 * Implementa cifrado simétrico AES-GCM para protección de datos en reposo (SGTD-PCM).
 */

const ENCRYPTION_KEY_NAME = 'ps_system_master_key';

// Genera o recupera una clave maestra persistente para el cifrado local
async function getMasterKey(): Promise<CryptoKey> {
  const storedKey = localStorage.getItem(ENCRYPTION_KEY_NAME);
  if (storedKey) {
    const keyData = JSON.parse(storedKey);
    return await window.crypto.subtle.importKey(
      'jwk',
      keyData,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
  }

  const key = await window.crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
  
  const exportedKey = await window.crypto.subtle.exportKey('jwk', key);
  localStorage.setItem(ENCRYPTION_KEY_NAME, JSON.stringify(exportedKey));
  return key;
}

/**
 * Cifra objetos JSON utilizando AES-256-GCM.
 */
export async function encryptData(data: any): Promise<string> {
  const key = await getMasterKey();
  const iv = window.crypto.getRandomValues(new Uint8Array(12)); // Vector de inicialización
  const encodedData = new TextEncoder().encode(JSON.stringify(data));
  
  const encryptedContent = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encodedData
  );

  const combined = new Uint8Array(iv.length + encryptedContent.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encryptedContent), iv.length);
  
  return btoa(String.fromCharCode(...combined));
}

/**
 * Descifra strings Base64 a objetos JSON.
 */
export async function decryptData(encryptedBase64: string): Promise<any> {
  try {
    const key = await getMasterKey();
    const combined = new Uint8Array(
      atob(encryptedBase64).split('').map(c => c.charCodeAt(0))
    );
    
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);
    
    const decryptedContent = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );
    
    return JSON.parse(new TextDecoder().decode(decryptedContent));
  } catch (e) {
    console.error('Violación de Integridad: No se pudo descifrar el bloque de datos.');
    return null;
  }
}

/**
 * Genera un hash SHA-256 para validación de integridad de documentos.
 */
export async function generateDataHash(data: any): Promise<string> {
  const msgUint8 = new TextEncoder().encode(JSON.stringify(data));
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Aplica máscaras de privacidad para cumplimiento de la Ley 29733.
 */
export function maskDni(dni: string): string {
  if (!dni || dni.length < 8) return dni;
  return `${dni.substring(0, 3)}****${dni.substring(7)}`;
}

export function maskPhone(phone: string): string {
  if (!phone || phone.length < 9) return phone;
  return `${phone.substring(0, 3)}***${phone.substring(6)}`;
}
