import {uuidV4Regex} from "./regex.js";
export function validateFileProps(data: any): boolean {
  if (!data.uuid || !data.enc_name || !data.enc_name_iv)
    return false;
  if (!uuidV4Regex.test(data.uuid))
    return false;
  return data.enc_name_iv.length === 16;
}

export function validateFileEncKyBox(data: any): boolean {
  if (!data.enc_file_enc_key || !data.filekey_enc_iv || !data.file_enc_iv) {
    return false;
  }
  return !(data.filekey_enc_iv.length !== 16 || data.file_enc_iv.length !== 16);
}
function typeCheckLoop(obj: any, objProps: Array<string>): boolean {
  const keysToCheck: Array<string> = Object.keys(obj);
  if (keysToCheck.length !== objProps.length) {
    return false
  }
  for (const k of objProps) {
    if (obj[k] === undefined) {
      return false;
    }
  }
  return true;
}
