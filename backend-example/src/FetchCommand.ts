import { App } from "@deroll/app";
import { Hex } from "viem";

interface FetchRequestConfig {
    url: string,
    options?: any
}

export class FetchCommand {
    static async execute(fetchConfig: FetchRequestConfig, app: App, metadata: Record<string, string | number> = {}) {
        try {
            const headers = fetchConfig.options?.headers || {}
            Object.getOwnPropertyNames(metadata).forEach(property => {
                headers[`x-${property}`] = `${metadata[property] ?? ''}`
            })
            const resp = await fetch(fetchConfig.url, { ...fetchConfig.options, headers })
            const jsonString = JSON.stringify({
                command: "cartesify:fetch",
                success: {
                    text: await resp.text(),
                    headers: Array.from(resp.headers.entries()),
                    status: resp.status,
                    ok: resp.ok,
                    type: resp.type,
                }
            })
            const buffer = Buffer.from(jsonString, "utf8")
            const hexPayload: Hex = `0x${buffer.toString("hex")}`
            await app.createReport({ payload: hexPayload })
            if (resp.status >= 200 && resp.status < 300) {
                return "accept"
            } else {
                return "reject"
            }
        } catch (e) {
            if (e instanceof TypeError) {
                const jsonString = JSON.stringify({
                    command: "cartesify:fetch",
                    error: {
                        constructorName: "TypeError",
                        message: e.message,
                        cause: e.cause
                    }
                })
                const buffer = Buffer.from(jsonString, "utf8")
                const hexPayload: Hex = `0x${buffer.toString("hex")}`
                await app.createReport({ payload: hexPayload })
                return "reject"
            }
            console.error(`Unexpected error executing fetch on url="${fetchConfig.url}"`)
            throw e
        }
    }
}
