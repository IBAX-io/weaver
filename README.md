# Weaver

- Provide the user interface for ibax.
- Provide the IDE for App development.
- Save the private key of the user account and grant the permissions.
- Request the App's page data from the database and present it to the user.
- Send the transaction to the backend via REST API.
- Automatically create an transaction for user operations that requires one. For example, when an App developer implementing a contract from the IDE, weaver will convert it into a transaction.

## Quick start

> Requires Node.js 24 LTS (or 22.22.2+, or 26+; odd releases such as 23 and 25 are not supported by the test tools) and Yarn 1. With nvm, `nvm install && nvm use` installs and picks the version in `.nvmrc`; with Node's corepack, `corepack enable` provides the Yarn that `packageManager` names. Install with Yarn only: the security pins in `resolutions` are Yarn's syntax, so pnpm and npm would install without them (pnpm refuses the project; `packageManager` names Yarn).

**Note: `yarn start` serves the web app at http://127.0.0.1:3000. `yarn start-desktop` opens the desktop app on that server (run `yarn start` first). On the first start `public/settings.json` is created from `public/settings.json.dist` (mainnet, testnet and a local node at http://127.0.0.1:7079); edit it to change the networks. It is not replaced afterwards: one created by an earlier version lacks the `explorer` of mainnet and testnet (see below), so add it from `settings.json.dist`, or delete the file to have it created again.**

**Crypto: each node reports its key and hash algorithms (`/api/v2/getuid`), and everything Weaver signs for a network uses that network's algorithms, kept in the session.**

- The one built-in default, `DEFAULT_CRYPTO_SUITE` (ECDSA secp256k1 with Keccak-256, what the public IBAX networks use), never decides how anything is signed. It only names a stored wallet and picks the accounts the sign-in page lists before any network was reached.
- A node that reports no algorithms predates configurable crypto and is taken to use ECDSA P-256 with SHA-256.
- A chain changes its algorithms only by being redeployed. A signed-in user is then signed out and told why: their account has another address under the new algorithms. The same happens, with its own notice, when the node no longer accepts the session (expired, or the node restarted).

### Configuration example

- honorNodes Configure master node address

```json
{
  "defaultLocale": "en-US",
  "defaultNetwork": "DEFAULT_NETWORK",
  "networks": [
    {
      "key": "DEFAULT_NETWORK",
      "name": "Default Network",
      "networkID": 100,
      "honorNodes": ["http://127.0.0.1:7079"],
      "socketUrl": "",
      "activationEmail": "",
      "enableDemoMode": true,
      "disableSync": false,
      "explorer": "https://scan.example/api/v2"
    }
  ]
}
```

- **defaultLocale** - Default langauge
- **defaultNetwork** - Default network key to be connected automatically
- **networks.key** - Designate the unique network key
- **networks.name** - A readable network name to be displayed in the page
- **networks.networkID** - The unique identifier defined for all transactions, please refer to the configuration of the go-ibax instance
- **networks.honorNodes** - List of prebuilt urls to be synchronized
- **networks.socketUrl** - Optional. The address (`ws://` or `wss://`, without `/connection/websocket`) the client reaches the network's Centrifugo 6 at, for the signed-in account's notifications. Default: the address the node gives (`GET config/centrifugo`)
- **networks.activationEmail** - An optional parameter, to be displayed for the user for KYC when there is no activated node to be logged in.
- **networks.enableDemoMode** - Guest authorization with private key will be enabled when set to true
- **networks.disableSync** - An optional parameter to disable the synchronization of a full node. Please be cautious in using it for security reason
- **networks.explorer** - An optional https address of the network's block explorer API (IBAX Scan), used to list the account's UTXO transfers in the wallet (only once the user agrees to send the account's address to it; changing it asks the user again). An address that is not https is left out with a warning in the console.

### Get code

`$ git clone https://github.com/IBAX-io/weaver.git`

### Installation dependency

`$ yarn install`

### Start in browser

`$ yarn start`

---

## Desktop client

> You only need the following 2 steps to build a desktop app (please make sure all dependencies are installed and run properly in the browser).

`$ yarn build-desktop`

`$ yarn release --publish never -mwl`

> -mwl Parameter representation mac os, windows, linux，This parameter specifies the compilation of different operating systems
