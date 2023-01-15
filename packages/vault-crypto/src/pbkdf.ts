
import {b642ab} from "functions";
import {PasswordHashBuffer, PasswordString} from "./types";

const PBKDF2_SALT_LEN = 16;
const PBKDF2_NB_ROUND = 1_000_000;
const PBKDF2_HASH_ALG = 'SHA-256';
const PBKDF2_HASH_BIT_LEN = 256;

/**
 * Derive a 256 bits key from user password
 * @param password
 */
export async function deriveKeyFromPassword(password: PasswordString): Promise<PasswordHashBuffer> {

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
async function getPbkdfKeyMaterial(passwordBuffer: Uint8Array): Promise<CryptoKey> {
  return window.crypto.subtle.importKey(
    "raw",
    passwordBuffer,
    {name: "PBKDF2"},
    false,
    ["deriveBits", "deriveKey"]
  );
}