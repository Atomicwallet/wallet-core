export default EVMCoin;
export type FeeConfigData = {
    defaultGasPrice: number;
    defaultMaxGasPrice: number;
    gasPriceCoefficient: number;
    nftGasPriceCoefficient: number;
    gasLimit: number;
    maxGasLimit: number;
    gasLimitCoefficient: number;
    nftGasLimitCoefficient: number;
    resendTimeout: number;
    unspendableBalance: number;
};
export type ExplorerConfig = {
    className: string;
    baseUrl: string;
    chainId: number;
    txLimit?: number | undefined;
    usedFor: string[];
};
declare const EVMCoin_base: {
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
 * @typedef FeeConfigData
 * @type {object}
 * @property {number} defaultGasPrice
 * @property {number} defaultMaxGasPrice
 * @property {number} gasPriceCoefficient
 * @property {number} nftGasPriceCoefficient
 * @property {number} gasLimit
 * @property {number} maxGasLimit
 * @property {number} gasLimitCoefficient
 * @property {number} nftGasLimitCoefficient
 * @property {number} resendTimeout
 * @property {number} unspendableBalance
 */
/**
 * @typedef ExplorerConfig
 * @type {object}
 * @property {string} className
 * @property {string} baseUrl
 * @property {number} chainId
 * @property {number} [txLimit=100]
 * @property {string[]} usedFor
 */
/**
 * @class EVMCoin
 */
declare class EVMCoin extends EVMCoin_base {
    /**
     * constructs the object.
     *
     * @param {object} config
     * @param {string} config.id
     * @param {string} config.ticker
     * @param {string} config.name
     * @param {boolean} config.isL2
     * @param {boolean} config.isUseModeratedGasPrice
     * @param {boolean} [config.isUseEIP1559=false] - Use EIP-1559 for send transaction.
     * @param {string} config.alias
     * @param {string[]} [config.features]
     * @param {FeeConfigData} config.feeData
     * @param {ExplorerConfig[]} config.explorers
     * @param {string} config.txWebUrl
     * @param {boolean} config.socket
     * @param {number} config.chainId
     * @param {boolean} [config.notify=false]
     * @param {boolean} [config.isTestnet=false]
     * @param {boolean} [config.isCustom=false]
     */
    constructor(config: {
        id: string;
        ticker: string;
        name: string;
        isL2: boolean;
        isUseModeratedGasPrice: boolean;
        isUseEIP1559?: boolean | undefined;
        alias: string;
        features?: string[] | undefined;
        feeData: FeeConfigData;
        explorers: ExplorerConfig[];
        txWebUrl: string;
        socket: boolean;
        chainId: number;
        notify?: boolean | undefined;
        isTestnet?: boolean | undefined;
        isCustom?: boolean | undefined;
    }, db: any, configManager: any);
    /** @type {string} */
    web3BaseUrl: string;
    /** @type {import('web3').default|null} */
    coreLibrary: import("web3").default | null;
    isL2: boolean;
    /** @type {{ [id: string]: EVMToken }} */
    tokens: {
        [id: string]: EVMToken;
    };
    /** @type {string[]} */
    bannedTokens: string[];
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
    get networkType(): string;
    /**
     * Custom tokens is enabled on EVM by default
     * @return {boolean}
     */
    get isCustomTokenSupported(): boolean;
    /**
     * Sets fee data
     * @param {FeeConfigData} feeData
     */
    setFeeData(feeData?: FeeConfigData): void;
    defaultGasPrice: number | undefined;
    defaultMaxGasPrice: number | undefined;
    gasPriceCoefficient: number | undefined;
    nftGasPriceCoefficient: number | undefined;
    gasLimit: number | undefined;
    maxGasLimit: number | undefined;
    gasLimitCoefficient: number | undefined;
    contractGasLimitCoefficient: number | undefined;
    nftGasLimitCoefficient: number | undefined;
    resendTimeout: number | undefined;
    unspendableBalance: number | undefined;
    maxGasLimitL1: number | undefined;
    maxGasPriceL1: number | undefined;
    isFeeDynamic(): boolean;
    /**
     * Gets token transaction list
     *
     * @param {string} contract - Contract address.
     * @returns {Promise<Transaction[]>}
     */
    getTokenTransactions({ contract }: string): Promise<Transaction[]>;
    /**
     * Gets transaction list
     *
     * @returns {Promise<Transaction[]>}
     */
    getTransactions(): Promise<Transaction[]>;
    manageSocket(): void;
    /**
     * List to be excluded from wallets list
     * @return {string[]} array of tickers
     */
    getExcludedTokenList(): string[];
    /**
     * Loads a wallet
     * Mutates the wallet with created privateKey and the address obtained from the private key.
     *
     * @param {Buffer} seed - The mnemonic seed.
     * @param {string} [mnemonicString] - The mnemonic string.
     * @returns {Promise<{id: string, privateKey: string, address: string}>}
     * @throws {Error}
     */
    loadWallet(seed: Buffer, mnemonicString?: string): Promise<{
        id: string;
        privateKey: string;
        address: string;
    }>;
    address: string | undefined;
    /**
     * Validates wallet address
     *
     * @param {string} address - The address.
     * @return {Promise<boolean>}
     */
    validateAddress(address: string): Promise<boolean>;
    /**
     * Creates a transaction to transfer funds
     *
     * @param {object} data
     * @param {string} data.address - The destination address.
     * @param {boolean} [data.isSendAll=false] - Send all funds sign.
     * @param {string | null} [data.userFee=null] - User fee precalculated for send all funds.
     * @param {string} data.amount - Amount of funds to send (not used if isSendAll=true).
     * @param {number} [data.nonce] - Nonce.
     * @param {string | null} [data.userGasPrice=null] - Custom gas price.
     * @param {number} [data.multiplier] - Gas price coefficient - Not used here.
     * @param {string} [data.gasLimit] - Custom gas limit.
     * @param {string | null} [data.paymentData=null] - The payment id (only HEX value!).
     * @return {Promise<string>} - Raw signed transaction
     */
    createTransaction({ address, isSendAll, userFee, amount, nonce, userGasPrice, multiplier, gasLimit, paymentData, }: {
        address: string;
        isSendAll?: boolean | undefined;
        userFee?: string | null | undefined;
        amount: string;
        nonce?: number | undefined;
        userGasPrice?: string | null | undefined;
        multiplier?: number | undefined;
        gasLimit?: string | undefined;
        paymentData?: string | null | undefined;
    }): Promise<string>;
    /**
     * Creates a transaction to transfer funds
     *
     * @param {string} data
     * @param {string} data.address - The destination address.
     * @param {string} data.amount - Amount of funds to send (not used if isSendAll=true).
     * @param {string} data.contract - Contract address.
     * @param {string | null} [data.userGasPrice=null] - Custom gas price.
     * @param {number} [data.multiplier] - Gas price coefficient - Not used here.
     * @param {string} [data.gasLimit] - Custom gas limit.
     * @return {Promise<string>} - Raw signed transaction
     */
    createTokenTransaction({ address, amount, custom, userGasPrice, gasLimit, contract, multiplier }: string): Promise<string>;
    /**
     * Sends transaction
     * @async
     * @param {string} rawtx - Signed raw tx.
     * @returns {Promise<{txid: string}>}
     */
    sendTransaction(rawtx: string): Promise<{
        txid: string;
    }>;
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
    getFeeL1({ contract, amount }?: {
        amount?: number | undefined;
    }): Promise<any>;
    getFeeL2({ userGasPrice, gasLimit, contract, amount }?: {
        userGasPrice?: null | undefined;
        gasLimit?: null | undefined;
        contract?: null | undefined;
        amount?: number | undefined;
    }): Promise<any>;
    /**
     * Gets the estimated fee for the transaction
     *
     * @param {object} [options] - options.
     * @param {number} [options.amount=1] - Amount.
     * @param {string} [options.address] - Destination address.
     * @param {string} [options.contract=null] - Contract address.
     * @param {string|number} [options.userGasPrice=null] - Custom gas price.
     * @param {string|number} [options.gasLimit=null] - Custom gas limit.
     * @returns {Promise<BN>}
     */
    getFee({ userGasPrice, gasLimit, contract, amount }?: {
        amount?: number | undefined;
        address?: string | undefined;
        contract?: string | undefined;
        userGasPrice?: string | number | undefined;
        gasLimit?: string | number | undefined;
    }): Promise<BN>;
    /**
     * @param {string} data
     * @returns {Promise<BN>}
     */
    _getFeeL1FromOracle(data: string): Promise<BN>;
    /**
     * Gets gas price L1 from ETH network
     * @returns {Promise<number>}
     */
    _getGasPriceL1FromConfig(): Promise<number>;
    /**
     * @returns {Promise<number>}
     */
    getCoinFeeL1FromOracle(): Promise<number>;
    /**
     * @returns {Promise<number>}
     */
    getTokenFeeL1FromOracle(contract: any, amount: any): Promise<number>;
    /**
     * Gets gas price in WEI
     *
     * @param {boolean} [withoutCoefficient] - Returns the net gas price if it is set.
     * @returns {Promise<number>}
     */
    getGasPrice(withoutCoefficient?: boolean): Promise<number>;
    /**
     * Gets moderate gas prices from EVM Gas station
     *
     * @returns {Promise<{standard: number, fastest: number} | null>}
     */
    getModeratedGasPrice(): Promise<{
        standard: number;
        fastest: number;
    } | null>;
    /**
     * Estimates gas
     * @param {number} amount - Amount.
     * @param {string} [toAddress=MOCKED_ARB_ADDRESS] - Destination address.
     * @param {string} contractAddress - Contract address.
     * @returns {Promise<number>}
     */
    estimateGas(amount: number, toAddress?: string, contractAddress: string): Promise<number>;
    /**
     * Gets available balance for send in ETH
     *
     * @param {string|number|BN} fee - Custom fee in WEI.
     * @return {Promise<string>}
     */
    availableBalance(fee: string | number | BN): Promise<string>;
    /**
     * Mutates the wallet with the requested balance and returns it
     *
     * @param {object} tokenInfo
     * @param {boolean} tokenInfo.isToken
     * @param {boolean} tokenInfo.onlyCoin
     * @param {string} tokenInfo.contract
     * @returns {Promise<{balance: string|BN|null}>}
     */
    getInfo(tokenInfo: {
        isToken: boolean;
        onlyCoin: boolean;
        contract: string;
    }): Promise<{
        balance: string | BN | null;
    }>;
    balance: any;
    /**
     * Gets token balance
     *
     * @param {string} contract - Token contract address.
     * @returns {Promise<string|number|BN>}
     */
    getTokenInfo({ contract }: string): Promise<string | number | BN>;
    /**
     * Calculates total balance
     *
     * @returns {Amount}
     */
    calculateTotal(): Amount;
    /**
     * Creates a token.
     *
     * @param {object} args - The arguments.
     * @return {EVMToken}
     */
    createToken(args: object): EVMToken;
    /**
     * @typedef ExplorerTokenShape
     * @type {object}
     * @property {string} name
     * @property {string} ticker
     * @property {number} decimal
     * @property {string} contract
     * @property {string} parentTicker
     * @property {string} uniqueField
     * @property {string[]} supportedStandards
     *
     */
    /**
     * Returns user token list data
     * @returns {Promise<ExplorerTokenShape[]>}
     */
    getUserTokenList(): Promise<{
        name: string;
        ticker: string;
        decimal: number;
        contract: string;
        parentTicker: string;
        uniqueField: string;
        supportedStandards: string[];
    }[]>;
    /**
     * @typedef ConfigTokenShape
     * @type {object}
     * @property {string} name
     * @property {string} ticker
     * @property {number} decimal
     * @property {string} contract
     * @property {boolean} visibility
     *
     */
    /**
     * Returns all token list data
     *
     * @returns {Promise<ConfigTokenShape[]>}
     */
    getTokenList(): Promise<{
        name: string;
        ticker: string;
        decimal: number;
        contract: string;
        visibility: boolean;
    }[]>;
    /**
     * Returns banned token list
     *
     * @async
     * @returns {Promise<string[]>} - Array of contract addresses
     */
    getBannedTokenList(): Promise<string[]>;
    /**
     * @typedef TokenObjectShape
     * @type {ConfigTokenShape}
     * @property {'list'|'user'} source
     */
    /**
     * Converts serverToken to internal token format
     *
     * @returns {Promise<TokenObjectShape[]>}
     */
    getTokenObject(serverToken: any, source?: string): Promise<{
        name: string;
        ticker: string;
        decimal: number;
        contract: string;
        visibility: boolean;
    }[]>;
    /**
     * Maps from user token list to internal token format
     *
     * @param {ConfigTokenShape} token
     * @param {'list'|'user'} source
     * @returns {Promise<TokenObjectShape[]>}
     */
    getTokenFromUserList(token: {
        name: string;
        ticker: string;
        decimal: number;
        contract: string;
        visibility: boolean;
    }, source: "list" | "user"): Promise<{
        name: string;
        ticker: string;
        decimal: number;
        contract: string;
        visibility: boolean;
    }[]>;
    /**
     * Sets privateKey
     * Mutates the wallet with the private key.
     * Used as a faster method than loadWallet.
     *
     * @param {string} privateKey - The private key.
     * @param {string} [mnemonicString]
     * @returns {void}
     */
    setPrivateKey(privateKey: string, mnemonicString?: string): void;
    /**
     * @TODO Remove after the implementation of the features set in the coin configs
     * Returns a sign NFT is not supported
     *
     * @returns {false}
     */
    isNftSupported(): false;
    get feeTicker(): any;
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
import { EVMToken } from '../../tokens/index.js';
import Transaction from '../../explorers/Transaction.js';
import { Amount } from '../../utils/index.js';
