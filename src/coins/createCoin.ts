import type { Coin, CoinConfigType } from 'src/abstract';
import { createEVMCoin } from 'src/coins/collection/EVM';
import type { EVMConfig, EVMUserConfig } from 'src/coins/collection/EVM/types';

export type CoinDataConfig = CoinConfigType & Partial<EVMUserConfig> & Partial<EVMConfig> & { walletType?: string };

/**
 * Creates new coin instance
 * @param CoinClass
 * @param coinData
 * @return {Coin}
 */
export default function createCoin(CoinClass: unknown, coinData: CoinDataConfig): Coin {
  if (coinData.walletType === 'EVM') {
    // @todo define proper return type
    return createEVMCoin(coinData) as unknown as Coin;
  }

  // @ts-expect-error define generic type
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return new CoinClass({
    id: coinData.id,
    ticker: coinData.ticker,
    name: coinData.name,
    isL2: coinData.isL2,
    isUseModeratedGasPrice: coinData.isUseModeratedGasPrice,
    isUseEIP1559: coinData.isUseEIP1559,
    alias: 'atomic',
    features: coinData.features,
    feeData: coinData.feeData,
    explorers: coinData.explorers,
    txWebUrl: coinData.txWebUrl,
    socket: !!coinData.socket,
    stakingContract: coinData.feeData?.stakingContract,
    stakingProxyContract: coinData.feeData?.stakingProxyContract,
    network: coinData.network,
    chainId: coinData.chainId,
    notify: coinData.notify ?? false,
    isTestnet: !!coinData.isTestnet,
    atomicId: coinData.atomicId,
    // Cosmos like
    prefix: coinData.prefix,
    denom: coinData.denom,
    derivation: coinData.derivation,
    decimal: coinData.decimal,
  });
}
