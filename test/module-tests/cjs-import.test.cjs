// CommonJS import test
const assert = require("assert").strict;
const { GcpKmsSigner, TypedDataVersion } = require("../../dist/signer.cjs");

console.log("Testing CommonJS imports...");

// Test GcpKmsSigner class is exported correctly
console.log("Testing GcpKmsSigner class is exported correctly");
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

// Test TypedDataVersion is exported correctly
console.log("Testing TypedDataVersion is exported correctly");
assert.equal(typeof TypedDataVersion, "object");
assert.equal(typeof TypedDataVersion.V4, "string");

console.log("All CommonJS import tests passed!");
