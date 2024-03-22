import { ContractTransactionResponse, Signer, ethers } from "ethers";
import { CartesiClient } from "../main";
import { Utils } from "../utils";
import { WrappedPromise } from "./WrappedPromise";
import { InputAddedListener } from "./InputAddedListener";

export interface FetchOptions extends RequestInit {
    cartesiClient?: CartesiClient
    signer?: Signer
}

export type SetSigner = {
    setSigner(signer: Signer): void
}

export type FetchType = (
    input: string | URL | globalThis.Request,
    init?: FetchOptions,
) => Promise<Response>

export type FetchFun = FetchType & SetSigner;

async function _fetch(url: string | URL | globalThis.Request, options?: FetchOptions) {
    if (options?.method === 'GET' || options?.method === undefined) {
        return doRequestWithInspect(url, options)
    } else if (options?.method === 'POST' || options?.method === 'PUT' || options?.method === 'PATCH' || options?.method === 'DELETE') {
        return doRequestWithAdvance(url, options)
    }
    throw new Error(`Method ${options?.method} not implemented.`);
}

async function doRequestWithAdvance(url: string | URL | globalThis.Request, options?: FetchOptions) {
    if (!options?.cartesiClient) {
        throw new Error('You need to configure the Cartesi client')
    }
    const cartesiClient = options.cartesiClient
    const { logger } = cartesiClient.config;
    try {
        new InputAddedListener(cartesiClient).addListener()
        const inputContract = await cartesiClient.getInputContract();
        const requestId = `${Date.now()}:${Math.random()}`
        const wPromise = InputAddedListener.requests[requestId] = new WrappedPromise()
        // convert string to input bytes (if it's not already bytes-like)
        const inputBytes = ethers.toUtf8Bytes(
            JSON.stringify({
                requestId,
                cartesify: {
                    fetch: {
                        url,
                        options: { ...options, cartesiClient: undefined },
                    },
                },
            })
        );
        const dappAddress = await cartesiClient.getDappAddress();

        // send transaction
        const tx = await inputContract.addInput(dappAddress, inputBytes) as ContractTransactionResponse;
        await tx.wait(1);
        const resp = (await wPromise.promise) as any
        const res = new Response(resp.success)
        return res
    } catch (e) {
        logger.error(`Error ${options?.method ?? 'GET'} ${url}`, e)
        throw e
    }
}

async function doRequestWithInspect(url: string | URL | globalThis.Request, options?: FetchOptions) {
    if (!options?.cartesiClient) {
        throw new Error('You need to configure the Cartesi client')
    }
    const that = options.cartesiClient as any;
    const { logger } = that.config;

    try {
        const inputJSON = JSON.stringify({
            cartesify: {
                fetch: {
                    url,
                    options: { ...options, cartesiClient: undefined },
                },
            },
        });
        const jsonEncoded = encodeURIComponent(inputJSON);
        const urlInner = new URL(that.config.endpoint);
        urlInner.pathname += `/${jsonEncoded}`;
        const response = await fetch(urlInner.href, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
        });
        const result: unknown = await response.json();

        if (Utils.isObject(result) && "reports" in result && Utils.isArrayNonNullable(result.reports)) {
            const lastReport = result.reports[result.reports.length - 1]
            if (Utils.isObject(lastReport) && "payload" in lastReport && typeof lastReport.payload === "string") {
                const payload = Utils.hex2str(lastReport.payload.replace(/^0x/, ""));
                const successOrError = JSON.parse(payload)
                if (successOrError.success) {
                    return new Response(successOrError.success)
                } else if (successOrError.error) {
                    if (successOrError.error?.constructorName === "TypeError") {
                        throw new TypeError(successOrError.error.message)
                    } else {
                        throw successOrError.error
                    }
                }
            }
        }
        throw new Error(`Wrong inspect response format.`)
    } catch (e) {
        logger.error(e);
        throw e;
    }

}

export { _fetch as fetch }

class Response {

    ok: boolean = false
    status: number = 0
    type: string = ""
    headers = new Map<string, string>()
    private rawData: string
    constructor(params: any) {
        this.ok = params.ok
        this.status = params.status
        this.type = params.type
        this.rawData = params.text
        if (params.headers) {
            this.headers = new Map(params.headers)
        }
    }

    async json() {
        return JSON.parse(this.rawData)
    }

    async text() {
        return this.rawData
    }
}

