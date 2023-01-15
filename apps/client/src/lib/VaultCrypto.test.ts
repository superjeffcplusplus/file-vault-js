import {b642ab} from "./utils";
import {PBKDF2_HASH_ALG, PBKDF2_HASH_BIT_LEN} from "./VaultCrypto";
import * as crypto from "crypto";
describe('VaultCrypto module',() => {


  // test('Symmetric key should be suitable for AES-GCM', async () => {
  //   const key: CryptoKey = await crypto.symEncGenKey();
  //   expect(key.type).toEqual('secret');
  //   expect(key.algorithm).toEqual({"length": 256, "name": "AES-GCM"});
  //   expect(key.usages[0]).toEqual('encrypt');
  //   expect(key.usages[1]).toEqual('decrypt');
  // })

  test("derive key", () => {
    expect(deriveKey).not.toThrow();
  });

  test("sym dec", () => {
    const fn = async () => {
      const encShare =   "Ds+XLaACCT0KSxBX2m2P2YrbnzfQKENFIHT+tK2rrZGOMMUm0v87FhRHKLZCJ8xYjA==";
      const encShareIV = "Ds+XLaACCT0KSxBX2m2P2YrbnzfQKENFIHT+tK2rrZGOMMUm0v87FhRHKLZCJ8xYjA==";
    }
  })

})


const deriveKey = async () => {

  const saltBuffer = b642ab("tz3jCZhK/P1gtJaBoxPshg==");
  const passwordBuffer = b642ab("pass1");

  const keyMaterial = await crypto.webcrypto.subtle.importKey(
    "raw",
    passwordBuffer,
    {name: "PBKDF2"},
    false,
    ["deriveBits", "deriveKey"]
  );

  return await crypto.webcrypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: saltBuffer,
      iterations: 100_000,
      hash: PBKDF2_HASH_ALG,
    },
    keyMaterial,
    PBKDF2_HASH_BIT_LEN
  );
}