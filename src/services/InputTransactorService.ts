import { InputTransactorConfig, InputTransactorMessage, PrimaryType, TypedData, WalletConfig } from "../models/input-transactor"
import { Utils } from "../utils"
import configFile from "../configs/token-config.json"

export default class InputTransactorService {


    static sendMessage = async (walletConfig: WalletConfig, inputTransactorConfig: InputTransactorConfig, message: InputTransactorMessage) => {
        try {
            const typedData: TypedData = await InputTransactorService.createTypedData(walletConfig, inputTransactorConfig, message)
            const signedMessage = await InputTransactorService.assingInputMessage(walletConfig, typedData)

            const response = await fetch('http://localhost:8080/transactions', {
                method: 'POST',
                body: JSON.stringify(signedMessage),
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response
        } catch (e) {
            console.error("submit to Espresso failed.", e)
            throw e
        }
    }

    static assingInputMessage = async (walletConfig: WalletConfig, typedData: TypedData) => {
        try {
            const { walletClient } = walletConfig
            const signature = await InputTransactorService.executeSign(walletClient, typedData)
            const signedMessage = {
                signature,
                typedData: btoa(JSON.stringify(typedData))
            }

            return signedMessage
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
        const types = {
            [primaryType]: messageContent
        }
        return types
    }

    static getNonce = async (senderAccount: string, connectedChainId: string) => {
        try {
            const config: Record<string, any> = configFile
            const url = `${config[connectedChainId].graphqlAPIURL}/graphql`;
            const query = `
            {inputs(where: {msgSender: "${senderAccount}" type: "Espresso"}) {
                totalCount
        }}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ query })
            });

            const responseData = await response.json();
            const nextNonce = responseData.data.inputs.totalCount + 1;
            return nextNonce
        } catch (e) {
            console.error("Error: not found nonce. ", e)
            throw e
        }
    }
}