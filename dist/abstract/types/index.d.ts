export interface ILogger {
    error(errorObject: Record<string, string>): void;
    log(logObject: Record<string, string>): void;
    warn(warnObject: Record<string, string>): void;
    setUserId?(id: string): void;
}
export * from './abstractWalletTypes.js';
export * from './coinTypes.js';
export * from './tokenTypes.js';
