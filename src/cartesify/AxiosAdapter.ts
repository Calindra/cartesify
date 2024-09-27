import { Utils } from "../utils";
import { WrappedPromise } from "./WrappedPromise";
import { CartesiClient } from "..";
import { Config, AxiosSetupOptions, CartesifyAxiosResponse } from "../models/config";
import { CartesiMachineControllable } from "../interfaces/CartesiMachineContollable"
import { Response as FResponse, fetch as _fetch } from "./FetchLikeClient"
import { AxiosError, AxiosResponse } from "axios";
export class AxiosAdapter implements CartesiMachineControllable {

    private url: string | URL | globalThis.Request
    private options: any
    static requests: Record<string, WrappedPromise> = {}

    constructor(url: string | URL | globalThis.Request, options: any) {
        this.url = url
        this.options = options
    }

    async operateMachine() {
        try {
            const response = await _fetch(this.url, this.options)
            const transalatedResponde = await this.responseTranslateFromFetchToAxios(response)
            return transalatedResponde
        } catch (e: any) {
            if(e.name === "AxiosError"){
                throw e
            }
            const statusText = Utils.httpStatusMap[500]
            const config =  { headers: this.options.headers || {} }
            const data = this.options.body ? JSON.parse(this.options.body) : {}
            const request = {
                url: this.url,
                method: this.options.method,
                data,
                headers: config.headers
            }
            const response: AxiosResponse = {
                data: {},
                status: 500,
                statusText,
                headers: {},
                config,
                request
            }
            const message = e.message.replace("fetch", "axios")
            throw new AxiosError(message, "500", config, request, response)
        }

    }

    async responseTranslateFromFetchToAxios(fetchResponse: FResponse): Promise<CartesifyAxiosResponse> {
        let data
        const status = fetchResponse.status
        const statusText = Utils.httpStatusMap[status] || "";
        const headers = fetchResponse.headers || {};
        try {
            data = await fetchResponse.json()
        } catch (e) {
            const code = status.toString()
            const config = { headers: this.options.headers || {} }
            const headersObject = Object.fromEntries(headers)
            const request = {
                url: this.url,
                method: this.options.method,
                data: JSON.parse(this.options.body),
                headers: config.headers
            }
            const response: AxiosResponse = {
                data: {},
                status,
                statusText,
                headers: headersObject,
                config,
                request
            }

            throw new AxiosError(statusText, code, config, request, response)

        }

        const config = { headers: data.headers || {} }
        delete data.headers
        return {
            data,
            status: status,
            statusText,
            headers,
            config
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

        const axiosClient = AxiosAdapter.createClient(cartesiClient, _url, method, init, data);

        return axiosClient.operateMachine();
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

        return new AxiosAdapter(url, opts);
    }
}

