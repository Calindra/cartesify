import { CartesiClient } from "../main";
import { Utils } from "../utils";
import { WrappedPromise } from "./WrappedPromise";
import debug from "debug";

/**
 * to see the logs run on terminal:
 * ```
 * export DEBUG=cartesify:*
 * ```
 */
const debugs = debug('cartesify:InputAddedListener')

let listenerAdded = false

const query = `query Report($index: Int!) {
    input(index: $index) {
        reports(last: 1) {
            edges {
                node {
                    payload
                }
            }
        }
    }
}`

const defaultOptions: RequestInit = {
    "headers": {
        "accept": "*/*",
        "accept-language": "en-US,en;q=0.9,pt;q=0.8",
        "content-type": "application/json",
        "sec-ch-ua": "\"Not_A Brand\";v=\"8\", \"Chromium\";v=\"120\", \"Microsoft Edge\";v=\"120\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"macOS\"",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin"
    },
    "referrerPolicy": "strict-origin-when-cross-origin",
    "method": "POST",
    "mode": "cors",
    "credentials": "omit",
}

export class InputAddedListener {

    static requests: Record<string, WrappedPromise> = {}

    endpointGraphQL: URL
    maxRetry = 30

    constructor(private cartesiClient: CartesiClient) {
        this.endpointGraphQL = cartesiClient.config.endpointGraphQL
    }

    async queryGraphQL(query: string, variables: Record<string, string | number>) {
        const req = await fetch(this.endpointGraphQL, {
            ...defaultOptions,
            referrer: `${this.endpointGraphQL.toString()}`,
            body: JSON.stringify({
                query,
                operationName: null,
                variables
            }),
        });
        return await req.json()
    }

    getLastReportAsJSON(json: any) {
        if (json.data?.input.reports.edges.length > 0) {
            const lastEdge = json.data.input.reports.edges.length - 1
            const hex = json.data.input.reports.edges[lastEdge].node.payload
            return Utils.hex2str2json(hex)
        }
    }

    resolveOrRejectPromise(wPromise: WrappedPromise, lastReport: any) {
        if (lastReport.success) {
            wPromise.resolve!(lastReport)
        } else if (lastReport.error?.constructorName === "TypeError") {
            const typeError = new TypeError(lastReport.error.message)
            wPromise.reject!(typeError)
        } else if (lastReport.error) {
            wPromise.reject!(lastReport.error)
        } else {
            wPromise.reject!(new Error(`Unexpected cartesify response format from backend ${JSON.stringify(lastReport)}`))
        }
    }

    async addListener() {
        const cartesiClient = this.cartesiClient;
        if (!cartesiClient) {
            throw new Error('You need to configure the Cartesi client')
        }
        if (listenerAdded) {
            return
        }
        listenerAdded = true
        const contract = await cartesiClient.getInputContract()
        contract.on("InputAdded", async (_dapp: string, inboxInputIndex: number, _sender: string, input: string) => {
            const start = Date.now()
            let attempt = 0;
            try {
                const payload = Utils.hex2str2json(input)
                const wPromise = InputAddedListener.requests[payload.requestId]
                if (!wPromise) {
                    return
                }
                while (attempt < this.maxRetry) {
                    try {
                        attempt++;
                        if (attempt > 1) {
                            debugs(`waiting 1s to do the ${attempt} attempt. InputBoxIndex = ${inboxInputIndex}`)
                            await new Promise((resolve) => setTimeout(resolve, 1000))
                        }
                        const variables = { index: +inboxInputIndex.toString() }
                        const gqlResponse = await this.queryGraphQL(query, variables)
                        const lastReport = this.getLastReportAsJSON(gqlResponse)
                        if (/^cartesify:/.test(lastReport?.command)) {
                            this.resolveOrRejectPromise(wPromise, lastReport)
                            return // exit loop and function
                        } else {
                            debugs(`its not a cartesify %O`, gqlResponse)
                        }
                    } catch (e) {
                        debugs('%O', e)
                    }
                }
                wPromise.reject!(new Error(`Timeout after ${this.maxRetry} attempts`))
            } catch (e) {
                debugs(e)
            } finally {
                debugs(`InputAdded: ${Date.now() - start}ms; attempts = ${attempt}`)
            }
        })
    }
}
