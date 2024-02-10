import fs from "fs";
import openapiTS from "openapi-typescript";

/*
This code customizes the TypeScript schema generation using openapi-typescript 
Node API defined at https://openapi-ts.pages.dev/node/. The goal is to use the 
viem types Hex and Address instead of simple strings for some schema properties.
*/

const inputFile =
  "https://raw.githubusercontent.com/cartesi/openapi-interfaces/fce8cc7fcf2d2fcc1940e048cd16fb8550b09779/rollup.yaml";
const outputFile = "src/schema.d.ts";

// import types from viem in generated code
const inject = "import { Address, Hex } from 'viem';\n";

console.log(`${inputFile} -> ${outputFile}`);
openapiTS(inputFile, {
  inject,
  transform: (schemaObject, _options) => {
    if ("format" in schemaObject && schemaObject.format === "hex") {
      // use viem.Hex if format is hex
      return schemaObject.nullable ? "Hex | null" : "Hex";
    } else if ("format" in schemaObject && schemaObject.format === "address") {
      // use viem.Address if format is address
      return schemaObject.nullable ? "Address | null" : "Address";
    }
  },
}).then((output) => fs.writeFileSync(outputFile, output));
