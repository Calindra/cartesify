export type ObjectLike = Record<string, unknown>;export interface Log {
  info(...args: unknown[]): void;
  error(...args: unknown[]): void;
}

