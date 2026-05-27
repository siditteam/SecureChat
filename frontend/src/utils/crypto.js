function toBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let bin = '';
  for (let i = 0; i < bytes.byteLength; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

function fromBase64(b64) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

export async function generateKeyPair() {
  const pair = await crypto.subtle.generateKey(
    { name: 'RSA-OAEP', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
    true,
    ['encrypt', 'decrypt']
  );
  const [publicKeyJwk, privateKeyJwk] = await Promise.all([
    crypto.subtle.exportKey('jwk', pair.publicKey),
    crypto.subtle.exportKey('jwk', pair.privateKey),
  ]);
  return { publicKeyJwk, privateKeyJwk };
}

async function importRsaPublicKey(jwk) {
  return crypto.subtle.importKey('jwk', jwk, { name: 'RSA-OAEP', hash: 'SHA-256' }, false, ['encrypt']);
}

async function importRsaPrivateKey(jwk) {
  return crypto.subtle.importKey('jwk', jwk, { name: 'RSA-OAEP', hash: 'SHA-256' }, false, ['decrypt']);
}

export async function encryptMessage(plaintext, recipientPublicKeyJwk, senderPublicKeyJwk) {
  // Generate a per-message AES-GCM key
  const aesKey = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);

  const [ciphertext, rawAesKey, recipientKey, senderKey] = await Promise.all([
    crypto.subtle.encrypt({ name: 'AES-GCM', iv }, aesKey, encoded),
    crypto.subtle.exportKey('raw', aesKey),
    importRsaPublicKey(recipientPublicKeyJwk),
    importRsaPublicKey(senderPublicKeyJwk),
  ]);

  const [encryptedKeyForReceiver, encryptedKeyForSender] = await Promise.all([
    crypto.subtle.encrypt({ name: 'RSA-OAEP' }, recipientKey, rawAesKey),
    crypto.subtle.encrypt({ name: 'RSA-OAEP' }, senderKey, rawAesKey),
  ]);

  return {
    encryptedContent: toBase64(ciphertext),
    encryptedKeyForReceiver: toBase64(encryptedKeyForReceiver),
    encryptedKeyForSender: toBase64(encryptedKeyForSender),
    iv: toBase64(iv),
  };
}

export async function decryptMessage({ encryptedContent, encryptedKeyForReceiver, encryptedKeyForSender, iv }, isSender, privateKeyJwk) {
  const privateKey = await importRsaPrivateKey(privateKeyJwk);
  const encryptedAesKey = isSender ? encryptedKeyForSender : encryptedKeyForReceiver;

  const rawAesKey = await crypto.subtle.decrypt({ name: 'RSA-OAEP' }, privateKey, fromBase64(encryptedAesKey));
  const aesKey = await crypto.subtle.importKey('raw', rawAesKey, { name: 'AES-GCM' }, false, ['decrypt']);
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromBase64(iv) }, aesKey, fromBase64(encryptedContent));

  return new TextDecoder().decode(decrypted);
}
