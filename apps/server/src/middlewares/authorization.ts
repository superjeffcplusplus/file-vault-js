import {NextFunction, Request, Response} from "express";
import {TokenService} from "./../services/tokenService.js";

const tokenService = TokenService.getInstance();

export const AuthorizationHandler = async (req:Request, res:Response, next: NextFunction) => {

  // TODO verify token with regex
  const authHeader = req.headers.authorization;
  const company = req.query.company;

  if (!authHeader || !company || authHeader === "undefined") {
    res.status(403)
      .json({message: "Unauthorized access."});
    return;
  }

  try {
    await tokenService.verifyToken(authHeader!, company);
    next();
  } catch (e: any) {
    console.log(e.message)
    res.status(403)
      .json({message: "Unauthorized access."})
    return;
  }

}