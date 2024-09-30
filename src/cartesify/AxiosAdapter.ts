import { Utils } from "../utils";
import { CartesiClient } from "..";
import { Config, AxiosSetupOptions } from "../models/config";
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
        let data = {}
        try {
            data = this.options.body ? JSON.parse(this.options.body) : {}
        } catch (e: any) {
            data = {}
        }

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
        let axiosClient: AxiosAdapter;

        const params = (method === "GET" || method === "DELETE") ? init?.params : undefined;
        const _url = AxiosAdapter.createURL(url, options, params)
        switch (method) {
            case "GET":
            case "DELETE":
                axiosClient = AxiosAdapter.createClient(cartesiClient, _url, method, init);
                break;
            case "POST":
            case "PUT":
            case "PATCH":
                const dataParams = new URLSearchParams();
                if (init?.params) {
                    Object.keys(init.params).forEach(key => dataParams.append(key, init.params[key]));
                }
                axiosClient = AxiosAdapter.createClient(cartesiClient, _url, method, init, { ...data, ...Object.fromEntries(dataParams) });
                break;
            default:
                axiosClient = AxiosAdapter.createClient(cartesiClient, _url, method, init, data);
                break;
        }
        return axiosClient.operateMachine();
    }

    private static createURL(url: string, options: AxiosSetupOptions, params?: Record<string, any>): string {
        const _url = new URL(url.startsWith(options.baseURL || '') ? url : `${options.baseURL || ''}${url}`);
        if (params) {
            Object.keys(params).forEach(key => _url.searchParams.append(key, params[key]));
        }
        return _url.toString();
    };

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

