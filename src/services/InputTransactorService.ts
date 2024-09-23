import { PrimaryType } from "../models/input-transactor"
import { Utils } from "../utils"
import configFile from "../configs/token-config.json"
import axios from "axios"
export default class InputTransactorService {

    static buildTypes = (primaryType: PrimaryType) => {
        const messageContent = Utils.messageMap.get(primaryType)
        const types = {
            EIP712Domain: [
                { name: "name", type: "string" },
                { name: "version", type: "string" },
                { name: "chainId", type: "uint32" },
                { name: "verifyingContract", type: "address" },
            ],
            [primaryType]: messageContent
        } as const
        return types
    }

    static getNonce = async (senderAccount: string, connectedChainId: string, inputTransactorType: string) => {
        try {
            const config: Record<string, any> = configFile
            const url = `${config[connectedChainId].graphqlAPIURL}/graphql`;
            const query = `
            {inputs(where: {msgSender: "${senderAccount}" type: "${inputTransactorType}"}) {
                totalCount
        }}`;
            const response = await axios.post(url, { query }, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
            });
            const responseData = response.data;
            const nextNonce = responseData.inputs.totalCount + 1;
            return nextNonce
        } catch (e) {
            console.error("Error: not found nonce. ", e)
            throw e
        }
    }
}