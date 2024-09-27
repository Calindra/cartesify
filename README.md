# Cartesify

## Introduction

Cartesify is a powerful web3 client that allows you to interact with the Cartesi Machine. It enables you to send transactions, query data, and seamlessly interact with your backend using a REST-like approach.

## Getting Started

The easiest way to get started with Cartesify is by simply cloning the template from: [cartesify-template](https://github.com/Calindra/cartesify-template).

### Installation

To use our web3 client, follow these simple installation steps:

```shell
npm install @calindra/cartesify
```

Pay attention: @calindra/cartesify is intended to be used with [@calindra/cartesify-backend](https://github.com/Calindra/cartesify-backend)

### Usage

1. Import and configure the Web3 library into your project:

   ```ts
   import { Cartesify } from "@calindra/cartesify";

   const CARTESI_INSPECT_ENDPOINT = "http://localhost:8080/inspect";

   // replace with the content of your dapp address (it could be found on dapp.json)
   const DAPP_ADDRESS = "0x70ac08179605AF2D9e75782b8DEcDD3c22aA4D0C";

   const fetch = Cartesify.createFetch({
     dappAddress: "0x70ac08179605AF2D9e75782b8DEcDD3c22aA4D0C",
     endpoints: {
       graphQL: new URL("http://localhost:8080/graphql"),
       inspect: new URL("http://localhost:8080/inspect"),
     },
   });
   ```

2. Connect to MetaMask and get the signer:

   ```ts
   import { ethers } from "ethers";

   async function getSigner() {
     try {
       await window.ethereum.request({ method: "eth_requestAccounts" });
       const provider = new ethers.providers.Web3Provider(window.ethereum);
       return provider.getSigner();
     } catch (error) {
       console.log(error);
       alert("Connecting to metamask failed.");
     }
   }
   ```

3. Start interacting with the Cartesi Machine:

   ```ts
   const response = await fetch("http://127.0.0.1:8383/echo", {
     method: "POST",
     headers: {
       "Content-Type": "application/json",
     },
     body: JSON.stringify({ any: "body" }),
     signer, // <- the signer
   });
   console.log(response.ok); // will print true
   const json = await response.json();
   console.log(json); // will print the backend response as json
   ```

## Using the `sendMessage` Method in Cartesify

This guide provides a step-by-step approach to using the `sendMessage` method in the Cartesify library.

### Step 1: Create the Input Transactor

You need to create an input transactor using the createInputTransactor method. Provide the necessary parameters:

```ts
const transactor = await Cartesify.createInputTransactor({
  endpoints: {
    graphQL: new URL("https://example.com/graphql"), // Replace with your GraphQL endpoint
    inspect: new URL("https://example.com/inspect"), // Replace with your inspection endpoint
  },
  provider: myProvider, // Your configured Ethereum provider
  signer: mySigner, // Your configured Ethereum signer
  dappAddress: "0xDappAddress", // Replace with your dApp address
  inputTransactorType: "Avail", // Specify your input transactor type
  domain: {
    name: "ExampleDomain",
    version: "1",
    chainId: 1,
    verifyingContract: "0xExampleContract", // Replace with your contract address
  }, // This field is optional. If not provided, a default configuration will be used.
});
```

### Step 2: Prepare the Message

Create the message object that will be sent to the dApp. Ensure it adheres to the required structure:

```ts
const payload = { key: "value" }; // Your message data

const message = {
  app: <dAppAddress>, // App identifier
  data: typeof payload === 'string' ? payload : JSON.stringify(payload), // Message data
  max_gas_price: "10", // Maximum gas price for the transaction
};

```

### Step 3: Send the Message

```ts
try {
  const result = await transactor.sendMessage(message);
  console.log("Message sent successfully:", result);
} catch (error) {
  console.error("Failed to send message:", error);
}
```
