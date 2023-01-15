import {EncryptedMasterKey} from "vault-lib";
import {exportRawKey, importSymKey, symDec, symEnc, symEncGenKey} from "../lib/VaultCrypto";
import {ab2b64str, b642ab} from "../lib/utils";
export class MasterKey {
  constructor(private clearKey: CryptoKey, private enc_key: string, private enc_key_iv: string) {}
  public static async create(sharedSecret: CryptoKey) : Promise<MasterKey> {
    const clearKey = await symEncGenKey();
    const rk = await exportRawKey(clearKey);
    const encKeyBuff = await symEnc(rk, sharedSecret);
    return new MasterKey(
      clearKey,
      ab2b64str(encKeyBuff.data),
      ab2b64str(encKeyBuff.iv)
    )
  }

  public static async import(encMaterKey: string, encMasterKeyIV: string, sharedSecret: CryptoKey): Promise<MasterKey>{

    if (!encMaterKey || !encMasterKeyIV)
      throw new Error("Incomplete data.")

    const clearKeyRaw = await symDec({data: b642ab(encMaterKey), iv: b642ab(encMasterKeyIV)}, sharedSecret);
    const clearKey = await importSymKey(clearKeyRaw);
    return new MasterKey(
      clearKey,
      encMaterKey,
      encMasterKeyIV
    )
  }

  public getKey(): CryptoKey {
    return this.clearKey;
  }

  public export(): EncryptedMasterKey {
    return {
      enc_sym_key: this.enc_key,
      enc_sym_key_iv: this.enc_key_iv
    }
  }
}