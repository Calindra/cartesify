import { App } from "@deroll/app";
import axios, { AxiosRequestConfig } from "axios";
import { Hex } from "viem";

export class AxiosCommand {
    static async execute(axiosConfig: AxiosRequestConfig, app: App, metadata?: any) {
        try {
            const resp = await axios(axiosConfig)
            const jsonString = JSON.stringify({
                success: {
                    data: resp.data,
                    headers: resp.headers,
                    status: resp.status
                }
            })
            const buffer = Buffer.from(jsonString, "utf8")
            const hexPayload: Hex = `0x${buffer.toString("hex")}`
            await app.createReport({ payload: hexPayload })
            return "accept"
        } catch (e) {
            if (axios.isAxiosError(e)) {
                const jsonString = JSON.stringify({
                    error: {
                        ...e.toJSON()
                    }
                })
                console.log(e.toJSON())
                const buffer = Buffer.from(jsonString, "utf8")
                const hexPayload: Hex = `0x${buffer.toString("hex")}`
                await app.createReport({ payload: hexPayload })
                return "reject"
            } else {
                throw e
            }
        }
    }
}
