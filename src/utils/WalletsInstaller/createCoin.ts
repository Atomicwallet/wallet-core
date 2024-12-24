/**
 * Creates a coin from the provided coin class
 * @param  CoinClass class of the coin e.g. BTCCoin
 * @param  {Object} coinData the coin fee data
 * @return {Object}
 */

import { createEVMCoin } from '../../coins/collection/EVM';
import type { Coin, CoinConfigType, FeeDataType, Token } from '@/abstract';
import type { EVMConfig } from '@/coins/collection/EVM/types';

/**
 *
 * @param CoinClass
 * @param coinData
 * @return {Coin}
 */
function createCoin(
  CoinClass: new (config: CoinConfigType & EVMConfig) => Coin | Token,
  coinData: CoinConfigType &
    EVMConfig &
    FeeDataType & {
      walletType?: string;
    },
) {
  if (coinData.walletType === 'EVM') {
    return createEVMCoin(coinData);
  }

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
    // @ts-expect-error @todo define proper types
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
