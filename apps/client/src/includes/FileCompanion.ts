import {exportRawKey, importSymKey, symDec, symEnc, symEncGenKey} from "../lib/VaultCrypto";
import {ab2b64str, b642ab, fromBinaryStr, toBinaryStr} from "../lib/utils";

export interface FileProps {
  uuid: string, // Resource identifier
  enc_name: string, // Encrypted filename
  enc_name_iv: string, // Filename encryption IV
}

export interface FileEncKeyBox {
  enc_file_enc_key: string, // (encrypted) The key that encrypt the file
  filekey_enc_iv: string, // The file encryption IV
  file_enc_iv: string, // The file key encryption IV
}

export class FileCompanion {
  /**
   *
   * @param uuid resource identifier
   * @param encFileName (encrypted) file name
   * @param encFileNameIV the IV used to encrypt the file name
   * @param clearFileName (clear) file name
   * @param clearFileEncKey (clear) the key that encrypt the file
   * @param encFileEncKey (encrypted) the key that encrypt the file
   * @param fileEncIV the IV used to encrypt the file
   * @param fileKeyEncryptionIV the IV used to encrypt the key that encrypt the file
   */
  constructor(
    private uuid: string,
    private encFileName: string,
    private encFileNameIV: string,
    private clearFileName: string,
    private clearFileEncKey?: CryptoKey,
    private encFileEncKey?: string,
    private fileEncIV?: string,
    private fileKeyEncryptionIV?: string,
  ) {}
  public static async create(fileName: string, masterKey: CryptoKey) {
    const uuid = window.crypto.randomUUID();

    const encFNameBuff = await symEnc(fromBinaryStr(fileName), masterKey);

    return new FileCompanion(uuid, ab2b64str(encFNameBuff.data), ab2b64str(encFNameBuff.iv), fileName);

  }

  public static async import(fileProps: FileProps, masterKey: CryptoKey) {

    if (!fileProps.uuid || !fileProps.enc_name || !fileProps.enc_name_iv)
      throw new Error("Incomplete data.")

    const clearName = await symDec({data: b642ab(fileProps.enc_name), iv: b642ab(fileProps.enc_name_iv)}, masterKey);

    return new FileCompanion(fileProps.uuid, fileProps.enc_name, fileProps.enc_name_iv, toBinaryStr(clearName))
  }


  /**
   *
   * @param encFileEncKey (encrypted) The key that encrypt the file
   * @param fileKeyEncIV The IV used to encrypt the key that encrypt the file
   * @param fileEncIV The IV used to encrypt the file
   * @param keyEncKey
   */
  public async setFileEncComponents(encFileEncKey: string, fileKeyEncIV: string, fileEncIV: string, keyEncKey: CryptoKey) {
    this.encFileEncKey = encFileEncKey;
    this.fileEncIV = fileEncIV;
    this.fileKeyEncryptionIV = fileKeyEncIV;
    const rk = await symDec(
      {
        data: b642ab(encFileEncKey),
        iv: b642ab(fileKeyEncIV)
      },
      keyEncKey
    );
    this.clearFileEncKey = await importSymKey(rk);
  }

  public async setClearFileEncKey(key: CryptoKey) {
    this.clearFileEncKey = key;
  }

  public async encryptFile(file: Blob, keyEncryptionKey: CryptoKey): Promise<Blob> {

    const key = await symEncGenKey();
    const encFileBuff = await symEnc(await file.arrayBuffer(), key);

    const encKeyBuff = await symEnc(
      await exportRawKey(key),
      keyEncryptionKey
    )

    this.fileKeyEncryptionIV = ab2b64str(encKeyBuff.iv);

    this.clearFileEncKey = key;
    this.fileEncIV = ab2b64str(encFileBuff.iv);
    return new Blob([encFileBuff.data])
  }


  public async decryptFile(encFile: ArrayBuffer): Promise<ArrayBuffer> {
    if (!this.fileEncIV || !this.clearFileEncKey)
      throw new Error("Incomplete data.")
    return await symDec(
      {
        data: encFile,
        iv: b642ab(this.fileEncIV)
      },
      this.clearFileEncKey);
  }

  public getUuid(): string {
    return this.uuid;
  }

  public getClearName(): string {
    return this.clearFileName;
  }

  public exportProps(): FileProps {
    if (!this.uuid || !this.encFileName || !this.encFileNameIV)
      throw new Error("Incomplete data.");
    return {
      uuid: this.uuid,
      enc_name: this.encFileName,
      enc_name_iv: this.encFileNameIV,
    };
  }

  public exportFileEncKeyBox(): FileEncKeyBox {
    if (!this.fileKeyEncryptionIV || !this.encFileEncKey || !this.fileEncIV)
      throw new Error("Incomplete data.")
    return {
      enc_file_enc_key: this.encFileEncKey, // (encrypted) The key that encrypt the file
      filekey_enc_iv: this.fileKeyEncryptionIV, // The file encryption IV
      file_enc_iv: this.fileEncIV, // The file key encryption IV
    }
  }

}