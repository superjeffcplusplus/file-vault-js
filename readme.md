# File Vault js

`File Vault js` is client-server application for securely storing files in the cloud.
The specificity of this digital vault is that minimum two users are required to unlock the vault.
This is done by using Shamir Secret Sharing to split the master key between the users. All the cryptographic operations on files are executed on the client side. The server only stores them. It never has access to the plaintext or the encryption keys.  
This application was initially coded as part of the Applied Cryptography course of the HEIG-VD.  

You will find more details in [doc package](https://github.com/superjeffcplusplus/file-vault-js/tree/main/packages/doc).

## Project architecture and development
This project use [pnpm](https://pnpm.io/installation) to manage packages and run dev scripts.

### Scripts

Requires Node 18 (LTS) and https to enable Web Crypto API in the browser.
The second requirement is automatically implemented in dev mode. 
You have just to accept the self-signed certificate in your development browser.

Install all dependencies of all packages:
```
pnpm install
```

To run both server and client, run this comment from project root dir:
```
pnpm --parallel start
```
Use the `--filter` arg to run actions on specific package, for example `start` script:
```
pnpm --filter client start
```
It works with dependence installation too (`-D` for dev dep):
```
pnpm --filter client add [-D] <new package>
```