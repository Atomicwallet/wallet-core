export default TronNodeExplorer;
/**
 * Full tron node api
 *
 */
declare class TronNodeExplorer extends Explorer {
    getInfoParams(address: any): {
        address: any;
    };
    getRewardUrl(): string;
    getRewardMethod(): string;
    getRewardParams(address: any): {
        address: any;
    };
    getTransactionUrl(txid: any): string;
    getTxHash(tx: any): any;
    getTxValue(selfAddress: any, tx: any): string;
    getTxDirection(selfAddress: any, tx: any): boolean;
    getTxOtherSideAddress(selfAddress: any, tx: any): any;
    getTxDateTime(tx: any): Date;
    getTxConfirmations(tx: any): number;
    getTxAsset(tx: any, tokens: any): any;
    getTxAssetId(tx: any): any;
    modifyTransactionResponse(tx: any, selfAddress: any, tokens: any): Transaction;
    getInfo(address: any): Promise<{
        balance: string;
        assetV2: any;
        stakingInfo: {
            frozen: any;
            votes: any;
            reward: any;
            accountResource: any;
            frozenBalanceForEnergy: any;
        };
    }>;
    modifyInfoResponse(response: any): {
        balance: string;
        assetV2: any;
        stakingInfo: {
            frozen: any;
            votes: any;
            reward: any;
            accountResource: any;
            frozenBalanceForEnergy: any;
        };
    };
}
import Explorer from '../../explorers/explorer.js';
import Transaction from '../../explorers/Transaction.js';
