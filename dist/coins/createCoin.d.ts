import type { Coin, CoinConfigType, ILogger } from '../abstract/index.js';
import type { EVMConfig, EVMUserConfig } from '../coins/collection/EVM/types.js';
import { IConfigManager } from '../utils/configManager/index.js';
import { IDataBase } from '../utils/db/index.js';
export type CoinDataConfig = CoinConfigType & Partial<EVMUserConfig> & Partial<EVMConfig> & {
    walletType?: string;
};
/**
 * Creates new coin instance
 */
export default function createCoin(CoinClass: unknown, coinData: CoinDataConfig, db?: IDataBase, configManager?: IConfigManager, logger?: ILogger): Coin;
