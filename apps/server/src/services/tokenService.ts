import * as jose from "jose";

export class TokenService {

  private static instance?: TokenService;
  public static getInstance(): TokenService {
    if(!TokenService.instance) {
      TokenService.instance = new TokenService();
    }
    return TokenService.instance;
  }


  private alg: string = 'HS256'
  // TODO : use non predictable secret
  private secret = new TextEncoder().encode(
    'cc7e0d44fd473002f1c42167459001140ec6389b7353f8088f4d9a95f2f596f2',
  )

  public newToken(companyName: string): Promise<string> {
    const alg = this.alg
    return new jose.SignJWT({'company_name': `${companyName}`})
      .setProtectedHeader({ alg })
      .setIssuedAt()
      .setAudience(`${companyName}`)
      .setExpirationTime('1h')
      .sign(this.secret);
  }

  public verifyToken(token: string, companyName: any): Promise<jose.JWTVerifyResult> {
    return jose.jwtVerify(token, this.secret, {
      audience: companyName
    });
  }

}