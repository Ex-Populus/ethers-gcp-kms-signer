import configs from "dotenv";
import {
  MessageTypes,
  SignTypedDataVersion,
  TypedDataV1,
  TypedMessage,
  typedSignatureHash,
  TypedDataUtils,
} from "@metamask/eth-sig-util";

import { ethers } from "ethers";
import { bufferToHex } from "ethereumjs-util";
import { getPublicKey, getEthereumAddress, requestKmsSignature, determineCorrectV } from "./util/gcp-kms-utils";
import { validateVersion } from "./util/signature-utils";

configs.config();

export const TypedDataVersion = SignTypedDataVersion;

export interface GcpKmsSignerCredentials {
  projectId: string;
  locationId: string;
  keyRingId: string;
  keyId: string;
  keyVersion: string;
}

export class GcpKmsSigner extends ethers.AbstractSigner {
  kmsCredentials: GcpKmsSignerCredentials;

  ethereumAddress: string;

  constructor(kmsCredentials: GcpKmsSignerCredentials, provider?: ethers.Provider) {
    super(provider);
    Object.defineProperty(this, "kmsCredentials", {
      enumerable: true,
      value: kmsCredentials,
      writable: false,
    });
  }

  async getAddress(): Promise<string> {
    if (this.ethereumAddress === undefined) {
      const key = await getPublicKey(this.kmsCredentials);
      this.ethereumAddress = getEthereumAddress(key);
    }
    return Promise.resolve(this.ethereumAddress);
  }

  async _signDigest(digestString: string): Promise<string> {
    const digestBuffer = Buffer.from(ethers.getBytes(digestString));
    const sig = await requestKmsSignature(digestBuffer, this.kmsCredentials);
    const ethAddr = await this.getAddress();
    const { v } = determineCorrectV(digestBuffer, sig.r, sig.s, ethAddr);

    return ethers.Signature.from({
      r: `0x${sig.r.toString("hex")}`,
      s: `0x${sig.s.toString("hex")}`,
      v,
    }).serialized;
  }

  async signMessage(message: string | Uint8Array): Promise<string> {
    return this._signDigest(ethers.hashMessage(message));
  }

  /**
   * Original implementation takes into account the private key, but here we use the private
   * key from the GCP KMS, so we don't need to provide the PK as signature option.
   * Source code: https://github.com/MetaMask/eth-sig-util/blob/main/src/sign-typed-data.ts#L510
   * .
   * Sign typed data according to EIP-712. The signing differs based upon the `version`.
   *
   * V1 is based upon [an early version of EIP-712](https://github.com/ethereum/EIPs/pull/712/commits/21abe254fe0452d8583d5b132b1d7be87c0439ca)
   * that lacked some later security improvements, and should generally be neglected in favor of
   * later versions.
   *
   * V3 is based on [EIP-712](https://eips.ethereum.org/EIPS/eip-712), except that arrays and
   * recursive data structures are not supported.
   *
   * V4 is based on [EIP-712](https://eips.ethereum.org/EIPS/eip-712), and includes full support of
   * arrays and recursive data structures.
   *
   * @param options - The signing options.
   * @param options.data - The typed data to sign.
   * @param options.version - The signing version to use.
   * @returns The '0x'-prefixed hex encoded signature.
   */
  async signTypedData<V extends SignTypedDataVersion, T extends MessageTypes>({
    data,
    version,
  }: {
    data: V extends "V1" ? TypedDataV1 : TypedMessage<T>;
    version: V;
  }): Promise<string> {
    validateVersion(version);

    if (data === null || data === undefined) {
      throw new Error("Missing data parameter");
    }

    let messageSignature: Promise<string>;
    if (version === SignTypedDataVersion.V1) {
      messageSignature = this._signDigest(typedSignatureHash(data as TypedDataV1));
    } else {
      const eip712Hash: Buffer = TypedDataUtils.eip712Hash(
        data as TypedMessage<T>,
        version as SignTypedDataVersion.V3 | SignTypedDataVersion.V4
      );
      messageSignature = this._signDigest(bufferToHex(eip712Hash));
    }
    return messageSignature;
  }

  async signTransaction(transaction: ethers.TransactionRequest): Promise<string> {
    // Resolve all properties
    const tx = await ethers.resolveProperties(transaction);

    // Create an unsigned transaction - convert to simple object with string values
    const txParams: Record<string, any> = {};

    // Use Object.keys instead of for...in to avoid linter warning
    await Promise.all(
      Object.keys(tx).map(async (key) => {
        if (tx[key] != null) {
          if (typeof tx[key] === "object" && "getAddress" in tx[key]) {
            // Handle Addressable
            txParams[key] = await tx[key].getAddress();
          } else {
            txParams[key] = tx[key];
          }
        }
      })
    );

    const unsignedTx = ethers.Transaction.from(txParams);

    // Get the transaction digest to sign
    const digest = unsignedTx.unsignedHash;

    // Sign the digest
    const signature = await this._signDigest(digest);

    // Create signed transaction
    const sig = ethers.Signature.from(signature);

    // Return the serialized transaction with signature
    return ethers.Transaction.from({
      ...txParams,
      signature: sig,
    }).serialized;
  }

  connect(provider: ethers.Provider): GcpKmsSigner {
    return new GcpKmsSigner(this.kmsCredentials, provider);
  }
}
