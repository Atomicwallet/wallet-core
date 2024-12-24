import type BN from 'bn.js';

export type WalletId = string;
export type WalletTicker = string;
export type WalletName = string;
export type WalletAlias = string;
export type WalletAddress = string;
export type WalletDecimal = number;
export type WalletConfirmation = boolean;
export type WalletNetwork = string;
export type WalletChainId = string | number;
export type WalletContract = string;

export type RawTxHex = string;
export type RawTxBinary = Uint8Array;
export type RawTxObject = object;
export type TxHash = string;

export type WalletIdentifierType = {
  id: WalletId;
  ticker?: WalletTicker;
  name?: WalletName;
  address?: WalletAddress;
  confirmed?: WalletConfirmation;
  decimal?: WalletDecimal;
  contract?: WalletContract;
  network?: WalletNetwork;
  chainId?: WalletChainId;
  parent?: WalletId;
};

export type WalletConfigType = {
  id: WalletId;
  ticker: WalletTicker;
  name: WalletName;
  decimal: WalletDecimal;
};

export type CreateTxParams = {
  address: string;
  amount: string;
  memo?: string | number;
  contract?: WalletContract;
  gasLimit?: BN | string;
  paymendData?: string | object | Uint8Array;
};

export type CreateNftTxParams = {
  toAddress: string;
  contractAddress?: WalletContract;
  data: string;
  userOptions?: {
    userGasPrice: string;
    userGasLimit: string;
  };
};

export type NftFeeParams = {
  contractAddress?: WalletContract;
  tokenId: string;
  tokenStandard: string; // @TODO should be enum
  toAddress: string;
  userOptions?: {
    userGasPrice: string;
    userGasLimit: string;
  };
};

export type RawTxHash = {
  txid: TxHash;
};
