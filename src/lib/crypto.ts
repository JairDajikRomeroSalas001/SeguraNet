/**
 * Utilidades criptográficas avanzadas utilizando Web Crypto API.
 * Implementa cifrado simétrico AES-GCM para protección de datos en reposo.
 */

const ENCRYPTION_KEY_NAME = 'ps_system_master_key';

// Genera una clave maestra para el cifrado local si no existe
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
 * Cifra datos sensibles antes de guardarlos en localStorage.
 */
export async function encryptData(data: any): Promise<string> {
  const key = await getMasterKey();
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
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
 * Descifra datos recuperados de localStorage.
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
    console.error('Error de descifrado: Posible manipulación de datos o clave inválida.');
    return null;
  }
}

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
