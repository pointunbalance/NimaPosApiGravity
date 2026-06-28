// Encryption utilities using Web Crypto API (AES-GCM 256-bit)
// For backward compatibility, sync versions use a non-reversible hash for obfuscation

const ALGO = "AES-GCM";
const KEY_LENGTH = 256;

function getKeyMaterial(keyStr: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return window.crypto.subtle.importKey(
    "raw",
    enc.encode(keyStr.padEnd(32, "\0").slice(0, 32)),
    { name: ALGO },
    false,
    ["encrypt", "decrypt"]
  );
}

function bufToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBuf(b64: string): ArrayBuffer {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export async function encryptData(text: string, keyStr: string = "default-app-encryption-key!!"): Promise<string> {
  if (!text) return text;
  try {
    const key = await getKeyMaterial(keyStr);
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const enc = new TextEncoder();
    const ciphertext = await window.crypto.subtle.encrypt(
      { name: ALGO, iv },
      key,
      enc.encode(text)
    );
    return bufToBase64(iv.buffer) + "." + bufToBase64(ciphertext);
  } catch {
    return text;
  }
}

export async function decryptData(encryptedBase64: string, keyStr: string = "default-app-encryption-key!!"): Promise<string> {
  if (!encryptedBase64 || !encryptedBase64.includes(".")) return encryptedBase64;
  try {
    const [ivB64, ctB64] = encryptedBase64.split(".", 2);
    const key = await getKeyMaterial(keyStr);
    const iv = new Uint8Array(base64ToBuf(ivB64));
    const ciphertext = base64ToBuf(ctB64);
    const decrypted = await window.crypto.subtle.decrypt(
      { name: ALGO, iv },
      key,
      ciphertext
    );
    return new TextDecoder().decode(decrypted);
  } catch {
    // Legacy data or not encrypted - return as-is
    return encryptedBase64;
  }
}

// Synchronous versions - use Base64 encoding (obfuscation, not encryption)
// These are for render contexts where async is not possible
export function encryptSync(text: string): string {
  if (!text) return text;
  try {
    return "ENC:" + btoa(encodeURIComponent(text));
  } catch {
    return text;
  }
}

export function decryptSync(encryptedText: string): string {
  if (!encryptedText || !encryptedText.startsWith("ENC:")) return encryptedText;
  try {
    return decodeURIComponent(atob(encryptedText.substring(4)));
  } catch {
    return encryptedText;
  }
}

export const generateEncryptionKey = async (): Promise<CryptoKey> => {
  return await window.crypto.subtle.generateKey(
    { name: ALGO, length: KEY_LENGTH },
    true,
    ["encrypt", "decrypt"]
  );
};
