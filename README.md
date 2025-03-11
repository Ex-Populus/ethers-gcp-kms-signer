# ethers-gcp-kms-signer

This is a wallet or signer that can be used together with [Ethers.js](https://github.com/ethers-io/ethers.js/) applications.

## Requirements

- **ethers.js v6 or greater**: This library requires ethers.js v6.0.0 or higher as a peer dependency.

## Getting Started

```sh
npm i ethers-gcp-kms-signer ethers@^6.0.0
```

1. Create your asymmetric key as follows: https://cloud.google.com/kms/docs/creating-asymmetric-keys with `EC_SIGN_SECP256K1_SHA256` algorithm.

2. Add the new service account to GCP with the correct KMS roles: Crypto KMS `Signer`, `Verifier`, `Viewer`

3. Provide the GCP service account credentials using an environment variable called `GOOGLE_APPLICATION_CREDENTIALS` [here](https://cloud.google.com/kms/docs/accessing-the-api#non_google_production_environment)

4. Use the `GcpKmsSigner` constructor as shown below, and that will resolve the correct key to sign the transaction.

```js
import { GcpKmsSigner } from "ethers-gcp-kms-signer";
import { ethers } from "ethers";

const kmsCredentials = {
  projectId: "gcp-project-id", // your project id in gcp
  locationId: "global", // the location where your key ring was created
  keyRingId: "kr-1", // the id of the key ring
  keyId: "key-name", // the name/id of your key in the key ring
  keyVersion: "1", // the version of the key
};

// Using ethers v6 provider
const provider = new ethers.JsonRpcProvider("YOUR_RPC_URL");
let signer = new GcpKmsSigner(kmsCredentials);
signer = signer.connect(provider);

const tx = await signer.sendTransaction({
  to: "0xE94E130546485b928C9C9b9A5e69EB787172952e",
  value: ethers.parseEther("0.01"),
});
console.log(tx);
```

## Module Format Support

This package supports both ES Modules (ESM) and CommonJS (CJS) formats. You can use it in either type of project:

### ESM (Modern JavaScript)

```js
import { GcpKmsSigner } from "ethers-gcp-kms-signer";
```

### CommonJS

```js
const { GcpKmsSigner } = require("ethers-gcp-kms-signer");
```

### About the ESM/CommonJS Compatibility

We've made significant improvements to ensure this package works seamlessly in both ESM and CommonJS environments. The key changes include:

- **Dynamic Module Resolution**: We implemented helper functions to detect whether the code is running in an ESM or CommonJS context and handle imports accordingly.
- **Compatibility with Legacy Dependencies**: Some of our dependencies (like `elliptic` and `asn1.js`) were originally written for CommonJS. We've added code to properly resolve these modules in both environments.

- **Comprehensive Testing**: We've added tests that verify the package can be properly imported in both ESM and CommonJS projects.

These changes ensure the package can be used with both modern ESM-based projects and legacy CommonJS projects without any additional configuration.

# Developers

## Install

`git clone` this repo

```sh
$ git clone https://github.com/openlawteam/ethers-gcp-kms-signer my-module
$ cd my-module
$ rm -rf .git
$ npm install # or yarn
```

Just make sure to edit `package.json`, `README.md` and `LICENSE` files accordingly with your module's info.

## Commands

```sh
$ npm test # run tests with Jest
$ npm run coverage # run tests with coverage
$ npm run lint # lint code
$ npm run build # generate docs and transpile code
```

## Commit message format

This boiler plate uses the **semantic-release** package to manage versioning. Once it has been set up, version numbers and Github release changelogs will be automatically managed. **semantic-release** uses the commit messages to determine the type of changes in the codebase. Following formalized conventions for commit messages, **semantic-release** automatically determines the next [semantic version](https://semver.org) number, generates a changelog and publishes the release.

Use `npm run commit` instead of `git commit` in order to invoke Commitizen commit helper that helps with writing properly formatted commit messages.

## License

MIT

# Credits

All the credits to

- [RJ Chow](https://github.com/rjchow) for integrating AWS KMS signer with Ethers.js and share that with everyone at https://github.com/rjchow/ethers-aws-kms-signer

- Lucas Henning for doing the legwork on parsing the AWS KMS signature and public key asn formats: https://luhenning.medium.com/the-dark-side-of-the-elliptic-curve-signing-ethereum-transactions-with-aws-kms-in-javascript-83610d9a6f81
