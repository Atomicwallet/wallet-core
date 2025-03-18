import type { Coin } from '../abstract/index.js';
import { IConfigManager } from '../utils/configManager/index.js';
import { IDataBase } from '../utils/db/index.js';
export declare const createWallets: (arg?: {
    id: string;
}, db?: IDataBase, configManager?: IConfigManager) => Promise<Coin[]>;
