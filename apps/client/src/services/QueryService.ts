import {
  EncryptedMasterKey,
  LoginInitRequest,
  RegisterRequest,
} from "vault-lib";
import {VaultService} from "./VaultService";
import {FileEncKeyBox, FileProps} from "../includes/FileCompanion";
export class QueryService {
  private SRV_HOST = 'http://localhost:8080';

  constructor(private vaultsrv: VaultService ) {}

  private jwt(): string {
    const token = this.vaultsrv.jwt;
    if (token)
      return token
    else
      return ""
  }

  private companyName(): string {
    return this.vaultsrv.getCompanyName();
  };

  public register(data: RegisterRequest): Promise<any> {
    return fetch(`${this.SRV_HOST}/register`, this.getFetchOptions('POST', data));
  }

  public loginInit(data: LoginInitRequest): Promise<any> {
    return fetch(`${this.SRV_HOST}/login`, this.getFetchOptions('POST', data));
  }

  public async loginChallengeResponse(signedChallenge: any, loginReqId: string): Promise<any> {
    return fetch(`${this.SRV_HOST}/login/${loginReqId}`, this.getFetchOptions('POST', signedChallenge));
  }

  public async getMk(): Promise<any> {
    return fetch(`${this.SRV_HOST}/masterkey?company=${this.companyName()}`, this.getFetchOptions('GET'));
  }

  public async createMk(data: EncryptedMasterKey): Promise<any> {
    return fetch(`${this.SRV_HOST}/masterkey?company=${this.companyName()}`, this.getFetchOptions('POST', data));
  }

  public getFileKey(uuid: string): Promise<any> {
    // TODO: check if jwt is set
    return fetch(`${this.SRV_HOST}/file/${uuid}/key?company=${this.companyName()}`, this.getFetchOptions('GET'));
  }
  public getFile(uuid: string): Promise<any> {
    // TODO: check if jwt is set
    return fetch(`${this.SRV_HOST}/file/${uuid}?company=${this.companyName()}`, this.getFetchOptions('GET'));
  }

  public getFileList(): Promise<any> {
    return fetch(`${this.SRV_HOST}/file?company=${this.companyName()}`, this.getFetchOptions('GET'));
  }

  public createFileRequest(fileNameBox: FileProps, fileEncBox: FileEncKeyBox) {
    return fetch(`${this.SRV_HOST}/file?company=${this.companyName()}`, this.getFetchOptions('POST', {
      file_name_box: fileNameBox,
      file_key_box: fileEncBox
    }))
  }

  public async sendFile(uuid: string, file: Blob): Promise<any> {
    const data = await file.arrayBuffer();
    return fetch(`${this.SRV_HOST}/file/${uuid}?company=${this.companyName()}`, {
      method: 'POST', headers: {
        'Authorization': this.jwt(),
        'Content-Type': 'text/plain'
      }, body: data
    })
  }

  public deleteFile(uuid: string) {
    return fetch(`${this.SRV_HOST}/file/${uuid}?company=${this.companyName()}`, this.getFetchOptions('DELETE'));
  }

  private getFetchOptions(method: string, data?: any) {

    const headers = {
      'Content-Type': 'application/json',
        'Authorization': this.jwt(),
    }

    if (method === 'POST') {
      return {
        method: method,
        headers: headers,
        body: JSON.stringify(data),
      }
    } else if (method === 'GET') {
      return {
        method: method,
        headers: headers
      }
    } else if (method === 'DELETE') {
      return {
        method: method,
        headers: headers
      }
    } else {
      throw new Error("Unsupported http method.");
    }
  }

  public static instance?: QueryService;
  public static getInstane() {
    if (!QueryService.instance)
      QueryService.instance = new QueryService(VaultService.getInstance());
    return QueryService.instance;
  }

}