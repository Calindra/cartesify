import { Utils } from "../utils";
import axios from "axios";
import { InputAddedListener } from "./InputAddedListener";
import { WrappedPromise } from "./WrappedPromise";
import { ContractTransactionResponse, ethers, Signer } from "ethers";
import { CartesiClient } from "..";
import { SetupOptions } from "@calindra/cartesify";
import { Config, AxiosSetupOptions } from "../models/config";
interface IAxiosLikeClient {
    cartesiClient: CartesiClient;
    options: SetupOptions;
    url: string | URL | globalThis.Request;
    method: string;
    data?: Record<string, any>;
    init?: Config;
}
export class AxiosLikeClientV2 {

    private url: string | URL | globalThis.Request
    private options: any
    private method?: string
    private data?: Record<string, any>
    private init?: Config
    private cartesiClient?: CartesiClient
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

    static async executeRequest(
        cartesiClient: CartesiClient,
        options: AxiosSetupOptions,
        url: string,
        method: string,
        init?: Config,
        data?: Record<string, any>
    ) {
        const _url = url.startsWith(options.baseURL || '') ? url : `${options.baseURL || ''}${url}`;

        const axiosClient = AxiosLikeClientV2.createClient(cartesiClient, _url, method, init, data);

        if (method === "GET") {
            return axiosClient.doRequestWithInspect();
        } else {
            return axiosClient.doRequestWithAdvance();
        }
    }



    static createClient(cartesiClient: CartesiClient, url: string, method: string, init?: Config, data?: Record<string, any>) {
        if (init?.signer) {
            cartesiClient.setSigner(init.signer);
        }

        const opts = {
            body: JSON.stringify(data),
            signer: init?.signer,
            cartesiClient: cartesiClient,
            headers: init?.headers,
            method
        };

        return new AxiosLikeClientV2(url, opts);
    }
}




class AxiosResponse<T = any> {
    data: T;
    status: number;
    statusText: string;
    headers: Record<string, string>;

    constructor(params: {
        data: T;
        status: number;
        statusText: string;
        headers: Record<string, string>;
    }) {
        this.data = params.data;
        this.status = params.status;
        this.statusText = Utils.httpStatusMap[params.status] || "";
        this.headers = params.headers || {};
    }
}


class Response {
    status: number = 0
    headers = new Map<string, string>()
    data: Record<string, any>
    statusText: string
    constructor(params: any) {
        this.status = params.status
        this.data = JSON.parse(params.text)
        this.statusText = Utils.httpStatusMap[params.status] || ""
        if (params.headers) {
            this.headers = new Map(params.headers)
        }
    }
}

