import { expect, it, describe, beforeAll } from "@jest/globals";
import { Cartesify } from "../../src";
import { ethers } from "ethers";
import axios, { AxiosError, AxiosResponse } from "axios"

describe("AxiosLikeClientV2", () => {
    const TEST_TIMEOUT = 300000
    let axiosLikeClient: any

    beforeAll(() => {
        const provider = ethers.getDefaultProvider("http://localhost:8545");
        const privateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
        let signer = new ethers.Wallet(privateKey, provider);
        axiosLikeClient = Cartesify.createAxios({
            dappAddress: '0xab7528bb862fb57e8a2bcd567a2e929a0be56a5e',
            endpoints: {
                graphQL: new URL("http://localhost:8080/graphql"),
                inspect: new URL("http://localhost:8080/inspect"),
            },
            provider,
            signer
        })
    })

    it.only("should work with GET", async () => {
        const response = await axiosLikeClient.get("http://127.0.0.1:8383/health")
        expect(response.statusText.toLowerCase()).toBe('ok')
        const json = await response.data;
        expect(json.some).toEqual('response')
    }, TEST_TIMEOUT)

    it("should work with POST", async () => {
        const response = await axiosLikeClient.post("http://127.0.0.1:8383/echo", { any: 'body' }, {
            headers: {
                "Content-Type": "application/json",
            },
        })
        expect(response.statusText.toLowerCase()).toBe('ok')
        const json = await response.data;
        expect(json).toEqual({ myPost: { any: "body" } })
    }, TEST_TIMEOUT)

    it("should work with PUT", async () => {
        const response = await axiosLikeClient.put("http://127.0.0.1:8383/update", { any: 'body' }, {
            headers: {
                "Content-Type": "application/json",
            },
        })
        expect(response.statusText.toLowerCase()).toBe('ok')
        const json = await response.data;
        expect(json).toEqual({ updateBody: { any: "body" } })
    }, TEST_TIMEOUT)

    it("should work with PATCH", async () => {
        const response = await axiosLikeClient.patch("http://127.0.0.1:8383/patch", { any: 'body' }, {
            headers: {
                "Content-Type": "application/json",
            }
        })
        expect(response.statusText.toLowerCase()).toBe('ok')
        const json = await response.data;
        expect(json).toEqual({ patchBody: { any: "body" } })
        expect(response.config.headers['Content-Type']).toEqual('application/json')
    }, TEST_TIMEOUT)

    it("should work with DELETE", async () => {
        const response = await axiosLikeClient.delete("http://127.0.0.1:8383/delete?foo=bar")
        expect(response.statusText.toLowerCase()).toBe('ok')
        const json = await response.data;
        expect(json).toEqual({ query: { foo: "bar" } })
    }, TEST_TIMEOUT)

    it("should handle 404 doing POST", async () => {
        const error: AxiosError = await axiosLikeClient.post("http://127.0.0.1:8383/echoNotFound", { any: 'body' }, {
            headers: {
                "Content-Type": "application/json",
            }
        }).catch((e: AxiosError) => e)

        expect(error.response?.statusText.toLowerCase()).toBe('not found')
        expect(error.response?.status).toBe(404)
    }, TEST_TIMEOUT)

    it("should handle 'TypeError: fetch failed' doing POST. Connection refused", async () => {
        const error = await axiosLikeClient.post("http://127.0.0.1:12345/wrongPort", { any: 'body' }, {
            headers: {
                "Content-Type": "application/json",
            }
        }).catch((e: Error) => e)

        expect(error.constructor.name).toBe("AxiosError")
        expect(error.message).toBe("axios failed")
        expect(error.response?.statusText.toLowerCase()).toBe('internal server error')
        expect(error.response?.status).toBe(500)
    }, TEST_TIMEOUT)

    it("should handle 'TypeError: axios failed' doing GET. Connection refused", async () => {
        const error: AxiosError = await axiosLikeClient.get("http://127.0.0.1:12345/wrongPort").catch((e: AxiosError) => e)
        expect(error).toThrowError
        expect(error.name).toBe("AxiosError")
        expect(error.message).toBe("axios failed")
        expect(error.response?.statusText.toLowerCase()).toBe('internal server error')
        expect(error.response?.status).toBe(500)
    }, TEST_TIMEOUT)

    it("should send the msg_sender as x-msg_sender within the headers. Also send other metadata with 'x-' prefix", async () => {
        const response = await axiosLikeClient.post("http://127.0.0.1:8383/echo/headers", { any: 'body' }, {
            headers: {
                "Content-Type": "application/json",
            }
        })

        expect(response.statusText.toLowerCase()).toBe('ok')
        const json = await response.request;
        expect(json.headers['x-msg_sender']).toEqual('0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266')
        expect(json.headers['x-block_number']).toMatch(/^[0-9]+$/)
        expect(json.headers['x-epoch_index']).toMatch(/^[0-9]+$/)
        expect(json.headers['x-input_index']).toMatch(/^[0-9]+$/)
        expect(json.headers['x-timestamp']).toMatch(/^[0-9]+$/)
    }, TEST_TIMEOUT)

    it("should send the headers doing GET", async () => {
        const response = await axiosLikeClient.get("http://127.0.0.1:8383/echo/headers", {
            headers: { "x-my-header": "some-value" }
        })
        expect(response.statusText.toLowerCase()).toBe('ok')
        expect(response.config.headers['x-my-header']).toEqual('some-value')
    }, TEST_TIMEOUT)

    it.only("should accept params", async () => {
        const response = await axiosLikeClient.get("http://127.0.0.1:8383/params", { params: { categories: 'all', count: 2 } })
        console.log("RESPONSE: ", response)
        expect(response.statusText.toLowerCase()).toBe('ok')
        expect(response.data.categories).toEqual("all")
        expect(response.data.count).toEqual("2")
        expect(response.request.url).toEqual("http://127.0.0.1:8383/params?categories=all&count=2")
    }, TEST_TIMEOUT)

})
