import {ECDSASignature, PasswordHashBuffer, PasswordString, SymEncDataBuffer} from "./model";
import {ab2b64str, b642ab} from "./utils";

const ERR_MSG = 'Crypto operation error.'

const PBKDF2_SALT_LEN = 16;
const PBKDF2_NB_ROUND = 1_000_000;
const PBKDF2_HASH_ALG = 'SHA-256';
const PBKDF2_HASH_BIT_LEN = 256;

const SYM_ENC_ALG = 'AES-GCM';
const AES_GCM_KEY_BIT_LEN = 256;
const AES_GCM_IV_BYTE_LEN = 12;
export const SIGN_ALG = {
  name: "ECDSA",
  namedCurve: "P-384",
}


/**
 *
 * @param password
 */

async function deriveKeyFromPassword(password: PasswordString): Promise<PasswordHashBuffer> {

  let saltBuffer;
  if (!password.salt) {
    saltBuffer = window.crypto.getRandomValues(new Uint8Array(PBKDF2_SALT_LEN));
  } else {
    saltBuffer = b642ab(password.salt);
  }

  const keyMaterial = await getPbkdfKeyMaterial(new TextEncoder().encode(password.password));

  const derivedBits: ArrayBuffer = await window.crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: saltBuffer,
      iterations: PBKDF2_NB_ROUND,
      hash: PBKDF2_HASH_ALG,
    },
    keyMaterial,
    PBKDF2_HASH_BIT_LEN
  );

  return {passwordHash: new Uint8Array(derivedBits), salt: saltBuffer};
}

/**
 * Generate a key of 256 bits for use with AES-GCM.
 */
async function symEncGenKey(): Promise<CryptoKey> {
  return window.crypto.subtle.generateKey(
    {
      name: SYM_ENC_ALG,
      length: AES_GCM_KEY_BIT_LEN,
    },
    true,
    ['encrypt', 'decrypt']
  )
}

/**
 * Encrypt provided data with provided key with GCM.
 * The IV is random generated.
 * The tag is included in the data property of the SymEncDataBuffer returned.
 * The tag has 128 bits length (default from web API).
 * See: https://developer.mozilla.org/en-US/docs/Web/API/AesGcmParams
 * @param data
 * @param key
 * @param authData
 */
async function symEnc(data: ArrayBuffer, key: CryptoKey, authData?: Uint8Array): Promise<SymEncDataBuffer> {
  const iv = window.crypto.getRandomValues(new Uint8Array(AES_GCM_IV_BYTE_LEN));
  const encData = await window.crypto.subtle.encrypt(
    {
      name: SYM_ENC_ALG,
      iv: iv,
    },
    key, data);
  return {
    data: encData,
    iv: iv.buffer,
  }
}

function symDec(encData: SymEncDataBuffer, key: CryptoKey): Promise<ArrayBuffer> {
  return new Promise((res, rej) => {
    window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: encData.iv,
      },
      key,
      encData.data
    ).then((a) => {
      res(a);
    }).catch((e: any) => {
      console.log(e);
      console.log(key);
      console.log(encData);
      rej(ERR_MSG);
    });
  })
}

async function encryptKey(keyToEncrypt: CryptoKey, encKey: CryptoKey): Promise<SymEncDataBuffer> {
  console.log(keyToEncrypt.algorithm.name)
  console.log(SYM_ENC_ALG)
  if (encKey.algorithm.name !== SYM_ENC_ALG || keyToEncrypt.algorithm.name !== SIGN_ALG.name)
    throw new Error(ERR_MSG);
  console.log("before key export");
  if (keyToEncrypt.type === 'private') {
    const rawKey: ArrayBuffer = await window.crypto.subtle.exportKey('pkcs8', keyToEncrypt);
    console.log("after key export")
    return symEnc(new Uint8Array(rawKey), encKey);
  } else {
    const rawKey: ArrayBuffer = await window.crypto.subtle.exportKey('raw', keyToEncrypt);
    return symEnc(new Uint8Array(rawKey), encKey);
  }
}

async function decryptSignKey(data: SymEncDataBuffer, key: CryptoKey): Promise<CryptoKey> {
  const rawKey = await symDec(data, key);
  return window.crypto.subtle.importKey('raw', rawKey, SIGN_ALG, true, ['sign']);
}

async function importSymKey(keyBin: ArrayBuffer): Promise<CryptoKey> {
  return window.crypto.subtle.importKey('raw', keyBin, SYM_ENC_ALG, true, ['encrypt', 'decrypt']);
}

async function asymSignGenKeyPair(): Promise<CryptoKeyPair> {
  const keyPair = await window.crypto.subtle.generateKey(
    SIGN_ALG,
    true,
    ["sign", "verify"],
  );
  return keyPair as CryptoKeyPair
}

async function asymSign(data: ArrayBuffer, key: CryptoKey): Promise<ECDSASignature> {
  return await window.crypto.subtle.sign(
    {...SIGN_ALG, hash: "SHA-256"},
    key,
    data,
  );
}

async function asymVerifySignature(data: Uint8Array, pubKey: CryptoKey, s: ECDSASignature): Promise<boolean> {
  return window.crypto.subtle.verify(
    SIGN_ALG,
    pubKey,
    s,
    data,
  )
}

async function getPbkdfKeyMaterial(passwordBuffer: Uint8Array): Promise<CryptoKey> {
  return window.crypto.subtle.importKey(
    "raw",
    passwordBuffer,
    {name: "PBKDF2"},
    false,
    ["deriveBits", "deriveKey"]
  );
}

async function exportRawKey(key: CryptoKey) {
  const rawKey = await window.crypto.subtle.exportKey('raw', key);
  return new Uint8Array(rawKey, 0, rawKey.byteLength);
}

/**
 * Export private key in pkcs8
 * @param key
 */
async function exportRawPrivKey(key: CryptoKey) {
  const rawKey = await window.crypto.subtle.exportKey('pkcs8', key);
  return new Uint8Array(rawKey, 0, rawKey.byteLength);
}

async function importPrivKey(key: ArrayBuffer): Promise<CryptoKey> {
  return window.crypto.subtle.importKey('pkcs8', key, SIGN_ALG, true, ["sign"]);
}

async function exportPubKeyAsPEM(key: CryptoKey) {
  const exported = await window.crypto.subtle.exportKey(
    "spki",
    key
  );
  return ab2b64str(exported);
}

async function importPubKey(key: ArrayBuffer) {
  return window.crypto.subtle.importKey("spki", key, SIGN_ALG, true, ["verify"]);
}

export {
  deriveKeyFromPassword,
  symEncGenKey,
  symEnc,
  symDec,
  importSymKey,
  asymSignGenKeyPair,
  asymSign,
  asymVerifySignature,
  exportRawKey,
  exportRawPrivKey,
  decryptSignKey,
  encryptKey,
  exportPubKeyAsPEM,
  importPrivKey,
  importPubKey
};