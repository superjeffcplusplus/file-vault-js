
export function bytesToHexString(bytes: Uint8Array): string {
  return Array.prototype.map.call(bytes, function(byte) {
    return ('0' + (byte & 0xFF).toString(16)).slice(-2);
  }).join('');
}

export function bytesFromHexString(hexString: string): Uint8Array {
  let result: Array<number> = [];
  for (let i = 0; i < hexString.length; i += 2) {
    result.push(parseInt(hexString.substring(i, i + 2), 16));
  }
  return Uint8Array.from(result);
}

/*
* Convert an ArrayBuffer into a b64 string
*/
export function ab2b64str(buf: ArrayBuffer) {
  const binaryStr = toBinaryStr(new Uint8Array(buf))
  return universalBtoa(binaryStr);
}

/*
* Convert a b64 string into an ArrayBuffer
*/
export function b642ab(b64Str: string): ArrayBuffer {
  const dec = universalAtob(b64Str);
  return fromBinaryStr(dec);
}

/**
 * Convert an ArrayBuffer to a string in which
 * each 16-bit unit occupies only one byte
 * @param buf
 */
function toBinaryStr(buf: ArrayBuffer) {
  const charCodes = new Uint8Array(buf);

  let result = "";
  charCodes.forEach((char) => {
    result += String.fromCharCode(char);
  });
  return result;
}

/**
 * Convert an utf-16 string into an ArrayBuffer containing
 * the corresponding char codes.
 * @param binStr
 */
export function fromBinaryStr(binStr: string): ArrayBuffer {
  const bytes = Uint8Array.from({ length: binStr.length },
    (element, index) =>
      binStr.charCodeAt(index)
  )
  return bytes.buffer;
}

/**
 * Makes btoa working on nodejs and in browsers
 * @param str
 */
const universalBtoa = (str: string) => {
  return Buffer.from(str, 'binary').toString('base64');
};

/**
 * Makes atob working on nodejs and in browsers
 * @param b64Encoded
 */
const universalAtob = (b64Encoded: string) => {
  return Buffer.from(b64Encoded, 'base64').toString('binary');
};