export default MATICCoin;
declare const MATICCoin_base: {
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
 * @class MATICCoin
 */
declare class MATICCoin extends MATICCoin_base {
    /**
     * constructs the object.
     *
     * @param  {object} config
     */
    constructor(config: object);
    /** @type {string} */
    web3BaseUrl: string;
    /** @type {object|null} */
    coreLibrary: object | null;
    derivation: string;
    gasPriceConfig: any;
    bannedTokens: any[];
    tokens: {};
    nonce: any;
    /**
     * Sets web3 instance to coreLibrary
     * @returns {Promise<void>}
     */
    initCoreLibrary(): Promise<void>;
    /**
     * Gets web3 instance
     * @returns {Promise<*>}
     */
    getCoreLibrary(): Promise<any>;
    setFeeData(feeData?: {}): void;
    gasLimit: string | undefined;
    nftGasLimitCoefficient: any;
    nftGasPriceCoefficient: any;
    gasLimitCoefficient: any;
    gasPriceCoefficient: any;
    defaultGasPrice: any;
    defaultMaxGasPrice: any;
    resendTimeout: any;
    tokenGasLimit: any;
    getTransactions(): Promise<any[]>;
    /**
     * List to be excluded from wallets list
     * @return {string[]} array of tickers
     */
    getExcludedTokenList(): string[];
    /**
     * Loads a wallet.
     *
     * @param {BitcoreMnemonic} seed The private key object.
     * @return {Promise<Object>} The private key.
     */
    loadWallet(seed: BitcoreMnemonic): Promise<Object>;
    address: any;
    getAddress(): Promise<any>;
    /**
     * Validates wallet address
     *
     * @param {string} address The address
     * @return {boolean}
     */
    validateAddress(address: string): boolean;
    /**
     * Creates a transaction.
     *
     * @param {string} address The destination address
     * @param {number} amount The amount to send
     * @param {string} paymentData The payment id (only HEX value!)
     * @param {string} gasLimit
     * @param {number} multiplier coefficient
     * @return {Promise<string>} Raw transaction
     */
    createTransaction({ address, amount, paymentData, nonce, userGasPrice, gasLimit, multiplier, }: string): Promise<string>;
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
    createTokens(tokens: any[] | undefined, wallets: any): any;
    createTokenTransaction({ address, amount, userGasPrice, gasLimit, contract, multiplier, nonce }: {
        address: any;
        amount: any;
        userGasPrice: any;
        gasLimit: any;
        contract: any;
        multiplier: any;
        nonce: any;
    }): Promise<string>;
    getNonce(): Promise<any>;
    getFee({ userGasPrice, gasLimit, multiplier }?: {
        userGasPrice?: null | undefined;
        gasLimit?: null | undefined;
        multiplier?: any;
    }): Promise<any>;
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
     * Gets nft gas price from node
     *
     * @param {number} [gasPriceCoefficient = 1] - Custom coefficient for tune gas.
     * @returns {Promise<string>}
     * @throws {ExternalError}
     */
    getNftGasPrice(gasPriceCoefficient?: number): Promise<string>;
    getGasPrice(withoutCoeff?: boolean): Promise<any>;
    getModerateGasPrice(): Promise<{
        fastest: any;
        safeLow: any;
    } | {
        fastest?: undefined;
        safeLow?: undefined;
    }>;
    estimateGas(): Promise<any>;
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
     * @return {MATICToken}
     */
    createToken(args: any[][]): MATICToken;
    /**
     * Returns user token list data
     * @returns {Promise<Array>}
     */
    getUserTokenList(): Promise<any[]>;
    /**
     * Returns token data based on config name
     * @param {string} configName
     * @returns {Promise<Array>}
     */
    getTokenLists(configName: string): Promise<any[]>;
    /**
     * Returns all token data
     * @returns {Promise<Array>}
     */
    getTokenList(): Promise<any[]>;
    /**
     * Returns banned token list data
     * @returns {Promise<Array>}
     */
    getBannedTokenList(): Promise<any[]>;
    /**
     * Maps from user token list to internal token format
     * @returns {Promise<Object>}
     */
    getTokenFromUserList(token: any, source: any): Promise<Object>;
    gasPrice(): Promise<any>;
    setPrivateKey(privateKey: any): Promise<void>;
    isFeeDynamic(): boolean;
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
import { MATICToken } from '../../tokens/index.js';
