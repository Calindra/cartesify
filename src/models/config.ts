import { AddressLike, Provider, Signer } from "ethers";
import { CartesiClient } from "..";
import { FetchOptions } from "@calindra/cartesify";
import { WalletConfig } from "./input-transactor";
import { TypedDataDomain } from "viem";

export interface Config {
    headers?: any;
    signer?: Signer;
    cartesiClient?: CartesiClient;
}

export interface AxiosSetupOptions {
    endpoints: {
        graphQL: URL;
        inspect: URL;
    };
    provider?: Provider;
    signer?: Signer;
    dappAddress: AddressLike;
    baseURL?: string;
}

export interface DeleteConfig extends Config {
    data: Record<string, any>;
}

export interface AxiosClient {
    get: (url: string, init?: FetchOptions) => Promise<any>;
    post: (url: string, data?: Record<string, any>, init?: Config) => Promise<any>;
    put: (url: string, data?: Record<string, any>, init?: Config) => Promise<any>;
    patch: (url: string, data?: Record<string, any>, init?: Config) => Promise<any>;
    delete: (url: string, init?: DeleteConfig) => Promise<any>;
}

export interface InputTransactorProps {
    walletConfig: WalletConfig;
    domain: TypedDataDomain;
    inputTransactorType: string;
}