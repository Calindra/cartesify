import { Signer } from "ethers";
import { CartesiClient, CartesiClientBuilder } from "..";
import { AxiosLikeClient } from "./AxiosLikeClient";
import { FetchFun, FetchOptions, fetch as _fetch } from "./FetchLikeClient";
import { AxiosLikeClientV2 } from "./AxiosLikeClientV2";
import { Config, AxiosSetupOptions, DeleteConfig, AxiosClient, InputTransactorProps, InputTransactorOptions } from "../models/config";
import { InputTransactorConfig, InputTransactorMessage, WalletConfig } from "../models/input-transactor";
import InputTransactorService from "../services/InputTransactorService";
import { Address, TypedDataDomain } from "viem";
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
            delete: (url: string, init?: DeleteConfig) => AxiosLikeClientV2.executeRequest(cartesiClient, options, url, "DELETE", init, init?.data)
        };
    }

    static async createInputTransactor(inputTransactor: InputTransactorProps, options: InputTransactorOptions) {
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

        const { inputTransactorType, domain } = inputTransactor

        const defaultDomain = await this.getDomain(domain, inputTransactorType, options.signer);

        const inputTransactorConfig: InputTransactorConfig = {
            inputTransactorType: inputTransactorType,
            domain: defaultDomain
        }
        return {
            sendMessage: (message: InputTransactorMessage, connectedChainId: string) => {
                const wConfig: WalletConfig = {
                    walletClient: options.signer,
                    connectedChainId: connectedChainId
                }
                return InputTransactorService.sendMessage(wConfig, inputTransactorConfig, message)
            }
        }
    }

    private static async getDomain(domain: TypedDataDomain | undefined, inputTransactorType: string, signer: Signer): Promise<TypedDataDomain> {
        try {
            if (domain) {
                return domain;
            }

            const network = await signer.provider?.getNetwork();
            if (!network || !network.chainId) {
                throw new Error("Failed to fetch network or chainId from the provider.");
            }

            return {
                name: inputTransactorType,
                version: "1",
                chainId: Number(network.chainId),
                verifyingContract: "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC" as Address,
            } as TypedDataDomain;

        } catch (error) {
            console.error("Error generating default domain:", error);
            throw new Error("Unable to generate the default domain. Ensure the signer and network information are correct.");
        }
    }
}
