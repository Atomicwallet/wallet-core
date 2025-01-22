import type { Coin, ILogger } from 'src/abstract';
import * as coins from 'src/coins/collection';
import createCoin from 'src/coins/createCoin';
import walletsConfig from 'src/resources/wallets_fee.json';

import { IConfigManager } from '../utils/configManager';
import { IDataBase } from '../utils/db';

export const createWallets = async (
  arg?: { id: string },
  db?: IDataBase,
  configManager?: IConfigManager,
  logger?: ILogger,
) => {
  const config = arg ? walletsConfig.filter(({ id: coinId }) => coinId === arg.id) : walletsConfig;

  return config.reduce((accum: Coin[], coinData: any) => {
    const coinClass = coinData.className as keyof typeof coins;
    if (coins[coinClass]) {
      const wallet = createCoin(coins[coinClass], coinData, db, configManager, logger);

      accum.push(wallet);
    }

    return accum;
  }, []);
};
