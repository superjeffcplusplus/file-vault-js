import { NotFoundException } from './../utils/exceptions.js'
import {Request, Response} from "express";


export const UnknownResourceHandler = (req:Request, res:Response) => {
  return res
    .status(404)
    .json(new NotFoundException("The requested resource does not exists."));
}