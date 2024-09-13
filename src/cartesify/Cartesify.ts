import { AddressLike, Provider, Signer } from "ethers";
import { CartesiClient, CartesiClientBuilder } from "..";
import { AxiosLikeClient, AxiosBuilder } from "./AxiosLikeClient";
import { FetchFun, FetchOptions, fetch as _fetch } from "./FetchLikeClient";
import { doRequestWithInspect } from "./AxiosLikeClientV2";
interface SetupOptions {
    endpoints: {
        graphQL: URL;
        inspect: URL;
    };
    provider?: Provider;
    signer?: Signer;
    dappAddress: AddressLike
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

        // const url = new URL(options.endpoints.inspect);
        // const baseURL = `${url.protocol}//${url.hostname}${url.port ? `:${url.port}` : ''}`
        // const axiosBuilder: AxiosBuilder = {
        //     baseURL: baseURL,
        //     cartesiClient: cartesiClient
        // }
        // const axiosClient = AxiosLikeClient.create(axiosBuilder)

        // const post = function (url: string, data?: any) {
        //     return axiosClient.post(url, data)
        // }

        // const put = function (url: string, data?: any) {
        //     return axiosClient.put(url, data)
        // }

        // const patch = function (url: string, data?: any) {
        //     return axiosClient.patch(url, data)
        // }

        // const axiosDelete = function (url: string, data?: any) {
        //     return axiosClient.delete(url, data)
        // }

        const get = function (url: string, init?: FetchOptions) {
            return doRequestWithInspect(url, { ...init, cartesiClient })
        }

        return {
            get,
            // post,
            // put,
            // patch,
            // delete: axiosDelete

        }
        // return axiosClient
    }
}
