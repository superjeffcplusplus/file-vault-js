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

export interface UserProps {
  name: string, // to authenticate with share
  pbkdf_salt: string, // to authenticate with share
  enc_share: string,
  enc_share_iv: string,
}
export interface CompanyProps {
  name: string, // to authenticate with enc_signing_priv_key
  signing_pub_key: string,
  enc_signing_priv_key: string,
  enc_signing_priv_key_iv: string,
}
export interface FileProps {
  uuid: string, // to authenticate with enc_name
  enc_name: string,
  enc_name_iv: string,

  enc_enc_file_key: string,
  enc_enc_file_key_iv: string,
}

export interface EncryptedMasterKey {
  enc_sym_key: string,
  enc_sym_key_iv: string,
}
export interface SymEncBox {
  enc_data: string,
  iv: string,
}

export interface JWT {
  header: {
    alg: string,
    typ: string,
  }
  data: {
    company_name: string,
  }
}