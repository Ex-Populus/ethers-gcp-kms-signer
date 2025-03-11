// Test to verify build output files
import { strict as assert } from "assert";
import fs from "fs";
import path from "path";

describe("Build output verification", () => {
  const distDir = path.resolve(process.cwd(), "dist");

  test("dist directory exists", () => {
    const exists = fs.existsSync(distDir);
    assert.equal(exists, true, "The dist directory should exist");
  });

  test("ESM output files exist", () => {
    const esmFile = path.join(distDir, "signer.js");
    const esmExists = fs.existsSync(esmFile);
    assert.equal(esmExists, true, "The ESM output file should exist");

    // Check if file content contains ESM format indicators
    const content = fs.readFileSync(esmFile, "utf8");
    assert.equal(content.includes("export "), true, "ESM file should contain export statements");
  });

  test("CommonJS output files exist", () => {
    const cjsFile = path.join(distDir, "signer.cjs");
    const cjsExists = fs.existsSync(cjsFile);
    assert.equal(cjsExists, true, "The CommonJS output file should exist");

    // Check if file content contains CommonJS format indicators
    const content = fs.readFileSync(cjsFile, "utf8");
    assert.equal(
      content.includes("module.exports") ||
        content.includes("exports.") ||
        content.includes("Object.defineProperty(exports"),
      true,
      "CJS file should contain CommonJS export patterns"
    );
  });

  test("TypeScript declaration files exist", () => {
    const dtsFile = path.join(distDir, "signer.d.ts");
    const dtsExists = fs.existsSync(dtsFile);
    assert.equal(dtsExists, true, "The TypeScript declaration file should exist");
  });
});
