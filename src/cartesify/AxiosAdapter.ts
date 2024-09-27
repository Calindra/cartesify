import { Utils } from "../utils";
import { WrappedPromise } from "./WrappedPromise";
import { CartesiClient } from "..";
import { Config, AxiosSetupOptions, CartesifyAxiosResponse } from "../models/config";
import { CartesiMachineControllable } from "../interfaces/CartesiMachineContollable"
import { Response as FResponse, fetch as _fetch } from "./FetchLikeClient"
import { AxiosError, AxiosRequestConfig, AxiosRequestHeaders, AxiosResponse, InternalAxiosRequestConfig } from "axios";
export class AxiosAdapter implements CartesiMachineControllable {

    private url: string | URL | globalThis.Request
    private options: any
    static requestsHeaders: any

    constructor(url: string | URL | globalThis.Request, options: any) {
        this.url = url
        this.options = options
    }

    async operateMachine(): Promise<AxiosResponse> {
        try {
            const response = await this.fetchResponse()
            return await this.translateResponse(response)
        } catch (e: any) {
            if (this.isAxiosError(e)) throw e
            throw this.createAxiosError(e)
        }
    }

    private async translateResponse(fetchResponse: FResponse): Promise<AxiosResponse> {
        try {
            const data = await fetchResponse.json()
            AxiosAdapter.requestsHeaders = data.headers
            delete data.headers
            return this.createAxiosResponse(fetchResponse, data)
        } catch (e) {
            throw this.createAxiosError(e, fetchResponse)
        }
    }

    private async fetchResponse(): Promise<FResponse> {
        return await _fetch(this.url, this.options)
    }

    private createAxiosResponse(fetchResponse: FResponse, data: any): AxiosResponse {
        const { status, headers } = fetchResponse
        const objectHeaders = headers ? Object.fromEntries(headers) : headers
        const axiosResponse = {
            data,
            status,
            statusText: Utils.httpStatusMap[status] || "",
            headers: objectHeaders,
            config: this.createConfig(),
            request: this.createRequest()
        }
        return axiosResponse
    }

    private createAxiosError(error: any, fetchResponse?: FResponse): AxiosError {
        const status = fetchResponse?.status || 500
        const statusText = Utils.httpStatusMap[status] || 'Internal Server Error'
        const message = error.message?.replace("fetch", "axios") || statusText
        const axiosError = new AxiosError(
            message,
            status.toString(),
            this.createConfig(),
            this.createRequest(),
            this.createAxiosResponse(fetchResponse || { status } as FResponse, {})
        )

        return axiosError
    }

    private createConfig(): InternalAxiosRequestConfig {
        const config = { headers: this.options.headers || {} as AxiosRequestHeaders };
        return config
    }

    private createRequest(): AxiosRequestConfig {
        const data = this.options.body ? JSON.parse(this.options.body) : {}
        return {
            url: this.url as string,
            method: this.options.method || 'GET',
            data,
            headers: AxiosAdapter.requestsHeaders
        }
    }

    private isAxiosError(e: any): boolean {
        return e.name === "AxiosError"
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

