import { createEVMCoin } from '../coins/collection/EVM/index.js';
/**
 * Creates new coin instance
 */
export default function createCoin(CoinClass, coinData, db, configManager) {
    if (coinData.walletType === 'EVM') {
        // @todo define proper return type
        return createEVMCoin(coinData, db, configManager);
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
    }, db, configManager);
}
//# sourceMappingURL=createCoin.js.map