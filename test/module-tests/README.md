# Module Import Tests

These tests verify that the package can be properly built and imported using both ESM and CommonJS formats.

## Tests Overview

1. `build-output.test.js` - Verifies that the build process correctly generates all expected output files:

   - ESM module file (`dist/signer.js`)
   - CommonJS module file (`dist/signer.cjs`)
   - TypeScript declaration file (`dist/signer.d.ts`)

2. `esm-import.test.js` - Tests importing the package using ES Modules syntax

   - Verifies the exported types are correct
   - Verifies a basic instance can be created

3. `cjs-import.test.cjs` - Tests importing the package using CommonJS `require` syntax
   - Verifies the exported types are correct
   - Verifies a basic instance can be created

## Running the Tests

You can run all the module tests with:

```bash
npm run test:modules
```

This will:

1. Build the package from source
2. Verify the build output files
3. Test ESM imports
4. Test CommonJS imports

## Notes

- These tests use the `.js` and `.cjs` extensions to explicitly test the right module system.
- The ESM tests require the `--experimental-vm-modules` flag for Jest to support ES modules.
- The tests here are just validating that the package can be imported in both module systems, not the functionality of the package itself. The main test suite covers functional testing.
