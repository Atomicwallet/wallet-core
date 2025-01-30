export default FTMCoin;
declare const FTMCoin_base: {
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
 * @class FTMCoin
 * @TODO Add Mixins to implement nft, stakes. @See ETHCoin.
 */
declare class FTMCoin extends FTMCoin_base {
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
    balance: string;
    gasPriceConfig: any;
    bannedTokens: any[];
    web3: Web3Explorer;
    tokens: {};
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
    gasLimit: number | undefined;
    stakingGasLimit: number | undefined;
    nftGasLimitCoefficient: number | undefined;
    nftGasPriceCoefficient: number | undefined;
    gasLimitCoefficient: number | undefined;
    gasPriceCoefficient: number | undefined;
    defaultGasPrice: number | undefined;
    defaultMaxGasPrice: number | undefined;
    resendTimeout: any;
    isFeeDynamic(): boolean;
    getTransactions(): Promise<any>;
    manageSocket(): void;
    /**
     * List to be exluded from wallets list
     * @return {Array<String>} array of tickers
     */
    getExcludedTokenList(): Array<string>;
    /**
     * Get FTM fee settings
     * @return {Promise<Object>} The FTM fee settings
     */
    getFeeSettings(): Promise<Object>;
    /**
     * Loads a wallet.
     *
     * @param {BitcoreMnemonic} mnemonic The private key object.
     * @return {Promise<object>}
     */
    loadWallet(seed: any): Promise<object>;
    address: string | undefined;
    /**
     * Validates wallet address
     *
     * @param {String} address The address
     * @return {Promise<boolean>}
     */
    validateAddress(address: string): Promise<boolean>;
    /**
     * Creates a transaction to transfer funds
     *
     * @param {string} address - The destination address.
     * @param {boolean} [isSendAll=false] - Send all funds sign.
     * @param {string | null} [userFee=null] - User fee precalculated for send all funds.
     * @param {string} amount - Amount of funds to send (not used if isSendAll=true).
     * @param {number} nonce - Nonce.
     * @param {string | null} [userGasPrice=null] - Custom gas price.
     * @param {number} [multiplier=this.gasPriceCoefficient] - Gas price coefficient.
     * @param {string} [gasLimit] - Custom gas limit.
     * @param {string | null} [paymentData=null] - The payment id (only HEX value!).
     * @return {Promise<string>} - Raw signed transaction
     */
    createTransaction({ address, isSendAll, userFee, amount, nonce, userGasPrice, multiplier, gasLimit, paymentData, }: string): Promise<string>;
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
     * Send transacrion and increase nonce by 1
     * @param rawtx
     * @returns {Promise<Transaction>}
     */
    sendTransaction(rawtx: any): Promise<Transaction>;
    /**
     * Sets status to 1 to mark transaction as completed.
     * Borrowed from Web3Explorer.
     *
     */
    checkTransaction(txInfo: any): Promise<void>;
    /**
     * Gets max fee per gas from Eth Gas Station
     * For support EIP-1559 standard
     *
     * @deprecated Use getGasPriceForSendNft method instead
     * @param {number} [gasPriceCoefficient = 1] - Custom coefficient for tune gas price.
     * @returns {Promise<string>}
     * @throws {ExternalError}
     */
    getMaxFeePerGas(gasPriceCoefficient?: number): Promise<string>;
    /**
     * Gets gas price from blockchain
     *
     * @param {number} [coefficient = 1] - Custom coefficient for tune gas price.
     * @returns {Promise<number>} - Gas price in WEI
     */
    getGasPriceForSendNft(coefficient?: number): Promise<number>;
    /**
     * Gets gas limit from node
     *
     * @param {string} address - Wallet address.
     * @param {string} toContract - NFT contract address.
     * @param {string} data - Encoded token ABI data.
     * @param {number} [gasLimitCoefficient = 1] - Custom coefficient for tune gas limit.
     * @returns {Promise<number>}
     * @throws {ExternalError}
     */
    estimateGasForSendNft(address: string, toContract: string, data: string, gasLimitCoefficient?: number): Promise<number>;
    /**
     * @typedef UserFeeOptions
     * @type {Object}
     * @property {string} [userGasLimit] - Custom gas limit.
     * @property {string} [userGasPrice] - Custom gas price.
     */
    /**
     * @param {string} toContract - The NFT contract address.
     * @param {string} data - Contract encoded data.
     * @param {UserFeeOptions} userOptions - Custom user options.
     * @returns {Promise<{gasLimit: number, gasPrice: number, nonce: number}>}
     */
    getNftTransferGasParams(toContract: string, data: string, { userGasPrice, userGasLimit }: {
        /**
         * - Custom gas limit.
         */
        userGasLimit?: string | undefined;
        /**
         * - Custom gas price.
         */
        userGasPrice?: string | undefined;
    }): Promise<{
        gasLimit: number;
        gasPrice: number;
        nonce: number;
    }>;
    /**
     * Gets the fee required to transfer the NFT
     *
     * @param {Object} params
     * @param {string | null} params.contractAddress - NFT contract address.
     * @param {string} params.tokenId - Token id.
     * @param {ERC721_TOKEN_STANDARD | ERC1155_TOKEN_STANDARD | string} params.tokenStandard - Token standard.
     * @param {string|null} [params.toAddress=null] - Recipient address. If it is null or equal to the self wallet
     * address, then the fake address will be used.
     * @param {UserFeeOptions} [params.userOptions={}] - Custom user options.
     * @return {Promise<BN>} - The fee.
     * @throws {ExternalError}
     */
    getNftFee({ contractAddress, tokenId, tokenStandard, toAddress, userOptions }: {
        contractAddress: string | null;
        tokenId: string;
        tokenStandard: ERC721_TOKEN_STANDARD | ERC1155_TOKEN_STANDARD | string;
        toAddress?: string | null | undefined;
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
     * @param {string} [toAddress] - The destination address. Unused here.
     * @param {string} contractAddress - NFT contract address.
     * @param {string} data - Contract encoded data.
     * @param {UserFeeOptions} [userOptions={}] - Custom user options.
     * @return {Promise<string>} - Raw transaction
     * @throws {ExternalError}
     */
    createNftTransaction({ contractAddress, data, userOptions }?: string): Promise<string>;
    getNonce(): Promise<any>;
    /**
     * @typedef UserFeeOptions
     * @type {object}
     * @property {string | null} [userGasPrice=null] - Custom gas price.
     * @property {string | null} [gasLimit=null] - Custom gas limit.
     */
    /**
     * Gets the estimated fee for the transaction
     *
     * @param {UserFeeOptions} [userOptions] - Custom priority
     * @returns {Promise<BN>}
     */
    getFee({ userGasPrice, gasLimit }?: {
        /**
         * - Custom gas limit.
         */
        userGasLimit?: string | undefined;
        /**
         * - Custom gas price.
         */
        userGasPrice?: string | undefined;
    }): Promise<BN>;
    /**
     * Gets gas price in WEI
     * @TODO Use a moderatedGasPrice after the service is implemented
     * @TODO @See ETHCoin implementation
     *
     * @returns {Promise<number>}
     */
    getGasPrice(): Promise<number>;
    /**
     * Gets moderate gas prices from Eth Gas station
     *
     * @returns {Promise<{standard: BN, fastest: BN} | {}>}
     */
    getModerateGasPrice(): Promise<{
        standard: BN;
        fastest: BN;
    } | {}>;
    estimateGas(amount: any, address: any, contract: any, defaultGas?: number): Promise<string | number>;
    /**
     * Gets available balance for send in FTM
     *
     * @param {string|number|BN} fee - Custom fee in WEI.
     * @return {Promise<string>}
     */
    availableBalance(fee: string | number | BN): Promise<string>;
    getInfo(tokenInfo: any): Promise<{
        balance: any;
        balances: any;
    }>;
    getStakingInfo(): Promise<any>;
    calculateTotal({ staked }: {
        staked: any;
    }): Amount;
    calculateAvailableForStake(): Promise<Amount>;
    /**
     * Only predefined smart-contract is available
     * @returns {Promise<[]>}
     */
    getUserValidators(): Promise<[]>;
    /**
     *
     * @param address smart-contract address
     * @param amount amount in FTM
     * @param gasLimit
     * @return {Promise<String>}
     */
    createDelegationTransaction({ address, amount, gasLimit }: {
        address: any;
        amount: any;
        gasLimit: any;
    }): Promise<string>;
    /**
     * Creates a token.
     *
     * @param {object} args - The arguments
     * @return {FTMToken}
     */
    createToken(args: object): FTMToken;
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
    /**
     * Converts serverToken to internal token format
     * @returns {Promise<Array>}
     */
    getTokenObject(serverToken: any, source?: string): Promise<any[]>;
    /**
     * Maps from user token list to internal token format
     * @returns {Promise<Array>}
     */
    getTokenFromUserList(token: any, source: any): Promise<any[]>;
    /**
     * Maps from common token list to internal token format
     * @returns {Promise<Array>}
     */
    getTokenFromCommonList(token: any, source: any): Promise<any[]>;
    gasPrice(): Promise<number>;
    setPrivateKey(privateKey: any): void;
    getGasRange(sendType?: string): any;
    getEstimatedTimeCfg(force?: boolean): Promise<any>;
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
import Transaction from '../../explorers/Transaction.js';
import { Amount } from '../../utils/index.js';
import { FTMToken } from '../../tokens/index.js';
