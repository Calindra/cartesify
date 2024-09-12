import mock from "http-request-mock";
import { expect, it, describe, beforeEach, afterEach, jest } from "@jest/globals";
import { CartesiClient, CartesiClientBuilder } from "../../src";
import { Network, type Provider, ethers, ContractTransactionResponse } from "ethers";
import { Cartesify } from "../../src/cartesify/Cartesify"


jest.setTimeout(30000); // Aumenta o timeout para 30 segundos

describe("Cartesify", () => {
    const mocker = mock.setupForUnitTest("fetch");

    let cartesiClient: CartesiClient;
    const endpoint = new URL("http://127.0.0.1:8545/inspect");

    beforeEach(async () => {
        const provider = ethers.getDefaultProvider(endpoint.href);
        cartesiClient = new CartesiClientBuilder().withEndpoint(endpoint).withProvider(provider).build();
    });

    afterEach(() => {
        mocker.reset();
    });

    it("should create Axios instance", async () => {
        const provider = ethers.getDefaultProvider("http://localhost:8545");
        const privateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
        let signer = new ethers.Wallet(privateKey, provider);

        const axiosInstance = await Cartesify.createAxios({
            dappAddress: '0xab7528bb862fb57e8a2bcd567a2e929a0be56a5e',
            endpoints: {
                graphQL: new URL("http://localhost:8545/graphql"),
                inspect: new URL("http://localhost:8545/inspect"),
            },
            provider,
            signer,
        })

        expect(axiosInstance).toBeDefined();
    })

})