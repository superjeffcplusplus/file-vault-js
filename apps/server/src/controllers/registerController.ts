import {Router} from "express";

import {VaultDB} from "./../VaultDB.js";

const db = VaultDB.getInstance()
const RegisterController = Router()


RegisterController.post("/", async (req, res) => {
  console.log("incoming register request... ")
  const data = req.body;

  try {
    await db.createCompanyWithUsers(data.company, data.users);
    return res
      .status(201)
      .json({result: "success"});
  } catch (e: any) {
    console.log(e);
    return res
      .status(500)
      .json({result: e.message});
  }

});

export default RegisterController;