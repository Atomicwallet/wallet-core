export default NearRPCExplorer;
declare class NearRPCExplorer extends Explorer {
    constructor(...args: any[]);
    provider: nearAPI.providers.JsonRpcProvider;
    _getNodeConfig(): Promise<import("near-api-js/lib/providers/provider").NearProtocolConfig | null>;
    getNodeConfig: lodash.DebouncedFuncLeading<() => Promise<import("near-api-js/lib/providers/provider").NearProtocolConfig | null>>;
    getAccessKey(address: any, publicKey: any): Promise<import("near-api-js/lib/providers/provider").QueryResponseKind>;
    sendTransaction(rawtx: any): Promise<{
        txid: any;
    }>;
    _getGasPrice(): Promise<string | null>;
    getGasPrice: lodash.DebouncedFuncLeading<() => Promise<string | null>>;
    getInfo(selfAddress: any): Promise<{
        balance: any;
        unspendable: any;
    } | {
        balance: string;
        unspendable?: undefined;
    }>;
    fetchStakingInfo(selfAddress: any, { activeValidators }?: {
        activeValidators?: never[] | undefined;
    }): Promise<{
        staked: Amount;
        unstaking: Amount;
        pendingWithdrawals: Amount;
        availableWithdrawals: Amount;
        validators: {};
    }>;
    /**
     * Fetch stakings info from validator smart-contract
     *
     * @param address
     * @param validator
     * @returns {Promise<{
     * unstaking: Amount,
     * total: Amount,
     * availableForWithdraw: Amount,
     * pendingWithdrawals: Amount,
     * staked: Amount,
     * availableWithdrawals: Amount}>
     * }
     */
    getValidatorInfo(address: any, validator: any): Promise<{
        unstaking: Amount;
        total: Amount;
        availableForWithdraw: Amount;
        pendingWithdrawals: Amount;
        staked: Amount;
        availableWithdrawals: Amount;
    }>;
    /**
     * Function to call smart-contract method.
     *
     * List of available method names:
     *
     * 'get_account_staked_balance',
     * 'get_account_unstaked_balance',
     * 'get_account_total_balance',
     * 'is_account_unstaked_balance_available',
     * 'get_total_staked_balance',
     * 'get_owner_id'
     * 'get_reward_fee_fraction'
     * 'get_farms'
     * 'get_farm'
     * 'get_active_farms',
     * 'get_unclaimed_reward',
     * 'get_pool_summary',
     *
     * @param contractId
     * @param methodName
     * @param args
     * @throws ExternalError
     * @returns {Promise<any>}
     */
    viewFunction(contractId: any, methodName: any, args?: {}): Promise<any>;
    jsonFromRawResponse(res: any): any;
    bytesJsonStringify(args: any): Buffer<ArrayBuffer>;
}
import Explorer from '../../explorers/explorer.js';
import * as nearAPI from 'near-api-js';
import lodash from 'lodash';
import { Amount } from '../../utils/index.js';
