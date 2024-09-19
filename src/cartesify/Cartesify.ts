import { Signer } from "ethers";
import { CartesiClient, CartesiClientBuilder } from "..";
import { AxiosLikeClient } from "./AxiosLikeClient";
import { FetchFun, FetchOptions, fetch as _fetch } from "./FetchLikeClient";
import { AxiosLikeClientV2 } from "./AxiosLikeClientV2";
import { Config, AxiosSetupOptions } from "../models/config";

interface DeleteConfig extends Config {
    data: Record<string, any>;
}

interface AxiosClient {
    get: (url: string, init?: FetchOptions) => Promise<any>;
    post: (url: string, data?: Record<string, any>, init?: Config) => Promise<any>;
    put: (url: string, data?: Record<string, any>, init?: Config) => Promise<any>;
    patch: (url: string, data?: Record<string, any>, init?: Config) => Promise<any>;
    delete: (url: string, init?: DeleteConfig) => Promise<any>;
}


export class Cartesify {

    axios: AxiosLikeClient

    constructor(cartesiClient: CartesiClient) {
        this.axios = new AxiosLikeClient(cartesiClient)
    }

    static createFetch(options: AxiosSetupOptions): FetchFun {
        const builder = new CartesiClientBuilder()
            .withDappAddress(options.dappAddress)
            .withEndpoint(options.endpoints.inspect)
            .withEndpointGraphQL(options.endpoints.graphQL)
        if (options.provider) {
            builder.withProvider(options.provider)
        }
        const cartesiClient = builder.build()
        if (options.signer) {
            cartesiClient.setSigner(options.signer)
        }
        const fetchFun = function (input: string | URL | globalThis.Request, init?: FetchOptions) {
            if (init?.signer) {
                cartesiClient.setSigner(init.signer)
            }
            return _fetch(input, { ...init, cartesiClient })
        }
        fetchFun.setSigner = (signer: Signer) => {
            cartesiClient.setSigner(signer)
        }
        return fetchFun
    }

    static createAxios(options: AxiosSetupOptions): AxiosClient {
        const builder = new CartesiClientBuilder()
            .withDappAddress(options.dappAddress)
            .withEndpoint(options.endpoints.inspect)
            .withEndpointGraphQL(options.endpoints.graphQL);

        if (options.provider) {
            builder.withProvider(options.provider);
        }

        const cartesiClient = builder.build();

        if (options.signer) {
            cartesiClient.setSigner(options.signer);
        }

        return {
            get: (url: string, init?: Config) => AxiosLikeClientV2.executeRequest(cartesiClient, options, url, "GET", init),
            post: (url: string, data?: Record<string, any>, init?: Config) => AxiosLikeClientV2.executeRequest(cartesiClient, options, url, "POST", init, data),
            put: (url: string, data?: Record<string, any>, init?: Config) => AxiosLikeClientV2.executeRequest(cartesiClient, options, url, "PUT", init, data),
            patch: (url: string, data?: Record<string, any>, init?: Config) => AxiosLikeClientV2.executeRequest(cartesiClient, options, url, "PATCH", init, data),
            delete: (url: string, init?: DeleteConfig) => this.createClient(cartesiClient, options, url, "DELETE", init?.data, init).doRequestWithAdvance()
        };
    }

    private static createClient(cartesiClient: CartesiClient, options: AxiosSetupOptions, url: string, method: string, data?: Record<string, any>, init?: Config) {
        if (init?.signer) {
            cartesiClient.setSigner(init.signer);
        }

        const _url = url.startsWith(options.baseURL || '') ? url : `${options.baseURL || ''}${url}`;
        const opts = {
            body: JSON.stringify(data),
            signer: init?.signer,
            cartesiClient: cartesiClient,
            headers: init?.headers,
            method
        };

        return new AxiosLikeClientV2(_url, opts);
    }
}
