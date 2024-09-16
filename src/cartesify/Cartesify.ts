import { AddressLike, Provider, Signer } from "ethers";
import { CartesiClient, CartesiClientBuilder } from "..";
import { AxiosLikeClient, AxiosBuilder } from "./AxiosLikeClient";
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

interface Data {
    commitment: string;
}

interface Config {
    headers: any;
    signer?: Signer;
    cartesiClient?: CartesiClient;
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

    static createAxios(options: SetupOptions) {
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

        const get = function (url: string, init?: FetchOptions) {
            const _url = url.startsWith(options.baseURL || '') ? url : `${options.baseURL || ''}${url}`;
            const axiosClient = new AxiosLikeClientV2(_url, { ...init, cartesiClient })
            return axiosClient.doRequestWithInspect()
        }

        const post = function (url: string, data?: Data, init?: Config) {
            const _url = url.startsWith(options.baseURL || '') ? url : `${options.baseURL || ''}${url}`;
            
            if (init?.signer) {
                cartesiClient.setSigner(init.signer)
            }
            const opts = {
                body: data?.commitment || "",
                signer: init?.signer,
                cartesiClient: cartesiClient,
                headers: init?.headers,
                method: "POST"
            }
            const axiosClient = new AxiosLikeClientV2(_url, opts)
            return axiosClient.doRequestWithAdvance()
        }

        return {
            get,
            post,
            // put,
            // patch,
            // delete: axiosDelete

        }
        // return axiosClient
    }
}
