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