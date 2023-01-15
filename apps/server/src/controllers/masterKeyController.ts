import {VaultDB} from "./../VaultDB.js";
import {Router} from "express";
import {AuthorizationHandler} from "./../middlewares/authorization.js";

const db = VaultDB.getInstance();
const MasterKeyController = Router();

MasterKeyController.use(AuthorizationHandler);

MasterKeyController.get("/", async (req,res) => {
  const cpName = req.query.company;
  const cpId = await db.getCompanyId(cpName as string);
  const mks: Array<any> = await db.getMasterKeys(cpId);
  // transformation into EncryptedMasterKey
  const resData = mks.reduce((acc, curr) => {
    const obj = {
      enc_sym_key: curr.enc_sym_key,
      enc_sym_key_iv: curr.enc_sym_key_iv,
      id: curr.id
    }
    acc.push(obj);
    return acc;
  }, []);
  return res.status(200).json(resData);
})

MasterKeyController.post("/", async (req, res) => {
  console.log("incoming post key request... ")
  const data = req.body;
  const cpName = req.query.company;
  // TODO : check the format of received data

  try {
    const cpId = await db.getCompanyId(cpName as string)
    await db.createMasterKey(cpId, data);
    return res
      .status(201)
      .json({message: "success"});
  } catch (e: any) {
    console.log(e);
    return res
      .status(500)
      .json({message: e.message});
  }

})

export default MasterKeyController;