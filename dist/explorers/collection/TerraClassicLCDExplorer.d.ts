export default class TerraClassicLCDExplorer extends Explorer {
    constructor({ wallet, config }: {
        wallet: any;
        config: any;
    }, ...args: any[]);
    lcdClient: LCDClient;
    cacheTime: number;
    cache: {};
    getLcdWallet(privateKey: any): import("@terra-money/terra.js").Wallet;
    isCached(func: any): any;
    putCache(key: any, value: any): void;
    getCache(key: any): any;
    getBalance(address: any, useSatoshis: any, denom?: any): Promise<any>;
    getTokenBalanceByContractAddress({ address, contractAddress }: {
        address: any;
        contractAddress: any;
    }): Promise<any>;
    sendTransaction(tx: any): Promise<import("@terra-money/terra.js").SyncTxBroadcastResult>;
    getUserDenomList(address: any): Promise<{
        symbol: any;
        name: string;
        decimals: any;
        denom: string;
    }[]>;
    estimateFee(signers: any, options: any): Promise<import("@terra-money/terra.js").Fee>;
    calculateTax(coin: any): Promise<import("@terra-money/terra.js").Coin>;
    getAccountInfo(address: any): Promise<import("@terra-money/terra.js").Account>;
    getValidators(address: any): Promise<[import("@terra-money/terra.js").Validator[], import("@terra-money/terra.js/dist/client/lcd/APIRequester").Pagination]>;
    getStakingInfo(address: any): Promise<{
        validators: [import("@terra-money/terra.js").Validator[], import("@terra-money/terra.js/dist/client/lcd/APIRequester").Pagination];
    }>;
    getStakedDelegations(address: any): Promise<any>;
    getRewardsBalance(address: any): Promise<any>;
    getUnbondingDelegations(address: any): Promise<any>;
}
import Explorer from '../../explorers/explorer.js';
import { LCDClient } from '@terra-money/terra.js';
