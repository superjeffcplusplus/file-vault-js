import {CompanyProps} from "vault-lib";
import {
  asymSign,
  asymSignGenKeyPair,
  exportPubKeyAsPEM,
  exportRawPrivKey,
  importPrivKey,
  importPubKey,
  symDec,
  symEnc
} from "./../lib/VaultCrypto";
import {ab2b64str, b642ab} from "./../lib/utils";
import {ECDSASignature} from "./../lib/model";



export class Company {

  constructor(private name:string,
              private asymSignPriv: CryptoKey,
              private encSigningPrivKey: string,
              private encSigningPrivKeyIV: string,
              private asymSignPub: CryptoKey) {}

  /**
   * This function is used when someone want to create a new company.
   * It creates the public signing keypair and encrypt the private key.
   * Returns a Company object.
   * @param name
   * @param sharedSecret used to encrypt the private signing key.
   */
  public static async create(name: string, sharedSecret: CryptoKey): Promise<Company> {

    if (name === undefined)
      throw new Error("Incomplete data.");

    const asymKeyPair = await asymSignGenKeyPair();
    const encPriv = await symEnc(
      await exportRawPrivKey(asymKeyPair.privateKey),
      sharedSecret,
    );
    const encSigningPrivKey = ab2b64str(encPriv.data);
    const encSigningPrivKeyIV = ab2b64str(encPriv.iv);

    return new Company(name, asymKeyPair.privateKey, encSigningPrivKey, encSigningPrivKeyIV, asymKeyPair.publicKey);
  }

  public static async import(props: CompanyProps, sharedSecret: CryptoKey): Promise<Company> {
    console.log("start Company.import")
    console.log(props)
    if (!props.name
      || !props.signing_pub_key
      || !props.enc_signing_priv_key
      || !props.enc_signing_priv_key_iv)
        throw new Error("Incomplete data.");

    console.log("before symdec")
    const clearPriv = await symDec(
      {
        data: b642ab(props.enc_signing_priv_key),
        iv: b642ab(props.enc_signing_priv_key_iv)
      },
      sharedSecret
    )
    console.log("after symdec")

    const cryptoKeyPriv = await importPrivKey(clearPriv);

    const cryptoKeyPub = await importPubKey(b642ab(props.signing_pub_key));

    return new Company(props.name, cryptoKeyPriv,
      props.enc_signing_priv_key,
      props.enc_signing_priv_key_iv, cryptoKeyPub);
  }

  public signData(data: ArrayBuffer): Promise<ECDSASignature> {
    return asymSign(data, this.asymSignPriv)
  }

  /**
   * Export the company object as CompanyProps
   * This function should be used if we want to send a company object over the network.
   */
  public async exportProps(): Promise<CompanyProps> {
    if (this.asymSignPub === undefined)
      throw new Error("Incomplete data.");
    const pem = await exportPubKeyAsPEM(this.asymSignPub);

    return {
      name: this.name,
      signing_pub_key: pem,
      enc_signing_priv_key: this.encSigningPrivKey,
      enc_signing_priv_key_iv: this.encSigningPrivKeyIV,
    }
  }

  public getName(): string {
    return this.name;
  }
}