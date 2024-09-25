import { Hex } from "./hex";
import { MessageField, PrimaryType } from "./models/input-transactor";
import type { ObjectLike } from "./types";

export class Utils {
  static isObject(value: unknown): value is ObjectLike {
    return typeof value === "object" && value !== null;
  }

  static isArrayNonNullable<T = unknown>(value: unknown): value is Array<T> {
    return Array.isArray(value) && value.length > 0;
  }

  static hex2str(hex: string) {
    return Hex.hex2a(hex);
  }

  static hex2str2json(hex: string) {
    const str = Utils.hex2str(hex.replace(/^0x/, ""));
    return JSON.parse(str);
  }

  static httpStatusMap: Record<number, string> = {
    200: "OK",
    201: "Created",
    202: "Accepted",
    204: "No Content",
    301: "Moved Permanently",
    302: "Found",
    304: "Not Modified",
    400: "Bad Request",
    401: "Unauthorized",
    403: "Forbidden",
    404: "Not Found",
    405: "Method Not Allowed",
    409: "Conflict",
    422: "Unprocessable Entity",
    500: "Internal Server Error",
    501: "Not Implemented",
    502: "Bad Gateway",
    503: "Service Unavailable",
    504: "Gateway Timeout"
  }

  static messageMap = new Map<string, MessageField[]>([
    [
      "AnvilMessage",
      [
        { name: "app", type: "address" },
        { name: "nonce", type: "uint32" },
        { name: "max_gas_price", type: "uint128" },
        { name: "data", type: "string" },
      ]
    ],
  ]);

  static inputTransactorTypeMap = new Map<string, PrimaryType>([
    [
      "Anvil", "AnvilMessage"
    ],
  ]);

}
