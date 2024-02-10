# Cartesify

## Introduction

Cartesify is a powerful web3 client that allows you to interact with the Cartesi Machine. It enables you to send transactions, query data, and interact with your backend seamlessly.

## Getting Started

### Installation

To use our web3 client, follow these simple installation steps:

```shell
npm install @calindra/cartesify
```

### Usage

1. Import and configure the Web3 library into your project:

   ```ts
   import { Cartesify } from "@calindra/cartesify";

   const CARTESI_INSPECT_ENDPOINT="http://localhost:8080/inspect";

   // replace with the content of your dapp address (it could be found on dapp.json)
   const DAPP_ADDRESS="0x70ac08179605AF2D9e75782b8DEcDD3c22aA4D0C";

   const fetch = Cartesify.createFetch({
      dappAddress: '0x70ac08179605AF2D9e75782b8DEcDD3c22aA4D0C',
      endpoints: {
         graphQL: new URL("http://localhost:8080/graphql"),
         inspect: new URL("http://localhost:8080/inspect"),
      },
   })
   ```
2. Connect to MetaMask and get the signer:
   ```ts
   import { ethers } from "ethers";

   async function getSigner() {
      try {
         await window.ethereum.request({ method: "eth_requestAccounts" })
         const provider = new ethers.providers.Web3Provider(
            window.ethereum
         );
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
      body: JSON.stringify({ any: 'body' }),
      signer, // <- the signer
   })
   console.log(response.ok) // will print true
   const json = await response.json();
   console.log(json) // will print the backend response as json
   ```
