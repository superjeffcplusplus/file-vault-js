import {CompanyProps, FileProps, UserProps} from "../model/model";

export interface RegisterRequest {
  users: Array<UserProps>,
  company: CompanyProps,

}

/**
 * Client -> Server
 */
export interface LoginInitRequest {
  users: Array<string>;
  company_name: string;
}

/**
 * Server -> Client
 */
export interface LoginInitResponse {
  users: Array<UserProps>,
  company: CompanyProps,
  login_req_id: string, // challenge to sign

}


/**
 * Server -> Client
 */
export interface AuthSuccessResponse {
  jwt: string,
  master_key: string,
  file_list: Array<FileProps>
}

