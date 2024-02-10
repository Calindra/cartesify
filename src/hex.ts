import { ObjectLike } from "./types";

export class Hex {
  static hex2a(hex: string) {
    let str = "";

    for (let i = 0; i < hex.length; i += 2) {
      let v = parseInt(hex.substring(i, i + 2), 16);
      if (v) str += String.fromCharCode(v);
    }
    return str;
  }

  static obj2hex(obj: ObjectLike): string {
    return "0x" + Buffer.from(JSON.stringify(obj)).toString("hex").toUpperCase();
  }
}
