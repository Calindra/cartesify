import { Hex } from "./hex";
import { MessageField, PrimaryType } from "./models/input-transactor";
import type { ObjectLike } from "./types";
import { STATUS_CODES } from "node:http"

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

  static onlyAllowXHeaders(headers: unknown) {
    if (!Utils.isObject(headers)) {
      return {};
    }
    return Object.entries(headers).reduce<Record<string, unknown>>((acc, [key, value]) => {
      if (key.toLowerCase().startsWith("x-")) {
        acc[key] = value;
      }
      return acc;
    }, {});
  }

  static httpStatusMap = STATUS_CODES;

  static messageMap = new Map<string, MessageField[]>([
    [
      "AvailMessage",
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
      "Avail", "AvailMessage"
    ],
  ]);

}
