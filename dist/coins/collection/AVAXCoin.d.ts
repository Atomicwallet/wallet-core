export default AVAXCoin;
declare const AVAXCoin_base: {
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
 * @class AVAXCoin
 */
declare class AVAXCoin extends AVAXCoin_base {
    /**
     * constructs the object.
     *
     * @param  {object} config
     */
    constructor(config: object);
    /** @type {string} */
    web3BaseUrl: string;
    /** @type {import('web3').default|null} */
    coreLibrary: import("web3").default | null;
    derivation: string;
    nonce: any;
    /**
     * Sets web3 instance to coreLibrary
     * @returns {Promise<void>}
     */
    initCoreLibrary(): Promise<void>;
    /**
     * Gets web3 instance
     * @returns {Promise<import('web3').default>}
     */
    getCoreLibrary(): Promise<import("web3").default>;
    setFeeData(feeData?: {}): void;
    gasLimit: string | undefined;
    gasLimitCoefficient: any;
    gasPriceCoefficient: any;
    defaultGasPrice: any;
    defaultMaxGasPrice: any;
    resendTimeout: any;
    nftGasLimitCoefficient: any;
    nftGasPriceCoefficient: any;
    isFeeDynamic(): boolean;
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
     * @return {Promise<string>} { description_of_the_return_value }
     */
    getAddress(): Promise<string>;
    /**
     * Validates wallet address
     *
     * @param {string} address The address
     * @return {Promise<boolean>}
     */
    validateAddress(address: string): Promise<boolean>;
    /**
     * Creates a transaction.
     *
     * @param {string} address The destination address
     * @param {number} amount The amount to send
     * @param {string} paymentData The payment id (only HEX value!)
     * @param {string} gasLimit
     * @param {string} userGasPrice
     * @param {number} multiplier coefficient
     * @return {Promise<string>} Raw transaction
     */
    createTransaction({ address, amount, paymentData, userGasPrice, gasLimit }: string): Promise<string>;
    /**
     * Gets the transactions.
     *
     * @return {Promise<Object[]>} The transactions.
     */
    getTransactions(): Promise<Object[]>;
    getNonce(): Promise<any>;
    /**
     * Gets the fee.
     *
     * @return {Promise<BN>} The fee.
     */
    getFee({ userGasPrice, gasLimit }?: {
        userGasPrice?: null | undefined;
        gasLimit?: null | undefined;
    }): Promise<BN>;
    getGasPrice(withoutCoeff?: boolean): Promise<any>;
    /**
     * Return available balance for send
     *
     * @return {Promise<string>}
     */
    availableBalance(fee: any): Promise<string>;
    updateBalance(): Promise<void>;
    balance: any;
    getInfo(): Promise<{
        balance: any;
    }>;
    gasPrice(): Promise<any>;
    setPrivateKey(privateKey: any): void;
    getGasRange(sendType?: string): any;
    checkTransaction(txInfo: any): Promise<void>;
    getBalance(): Promise<any>;
    getGasPriceUnits(): string;
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
import BN from 'bn.js';
