import {SymEncDataBuffer} from "./types.js";
import {ERR_MSG} from "./error.js";

const SYM_ENC_ALG = 'AES-GCM';
const AES_GCM_KEY_BIT_LEN = 256;
const AES_GCM_IV_BYTE_LEN = 12;

/**
 * Generate a key of 256 bits for use with AES-GCM.
 */
export async function symEncGenKey(): Promise<CryptoKey> {
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
export async function symEnc(data: ArrayBuffer, key: CryptoKey, authData?: Uint8Array): Promise<SymEncDataBuffer> {
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

export function symDec(encData: SymEncDataBuffer, key: CryptoKey): Promise<ArrayBuffer> {
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

export async function importSymKey(keyBin: ArrayBuffer): Promise<CryptoKey> {
  return window.crypto.subtle.importKey('raw', keyBin, SYM_ENC_ALG, true, ['encrypt', 'decrypt']);
}