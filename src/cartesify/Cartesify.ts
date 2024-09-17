import { AddressLike, Provider, Signer } from "ethers";
import { CartesiClient, CartesiClientBuilder } from "..";
import { AxiosLikeClient } from "./AxiosLikeClient";
import { FetchFun, FetchOptions, fetch as _fetch } from "./FetchLikeClient";
import { AxiosLikeClientV2 } from "./AxiosLikeClientV2";
interface SetupOptions {
    endpoints: {
        graphQL: URL;
        inspect: URL;
    };
    provider?: Provider;
    signer?: Signer;
    dappAddress: AddressLike;
    baseURL?: string;
}

interface Config {
    headers: any;
    signer?: Signer;
    cartesiClient?: CartesiClient;
}

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

    static createFetch(options: SetupOptions): FetchFun {
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

    static createAxios(options: SetupOptions): AxiosClient {
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
            get: (url: string, init?: FetchOptions) => {
                if (init?.signer) {
                    cartesiClient.setSigner(init.signer);
                }
                const _url = url.startsWith(options.baseURL || '') ? url : `${options.baseURL || ''}${url}`;
                const axiosClient = new AxiosLikeClientV2(_url, { ...init, cartesiClient });
                return axiosClient.doRequestWithInspect();
            },
            post: (url: string, data?: Record<string, any>, init?: Config) => this.createClient(cartesiClient, options, url, "POST", data, init).doRequestWithAdvance(),
            put: (url: string, data?: Record<string, any>, init?: Config) => this.createClient(cartesiClient, options, url, "PUT", data, init).doRequestWithAdvance(),
            patch: (url: string, data?: Record<string, any>, init?: Config) => this.createClient(cartesiClient, options, url, "PATCH", data, init).doRequestWithAdvance(),
            delete: (url: string, init?: DeleteConfig) => this.createClient(cartesiClient, options, url, "DELETE", init?.data, init).doRequestWithAdvance()
        };
    }

    private static createClient(cartesiClient: CartesiClient, options: SetupOptions, url: string, method: string, data?: Record<string, any>, init?: Config) {
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
