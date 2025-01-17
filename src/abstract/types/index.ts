export type ConfigManagerResponse = Array<any> | Record<string, any>;

export interface ConfigManagerInterface {
  register(id: string): void;
  get(id: string): Promise<ConfigManagerResponse>;
  getLocal(id: string): Promise<ConfigManagerResponse | undefined>;
}

export * from './abstractWalletTypes';
export * from './coinTypes';
export * from './tokenTypes';
