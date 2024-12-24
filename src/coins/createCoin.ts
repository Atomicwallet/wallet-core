import type { CoinConfigType } from '@/abstract';
import { createEVMCoin } from '@/coins/collection/EVM';
import type { EVMConfig, EVMUserConfig } from '@/coins/collection/EVM/types';

/**
 * Creates new coin instance
 * @param CoinClass
 * @param coinData
 * @return {Coin}
 */
function createCoin(
  CoinClass: unknown,
  coinData: CoinConfigType &
    Partial<EVMUserConfig> &
    Partial<EVMConfig> & { walletType?: string },
) {
  if (coinData.walletType === 'EVM') {
    return createEVMCoin(coinData);
  }

  // @ts-ignore
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

export default createCoin;
