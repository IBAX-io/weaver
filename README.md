[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)
[![Build Status](https://travis-ci.org/IBAX/ibax-front.svg?branch=master)](https://travis-ci.org/IBAX/ibax-front)
[![](https://tokei.rs/b1/github/IBAX/ibax-front)](https://github.com/IBAX/ibax-front)
![](https://reposs.herokuapp.com/?path=IBAX/ibax-front&style=flat)
[![Gitter](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/IBAX?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)

# Weaver

- Provide the user interface for ibax.
- Provide the IDE for App development.
- Save the private key of the user account and grant the permissions.
- Request the App's page data from the database and present it to the user.
- Send the transaction to the backend via REST API.
- Automatically create an transaction for user operations that requires one. For example, when an App developer implementing a contract from the IDE, weaver will convert it into a transaction.

## Quick start

> As the project is based on react, you must install Nodejs V6+ and manage the third party dependencies with 'yarn'

**Note: The yarn start command will bind the request server address to http://127.0.0.1:7079/api/v2 by default. You may use the yarn start-desktop command to debug the project in a desktop environment. You need to create the settings.json file at the public directory if you want to customize more API request server addresses, and an example configuration is available in the settings.json.dist at the public directory.**

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
      "disableSync": false
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
- **networks.socketUrl** - An optional parameter for the connection end-points of the writing centrifuge. Default value: to be provided by the go-ibax configuration
- **networks.activationEmail** - An optional parameter, to be displayed for the user for KYC when there is no activated node to be logged in.
- **networks.enableDemoMode** - Guest authorization with private key will be enabled when set to true
- **networks.disableSync** - An optional parameter to disable the synchronization of a full node. Please be cautious in using it for security reason

### Get code

`$ git clone https://github.com/IBAX/ibax-front.git`

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
