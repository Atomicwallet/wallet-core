export default ZilliqaNodeExplorer;
declare class ZilliqaNodeExplorer extends ZilliqaAbstractExplorer {
    constructor(...args: any[]);
    zilliqa: Zilliqa;
    sendTransaction({ rawtx, privateKey }: {
        rawtx: any;
        privateKey: any;
    }): Promise<{
        txid: any;
    }>;
    getBalance(address: any, contract: any): Promise<{
        balance: any;
        nonce: number;
    }>;
    getStakingBalance(address: any, contract: any): Promise<{
        staking: {
            validators: {
                address: any;
                amount: any;
            };
        };
        withdrawals: {} | {
            total: any;
            availableWithdrawal: {
                total: any;
            };
            pendingWithdrawal: {
                total: any;
            };
        };
    }>;
    getRewards(address: any, contract: any, staking: any): Promise<{
        total: any;
        validators: {};
    } | {
        total: string;
    }>;
    getTokenBalance(address: any, contracts: any): Promise<any[]>;
    getInfoParams(address: any): {
        id: string;
        jsonrpc: string;
        method: RPCMethod;
        params: any[];
    };
    /**
     * Returs rewars from all delegated validators
     * @param address
     * @param ssnContract
     * @param validators
     * @returns {Promise<{total: *, validators: {}}|undefined>}
     */
    getRewardsFromContract(address: any, ssnContract: any, { validators }: {
        validators: any;
    }): Promise<{
        total: any;
        validators: {};
    } | undefined>;
    /**
     * Returns all delegations from specified address
     *
     * @param address
     * @param contract
     * @returns {Promise<{validators: { address, amount }}>}
     */
    getStakedAmountFromContract(address: any, ssnContract: any): Promise<{
        validators: {
            address: any;
            amount: any;
        };
    }>;
    /**
     * Returns unbonding amounts for every validators
     * @param address
     * @param ssnContract
     * @returns {Promise<{total: *, availableWithdrawal: {total: *}, pendingWithdrawal: {total: *}}|{}>}
     */
    getWithdrawalsFromContract(address: any, ssnContract: any): Promise<{
        total: any;
        availableWithdrawal: {
            total: any;
        };
        pendingWithdrawal: {
            total: any;
        };
    } | {}>;
    getBlockchainInfo(): Promise<any>;
    modifyInfoResponse(data: any): {
        balance: any;
        nonce: any;
    };
}
import ZilliqaAbstractExplorer from './ZilliqaAbstractExplorer.js';
import { Zilliqa } from '@zilliqa-js/zilliqa';
import { RPCMethod } from '@zilliqa-js/core';
