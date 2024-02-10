import { expect, it, describe } from "@jest/globals";
import { AxiosLikeClient } from "../../src/cartesify/AxiosLikeClient";
import { CartesiClientBuilder } from "../../src/main";
import { ethers } from "ethers";

describe.skip("AxiosLikeClient", () => {
    const endpoint = new URL("http://localhost:8545/");

    it("should do a post", async () => {
        const provider = ethers.getDefaultProvider(endpoint.href);

        const cartesiClient = new CartesiClientBuilder()
            .withDappAddress('0x70ac08179605AF2D9e75782b8DEcDD3c22aA4D0C')
            .withEndpoint(endpoint)
            .withProvider(provider)
            .build();
        const privateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
        let walletWithProvider = new ethers.Wallet(privateKey, provider);

        cartesiClient.setSigner(walletWithProvider)

        const axios = AxiosLikeClient.create({ cartesiClient, baseURL: 'http://127.0.0.1:8383' })
        const res = await axios.post('/hit', { amount: 123 }) as any
        console.log(res)
        expect(res.data).toBeDefined()
    }, 30000)

})
