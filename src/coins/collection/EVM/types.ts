import type { WalletAlias, WalletId, WalletName, WalletTicker } from '@/abstract';

export type EVMFeeType = number;

export type EVMFeeConfig = {
  defaultGasPrice: EVMFeeType;
  defaultMaxGasPrice: EVMFeeType;
  gasPriceCoefficient: EVMFeeType;
  nftGasPriceCoefficient: EVMFeeType;
  gasLimit: EVMFeeType;
  maxGasLimit: EVMFeeType;
  gasLimitCoefficient: EVMFeeType;
  nftGasLimitCoefficient: EVMFeeType;
  resendTimeout: EVMFeeType;
  unspendableBalance: EVMFeeType;
};

export type EVMExplorerConfig = {
  className: string;
  baseUrl: string;
  chainId: number;
  txLimit?: number;
  usedFor: string[];
};

export type EVMConfig = {
  id?: WalletId;
  ticker: WalletTicker;
  name: WalletName;
  alias: WalletAlias;
  isL2: boolean;
  isUseModeratedGasPrice: boolean;
  isUseEIP1559?: boolean;
  feeData: EVMFeeConfig;
  explorers: EVMExplorerConfig[];
  txWebUrl: string;
  socket: boolean;
  network: string;
  chainId: number;
  notify?: boolean;
  isTestnet?: boolean;
  isCustom?: boolean;
};

export type EVMSpecific = {
  chainId: number;
  rpcBaseUrl: string;
};

export type EVMUserConfig = {
  ticker: WalletTicker;
  name: WalletName;
  explorerWebUrl?: string;
  features?: string[];
} & Partial<EVMSpecific>;
