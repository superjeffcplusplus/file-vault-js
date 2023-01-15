import {VaultService} from "../services/VaultService";
import {CompanyProps, LoginInitRequest, LoginInitResponse, UserProps} from "vault-lib";
import {QueryService} from "../services/QueryService";

export class LoginController {
  private static instance?: LoginController;
  public static getInstance(): LoginController {
    if (!this.instance) {
      this.instance = new LoginController(VaultService.getInstance(), QueryService.getInstane())
    }
    return this.instance;
  }

  constructor(private vaultService: VaultService, private qsrv: QueryService) {}

  public company?: string;
  public usersAndPass: Map<string, string> = new Map();
  public loginRequestId?: string;

  public async handleResponse(res: LoginInitResponse): Promise<string> {
    const {login_req_id, users, company} = res;
    
    await this.importCompany(company, users);
    
    return this.vaultService.signChallenge(login_req_id);
  }

  private async importCompany(companyProps: CompanyProps, users: UserProps[]): Promise<void> {
    for (const u of users) {
      const pass = this.usersAndPass.get(u.name);
      if (!pass)
        throw Error("Incoherent response from the server or no user set.");
      await this.vaultService.importUser(u, pass);
      console.log("user imported")
    }
    console.log("Before imp cpny")
    await this.vaultService.importCompany(companyProps);
    console.log("After imp cpny")
  }

  public getInitRequestData(): LoginInitRequest {
    const users = [];
    for (const k of this.usersAndPass.keys()) {
      users.push(k);
    }
    return {
      company_name: this.company!,
      users,
    }
  }

  public async fulfillAuth(token: string) {
    this.vaultService.jwt = token;
    await this.getMasterKeyRequest();
  }

  private async createMkRequest() {
    await this.vaultService.createMasterKey();
    return  this.qsrv.createMk(this.vaultService.exportMasterKey());
  }

  private async getMasterKeyRequest() {
    try {
      const res = await this.qsrv.getMk();
      const json = await res.json();
      if (res.ok) {
        if (json.length === 0) {
          const res2 = await this.createMkRequest()
          if (res2.ok) {
            alert("Master key successfully created.")
          }
        } else {
          await this.vaultService.importMasterKey(json[0].enc_sym_key, json[0].enc_sym_key_iv);
        }
      } else {
        console.log(json.message);
        alert("Error while fetching master key");
      }
    } catch (e:any) {
      console.log(e.message);
    }
  }

}


