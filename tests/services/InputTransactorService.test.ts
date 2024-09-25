import { describe, expect, it } from "@jest/globals";
import InputTransactorService from "../../src/services/InputTransactorService";
import { Address } from "viem";
import { ethers } from "ethers";
import { TypedData, WalletConfig } from "../../src/models/input-transactor";

describe.skip("InputTransactorService", () => {
    it("should return an object types", () => {
        const primaryType = "AvailMessage"
        const types: any = InputTransactorService.buildTypes(primaryType)

        const expectMessage = [
            { name: "app", type: "address" },
            { name: "nonce", type: "uint32" },
            { name: "max_gas_price", type: "uint128" },
            { name: "data", type: "string" }
        ]

        expect(typeof types).toBe("object");
        expect(types).toHaveProperty("AvailMessage");

        expect(types["AvailMessage"]).toEqual(expectMessage);
    })

    it("should return nonce", async () => {
        const nonce: any = await InputTransactorService.getNonce("0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f", '0x7a69')
        expect(nonce).toEqual(1);
    })

    it("should assign", async () => {
        const provider = ethers.getDefaultProvider("http://localhost:8545");
        const privateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
        let signer = new ethers.Wallet(privateKey, provider);
        const walletConfig: WalletConfig = {
            walletClient: signer,
            connectedChainId: "0x7a69"
        }

        const account = await signer.getAddress()
        const typedData: TypedData = {
            account,
            domain: {
                name: "AvailM",
                version: "1",
                chainId: 31337,
                verifyingContract:
                    "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC" as Address,
            },
            types: {
                AvailMessage: [
                    { name: "app", type: "address" },
                    { name: "nonce", type: "uint32" },
                    { name: "max_gas_price", type: "uint128" },
                    { name: "data", type: "string" },
                ],
            },
            primaryType: "AvailMessage",
            message: {
                app: "0xab7528bb862fb57e8a2bcd567a2e929a0be56a5e",
                data: "0xHello",
                max_gas_price: "10",
                nonce: 1,
                primaryType: "AvailMessage",
            }
        }
        const response = await InputTransactorService.assingInputMessage(walletConfig, typedData)
        expect(typeof response).toBe("object");
        expect(response).toHaveProperty("signature");
        expect(response).toHaveProperty("typedData");
    })

})