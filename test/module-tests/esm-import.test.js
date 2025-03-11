// ESM import test
import { strict as assert } from "assert";
import { GcpKmsSigner, TypedDataVersion } from "../../dist/signer.js";

describe("ESM import test", () => {
  test("GcpKmsSigner class is exported correctly", () => {
    // Verify GcpKmsSigner is exported and is a constructor function
    assert.equal(typeof GcpKmsSigner, "function");

    // Create an instance with minimal credentials to check constructor works
    const dummyCredentials = {
      projectId: "test-project",
      locationId: "test-location",
      keyRingId: "test-keyring",
      keyId: "test-key",
      keyVersion: "test-version",
    };

    const signer = new GcpKmsSigner(dummyCredentials);
    assert.equal(signer instanceof GcpKmsSigner, true);
  });

  test("TypedDataVersion is exported correctly", () => {
    // Verify TypedDataVersion is exported
    assert.equal(typeof TypedDataVersion, "object");
    assert.equal(typeof TypedDataVersion.V4, "string");
  });
});
