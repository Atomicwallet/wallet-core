export interface ILogger {
  error(errorObject: Record<string, string>): void;
  log(logObject: Record<string, string>): void;
  warn(warnObject: Record<string, string>): void;
  setUserId?(id: string): void;
}

export * from './abstractWalletTypes';
export * from './coinTypes';
export * from './tokenTypes';
