import { Utils } from "../utils";
import axios from "axios";
import { InputAddedListener } from "./InputAddedListener";
import { WrappedPromise } from "./WrappedPromise";
import { ContractTransactionResponse, ethers } from "ethers";
import { CartesiClient } from "..";
import { Config, AxiosSetupOptions, CartesifyAxiosResponse } from "../models/config";
import { CartesiMachineControllable } from "../interfaces/CartesiMachineContollable"
import { Response as FResponse, fetch as _fetch } from "../cartesify/FetchLikeClient"
export class AxiosLikeClientV2 implements CartesiMachineControllable {

    private url: string | URL | globalThis.Request
    private options: any
    static requests: Record<string, WrappedPromise> = {}

    constructor(url: string | URL | globalThis.Request, options: any) {
        this.url = url
        this.options = options
    }

    async doRequestWithInspect() {
        const response = await _fetch(this.url, this.options)
        const transalatedResponde = await this.responseTranslateFromFetchToAxios(response)
        return transalatedResponde
    }

    async responseTranslateFromFetchToAxios(fetchResponse: FResponse): Promise<CartesifyAxiosResponse> {
        const data = await fetchResponse.json()
        const statusText = Utils.httpStatusMap[fetchResponse.status] || "";
        const headers = fetchResponse.headers || {};
        const config = { headers: data.headers }
        delete data.headers
        return {
            data,
            status: fetchResponse.status,
            statusText,
            headers,
            config
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

class Response {
    status: number = 0
    headers = new Map<string, string>()
    data: Record<string, any>
    statusText: string
    constructor(params: any) {
        this.status = params.status
        try {
            this.data = typeof params.text === 'string' ? JSON.parse(params.text) : params.text;
        } catch (error) {
            console.error("Failed to parse response data:", error);
            this.data = {}; // Define como um objeto vazio se não conseguir fazer parse
        }
        this.statusText = Utils.httpStatusMap[params.status] || ""
        if (params.headers) {
            this.headers = new Map(params.headers)
        }
    }
}

