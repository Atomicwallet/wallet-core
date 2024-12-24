import * as coins from '@/coins/collection';
import { Coin } from '@/abstract';
import createCoin from '@/coins/createCoin';
import configs from '@/resources/wallets_fee.json'

const createWallets = async () => {
  return configs.reduce((accum: Coin[], coinData: any) => {
    const coinClass = coinData.className as keyof typeof coins
    if (coins[coinClass]) {
      const wallet = createCoin(
        coins[coinClass],
        coinData,
      );

      accum.push(wallet);
    }

    return accum;
  }, []);
};

export { createWallets };
