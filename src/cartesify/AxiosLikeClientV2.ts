import { Utils } from "../utils";
import axios from "axios";
import { InputAddedListener } from "./InputAddedListener";
import { WrappedPromise } from "./WrappedPromise";
import { ContractTransactionResponse, ethers } from "ethers";

export class AxiosLikeClientV2 {

    private url: string | URL | globalThis.Request
    private options: any
    static requests: Record<string, WrappedPromise> = {}

    constructor(url: string | URL | globalThis.Request, options: any) {
        this.url = url
        this.options = options
    }

    async doRequestWithInspect() {
        if (!this.options?.cartesiClient) {
            throw new Error('You need to configure the Cartesi client')
        }
        const that = this.options.cartesiClient as any;
        const { logger } = that.config;

        try {
            const inputJSON = JSON.stringify({
                cartesify: {
                    axios: {
                        url: this.url,
                        options: { ...this.options, cartesiClient: undefined },
                    },
                },
            });
            const jsonEncoded = encodeURIComponent(inputJSON);
            const urlInner = new URL(that.config.endpoint);
            urlInner.pathname += `/${jsonEncoded}`;
            const response = await axios.get(urlInner.href, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
            });
            const result: unknown = await response.data;

            if (Utils.isObject(result) && "reports" in result && Utils.isArrayNonNullable(result.reports)) {
                const lastReport = result.reports[result.reports.length - 1]
                if (Utils.isObject(lastReport) && "payload" in lastReport && typeof lastReport.payload === "string") {
                    const payload = Utils.hex2str(lastReport.payload.replace(/^0x/, ""));
                    const successOrError = JSON.parse(payload)
                    if (successOrError.success) {
                        return new AxiosResponse(successOrError.success)
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

    async doRequestWithAdvance() {
        if (!this.options?.cartesiClient) {
            throw new Error('You need to configure the Cartesi client')
        }
        const cartesiClient = this.options.cartesiClient
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
                            url: this.url,
                            options: { ...this.options, cartesiClient: undefined },
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
            logger.error(`Error ${this.options?.method ?? 'GET'} ${this.url}`, e)
            throw e
        }
    }
}




class AxiosResponse<T = any> {
    data: T;
    status: number;
    statusText: string;
    headers: Record<string, string>;
    config: any;
    request?: any;

    constructor(params: {
        data: T;
        status: number;
        statusText: string;
        headers: Record<string, string>;
        config?: any;
        request?: any;
    }) {
        this.data = params.data;
        this.status = params.status;
        this.statusText = params.statusText || '';
        this.headers = params.headers || {};
        this.config = params.config || {};
        this.request = params.request;
    }

    async json() {
        if (typeof this.data === "string") {
            return JSON.parse(this.data);
        }
        return this.data;
    }

    async text() {
        return typeof this.data === "string" ? this.data : JSON.stringify(this.data);
    }
}

class Response {
    ok: boolean = false
    status: number = 0
    type: string = ""
    headers = new Map<string, string>()
    private rawData: string
    data: Record<string, any>
    constructor(params: any) {
        this.ok = params.ok
        this.status = params.status
        this.type = params.type
        this.rawData = params.text
        this.data = JSON.parse(params.text)
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
