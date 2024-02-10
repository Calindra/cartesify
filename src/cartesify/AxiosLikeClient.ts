import { ContractTransactionResponse, ethers } from "ethers";
import { CartesiClient } from "../main";
import { Utils } from "../utils";
import { WrappedPromise } from "./WrappedPromise";

interface AxiosBuilder {
    baseURL?: string
    cartesiClient: CartesiClient
}

export class AxiosLikeClient {
    static requests: Record<string, WrappedPromise> = {}

    static listenerAdded = false
    baseURL?: string

    constructor(private cartesiClient: CartesiClient) {

    }

    static create(opts: AxiosBuilder) {
        const axiosLike = new AxiosLikeClient(opts.cartesiClient)
        axiosLike.baseURL = opts.baseURL
        axiosLike.addListener().catch(e => {
            console.error('AddListener error', e)
        })
        return axiosLike
    }

    async post(url: string, data?: any) {
        const cartesiClient = this.cartesiClient;
        if (!cartesiClient) {
            throw new Error('You need to configure the Cartesi client')
        }
        const { logger } = cartesiClient.config;

        try {
            const { provider, signer } = cartesiClient.config;
            logger.info("getting network", provider);
            const network = await provider.getNetwork();
            logger.info("getting signer address", signer);
            const signerAddress = await signer.getAddress();

            logger.info(`connected to chain ${network.chainId}`);
            logger.info(`using account "${signerAddress}"`);

            // connect to rollup,
            const inputContract = await cartesiClient.getInputContract();

            // use message from command line option, or from user prompt
            logger.info(`sending "${JSON.stringify(data)}"`);

            const requestId = `${Date.now()}:${Math.random()}`
            const wPromise = AxiosLikeClient.requests[requestId] = new WrappedPromise()
            // convert string to input bytes (if it's not already bytes-like)
            const inputBytes = ethers.toUtf8Bytes(
                JSON.stringify({
                    requestId,
                    cartesify: {
                        axios: {
                            data,
                            url: `${this.baseURL || ''}${url}`,
                            method: "POST"
                        },
                    },
                })
            );

            const dappAddress = await cartesiClient.getDappAddress();
            logger.info(`dappAddress: ${dappAddress} typeof ${typeof dappAddress}`);

            // send transaction
            const tx = await inputContract.addInput(dappAddress, inputBytes) as ContractTransactionResponse;
            logger.info(`transaction: ${tx.hash}`);
            logger.info("waiting for confirmation...");
            const receipt = await tx.wait(1);
            logger.info(JSON.stringify(receipt));
            return await wPromise.promise
        } catch (e) {
            logger.error(e);
            if (e instanceof Error) {
                throw e;
            }
            throw new Error("Error on advance");
        }
    }

    async get(urlPath: string) {
        const that = this.cartesiClient as any;
        const { logger } = that.config;

        try {
            const inputJSON = JSON.stringify({
                cartesify: {
                    axios: {
                        url: `${this.baseURL || ''}${urlPath}`,
                        method: "GET"
                    },
                },
            });
            const jsonEncoded = encodeURIComponent(inputJSON);

            const url = new URL(that.config.endpoint);
            url.pathname += `/${jsonEncoded}`;

            logger.info("Inspecting endpoint: ", url.href);

            const response = await fetch(url.href, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
            });
            const result: unknown = await response.json();

            if (Utils.isObject(result) && "reports" in result && Utils.isArrayNonNullable(result.reports)) {
                const firstReport = result.reports.at(0);
                if (Utils.isObject(firstReport) && "payload" in firstReport && typeof firstReport.payload === "string") {
                    const payload = Utils.hex2str(firstReport.payload.replace(/^0x/, ""));
                    return { data: JSON.parse(payload) };
                }
            }
        } catch (e) {
            logger.error(e);
        }
        return null;
    }

    async addListener() {
        const MAX_RETRY = 20
        const cartesiClient = this.cartesiClient;
        if (!cartesiClient) {
            throw new Error('You need to configure the Cartesi client')
        }
        if (AxiosLikeClient.listenerAdded) {
            return
        }
        AxiosLikeClient.listenerAdded = true
        const { logger } = cartesiClient.config;
        const contract = await cartesiClient.getInputContract()
        contract.on("InputAdded", async (_dapp: string, inboxInputIndex: number, _sender: string, input: string) => {
            try {
                const str = Utils.hex2str(input.replace(/0x/, ''))
                const payload = JSON.parse(str)
                const wPromise = AxiosLikeClient.requests[payload.requestId]
                if (!wPromise) {
                    return
                }
                let i = 0;
                while (i < MAX_RETRY) {
                    try {
                        i++;
                        logger.info(`attempt ${i}...`)
                        const req = await fetch("http://localhost:8080/graphql", {
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
                            "referrer": "http://localhost:8080/graphql",
                            "referrerPolicy": "strict-origin-when-cross-origin",
                            "body": `{\"operationName\":null,\"variables\":{},\"query\":\"{\\n  input(index: ${inboxInputIndex}) {\\n    reports(first: 10) {\\n      edges {\\n        node {\\n          payload\\n        }\\n      }\\n    }\\n  }\\n}\\n\"}`,
                            "method": "POST",
                            "mode": "cors",
                            "credentials": "omit"
                        });
                        const json = await req.json()
                        if (json.data?.input.reports.edges.length > 0) {
                            const hex = json.data.input.reports.edges[0].node.payload.replace(/0x/, '')
                            const strRes = Utils.hex2str(hex)
                            const successOrError = JSON.parse(strRes)
                            if (successOrError.success) {
                                wPromise.resolve!(successOrError.success)
                            } else {
                                wPromise.reject!(successOrError.error)
                            }
                            break;
                        }
                        await new Promise((resolve) => setTimeout(resolve, 1000))
                    } catch (e) {
                        console.error(e)
                    }
                }
            } catch (e) {
                console.error(e)
            }
        })
    }

}
