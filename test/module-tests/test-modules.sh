#!/bin/bash
set -e

echo "===== Building package ====="
npm run build

echo "===== Verifying build output ====="
NODE_OPTIONS=--experimental-vm-modules npx jest test/module-tests/build-output.test.js

echo "===== Testing ESM import ====="
NODE_OPTIONS=--experimental-vm-modules npx jest test/module-tests/esm-import.test.js

echo "===== Testing CommonJS import ====="
# Use node directly to run the CommonJS test instead of Jest
node test/module-tests/cjs-import.test.cjs

echo "===== All module import tests passed! =====" 