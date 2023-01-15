import {config} from "./config.js";
import {Sequelize, Transaction} from "sequelize";
import {Company, EncMk, FileEncKey, FileName, User} from "./model.js";

import {
  CompanyProps,
  EncryptedMasterKey,
  FileEncKeyBox,
  FileProps,
  UserProps
} from "vault-lib";


//import {CompanyProps, EncryptedMasterKey, UserProps} from "file-vault-js-protocol/lib";
export class VaultDB {
  private static instance?: VaultDB;
  public readonly sequelize: Sequelize;

  private readonly Company: any;
  private readonly User: any;
  private readonly FileName: any;
  private readonly FileEncKey: any;
  private readonly MasterKey: any;
  constructor() {
    this.sequelize = new Sequelize({
      dialect: 'sqlite',
      storage: config.DB_NAME,
    })
    this.Company = this.sequelize.define('company', Company);
    this.User = this.sequelize.define('user', User);
    this.FileName = this.sequelize.define('file_name', FileName);
    this.FileEncKey = this.sequelize.define('file_enc_key', FileEncKey);
    this.MasterKey = this.sequelize.define('enc_mk', EncMk);

    this.Company.hasMany(this.User, {as: "users"});

    this.Company.hasMany(this.FileName, {as: "files"});

    this.FileName.hasOne(this.FileEncKey, {
      onDelete: 'CASCADE'
    });

    this.Company.hasMany(this.MasterKey, {as: "master_keys"});

    this.sequelize.sync();
  }
  public static getInstance(): VaultDB {
    if (this.instance === undefined) {
      this.instance = new VaultDB();
    }
    return this.instance;
  }

  public async createCompanyWithUsers(company: CompanyProps, users: UserProps[]): Promise<any> {
    await this.sequelize.transaction(async (t: Transaction) => {
      const cp =  await this.Company.create({
        name: company.name,
        signing_pub_key: company.signing_pub_key,
        enc_signing_priv_key: company.enc_signing_priv_key,
        enc_signing_priv_key_iv: company.enc_signing_priv_key_iv,
      }, {transaction: t})
      for (const user of users) {
        await this.User.create({
          name: user.name,
          pbkdf_salt: user.pbkdf_salt,
          enc_share: user.enc_share,
          enc_share_iv: user.enc_share_iv,
          companyId: cp.id,
        }, {transaction: t});
      }
    })

  }

  public createMasterKey(companyId: number, mk: EncryptedMasterKey): Promise<any> {
    return this.MasterKey.create({
      enc_sym_key: mk.enc_sym_key,
      enc_sym_key_iv: mk.enc_sym_key_iv,
      companyId: companyId,
    });
  }

  public getMasterKeys(companyId: number): Promise<any> {
    return this.MasterKey.findAll({where: {companyId: companyId}});
  }

  public getCompany(name: string,  t?: Transaction): Promise<any> {
    const cp = this.Company.findOne({where: {name: name}}, {transaction: t});
    if (!cp)
      throw new Error('Unknown company')
    return cp;
  }

  public async getCompanyId(name: string): Promise<number> {
    const model = await this.Company.findOne({
      attributes: ['id'],
      where: {name: name}
    })

    if (!model)
      throw new Error(`Company ${name} does not exists.`)

    return model?.dataValues.id;
  }

  public getUser(companyId: number, unsername: string, t?: Transaction): Promise<any> {
    return this.User.findOne({ where: { name: unsername, companyId: companyId } }, {transaction: t});
  }

  public getFileKey(uuid: string) {
    const keyComponents = this.FileEncKey.findOne({where: {fileNameUuid: uuid}});
    if (!keyComponents)
      throw new Error("Key not found");
    return keyComponents;
  }

  public getFileProps(uuid:string) {
    const props = this.FileName.findOne({where: {uuid: uuid}});
    if (!props)
      throw new Error("File props not found");
    return props;
  }

  public async createFile(fileNameBox: FileProps, fileKeyBox: FileEncKeyBox, companyId: number): Promise<any>{
    await this.sequelize.transaction(async (t: Transaction) => {
      const fn = await this.FileName.create({
        companyId: companyId,
        uuid: fileNameBox.uuid,
        enc_name: fileNameBox.enc_name,
        enc_name_iv: fileNameBox.enc_name_iv
      }, {transaction: t});
      const fk = await this.FileEncKey.create({
        enc_file_enc_key: fileKeyBox.enc_file_enc_key,
        filekey_enc_iv: fileKeyBox.filekey_enc_iv,
        file_enc_iv: fileKeyBox.file_enc_iv,
      }, {transaction: t});
      fn.setFile_enc_key(fk)
    })
  }

}