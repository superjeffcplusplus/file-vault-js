export interface SymEncDataBuffer {
  data: ArrayBuffer;
  iv: ArrayBuffer;
}

export type ECDSASignature = ArrayBuffer;

export interface PasswordHashBuffer {
  passwordHash: ArrayBuffer;
  salt: ArrayBuffer;
}

export interface PasswordString {
  password: string;
  salt?: string;
}