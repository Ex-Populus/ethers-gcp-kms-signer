/* eslint-disable */

// Import elliptic in a way that works for both ESM and CommonJS
import ellipticLib from "elliptic";

// Handle both ESM and CommonJS imports
const getElliptic = () => {
  // For CommonJS: elliptic is directly the module with .ec property
  if (typeof ellipticLib === "object" && (ellipticLib as any).ec) {
    return ellipticLib;
  }
  // For ESM: elliptic might be in the default export
  if (typeof ellipticLib === "object" && (ellipticLib as any).default && (ellipticLib as any).default.ec) {
    return (ellipticLib as any).default;
  }
  throw new Error("Could not resolve elliptic library");
};

// Get the elliptic library
const elliptic = getElliptic();
// Get the EC constructor
const EC = (elliptic as any).ec;

// Import asn1.js in a way that works for both ESM and CommonJS
import asn1Lib from "asn1.js";

// Handle both ESM and CommonJS imports for asn1
const getAsn1 = () => {
  // For CommonJS
  if (typeof asn1Lib === "object" && typeof asn1Lib.define === "function") {
    return asn1Lib;
  }
  // For ESM
  if (
    typeof asn1Lib === "object" &&
    (asn1Lib as any).default &&
    typeof (asn1Lib as any).default.define === "function"
  ) {
    return (asn1Lib as any).default;
  }
  throw new Error("Could not resolve asn1.js library");
};

const asn1 = getAsn1();

// Import BN instead of using require
import BN from "bn.js";

/**
 * Use types for the `bn.js` lib, e.g. `@types/bn.js`
 */
type BNjs = any;

const ECPrivateKeyASN = asn1.define("ECPrivateKey", function () {
  // @ts-ignore
  const self = this as any;
  self
    .seq()
    .obj(
      self.key("version").int(),
      self.key("privateKey").octstr(),
      self.key("parameters").explicit(0).objid().optional(),
      self.key("publicKey").explicit(1).bitstr().optional()
    );
});

const ECPrivateKey8ASN = asn1.define("ECPrivateKey", function () {
  // @ts-ignore
  const self = this as any;
  self
    .seq()
    .obj(
      self.key("version").int(),
      self.key("privateKeyAlgorithm").seq().obj(self.key("ecPublicKey").objid(), self.key("curve").objid()),
      self.key("privateKey").octstr().contains(ECPrivateKeyASN),
      self.key("attributes").explicit(0).bitstr().optional()
    );
});

const SubjectPublicKeyInfoASN = asn1.define("SubjectPublicKeyInfo", function () {
  // @ts-ignore
  const self = this as any;
  self
    .seq()
    .obj(self.key("algorithm").seq().obj(self.key("id").objid(), self.key("curve").objid()), self.key("pub").bitstr());
});

interface CurveOptions {
  curveParameters: number[];
  privatePEMOptions: { label: string };
  publicPEMOptions: { label: string };
  curve: any;
}

const curves: { [index: string]: CurveOptions } = {
  secp256k1: {
    curveParameters: [1, 3, 132, 0, 10],
    privatePEMOptions: { label: "EC PRIVATE KEY" },
    publicPEMOptions: { label: "PUBLIC KEY" },
    curve: new EC("secp256k1"),
  },
};

interface PrivateKeyPKCS1 {
  version: BNjs;
  privateKey: Buffer;
  parameters: number[];
  publicKey?: {
    unused: number;
    data: Buffer;
  };
}

interface PrivateKeyPKCS8 {
  version: BNjs;
  privateKey: PrivateKeyPKCS1;
  privateKeyAlgorithm: { ecPublicKey: number[]; curve: number[] };
}

type KeyFormat = "raw" | "pem" | "der";

export class KeyEncoder {
  static ECPrivateKeyASN = ECPrivateKeyASN;

  static ECPrivateKey8ASN = ECPrivateKey8ASN;

  static SubjectPublicKeyInfoASN = SubjectPublicKeyInfoASN;

  algorithmID: number[];

  options: CurveOptions;

  constructor(options: string | CurveOptions) {
    if (typeof options === "string") {
      if (options !== "secp256k1") {
        throw new Error(`Unknown curve ${options}`);
      }
      options = curves[options];
    }
    this.options = options;
    this.algorithmID = [1, 2, 840, 10045, 2, 1];
  }

  private PKCS1toPKCS8(privateKey: PrivateKeyPKCS1): PrivateKeyPKCS8 {
    return {
      version: new BN(0),
      privateKey,
      privateKeyAlgorithm: {
        ecPublicKey: this.algorithmID,
        curve: privateKey.parameters,
      },
    };
  }

  privateKeyObject(rawPrivateKey: string, rawPublicKey: string) {
    const privateKeyObject: PrivateKeyPKCS1 = {
      version: new BN(1),
      privateKey: Buffer.from(rawPrivateKey, "hex"),
      parameters: this.options.curveParameters,
    };

    if (rawPublicKey) {
      privateKeyObject.publicKey = {
        unused: 0,
        data: Buffer.from(rawPublicKey, "hex"),
      };
    }

    return privateKeyObject;
  }

  publicKeyObject(rawPublicKey: string) {
    return {
      algorithm: {
        id: this.algorithmID,
        curve: this.options.curveParameters,
      },
      pub: {
        unused: 0,
        data: Buffer.from(rawPublicKey, "hex"),
      },
    };
  }

  encodePrivate(
    privateKey: string | Buffer,
    originalFormat: KeyFormat,
    destinationFormat: KeyFormat,
    destinationFormatType: "pkcs8" | "pkcs1" = "pkcs1"
  ): string {
    let privateKeyObject: PrivateKeyPKCS1;

    /* Parse the incoming private key and convert it to a private key object */
    if (originalFormat === "raw") {
      if (typeof privateKey !== "string") {
        throw "private key must be a string";
      }
      const keyPair = this.options.curve.keyFromPrivate(privateKey, "hex");
      const rawPublicKey = keyPair.getPublic("hex");
      privateKeyObject = this.privateKeyObject(privateKey, rawPublicKey);
    } else if (originalFormat === "der") {
      if (typeof privateKey !== "string") {
        // do nothing
      } else if (typeof privateKey === "string") {
        privateKey = Buffer.from(privateKey, "hex");
      } else {
        throw "private key must be a buffer or a string";
      }
      privateKeyObject = ECPrivateKeyASN.decode(privateKey, "der");
    } else if (originalFormat === "pem") {
      if (typeof privateKey !== "string") {
        throw "private key must be a string";
      }
      privateKeyObject = ECPrivateKeyASN.decode(privateKey, "pem", this.options.privatePEMOptions);
    } else {
      throw "invalid private key format";
    }

    /* Export the private key object to the desired format */
    if (destinationFormat === "raw") {
      return privateKeyObject.privateKey.toString("hex");
    }
    if (destinationFormat === "der") {
      return ECPrivateKeyASN.encode(privateKeyObject, "der").toString("hex");
    }
    if (destinationFormat === "pem") {
      return destinationFormatType === "pkcs1"
        ? ECPrivateKeyASN.encode(privateKeyObject, "pem", this.options.privatePEMOptions)
        : ECPrivateKey8ASN.encode(this.PKCS1toPKCS8(privateKeyObject), "pem", {
            ...this.options.privatePEMOptions,
            label: "PRIVATE KEY",
          });
    }
    throw "invalid destination format for private key";
  }

  encodePublic(publicKey: string | Buffer, originalFormat: KeyFormat, destinationFormat: KeyFormat): string {
    let publicKeyObject;

    /* Parse the incoming public key and convert it to a public key object */
    if (originalFormat === "raw") {
      if (typeof publicKey !== "string") {
        throw "public key must be a string";
      }
      publicKeyObject = this.publicKeyObject(publicKey);
    } else if (originalFormat === "der") {
      if (typeof publicKey !== "string") {
        // do nothing
      } else if (typeof publicKey === "string") {
        publicKey = Buffer.from(publicKey, "hex");
      } else {
        throw "public key must be a buffer or a string";
      }
      publicKeyObject = SubjectPublicKeyInfoASN.decode(publicKey, "der");
    } else if (originalFormat === "pem") {
      if (typeof publicKey !== "string") {
        throw "public key must be a string";
      }
      publicKeyObject = SubjectPublicKeyInfoASN.decode(publicKey, "pem", this.options.publicPEMOptions);
    } else {
      throw "invalid public key format";
    }

    /* Export the private key object to the desired format */
    if (destinationFormat === "raw") {
      return publicKeyObject.pub.data.toString("hex");
    }
    if (destinationFormat === "der") {
      return SubjectPublicKeyInfoASN.encode(publicKeyObject, "der").toString("hex");
    }
    if (destinationFormat === "pem") {
      return SubjectPublicKeyInfoASN.encode(publicKeyObject, "pem", this.options.publicPEMOptions);
    }
    throw "invalid destination format for public key";
  }
}
