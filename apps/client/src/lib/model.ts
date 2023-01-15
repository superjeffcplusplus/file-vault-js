export interface UserAndPass {
    name: string
    pass: string
}

export interface PasswordHashBuffer {
    passwordHash: ArrayBuffer;
    salt: ArrayBuffer;
}

export interface PasswordString {
    password: string;
    salt?: string;
}

export interface SymEncDataBuffer {
    data: ArrayBuffer;
    iv: ArrayBuffer;
}

export type ECDSASignature = ArrayBuffer;