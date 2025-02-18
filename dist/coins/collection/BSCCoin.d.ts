export default BSCCoin;
declare const BSCCoin_base: {
    new (): {
        [x: string]: any;
        createSmartContractCall({ type, smartContractAddress, standard, action, args }?: string): string;
        makeRawCall(abi: any, contract: string, method: string, args?: Array<any>): Promise<any>;
        getContractConstants(contract: string): Promise<{}>;
        decodeTransactionData(data: any): Promise<import("@ethersproject/abi").TransactionDescription>;
        estimateDataGas({ contract, data, amount }: {
            contract: any;
            data: any;
            amount?: string | undefined;
        }): Promise<string>;
        getAllowance({ contract, spender, abi }: string): any;
        makeApproval({ contract, address, amount }: string): string;
        createApproveTransaction({ contract, address, amount, userGasPrice, gasLimit, multiplier, nonce }?: {}): any;
    };
    [x: string]: any;
};
/**
 * @class BSCCoin
 */
declare class BSCCoin extends BSCCoin_base {
    /**
     * constructs the object.
     *
     * @param  {object} config
     */
    constructor(config: object, db: any, configManager: any);
    derivation: string;
    bannedTokens: any[];
    web3: Web3Explorer;
    baseUrl: any;
    tokens: {};
    nonce: any;
    setFeeData(feeData?: {}): void;
    gasLimit: string | undefined;
    nftGasLimitCoefficient: any;
    nftGasPriceCoefficient: any;
    gasLimitCoefficient: any;
    gasPriceCoefficient: any;
    defaultGasPrice: any;
    defaultMaxGasPrice: any;
    resendTimeout: any;
    getTransactions(): Promise<any>;
    isFeeDynamic(): boolean;
    /**
     * Retry init web3 provider each 10 seconds
     * if `new Web3` throws error for some reason
     *
     * @param provider url string
     */
    initProvider(provider: any): void;
    coreLibrary: Web3 | undefined;
    /**
     * Loads a wallet.
     *
     * @param {BitcoreMnemonic} mnemonic The private key object.
     * @return {Promise<Object>} The private key.
     */
    loadWallet(seed: any): Promise<Object>;
    address: string | undefined;
    /**
     * The address getter
     *
     * @return {String} { description_of_the_return_value }
     */
    getAddress(): string;
    /**
     * Validates wallet address
     *
     * @param {String} address The address
     * @return {Boolean}
     */
    validateAddress(address: string): boolean;
    /**
     * Creates a transaction.
     *
     * @param {String} address The destination address
     * @param {Number} amount The amount to send
     * @param {String} paymentData The payment id (only HEX value!)
     * @param {String} gasLimit
     * @param {Number} multiplier coefficient
     * @return {Promise<String>} Raw transaction
     */
    createTransaction({ address, amount, paymentData, nonce, userGasPrice, gasLimit, multiplier, }: string): Promise<string>;
    createTokenTransaction({ address, amount, custom, userGasPrice, gasLimit, contract, multiplier, nonce }: {
        address: any;
        amount: any;
        custom: any;
        userGasPrice: any;
        gasLimit: any;
        contract: any;
        multiplier: any;
        nonce: any;
    }): Promise<string>;
    /**
     * Gets nft gas price from node
     *
     * @param {number} [gasPriceCoefficient = 1] - Custom coefficient for tune gas.
     * @returns {Promise<string>}
     * @throws {ExternalError}
     */
    getNftGasPrice(gasPriceCoefficient?: number): Promise<string>;
    /**
     * Gets gas limit from node
     *
     * @param {string} address - Wallet address.
     * @param {string} toAddress - Destination wallet address.
     * @param {number} nonce - Nonce.
     * @param {string} data - Encoded token ABI data.
     * @param {number} [gasLimitCoefficient = 1] - Custom coefficient for tune gas limit.
     * @returns {Promise<string>}
     * @throws {ExternalError}
     */
    estimateGasForSendNft(address: string, toAddress: string, nonce: number, data: string, gasLimitCoefficient?: number): Promise<string>;
    /**
     * @typedef UserFeeOptions
     * @type {Object}
     * @property {string} [userGasLimit] - Custom gas limit.
     * @property {string} [userGasPrice] - Custom gas price.
     */
    /**
     * @param {string} toAddress - The destination address.
     * @param {string} data - Contract encoded data.
     * @param {UserFeeOptions} userOptions - Custom user options.
     * @returns {Promise<{gasLimit: string, gasPrice: string, nonce: number}>}
     */
    getNftTransferGasParams(toAddress: string, data: string, { userGasPrice, userGasLimit }: {
        /**
         * - Custom gas limit.
         */
        userGasLimit?: string | undefined;
        /**
         * - Custom gas price.
         */
        userGasPrice?: string | undefined;
    }): Promise<{
        gasLimit: string;
        gasPrice: string;
        nonce: number;
    }>;
    /**
     * Gets the fee required to transfer the NFT
     *
     * @param {Object} params
     * @param {string | null} params.contractAddress - NFT contract address.
     * @param {string} params.tokenId - Token id.
     * @param {ERC721_TOKEN_STANDARD | ERC1155_TOKEN_STANDARD | string} params.tokenStandard - Token standard.
     * @param {string} params.toAddress - Recipient address.
     * @param {UserFeeOptions} [params.userOptions={}] - Custom user options.
     * @return {Promise<BN>} - The fee.
     * @throws {ExternalError}
     */
    getNftFee({ contractAddress, tokenId, tokenStandard, toAddress, userOptions }: {
        contractAddress: string | null;
        tokenId: string;
        tokenStandard: ERC721_TOKEN_STANDARD | ERC1155_TOKEN_STANDARD | string;
        toAddress: string;
        userOptions?: {
            /**
             * - Custom gas limit.
             */
            userGasLimit?: string | undefined;
            /**
             * - Custom gas price.
             */
            userGasPrice?: string | undefined;
        } | undefined;
    }): Promise<BN>;
    /**
     * Creates an NFT transfer transaction.
     *
     * @param {string} toAddress - The destination address.
     * @param {string} contractAddress - NFT contract address.
     * @param {string} data - Contract encoded data.
     * @param {UserFeeOptions} [userOptions={}] - Custom user options.
     * @return {Promise<string>} - Raw transaction
     * @throws {ExternalError}
     */
    createNftTransaction({ toAddress, contractAddress, data, userOptions }: string): Promise<string>;
    getNonce(): Promise<any>;
    /**
     * Gets the fee.
     *
     * @param  {Number}  amount In satoshis
     * @param  {Boolean} isSendAll The is send all (default: false)
     * @return {Promise<BN>} The fee.
     */
    getFee({ userGasPrice, gasLimit }?: number): Promise<BN>;
    getGasPrice(withoutCoeff?: boolean): Promise<any>;
    estimateGas(amount: any, address: any, contract: any, defaultGas?: string): Promise<string>;
    /**
     * Return available balance for send
     *
     * @return {Promise<string>}
     */
    availableBalance(fee: any): Promise<string>;
    getInfo(tokenInfo: any): Promise<{
        balance: any;
    }>;
    balance: any;
    /**
     * Creates a token.
     *
     * @param {...Array} args The arguments
     * @return {BSCToken}
     *
     **/
    createToken(args: any[][]): BSCToken;
    /**
     * Returns user token list data
     * @returns {Promise<Array>}
     */
    getUserTokenList(): Promise<any[]>;
    /**
     * Returns all token list data
     * @returns {Promise<Array>}
     */
    getTokenList(): Promise<any[]>;
    /**
     * Returns banned token list data
     * @returns {Promise<Array>}
     */
    getBannedTokenList(): Promise<any[]>;
    gasPrice(): Promise<any>;
    setPrivateKey(privateKey: any): void;
    getGasRange(sendType?: string): any;
    getEstimatedTimeCfg(force?: boolean): Promise<any>;
    gasPriceConfig: any;
    getEstimatedTimeTx(gasPrice: any, mapping?: boolean): Promise<any>;
    /**
     * Sign data with pk
     * @param {string} data
     * @return {Sign}
     */
    signData(data: string): Sign;
    /**
     * Sign with provided 3-th party signer callback
     *
     * @param data Data to sign
     * @param signer Callback function
     * @return {*}
     */
    signWithCustomSigner({ data, signer }: {
        data: any;
        signer: any;
    }): any;
    #private;
}
import Web3Explorer from '../../explorers/collection/Web3Explorer.js';
import Web3 from 'web3';
import BN from 'bn.js';
import { BSCToken } from '../../tokens/index.js';
