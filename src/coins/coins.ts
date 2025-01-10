import type { Coin } from 'src/abstract';
import * as coins from 'src/coins/collection';
import createCoin from 'src/coins/createCoin';
import walletsConfig from 'src/resources/wallets_fee.json';

export const createWallets = async (arg?: { id: string }) => {
  const config = arg ? walletsConfig.filter(({ id: coinId }) => coinId === arg.id) : walletsConfig;

  return config.reduce((accum: Coin[], coinData: any) => {
    const coinClass = coinData.className as keyof typeof coins;
    if (coins[coinClass]) {
      const wallet = createCoin(coins[coinClass], coinData);

      accum.push(wallet);
    }

    return accum;
  }, []);
};
