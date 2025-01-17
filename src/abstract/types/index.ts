export type ConfigManagerResponse = Array<any> | Record<string, any>;

export interface ConfigManagerInterface {
  register(id: string): void;
  get(id: string): Promise<ConfigManagerResponse>;
  getLocal(id: string): Promise<ConfigManagerResponse | undefined>;
}

export interface LoggerInterface {
  error(errorObject: Record<string, string>): void;
  log(logObject: Record<string, string>): void;
  warn(warnObject: Record<string, string>): void;
  setUserId?(id: string): void;
}

export * from './abstractWalletTypes';
export * from './coinTypes';
export * from './tokenTypes';
