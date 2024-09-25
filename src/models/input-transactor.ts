import { Signer } from "ethers"
import { TypedDataDomain } from "viem"

export type MessageField = { name: string; type: string };

export type PrimaryType = "AvailMessage";

export interface TypedData {
    account: string;
    domain: TypedDataDomain
    types: {
        AvailMessage?: { name: string; type: string }[];
    };
    primaryType: PrimaryType;
    message: InputTransactorMessageWithNonce;
}

export interface WalletConfig {
    walletClient: Signer;
    connectedChainId: string;
}

export interface InputTransactorConfig {
    inputTransactorType: string;
    domain: TypedDataDomain;
}

export interface InputTransactorMessage {
    data: string;
    [key: string]: any;
}

export interface InputTransactorMessageWithNonce extends InputTransactorMessage {
    nonce: number;
}