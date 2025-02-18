import { IConfigManager, ConfigManagerResponse } from './types.js';
export * from './types.js';
declare class DefaultConfigManager implements IConfigManager {
    get(id: string): Promise<ConfigManagerResponse>;
    getLocal(id: string): Promise<ConfigManagerResponse | undefined>;
    register(id: string): void;
}
declare const _default: DefaultConfigManager;
export default _default;
