import { ethers } from "ethers"
import { TypedDataDomain } from "viem"

interface InputMessage {
    nonce: number
    payload: string
}

interface Domain {
    name: string
    version: string
    chainId: number
    verifyingContract: string
}

export interface InputTransactor {
    account: string
    domain: Domain
    primaryType: string
    message: InputMessage
}

export type MessageField = { name: string; type: string };

export type PrimaryType = "AnvilMessage";

export interface TypedData {
    account: string;
    domain: TypedDataDomain
    types: {
        EIP712Domain?: { name: string; type: string }[];
        AnvilMessage?: { name: string; type: string }[];
    };
    primaryType: PrimaryType;
    message: InputTransactorMessageWithNonce;
}

export interface WalletConfig {
    walletClient: ethers.Wallet;
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