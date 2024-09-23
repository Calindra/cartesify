import { PrimaryType } from "../models/input-transactor"
import { Utils } from "../utils"
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
}