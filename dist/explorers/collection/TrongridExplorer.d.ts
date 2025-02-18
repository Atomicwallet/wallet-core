export default TrongridExplorer;
/**
 * Class for tronscan explorer.
 *
 */
declare class TrongridExplorer extends Explorer {
    constructor(...args: any[]);
    defaultTxLimit: number;
    addressHex(address: any): any;
    /**
     * Gets the information url.
     *
     * @param address
     * @return {string} The information url.
     */
    getInfoUrl(address: any): string;
    /**
     * Get transaction list params
     *
     * @return {Object}
     */
    getTransactionsParams(address: any, offset?: number, limit?: number): Object;
    /**
     * Modify information response
     *
     * @return {Object} { description_of_the_return_value }
     */
    modifyInfoResponse(response: any): Object;
    /**
     * Gets the transaction url.
     *
     * @param  {<type>} txId The transmit identifier
     * @return {<type>} The transaction url.
     */
    getTransactionUrl(txId: <type>() => any): <type>() => any;
    /**
     * Gets the transactions url.
     *
     * @return {<type>} The transactions url.
     */
    getTransactionsUrl(address: any): <type>() => any;
    getContractInfoUrl(): string;
    getContractInfoMethod(): string;
    getContractInfoParams(contract: any): {
        value: any;
        visible: boolean;
    };
    getChainParametersUrl(): string;
    getAccountResourceUrl(): string;
    getAccountResourceMethod(): string;
    getAccountResourceParams(address: any): {
        address: any;
        visible: boolean;
    };
    getContractInfo(contract: any): Promise<object>;
    getChainParameters(): Promise<object>;
    getAccountResource(address: any): Promise<object>;
    getEstimatedEnergyUrl(): string;
    getEstimatedEnergyMethod(): string;
    /**
     * @param {string} args.owner_address trx address
     * @param {string} args.function_selector smart-contract function with params
     * @param {string} args.parameter hex representation on smart-contract function call
     * @param {boolean} args.visible
     * @return {args}
     */
    getEstimatedEnergyParameters(args: any): any;
    getDynamicEnergyParameters(): Promise<object>;
    /**
     * returns only dynamic energy parameters
     *
     * @param response
     * @return {object}
     */
    modifyDynamicEnergyParametersResponse(response: any): object;
    modifyEstimagedEnergyResponse(response: any): any;
    /**
     * Request for smart-contract call emulation
     *
     * @param args
     * @return {Promise<*>}
     */
    getEstimatedEnergy(args: any): Promise<any>;
    /**
     * Modify transactions response
     *
     * @return {<type>} { description_of_the_return_value }
     */
    modifyTransactionsResponse(response: any, address: any, asset?: any): <type>() => any;
    /**
     * Gets a balance from a wallet info.
     *
     * @return {Promise<String>} The balance.
     */
    getBalance(): Promise<string>;
    /**
     * Get asset ticker from tx
     * @param tx
     * @return {string|*}
     */
    getTxAsset(tx: any): string | any;
    /**
     * Gets the transmit hash.
     *
     * @param  {<type>} tx The transmit
     * @return {<type>} The transmit hash.
     */
    getTxHash(tx: <type>() => any): <type>() => any;
    /**
     * Gets the transmit direction.
     *
     * @param  {<type>} tx The transmit
     * @return {<type>} The transmit direction.
     */
    getTxDirection(selfAddress: any, tx: <type>() => any): <type>() => any;
    /**
     * Gets the transmit recipient.
     *
     * @param  {<type>} tx The transmit
     * @return {<type>} The transmit recipient.
     */
    getTxOtherSideAddress(selfAddress: any, tx: <type>() => any): <type>() => any;
    /**
     * Gets the transmit value.
     *
     * @param  {<type>} tx The transmit
     * @return {<type>} The transmit value.
     */
    getTxValue(selfAddress: any, tx: <type>() => any, decimal?: any): <type>() => any;
    /**
     * Gets the transmit date time.
     *
     * @param  {<type>} tx The transmit
     * @return {Date} The transmit date time.
     */
    getTxDateTime(tx: <type>() => any): Date;
    /**
     * Gets the transmit confirmations.
     *
     * @param  {<type>} tx The transmit
     * @return {<type>} The transmit confirmations.
     */
    getTxConfirmations(tx: <type>() => any): <type>() => any;
}
import Explorer from '../../explorers/explorer.js';
