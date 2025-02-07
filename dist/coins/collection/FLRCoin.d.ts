export default FLRCoin;
declare const FLRCoin_base: {
    new (config: any, db: any, configManager: any): {
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
 * @class FLRCoin
 */
declare class FLRCoin extends FLRCoin_base {
    /**
     * constructs the object.
     *
     * @param  { string } alias the alias
     * @param  {{}} feeData the fee data
     * @param  { array }  explorers the explorers
     * @param  { string } txWebUrl the transmit web url
     * @param {*} notify
     * @param { boolean } socket
     */
    constructor({ alias, notify, feeData, explorers, txWebUrl, socket, id }: string, db: any, configManager: any);
    derivation: string;
    stakingFeeMultiplier: number;
    gasPriceConfig: any;
    bannedTokens: any[];
    web3: Web3Explorer;
    baseUrl: any;
    tokens: {};
    nonce: any;
    setFeeData(feeData?: {}): void;
    gasLimit: any;
    stakingGasLimit: any;
    gasLimitCoefficient: any;
    gasPriceCoefficient: any;
    defaultGasPrice: any;
    defaultMaxGasPrice: any;
    autoClaimGasLimit: any;
    reservedForStake: any;
    stakingContract: any;
    rewardsContract: any;
    resendTimeout: any;
    isFeeDynamic(): boolean;
    getTransactions(): any;
    manageSocket(): void;
    /**
     * Loads a wallet.
     *
     * @param { buffer } seed
     * @return {Promise<unknown>} The private key.
     */
    loadWallet(seed: buffer): Promise<unknown>;
    coreLibrary: import("web3").default | undefined;
    address: string | undefined;
    /**
     * The address getter
     *
     * @return { string } private key hex
     */
    getAddress(): string;
    /**
     * Validates wallet address
     *
     * @param { string } address The address
     * @return { boolean }
     */
    validateAddress(address: string): boolean;
    /**
     * Creates a transaction.
     *
     * @param { string } address The destination address
     * @param { string } amount The amount to send
     * @param { string } paymentData The payment id (only HEX value!)
     * @param { string | BN } gasLimit
     * @param { number } multiplier coefficient
     * @param  {string | BN } userGasPrice
     * @param { BN } nonce
     * @return {Promise<string>} Raw transaction
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
     * @param { string } rawtx
     * @returns {Promise<Transaction>}
     */
    sendTransaction(rawtx: string): Promise<Transaction>;
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
     *
     * @return {Promise<BN>} The fee.
     * @param {string | number} obj.userGasPrice
     * @param {string | number} obj.gasLimit
     */
    getFee({ userGasPrice, gasLimit, multiplier }?: string | number): Promise<BN>;
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
        balances: {};
    }>;
    balance: any;
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
    gasPrice(): Promise<any>;
    setPrivateKey(privateKey: any): Promise<void>;
    getGasRange(sendType?: string): any;
    getEstimatedTimeCfg(force?: boolean): Promise<any>;
    getEstimatedTimeTx(gasPrice: any, mapping?: boolean): Promise<any>;
    /**
     * Transaction for deposit FLR -> WFLR
     *
     * @param {string} obj.amount
     * @return {Promise<string>}
     */
    createDepositTransaction({ amount }: string): Promise<string>;
    /**
     * Creates and submit deposit transaction,
     * then creates a delegation tx for completed deposit tx, if no delegates was made previously
     *
     * @param {string} obj.amount
     * @param {string} obj.validator
     * @return {Promise<string>}
     */
    createStakeTransaction({ amount, validator }: string): Promise<string>;
    /**
     * Transaction for withdraw WFLR -> FLR
     *
     * @param {string} obj.amount
     * @return {Promise<string>}
     */
    createUnstakeTransaction({ amount }: string): Promise<string>;
    /**
     * Delegate WFLR to chosen validator
     *
     * @param {string> }obj.validator
     * @return {Promise<string>}
     */
    createDelegationTransaction({ validator }: string): Promise<string>;
    /**
     * Undelegate all WFLR
     *
     * @return {Promise<string>}
     */
    createUndelegationTransaction(): Promise<string>;
    /**
     * Claims all unclaimed rewards
     *
     * @param {string} obj.address
     * @return {Promise<string>}
     */
    createClaimTransaction({ address }?: string): Promise<string>;
    calculateTotal({ balance, staked, rewards }: {
        balance: any;
        staked: any;
        rewards: any;
    }): Amount;
    calculateAvailableForStake({ balance }: {
        balance: any;
    }): Promise<Amount>;
    createAutoClaimTransaction(): Promise<string>;
    getActiveAutoClaim(): Promise<any>;
    /**
     * Fetch delegations percentage for each FTSO provider
     *
     * @param {string} address
     * @return {Promise<{delegatePercentage: any, providers: any}>}
     */
    fetchDelegations(address?: string): Promise<{
        delegatePercentage: any;
        providers: any;
    }>;
    /**
     * Return total rewards
     *
     * @param {string} address
     * @returns {Promise<BN>}
     */
    fetchUnclaimedRewards(address?: string): Promise<BN>;
    /**
     * Calculates delegations from all validators
     *
     * @param {object} validators
     * @return {BN}
     */
    calculateDelegatedVotes(validators: object): BN;
    /**
     * Calculates available votes
     *
     * @param {Amount} obj.staked
     * @param {Amount} obj.delegatedVotes
     * @return {BN}
     */
    calculateAvailableVotes({ staked, delegatedVotes }: Amount): BN;
    /**
     * Calculates cumulative for each rewards in each epochs
     * @param {[object]} unclaimed
     * @return {BN}
     */
    calculateRewards(unclaimed: [object]): BN;
    fetchStakingInfo(): Promise<{
        staked: Amount;
        validators: any;
        availableVotes: Amount;
        delegatedVotes: Amount;
        availableWithdrawals: Amount;
        rewards: Amount;
        additional: {
            autoClaimExecutors: any;
            autoClaimFee: any;
            activeAutoClaim: any;
        };
    }>;
    getNextDropDate(): number;
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
import Web3Explorer from '../../explorers/collection/Web3Explorer.js';
import BN from 'bn.js';
