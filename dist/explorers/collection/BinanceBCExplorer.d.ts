export default BinanceBCExplorer;
declare class BinanceBCExplorer extends Explorer {
    getStakingInfoMethod(): string;
    getStakingInfoBaseUrl(address: any): string;
    getDelegationsUrl(address: any): string;
    getUnDelegationsUrl(address: any): string;
    getReDelegationsUrl(address: any): string;
    getRewardsUrl(address: any): string;
    /**
     * Fetch active delegations for given address
     *
     * @param address { String }
     * @param offset {  Number}
     * @param limit { Number }
     * @returns {Promise<QueryDelegationsResponse>)|[]>}
     * */
    getDelegations({ address, offset, limit }?: string): Promise<QueryDelegationsResponse>;
    /**
     * Fetch active unDelegations for given address
     *
     * @param address { String }
     * @param offset {  Number}
     * @param limit { Number }
     * @returns {Promise<QueryUndelegationsResponse>)|[]>}
     * */
    getUnDelegations({ address, offset, limit }?: string): Promise<QueryUndelegationsResponse>;
    /**
     * Fetch active reDelegations for given address
     *
     * @param address { String }
     * @param offset {  Number}
     * @param limit { Number }
     * @returns {Promise<QueryRedelegationsResponse>)|[]>}
     */
    getReDelegations({ address, offset, limit }?: string): Promise<QueryRedelegationsResponse>;
    /**
     * Fetch active rewards for given address
     *
     * @param address { String }
     * @param offset { Number }
     * @param limit { Number }
     * @returns {Promise<*>}
     */
    getRewards({ address, offset, limit }?: string): Promise<any>;
    /**
     * Fetch active validators for given user address
     * returns validator address and validator name
     *
     * @param operations {Array <Array<Object>, Array<Object>> | undefined}
     * @param address {String}
     * @returns {Promise<any>}
     */
    getUserValidators(address?: string, operations?: Array<Array<Object>, Array<Object>> | undefined): Promise<any>;
    /**
     * Fetch staking balances from active validators by given user address
     *
     * @param address {String}
     * @returns {Promise<{staking: {total: string, validators: {}, unstake: string}, total: *}>}
     */
    fetchStakingInfo(address: string): Promise<{
        staking: {
            total: string;
            validators: {};
            unstake: string;
        };
        total: any;
    }>;
}
import Explorer from '../../explorers/explorer.js';
