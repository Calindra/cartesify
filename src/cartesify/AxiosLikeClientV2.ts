import { Utils } from "../utils";
import { FetchOptions } from "./FetchLikeClient";
import axios from "axios";

export async function doRequestWithInspect(url: string | URL | globalThis.Request, options?: FetchOptions) {
    if (!options?.cartesiClient) {
        throw new Error('You need to configure the Cartesi client')
    }
    const that = options.cartesiClient as any;
    const { logger } = that.config;

    try {
        const inputJSON = JSON.stringify({
            cartesify: {
                axios: {
                    url,
                    options: { ...options, cartesiClient: undefined },
                },
            },
        });
        const jsonEncoded = encodeURIComponent(inputJSON);
        const urlInner = new URL(that.config.endpoint);
        urlInner.pathname += `/${jsonEncoded}`;
        const response = await axios.get(urlInner.href, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
        });
        const result: unknown = await response.data;

        if (Utils.isObject(result) && "reports" in result && Utils.isArrayNonNullable(result.reports)) {
            const lastReport = result.reports[result.reports.length - 1]
            if (Utils.isObject(lastReport) && "payload" in lastReport && typeof lastReport.payload === "string") {
                const payload = Utils.hex2str(lastReport.payload.replace(/^0x/, ""));
                const successOrError = JSON.parse(payload)
                if (successOrError.success) {
                    return new AxiosResponse(successOrError.success)
                } else if (successOrError.error) {
                    if (successOrError.error?.constructorName === "TypeError") {
                        throw new TypeError(successOrError.error.message)
                    } else {
                        throw successOrError.error
                    }
                }
            }
        }
        throw new Error(`Wrong inspect response format.`)
    } catch (e) {
        logger.error(e);
        throw e;
    }

}

class AxiosResponse<T = any> {
    data: T;
    status: number;
    statusText: string;
    headers: Record<string, string>;
    config: any;
    request?: any;

    constructor(params: {
        data: T;
        status: number;
        statusText: string;
        headers: Record<string, string>;
        config?: any;
        request?: any;
    }) {
        this.data = params.data;
        this.status = params.status;
        this.statusText = params.statusText || '';
        this.headers = params.headers || {};
        this.config = params.config || {};
        this.request = params.request;
    }

    async json() {
        if (typeof this.data === "string") {
            return JSON.parse(this.data);
        }
        return this.data;
    }

    async text() {
        return typeof this.data === "string" ? this.data : JSON.stringify(this.data);
    }
}
