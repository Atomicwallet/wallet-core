export default class TerraLCDExplorer extends Explorer {
    constructor({ wallet, config }: {
        wallet: any;
        config: any;
    }, ...args: any[]);
    lcdClient: LCDClient;
    getBalance(address: any, useSatoshis: any, denom?: any): Promise<string>;
    waitForTx(txhash: any): Promise<any>;
    sendTransaction(rawtx: any): Promise<{
        txid: string;
    }>;
    estimateFee(signers: any, options: any): Promise<import("@terra-money/terra.js").Fee>;
    calculateTax(coin: any): Promise<import("@terra-money/terra.js").Coin>;
    getAccountInfo(address: any): Promise<import("@terra-money/terra.js").Account>;
    getValidators(address: any): Promise<[import("@terra-money/terra.js").Validator[], import("@terra-money/terra.js/dist/client/lcd/APIRequester").Pagination]>;
    getStakingInfo(address: any): Promise<{
        validators: [import("@terra-money/terra.js").Validator[], import("@terra-money/terra.js/dist/client/lcd/APIRequester").Pagination];
    }>;
    getStakedDelegations(address: any): Promise<import("@terra-money/terra.js").Delegation[]>;
    getRewardsBalance(address: any): Promise<import("@terra-money/terra.js").Rewards>;
    getUnbondingDelegations(address: any): Promise<import("@terra-money/terra.js").UnbondingDelegation[]>;
    getLcdWallet(privateKey: any): import("@terra-money/terra.js").Wallet;
}
import Explorer from '../../explorers/explorer.js';
import { LCDClient } from '@terra-money/terra.js';
