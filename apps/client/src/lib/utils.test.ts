import crypto from "crypto";

import {bytesToHexString, bytesFromHexString, ab2b64str, b642ab} from "./utils";

describe('encode - decode', () => {

  test("Encode must pad 1 to 15 with 0", () => {
    const arr = new Uint8Array([1,2,3,4,5,6,7,8,9,10,11,12,13,14,15]);
    const str = bytesToHexString(new Uint8Array(arr));
    expect(str).toEqual("0102030405060708090a0b0c0d0e0f");
  })

  test("Encode must output predicted string", () => {
    const arr = new Uint8Array([255,201,171,98,222]);
    const str = bytesToHexString(new Uint8Array(arr));
    expect(str).toEqual("ffc9ab62de");
  })

  test("Encode arbitrary data must output valid string.", () => {
    const regex = /^([0-9a-f]{2})*$/g;
    const randArr = crypto.webcrypto.getRandomValues(new Uint32Array(32));
    const str = bytesToHexString(new Uint8Array(randArr));
    expect(regex.test(str)).toEqual(true);
  })

  test("Decode 010203... must output correct array", () => {
    const str = "0102030405060708090a0b0c0d0e0f";
    const arr = bytesFromHexString(str);
    expect(arr).toStrictEqual(new Uint8Array([1,2,3,4,5,6,7,8,9,10,11,12,13,14,15]));
  })

  test("Decode string must output correct array", () => {
    const str = "ffc9ab62de";
    const arr = bytesFromHexString(str);
    expect(arr).toStrictEqual(new Uint8Array([255,201,171,98,222]));
  })

  test("Encode - decode b64", () => {
    const randArr = crypto.webcrypto.getRandomValues(new Uint32Array(32));
    const b64 = ab2b64str(randArr.buffer);
    const arrB = b642ab(b64);
    expect(randArr.buffer).toStrictEqual(arrB);
  })

  test("Which is bigger ?", () => {
    const randArr = crypto.webcrypto.getRandomValues(new Uint8Array(30));
    const b64 = ab2b64str(randArr.buffer);
    const hex = bytesToHexString(randArr);
    expect(hex.length).toEqual(60);
    expect(b64.length).toEqual(40);
    expect(b64.length).toBeLessThan(hex.length);
  })

})
