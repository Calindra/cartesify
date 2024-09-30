import { InputTransactorConfig, InputTransactorMessage, PrimaryType, TypedData, WalletConfig } from "../models/input-transactor"
import { Utils } from "../utils"
import { encodeAbiParameters } from "viem"
import axios from "axios"
export default class InputTransactorService {


    static sendMessage = async (walletConfig: WalletConfig, inputTransactorConfig: InputTransactorConfig, message: InputTransactorMessage) => {
        try {
            const typedData: TypedData = await InputTransactorService.createTypedData(walletConfig, inputTransactorConfig, message)
            const { signature, hexData } = await InputTransactorService.assingInputMessage(walletConfig, typedData)

            const body = JSON.stringify({
                signature,
                message: hexData,
            })

            const response = await fetch('http://localhost:8080/transaction', {
                method: 'POST',
                body,
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response
        } catch (e) {
            console.error("Paio submit failed.", e)
            throw e
        }
    }

    static assingInputMessage = async (walletConfig: WalletConfig, typedData: TypedData) => {
        try {
            const { walletClient } = walletConfig
            const signingMessageAbi = [
                {
                    type: 'address',
                    name: 'app'
                },
                {
                    type: 'uint64',
                    name: 'nonce'
                },
                {
                    type: 'uint128',
                    name: 'max_gas_price'
                },
                {
                    type: 'bytes',
                    name: 'data'
                }
            ];

            const abiEncoder = encodeAbiParameters as any
            const hexData = abiEncoder(signingMessageAbi, [
                typedData.message.app,
                typedData.message.nonce,
                typedData.message.max_gas_price,
                typedData.message.data
            ]);
            const signature = await InputTransactorService.executeSign(walletClient, typedData)

            return { signature, hexData }
        } catch (e) {
            console.error("Error when try assign message. ", e)
            throw e
        }
    }

    static executeSign = async (instance: any, typedData: TypedData) => {
        const { domain, types, message } = typedData
        if ('_signTypedData' in instance && typeof instance._signTypedData === 'function') {
            return await instance._signTypedData(domain, types, message);
        } else if ('signTypedData' in instance && typeof instance.signTypedData === 'function') {
            return await instance.signTypedData(domain, types, message);
        } else {
            throw new Error('The instance is neither a Signer nor a JsonRpcSigner');
        }
    }

    static createTypedData = async (walletConfig: WalletConfig, inputTransactorConfig: InputTransactorConfig, message: InputTransactorMessage): Promise<TypedData> => {
        try {
            let typedData: Partial<TypedData> = {}

            const { walletClient, connectedChainId } = walletConfig
            const { domain, inputTransactorType } = inputTransactorConfig
            const [account] = await walletClient.getAddress()
            const primaryType = Utils.inputTransactorTypeMap.get(inputTransactorType)

            if (!primaryType) {
                throw new Error("Invalid inputTransactorType");
            }
            typedData.account = account
            typedData.types = InputTransactorService.buildTypes(primaryType)
            typedData.primaryType = primaryType
            typedData.domain = domain

            const nextNonce = await InputTransactorService.getNonce(account.toString(), connectedChainId)

            const updatedMessage = {
                ...message,
                nonce: nextNonce,
            }
            typedData.message = updatedMessage
            return typedData as TypedData
        } catch (e) {
            console.error("Failed to create typedData. ", e)
            throw e
        }
    }

    static buildTypes = (primaryType: PrimaryType) => {
        const messageContent = Utils.messageMap.get(primaryType)
        if (!messageContent) {
            throw new Error("Invalid primaryType")
        }
        const types = {
            [primaryType]: messageContent
        }
        return types
    }

    static getNonce = async (senderAccount: string, connectedChainId: string) => {
        try {
            const config = {
                headers: {
                    'Content-Type': 'application/json'
                }

            }
            const data = {
                app_contract: "0xab7528bb862fB57E8A2BCd567a2e929a0Be56a5e",
                msg_sender: senderAccount
            }
            const response = await axios.post("http://localhost:8080/nonce", data, config);


            const nextNonce = response.data.nonce + 1;
            return nextNonce
        } catch (e) {
            console.error("Error: not found nonce. ", e)
            throw e
        }
    }
}