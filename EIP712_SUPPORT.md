# EIP-712 Support in Cartesify

This document describes the implementation of EIP-712 support in the Cartesify library. EIP-712 is a standard for typed structured data hashing and signing in Ethereum, which provides a more secure and user-friendly way for users to sign data.

## Overview

The Cartesify library now supports EIP-712 standard for signing requests. This implementation enables developers to:

1. Use the standard EIP-712 message format
2. Define custom types for structured data
3. Create and sign messages using the EIP-712 standard

## Usage

### Basic Usage

```typescript
import { Cartesify, EIP712Config } from "@calindra/cartesify";
import { ethers } from "ethers";

// 1. Connect to the provider and get signer
const provider = new ethers.providers.Web3Provider(window.ethereum);
const signer = provider.getSigner();

// 2. Create an EIP-712 domain
const domain = {
  name: "MyDApp",
  version: "1",
  chainId: 1, // Mainnet
  verifyingContract: "0x1234567890123456789012345678901234567890"
};

// 3. Define the types for your message
const eip712Config: EIP712Config = {
  domain,
  types: {
    Person: [
      { name: "name", type: "string" },
      { name: "wallet", type: "address" }
    ],
    Mail: [
      { name: "from", type: "Person" },
      { name: "to", type: "Person" },
      { name: "contents", type: "string" }
    ]
  },
  primaryType: "Mail"
};

// 4. Create the input transactor
const transactor = await Cartesify.createInputTransactor({
  endpoints: {
    graphQL: new URL("http://localhost:8080/graphql"),
    inspect: new URL("http://localhost:8080/inspect"),
  },
  provider,
  signer,
  dappAddress: "0x70ac08179605AF2D9e75782b8DEcDD3c22aA4D0C",
  inputTransactorType: "EIP712", // Specify EIP712 input transactor type
});

// 5. Create the message
const message = {
  data: JSON.stringify({
    from: {
      name: "Alice",
      wallet: "0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826"
    },
    to: {
      name: "Bob",
      wallet: "0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB"
    },
    contents: "Hello, Bob!"
  })
};

// 6. Send the message with EIP-712 signing
const result = await transactor.sendMessage(message, eip712Config);
```

### Using the Standard EIP-712 Message Type

If you just need a simpler message structure, you can use the standard EIP-712 message type without providing a custom type configuration:

```typescript
const transactor = await Cartesify.createInputTransactor({
  endpoints: {
    graphQL: new URL("http://localhost:8080/graphql"),
    inspect: new URL("http://localhost:8080/inspect"),
  },
  provider,
  signer,
  dappAddress: "0x70ac08179605AF2D9e75782b8DEcDD3c22aA4D0C",
  inputTransactorType: "EIP712",
});

// The standard message will be typed with { nonce: uint32, data: string }
const result = await transactor.sendMessage({
  data: JSON.stringify({ key: "value" })
});
```

## Implementation Details

The EIP-712 support has been added to the following components:

1. **InputTransactorService**: Modified to accept EIP-712 configuration and handle EIP-712 typed data signing
2. **Types**: Added new types for EIP-712 configuration, messages, and domains
3. **Utils**: Added standard EIP-712 message type definitions
4. **Cartesify**: Enhanced to support the EIP-712 flow in the createInputTransactor method

## Verification in the Backend

The backend needs to verify the EIP-712 signature by:

1. Reconstructing the same EIP-712 typed data structure
2. Using the signature to recover the signer's address
3. Validating that the signature is valid for the given message

For more details on how to verify EIP-712 signatures, see the [EIP-712 specification](https://eips.ethereum.org/EIPS/eip-712).