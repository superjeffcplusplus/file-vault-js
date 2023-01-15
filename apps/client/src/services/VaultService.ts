import {UserAndPass} from "../lib/model";
import {ab2b64str, fromBinaryStr} from "../lib/utils";
import {exportRawKey, importSymKey, symEnc, symEncGenKey} from "../lib/VaultCrypto"
import dcrypto from "@deliberative/crypto";
import {CompanyProps, EncryptedMasterKey, UserProps} from "vault-lib";
import {User} from "../includes/User";
import {Company} from "../includes/Company";
import {MasterKey} from "../includes/MasterKey";
import {FileProps, FileCompanion, FileEncKeyBox} from "../includes/FileCompanion";


export interface UserPropsAndPsswd {
  userProps: UserProps,
  password: string
}

export class VaultService {
  public jwt?: string;
  private SHARE_THRESHOLD = 2;
  private users: Map<string, User> = new Map();
  private files: Map<string, FileCompanion> = new Map();
  private company?: Company;
  private masterKey?: MasterKey;
  private sharedSecret?: CryptoKey;

  public getUserNumber(): number {
    return this.users.size;
  }

  public getCompanyName(): string {
    if (this.company)
      return this.company.getName();
    else
      return "";
  }

  public async createCompany(companyName: string, companyUsers: UserAndPass[]): Promise<void> {

    if (companyUsers.length < this.SHARE_THRESHOLD)
      throw Error("Minimum 2 users are required.");

    const clearSharedSecret: CryptoKey = await symEncGenKey();
    this.company = await Company.create(companyName, clearSharedSecret)
    const clearShares = await this.splitSecret(clearSharedSecret, companyUsers.length);
    for (const u of companyUsers) {
      const user = await User.create(u.name, u.pass, clearShares.pop()!)
      this.users.set(u.name, user);
    }
  }

  public async importCompany(props: CompanyProps): Promise<void> {
    if (this.getUserNumber() < this.SHARE_THRESHOLD) {
      throw new Error("Minimum 2 imported users required.")
    }
    console.log("before getSharedSecret")
    const key = await this.getSharedSecret()
    console.log("after getSharedSecret")
    this.company = await Company.import(props, key)
    console.log("end import cpy")

  }

  public exportCompany(): Promise<CompanyProps> {
    if (!this.company)
      throw new Error("Company not set.")
    return this.company.exportProps();
  }

  public async createMasterKey(): Promise<void> {

    if (!this.sharedSecret)
      throw new Error("Shared secret missing.")

    this.masterKey = await MasterKey.create(this.sharedSecret!);
  }
  public async importMasterKey(encMaterKey: string, encMasterKeyIV: string): Promise<void> {

    if (!this.sharedSecret)
      throw new Error("Shared secret missing.")

    this.masterKey = await MasterKey.import(encMaterKey, encMasterKeyIV, this.sharedSecret);
  }

  public exportMasterKey(): EncryptedMasterKey {

    if (!this.masterKey)
      throw new Error("No MK to export.")

    return this.masterKey.export();
  }

  /**
   * throw exception
   */
  public async exportUsers(): Promise<Array<UserProps>> {
    const out: Array<any> = [];
    // It works ... but ... TODO : Refactor using iterator
    this.users.forEach(async (u: User) => {
      out.push(await u.exportProps());
    })
    return out;
  }

  public async importUser(userProps: UserProps, password: string): Promise<void> {
    const user = await User.import(userProps, password)
    this.users.set(userProps.name, user);
  }

  public async createFileCompanion(fileName: string): Promise<string> {
    if (!this.masterKey)
      throw new Error("Missing master key");
    const newFile = await FileCompanion.create(fileName, this.masterKey?.getKey())
    this.files.set(newFile.getUuid(), newFile);
    return newFile.getUuid();
  }

  public async importFileMetadata(fileProps: FileProps): Promise<void> {
    if (!this.masterKey)
      throw new Error("missing master key.");
    const file = await FileCompanion.import(fileProps, this.masterKey.getKey());
    this.files.set(fileProps.uuid, file);
  }

  public async importFileKey(fileKey: FileEncKeyBox, uuid: string): Promise<FileCompanion> {
    if (!this.masterKey)
      throw new Error("missing master key.");
    if (!this.files.has(uuid))
      throw new Error(`File with uuid ${uuid} does not exist.`)
    if (!fileKey.file_enc_iv || !fileKey.enc_file_enc_key || !fileKey.filekey_enc_iv)
      throw new Error("Incomplete data.");
    const fc = this.files.get(uuid)!
    await fc.setFileEncComponents(fileKey.enc_file_enc_key, fileKey.filekey_enc_iv, fileKey.file_enc_iv, this.masterKey!.getKey());
    return fc;
  }

  public getFileCompanions() {
    return Array.from(this.files.values());
  }

  public clearFileList() {
    this.files.clear();
  }

  public exportFileProps(uuid: string): FileProps {
    if (!this.files.has(uuid))
      throw new Error(`File with uuid ${uuid} does not exist.`)
    return this.files.get(uuid)!.exportProps();
  }

  public exportFileEncKeyBox(uuid: string): FileEncKeyBox {
    if (!this.files.has(uuid))
      throw new Error(`File with uuid ${uuid} does not exist.`)
    return this.files.get(uuid)!.exportFileEncKeyBox();
  }

  /**
   * Encrypt the file of give uuid, previously imported in the VaultService instance.
   * Side effect: update the properties of corresponding FileCompanion object.
   * @param file
   * @param uuid
   */
  public async encryptFile(file: Blob, uuid: string): Promise<Blob> {

    if (!this.files.has(uuid))
      throw new Error(`File with uuid ${uuid} does not exist.`)

    if (!this.masterKey)
      throw new Error("missing master key.");

    const fileCompanion: FileCompanion = this.files.get(uuid)!

    const key = await symEncGenKey();
    const encFileBuff = await symEnc(await file.arrayBuffer(), key);

    const encKeyBuff = await symEnc(
      await exportRawKey(key),
      this.masterKey!.getKey()
    )

    await fileCompanion.setFileEncComponents(ab2b64str(encKeyBuff.data), ab2b64str(encKeyBuff.iv), ab2b64str(encFileBuff.iv), this.masterKey.getKey())

    return new Blob([encFileBuff.data]);
  }

  public async signChallenge(challenge: string) {
    if (!this.company)
      throw Error("Company not set.");
    const buf = fromBinaryStr(challenge);
    const sig = await this.company.signData(buf);
    return ab2b64str(sig);
  }

  private async splitSecret(keyToShare: CryptoKey, nbShares: number): Promise<Uint8Array[]> {

    const rk: ArrayBuffer = await window.crypto.subtle.exportKey("raw", keyToShare);

    return dcrypto.splitSecret(
      new Uint8Array(rk, 0, rk.byteLength),
      nbShares,
      this.SHARE_THRESHOLD)

  }

  public async getSharedSecret(): Promise<CryptoKey> {

    if (this.sharedSecret)
      return this.sharedSecret;

    const shares: Array<Uint8Array> = [];

    this.users.forEach((u) => {
      const tmp = u.getClearShare()
      shares.push(new Uint8Array(tmp, 0, tmp.byteLength));
    })

    this.sharedSecret = await importSymKey(await dcrypto.restoreSecret(shares));
    
    return this.sharedSecret;
  }

  private static instance?: VaultService;
  public static getInstance() {
    if (!VaultService.instance)
      VaultService.instance = new VaultService();
    return VaultService.instance;
  }

  public static reset() {
    VaultService.instance!.masterKey = undefined;
    VaultService.instance!.sharedSecret = undefined;
    VaultService.instance!.company = undefined;
    VaultService.instance!.jwt = undefined;
    VaultService.instance!.users.clear();
  }

  public isAuthenticated(): boolean {
    return this.jwt !== undefined;
  }

}