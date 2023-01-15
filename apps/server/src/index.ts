import cors from 'cors'
import express from 'express'
import {config} from "./config.js";
import {UnknownResourceHandler} from "./middlewares/errorsHandler.js";
import RegisterController from "./controllers/registerController.js";
import MasterKeyController from "./controllers/masterKeyController.js";
import LoginController from "./controllers/loginController.js";
import FileHandlingController from "./controllers/fileHandlingController.js";

import * as fs from 'fs';

if (!fs.existsSync('./files')) {
  fs.mkdir('./files', () => {
    console.log('Folder created');
  });
}

const app = express();

app.use(express.json({limit: '10mb'}),);

app.use(cors());

app.use("/register", RegisterController);

app.use("/masterkey", MasterKeyController);

app.use("/login", LoginController);

app.use("/file", FileHandlingController);

app.all("*", UnknownResourceHandler);

app.listen(config.API_PORT, () => console.log(`Listening on port ${config.API_PORT}`));