import express, {Router} from "express";
import {VaultDB} from "./../VaultDB.js";

import {Blob} from 'buffer';
import * as fs from "fs";
import { validateFileProps, validateFileEncKyBox, uuidV4RegexStr } from "vault-lib";
import {FileEncKeyBox} from "vault-lib";
import { AuthorizationHandler } from "./../middlewares/authorization.js";

const FileHandlingController = Router();
const db = VaultDB.getInstance();
const pendingRequests: Map<string, any> = new Map();

// TODO: use multer to handle downloads

/**
 * All the request here must be authenticated.
 */
FileHandlingController.use(AuthorizationHandler);

/**
 * New file metadata request
 */
FileHandlingController.post("/", async (req, res) => {
  const data = req.body;
  if (
    !data.file_name_box
    || !data.file_key_box
    || !validateFileEncKyBox(data.file_key_box)
    || !validateFileProps(data.file_name_box)) {
    res.status(400).json({message: "Malformed data"});
    return;
  }
  pendingRequests.set(data.file_name_box.uuid, data);
  res.status(201).json({message: "New file request registered. status pending"});
})

/**
 * New file data request
 */
// TODO : add regex in param
// TODO : revert if file creation failed.
FileHandlingController.post(`/:uuid(${uuidV4RegexStr})`, express.raw({type: "*/*", limit: '64mb'}), async (req, res) => {
  const cpName = req.query.company;
  const cpId = await db.getCompanyId(cpName as string);
  let uuid: string;
  if (!pendingRequests.has(req.params.uuid)) {
    res.status(401).json({message: "Unauthorized request."})
    return;
  }
  try {
    const data = pendingRequests.get(req.params.uuid);
    uuid = data.file_name_box.uuid;
    await db.createFile(data.file_name_box, data.file_key_box, cpId);
  } catch (e: any) {
    res.status(500).json({message: e.message});
    return;
  } finally {
    pendingRequests.delete(req.params.uuid);
  }
  let blob: Blob;
  try {
    const buffer = req.body
    await createDirIfNotExists(cpName as string);
    await createFile(`./files/${cpName}/${uuid}.dat`, buffer);
  } catch (e:any) {
    console.log(e);
    res.status(500).json({message: e.message});
    return;
  }
  res.status(201).json({message: "Resource created."});
})

/**
 * Get files metadata for authenticated company, without encryption key
 */
FileHandlingController.get("/", async (req, res) => {
  const cpName = req.query.company;
  try {
    const cp = await db.getCompany(<string>cpName);
    const files = await cp.getFiles();
    const out = files.map((f: any) => {
      return {
        uuid: f.uuid,
        enc_name: f.enc_name,
        enc_name_iv: f.enc_name_iv
      }
    })
    console.log(files);
    res.status(200).json(out);
  } catch (e:any) {
    res.status(500).json({message: "Unexpected error."});
  }
})

/**
 * Get key for file with given uuid
 *
 */
// TODO : add regex in param
FileHandlingController.get(`/:uuid(${uuidV4RegexStr})/key`, async (req, res) => {
  const uuid = req.params.uuid;
  try {
    const key = await db.getFileKey(uuid);
    const resData: FileEncKeyBox = {
      enc_file_enc_key: key.enc_file_enc_key,
      filekey_enc_iv: key.filekey_enc_iv,
      file_enc_iv: key.file_enc_iv
    }
    res.status(200).json(resData);
  } catch (e: any) {
    console.log(e.message);
    res.status(500).json({message: "Unexpected error."});
  }
})

/**
 * Get file in binary format
 */
// TODO : add regex in param
FileHandlingController.get(`/:uuid(${uuidV4RegexStr})`, async (req, res) => {
  const uuid = req.params.uuid;
  const cpN = req.query.company;
  const fileMdata = await db.getCompany(<string>cpN);
  const path = `./files/${cpN}/${uuid}.dat`;
  try {
    const fileBuff = await readFile(path);
    res.status(200).set("Content-Type", "text/plain").send(fileBuff);
  } catch (e:any) {
    res.status(500).json({message: "Server error."});
  }
})

FileHandlingController.delete(`/:uuid(${uuidV4RegexStr})`, async (req, res) => {
  const uuid = req.params.uuid;
  const cpName = req.query.company;
  let fileMdata: any;
  try {
    fileMdata = await db.getFileProps(uuid);
  } catch (e: any) {
    res.status(400).json({message: "File don't exist."});
    return;
  }
  const path = `./files/${cpName}/${uuid}.dat`;
  if (fs.existsSync(path)) {
  } else {
    res.status(400).json({message: 'Deletion failed'});
    return;
  }
  try {
    await deleteFile(path)
    await fileMdata.destroy();
    res.status(204).json({message: "Deletion successful."})
  } catch (e: any) {
    res.status(400).json({message: 'Deletion failed'});
  }
})

async function deleteFile(path: string): Promise<boolean> {
  return new Promise((res,rej) => {
    fs.rm(path, (err) => {
      if (err)
        rej();
      else
        res(true);
    })
  })
}
async function readFile(path: string)  {
  return new Promise<Buffer>((res, rej) => {
    fs.readFile(path, (err, data) => {
      if (err)
        rej();
      res(data);
    })
  })
}
async function createDirIfNotExists(companyName: string) {
  return new Promise<void>((resolve, reject) => {
    if (!fs.existsSync(`./files/${companyName}`)) {
      fs.mkdir(`./files/${companyName}`, (err) => {
        if (err)
          reject();
        else
          resolve();
      })
    } else {
      resolve();
    }
  })
}

async function createFile(path: string, content: Buffer) {
  return new Promise<void>((res, rej) => {
    fs.writeFile(path, content, (err) => {
      if (err)
        rej();
      else
        res();
    })
  })
}
export default FileHandlingController;