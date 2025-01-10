import { CoinConfigType } from 'src/abstract';
import walletsConfig from 'src/resources/wallets_fee.json';

const getWalletConfig = ({ id }: Pick<CoinConfigType, 'id'>): unknown => {
  return walletsConfig.find(({ id: coinId }) => coinId === id);
};

export { getWalletConfig };
