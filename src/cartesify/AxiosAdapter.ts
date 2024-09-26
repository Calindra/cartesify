import { Utils } from "../utils";
import { WrappedPromise } from "./WrappedPromise";
import { CartesiClient } from "..";
import { Config, AxiosSetupOptions, CartesifyAxiosResponse } from "../models/config";
import { CartesiMachineControllable } from "../interfaces/CartesiMachineContollable"
import { Response as FResponse, fetch as _fetch } from "./FetchLikeClient"
export class AxiosAdapter implements CartesiMachineControllable {

    private url: string | URL | globalThis.Request
    private options: any
    static requests: Record<string, WrappedPromise> = {}

    constructor(url: string | URL | globalThis.Request, options: any) {
        this.url = url
        this.options = options
    }

    async operateMachine() {
        const response = await _fetch(this.url, this.options)
        const transalatedResponde = await this.responseTranslateFromFetchToAxios(response)
        return transalatedResponde
    }

    async responseTranslateFromFetchToAxios(fetchResponse: FResponse): Promise<CartesifyAxiosResponse> {
        let data
        try {
            data = await fetchResponse.json()
        } catch (e) {
            data = {}
        }
        const statusText = Utils.httpStatusMap[fetchResponse.status] || "";
        const headers = fetchResponse.headers || {};
        const config = { headers: data.headers || {} }
        delete data.headers
        return {
            data,
            status: fetchResponse.status,
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

