import {DataTypes} from "sequelize";

export const Company =  {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING(32),
    allowNull: false,
    unique: true,
    validate: {
      // We require company names to have length of at least 5, and
      // only use letters, numbers and underscores.
      is: /^\w{5,}$/
    }
  },
  signing_pub_key: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  enc_signing_priv_key: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  enc_signing_priv_key_iv: {
    type: DataTypes.TEXT,
    allowNull: false
  },

}

export const User = {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING(32),
    allowNull: false,
    validate: {
      // We require usernames to have length of at least 3, and
      // only use letters, numbers and underscores.
      is: /^\w{3,}$/
    },
  },
  pbkdf_salt: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  enc_share: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  enc_share_iv: {
    type: DataTypes.TEXT,
    allowNull: false,
  }
}

export const FileName = {
  uuid: {
    primaryKey: true,
    type: DataTypes.UUIDV4,
    allowNull: false,
  },
  enc_name: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  enc_name_iv: {
    type: DataTypes.TEXT,
    allowNull: false
  },
}

export const FileEncKey = {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
  enc_file_enc_key: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  filekey_enc_iv: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  file_enc_iv: {
    type: DataTypes.TEXT,
    allowNull: false
  }
}

export const EncMk = {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
  enc_sym_key: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  enc_sym_key_iv: {
    type: DataTypes.TEXT,
    allowNull: false
  },
}