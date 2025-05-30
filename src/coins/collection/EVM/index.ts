import { IConfigManager } from 'src/utils/configManager';
import { IDataBase } from 'src/utils/db';

import EVMCoin from '../EVMCoin';
import { generateId } from './generateId';
import type { EVMExplorerConfig, EVMFeeConfig, EVMSpecific, EVMUserConfig } from './types';

export { default as EVMCoin } from '../EVMCoin';

export const generateExplorerConfig = ({ chainId, rpcBaseUrl }: EVMSpecific): EVMExplorerConfig => {
  return {
    className: 'Web3Explorer',
    baseUrl: new URL(rpcBaseUrl).origin,
    chainId,
    usedFor: ['node', 'balance', 'tx', 'send'],
  };
};

export const generateDefaultFeeConfig = (): EVMFeeConfig => {
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

export function isRpcBaseUrlValid(rpcBaseUrl: string) {
  try {
    const url = new URL(rpcBaseUrl);

    return url.protocol === 'https:';
  } catch {
    throw new TypeError('CreateEVMCoin: Invalid RPC Url');
  }
}

export function createEVMCoin(
  { ticker, name, chainId, rpcBaseUrl, explorerWebUrl = 'https://etherscan.io', features }: EVMUserConfig,
  db?: IDataBase,
  configManager?: IConfigManager,
): EVMCoin {
  if (!ticker || !name || !chainId || !rpcBaseUrl) {
    throw new TypeError(
      'CreateEVMCoin: Missing arguments.\n Every of [ticker, name, chainId, rpcBaseUrl] must be provided!',
    );
  }

  if (!isRpcBaseUrlValid(rpcBaseUrl)) {
    throw new TypeError('CreateEVMCoin: [rpcBaseUrl] should be `https` only`');
  }

  const explorerConfig = generateExplorerConfig({ chainId, rpcBaseUrl });

  return new EVMCoin(
    {
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
    },
    db,
    configManager,
  );
}
