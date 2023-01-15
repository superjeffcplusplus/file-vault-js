import {VaultDB} from "./../VaultDB.js";
import {Router} from "express";
//import {LoginInitRequest, LoginInitResponse} from "file-vault-js-protocol/lib";
import {b642ab, fromBinaryStr} from "./../utils/bytesConversion.js";

//const { subtle  } = require('crypto').webcrypto;
//const crypto = require('crypto');
import crypto from 'crypto';
const subtle = crypto.webcrypto.subtle

import {TokenService} from "./../services/tokenService.js";
import {LoginInitRequest} from "vault-lib";


const LoginController = Router();
const db = VaultDB.getInstance();
const loginRequests = new Map();
const tokenService = TokenService.getInstance();




export const SIGN_ALG = {
  name: "ECDSA",
  namedCurve: "P-384",
  hash: "SHA-256",
}

LoginController.post("/", async (req, res) => {
  const data: LoginInitRequest = req.body
  try {
    const resData = await getCpAndUsers(data.company_name, data.users);
    resData.login_req_id = crypto.randomUUID();
    loginRequests.set(resData.login_req_id, {companyName: resData.company.name, pubKey: resData.company.signing_pub_key});
    return res
      .status(200)
      .json(resData)
  } catch (e: any) {
    return res
      .status(404)
      .json({message: e.message})
  }
})

LoginController.post("/:uuid", async (req, res) => {
  const authReqData = loginRequests.get(req.params.uuid);
  if (!authReqData)
    return res
      .status(403)
      .json({message: "Unauthorized access."});

  const rawKey: ArrayBuffer = b642ab(authReqData.pubKey);
  const rawSig: ArrayBuffer = b642ab(req.body.sig)
  try {
    const cryptoKey = await subtle.importKey('spki', rawKey, SIGN_ALG, true, ['verify']);
    const isValid = await subtle.verify(SIGN_ALG, cryptoKey, rawSig, fromBinaryStr(req.params.uuid));
    if (isValid) {
      const token = await tokenService.newToken(authReqData.companyName);
      return res.status(200)
        .json({token: token})
    } else {
      return res.status(403)
        .json({message: "Unauthorized access."})
    }
  } catch (e: any) {
    return res.status(500)
        .json({message: e.message});
  } finally {
    loginRequests.delete(req.params.uuid);
  }
});


const getCpAndUsers = async (company: string, users: string[]): Promise<any> => {
  const cp = (await db.getCompany(company)).dataValues;
  if (!cp)
    throw new Error(`Company '${company}' does not exists.`)
  const usrs = [];
  for (const u of users) {
    const tmp = (await db.getUser(cp.id, u)).dataValues;
    if (!tmp)
      throw new Error(`User ${u} does not exists`);
    usrs.push({
      enc_share: tmp.enc_share,
      enc_share_iv: tmp.enc_share_iv,
      name: tmp.name,
      pbkdf_salt: tmp.pbkdf_salt
    })
  }
  return {company: {
      enc_signing_priv_key: cp.enc_signing_priv_key,
      enc_signing_priv_key_iv: cp.enc_signing_priv_key_iv,
      name: cp.name,
      signing_pub_key: cp.signing_pub_key,
    }, users: usrs}
}

export default LoginController;