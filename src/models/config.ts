import { AddressLike, Provider, Signer } from "ethers";
import { CartesiClient } from "..";

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