import type { Signer } from "ethers"
import type { TypedDataDomain, TypedDataDefinition, TypedDataParameter } from "viem"

export type MessageField = TypedDataParameter;

export type PrimaryType = "AvailMessage" | "EIP712Message";

export type TypeDataTypes = Record<PrimaryType, readonly TypedDataParameter[]>

export interface TypedData extends TypedDataDefinition<TypeDataTypes> {
    account: string;
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

export interface EIP712Config {
    domain: TypedDataDomain;
    types: Record<string, Array<{ name: string; type: string }>>;
    primaryType: string;
}