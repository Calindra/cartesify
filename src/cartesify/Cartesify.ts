import { AddressLike, Provider, Signer } from "ethers";
import { CartesiClient, CartesiClientBuilder } from "..";
import { AxiosLikeClient, AxiosBuilder } from "./AxiosLikeClient";
import { FetchFun, FetchOptions, fetch as _fetch } from "./FetchLikeClient";

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

    static async createAxios(options: SetupOptions) {
        const builder = new CartesiClientBuilder()
            .withDappAddress(options.dappAddress)
            .withEndpoint(options.endpoints.inspect)
            .withEndpointGraphQL(options.endpoints.graphQL)
        if (options.provider) {
            builder.withProvider(options.provider)
        }
        const cartesiClient = builder.build()
        const url = new URL(options.endpoints.inspect);
        const baseURL = `${url.protocol}//${url.hostname}${url.port ? `:${url.port}` : ''}`
        const axiosBuilder: AxiosBuilder = {
            baseURL: baseURL,
            cartesiClient: cartesiClient
        }
        const axiosClient = await AxiosLikeClient.create(axiosBuilder)

        return axiosClient
    }
}
