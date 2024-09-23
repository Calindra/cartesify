import { describe, expect, it } from "@jest/globals";
import InputTransactorService from "../../src/services/InputTransactorService";

describe("InputTransactorService", () => {
    it("should return an object types", () => {
        const primaryType = "AnvilMessage"
        const types: any = InputTransactorService.buildTypes(primaryType)

        const expectedDomain = [
            { name: "name", type: "string" },
            { name: "version", type: "string" },
            { name: "chainId", type: "uint32" },
            { name: "verifyingContract", type: "address" },
        ];
        const expectMessage = [
            { name: "nonce", type: "uint32" },
            { name: "payload", type: "string" },
        ]

        expect(typeof types).toBe("object");
        expect(types).toHaveProperty("EIP712Domain");
        expect(types).toHaveProperty("AnvilMessage");

        expect(types["EIP712Domain"]).toEqual(expectedDomain);
        expect(types["AnvilMessage"]).toEqual(expectMessage);
    })
    
})