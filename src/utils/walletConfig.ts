import type { CoinConfigType } from '@/abstract';
import walletsConfig from '@/resources/wallets_fee.json';

const getWalletConfig = ({ id }: Pick<CoinConfigType, 'id'>): unknown => {
  return walletsConfig.find(({ id: coinId }) => coinId === id);
};

export { getWalletConfig };
