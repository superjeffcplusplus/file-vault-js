import {UserProps} from "vault-lib";
import {deriveKeyFromPassword, importSymKey, symDec, symEnc} from "../lib/VaultCrypto";
import {PasswordHashBuffer} from "../lib/model";
import {ab2b64str, b642ab} from "../lib/utils";

export class User {
  constructor(private name: string,
              private encShare: string,
              private encShareIV: string,
              private clearShare: ArrayBuffer,
              private pbkdfSalt: string) {}

  public static async create(username: string, password: string, clearShare: Uint8Array): Promise<User> {
    if (!username || !password || !clearShare)
      throw new Error("Incomplete data.")

    const keyBuff: PasswordHashBuffer = await deriveKeyFromPassword({password: password});
    const keyBin = await importSymKey(keyBuff.passwordHash);

    const encShare = await symEnc(clearShare, keyBin);

    return new User(username, ab2b64str(encShare.data), ab2b64str(encShare.iv), clearShare, ab2b64str(keyBuff.salt))
  }

  public static async import(userProps: UserProps, password: string): Promise<User> {
    if (password === undefined
      || userProps.pbkdf_salt === undefined
      || userProps.name === undefined
      || userProps.enc_share_iv === undefined
      || userProps.enc_share === undefined)
        throw Error('Incomplete data.')

    const keyBuff: PasswordHashBuffer = await deriveKeyFromPassword(
      {password: password, salt: userProps.pbkdf_salt}
    );

    const clearKey = await importSymKey(keyBuff.passwordHash);

    const encShareIVBin = b642ab(userProps.enc_share_iv);
    const encShareBin = b642ab(userProps.enc_share);

    const clearShare = await symDec({data: encShareBin, iv: encShareIVBin}, clearKey);

    return new User(userProps.name, userProps.enc_share, userProps.enc_share_iv, clearShare, userProps.pbkdf_salt);

  }



  public getClearShare(): ArrayBuffer {
    return this.clearShare;
  }

  /**
   * Export the User object as UserProps
   * This function should be used if we want to send a User object over the network.
   */
  public async exportProps(): Promise<UserProps> {

    return {
      name: this.name,
      enc_share: this.encShare,
      enc_share_iv: this.encShareIV,
      pbkdf_salt: this.pbkdfSalt,
    }
  }

}