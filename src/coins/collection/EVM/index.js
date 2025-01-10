import EVMCoin from '../EVMCoin';
import { generateId } from './generateId';
export const generateExplorerConfig = ({ chainId, rpcBaseUrl }) => {
  return {
    className: 'Web3Explorer',
    baseUrl: new URL(rpcBaseUrl).origin,
    chainId,
    usedFor: ['node', 'balance', 'tx', 'send'],
  };
};
export const generateDefaultFeeConfig = () => {
  return {
    defaultGasPrice: 150,
    defaultMaxGasPrice: 1000,
    gasPriceCoefficient: 1,
    nftGasPriceCoefficient: 1,
    gasLimit: 21000,
    maxGasLimit: 150000,
    gasLimitCoefficient: 1,
    nftGasLimitCoefficient: 1,
    resendTimeout: 3,
    unspendableBalance: 0,
  };
};
export function isRpcBaseUrlValid(rpcBaseUrl) {
  try {
    const url = new URL(rpcBaseUrl);
    return url.protocol === 'https:';
  } catch {
    throw new TypeError('CreateEVMCoin: Invalid RPC Url');
  }
}
export function createEVMCoin({
  ticker,
  name,
  chainId,
  rpcBaseUrl,
  explorerWebUrl = 'https://etherscan.io',
  features,
}) {
  if (!ticker || !name || !chainId || !rpcBaseUrl) {
    throw new TypeError(
      'CreateEVMCoin: Missing arguments.\n Every of [ticker, name, chainId, rpcBaseUrl] must be provided!',
    );
  }
  if (!isRpcBaseUrlValid(rpcBaseUrl)) {
    throw new TypeError('CreateEVMCoin: [rpcBaseUrl] should be `https` only`');
  }
  const explorerConfig = generateExplorerConfig({ chainId, rpcBaseUrl });
  return new EVMCoin({
    id: generateId({ ticker, chainId, walletType: 'EVM' }),
    alias: 'atomic',
    name,
    ticker,
    chainId,
    features,
    feeData: generateDefaultFeeConfig(),
    explorers: [explorerConfig],
    isL2: false,
    isUseModeratedGasPrice: false,
    isUseEIP1559: false,
    txWebUrl: `${explorerWebUrl.replace(/\/+$/, '')}/tx/`,
    socket: false,
    isCustom: true,
  });
}
