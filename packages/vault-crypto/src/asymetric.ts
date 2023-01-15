import { ab2b64str } from "functions";
import {ECDSASignature} from "./types.js";
export const SIGN_ALG = {
  name: "ECDSA",
  namedCurve: "P-384",
}

export async function asymSignGenKeyPair(): Promise<CryptoKeyPair> {
  const keyPair = await window.crypto.subtle.generateKey(
    SIGN_ALG,
    true,
    ["sign", "verify"],
  );
  return keyPair as CryptoKeyPair
}
export async function asymSign(data: ArrayBuffer, key: CryptoKey): Promise<ECDSASignature> {
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
export async function importPrivKey(key: ArrayBuffer): Promise<CryptoKey> {
  return window.crypto.subtle.importKey('pkcs8', key, SIGN_ALG, true, ["sign"]);
}

/**
 * Export private key in pkcs8
 * @param key
 */
export async function exportRawPrivKey(key: CryptoKey) {
  const rawKey = await window.crypto.subtle.exportKey('pkcs8', key);
  return new Uint8Array(rawKey, 0, rawKey.byteLength);
}

export async function importPubKey(key: ArrayBuffer) {
  return window.crypto.subtle.importKey("spki", key, SIGN_ALG, true, ["verify"]);
}

export async function exportPubKeyAsPEM(key: CryptoKey) {
  const exported = await window.crypto.subtle.exportKey(
    "spki",
    key
  );
  return ab2b64str(exported);
}