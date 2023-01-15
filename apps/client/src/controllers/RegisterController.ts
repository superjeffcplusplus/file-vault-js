import {UserAndPass} from "../lib/model";
import {VaultService} from "../services/VaultService"
import {RegisterRequest} from "vault-lib";
export class RegisterController {
  constructor(private userSrv: VaultService) {

  }

  private static instance?: RegisterController;
  public static getInstance(): RegisterController {
    if (!this.instance) {
      this.instance = new RegisterController(new VaultService())
    }
    return this.instance;
  }


  public createCompany(companyName: string, users: UserAndPass[]): Promise<void> {
    return this.userSrv.createCompany(companyName, users);
  }

  public async createRegisterRequest(): Promise<RegisterRequest> {
    const company = await this.userSrv.exportCompany();
    const users = await this.userSrv.exportUsers();

    return {
      company,
      users,
    }
  }


}