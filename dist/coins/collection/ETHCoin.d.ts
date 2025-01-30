export default ETHCoin;
declare const ETHCoin_base: {
    new (config: any): {
        [x: string]: any;
        "__#11@#balances": {};
        "__#11@#predefinedValidators": any[];
        readonly balances: {};
        readonly predefinedValidators: any[];
        defaultAmount(): Amount;
        "__#11@#restoreCachedBalances"(): Promise<void>;
        "__#11@#updateCachedBalances"(balances: any): void;
        "__#11@#transformBalanceFieldFromJSON"(value: any): Amount;
        "__#11@#transformValidatorsObjectFromJSON"(validatorsJSONObject: any): {};
        "__#11@#transformCachedBalancesFromJSON"(balances?: any): {};
        setBalances(balances: any): void;
        isStakingSupported(): boolean;
        isRedelegationSupported(): boolean;
        makeStakingInfoStruct({ staked, unstaking, delegatedVotes, availableVotes, pendingWithdrawals, availableWithdrawals, availableForUnstake, rewards, frozenVotes, frozenEnergy, validators, additional, }?: Amount): Promise<{
            unstaking: Amount;
            total: Amount;
            availableForStake: Amount;
        }>;
        fetchStakingInfo(): any;
        getStakingInfo(): Promise<any | {
            unstaking: string;
            total: string;
            availableForStake: string;
            pendingWithdrawals: string;
            validators: {};
            staked: string;
            availableWithdrawals: string;
            rewards: string;
        } | {}>;
        calculateTotal({ balance, staked, unstaking, availableWithdrawals, pendingWithdrawals, rewards }: {
            balance: any;
            staked: any;
            unstaking: any;
            availableWithdrawals: any;
            pendingWithdrawals: any;
            rewards: any;
        }): void;
        calculateAvailableForStake({ balance, staked, unstaking }: {
            balance: any;
            staked: any;
            unstaking: any;
        }): Promise<void>;
        calculateAvailableForUnstake(): void;
        calculateStakedAmount(): any;
        calculateUnstakingAmount(): void;
        calculateAvailableWithdrawalsAmount(): void;
        calculatePendingWithdrawalsAmount(): void;
        calculateRewards(): void;
        getValidators(): {};
        getTotalBalance(): string;
        getAvailableBalance(): string;
        getAvailableForUnstakeBalance(): any;
        "__#11@#getBalanceByType"(balanceType: string, validatorAddress: string): string;
        getStakedBalance(validator: any): string;
        getUnstakingBalance(validator: any): string;
        getRewards(validator: any): string;
        getDelegatedVotes(): Amount;
        getAvailableVotes(): Amount;
        getFrozenVotes(): any;
        getFrozenEnergy(): any;
        getPendingWithdrawals(validator: any): string;
        getAvailableWithdrawals(validator: any): string;
        getUserValidators(address: string): Promise<any>;
        getAdditionalInfo(): string;
        getPredefinedValidators(): Promise<[]>;
        getDefaultValidators(): any | any[];
        getPredefineValidatorsConfigIdentifier(): string;
        getPredefineValidatorsConfigName(): string;
    };
    [x: string]: any;
};
/**
 * @class ETHCoin
 */
declare class ETHCoin extends ETHCoin_base {
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
     * @returns {Promise<*>}
     */
    getCoreLibrary(): Promise<any>;
    setFeeData(feeData?: {}): void;
    gasLimit: string | undefined;
    stakingGasLimit: any;
    nftGasLimitCoefficient: any;
    nftGasPriceCoefficient: any;
    gasLimitCoefficient: any;
    gasPriceCoefficient: any;
    defaultGasPrice: any;
    defaultMaxGasPrice: any;
    resendTimeout: any;
    isFeeDynamic(): boolean;
    getTokenTransactions({ contract }: {
        contract: any;
    }): any;
    getTransactions(): Promise<any>;
    manageSocket(): void;
    /**
     * List to be exluded from wallets list
     * @return {Array<String>} array of tickers
     */
    getExcludedTokenList(): Array<string>;
    /**
     * Get ETH fee settings
     * @return {Promise<Object>} The ETH fee settings
     * */
    getFeeSettings(): Promise<Object>;
    /**
     * Loads a wallet.
     *
     * @param {BitcoreMnemonic} mnemonic The private key object.
     * @return {Promise<Object>} The private key.
     */
    loadWallet(seed: any): Promise<Object>;
    address: any;
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
     * Send transacrion and increase nonce by 1
     * @param rawtx
     * @returns {Promise<Transaction>}
     */
    sendTransaction(rawtx: any): Promise<Transaction>;
    /**
     * Gets max fee per gas from Eth Gas Station
     * For support EIP-1559 standard
     *
     * @param {number} [gasPriceCoefficient = 1] - Custom coefficient for tune gas price.
     * @returns {Promise<string>}
     * @throws {ExternalError}
     */
    getMaxFeePerGas(gasPriceCoefficient?: number): Promise<string>;
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
    /**
     * Gets moderate gas prices from Eth Gas station
     *
     * @returns {Promise<{standard: BN, fastest: BN} | {}>}
     */
    getModerateGasPrice(): Promise<{
        standard: BN;
        fastest: BN;
    } | {}>;
    estimateGas(amount: any, address: any, contract: any, defaultGas?: string): Promise<string>;
    /**
     * Return available balance for send
     *
     * @return {Promise<string>}
     */
    availableBalance(fee: any): Promise<string>;
    getInfo(tokenInfo: any): Promise<{
        balance: any;
        balances: {};
    }>;
    balance: any;
    getTokenInfo({ contract }: {
        contract: any;
    }): Promise<any>;
    getStakingInfo(): Promise<{}>;
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
     * @param amount amount in ETH
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
     * @param {...Array} args The arguments
     * @return {ETHToken}
     */
    createToken(args: any[][]): ETHToken;
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
    gasPrice(): Promise<any>;
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
import { Amount } from '../../utils/index.js';
import { Web3Explorer } from '../../explorers/collection/index.js';
import BN from 'bn.js';
import ETHToken from '../../tokens/ETHToken.js';
