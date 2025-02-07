export default TONCoin;
declare const TONCoin_base: {
    new (): {
        [x: string]: any;
        processExplorerConfig(config: any): any;
        defaultProvider: any;
        providersMap: {} | undefined;
        getProvider(name: any): any;
        getBalance(): Promise<any>;
        getTransactions(args: any): Promise<any>;
        getInfo(): Promise<Object>;
        balance: any;
        getUnspentOutputs(address: any, scriptPubKey: any): Promise<any>;
        getUTXO(): any;
        sendTransaction(rawtx: any): any;
        getTransaction(txid: any): any;
        updateCoinParamsFromServer(config: Object): boolean;
        chainId: any;
        fee: any;
        stakingContract: any;
        stakingProxyContract: any;
        stakingFeeGas: any;
        reStakingFeeGas: any;
        unstakingFeeGas: any;
        claimFeeGas: any;
        tokenFeeGas: any;
        sendFeeGas: any;
    };
    [x: string]: any;
};
/**
 * The Open Network
 *
 * @class TONCoin
 */
declare class TONCoin extends TONCoin_base {
    constructor({ alias, notify, feeData, explorers, txWebUrl, socket, isTestnet, id }: {
        alias: any;
        notify: any;
        feeData: any;
        explorers: any;
        txWebUrl: any;
        socket: any;
        isTestnet: any;
        id: any;
    }, db: any, configManager: any);
    isTestnet: any;
    /** @type {{ [id: string]: TONToken }} */
    tokens: {
        [id: string]: TONToken;
    };
    /** @type {string[]} */
    bannedTokens: string[];
    tokenContractTransferFee: any;
    /**
     * Loads a wallet.
     *
     * @param {BitcoreMnemonic} mnemonic The private key object.
     * @return {Promise<Object>} The private key.
     */
    loadWallet(seed: any, phrase: any): Promise<Object>;
    keys: import("tonweb-mnemonic").KeyPair | undefined;
    wallet: import("tonweb/dist/types/contract/wallet/v3/wallet-v3-contract-r1").WalletV3ContractR1 | undefined;
    address: string | undefined;
    /**
     * Gets the fee.
     *
     * @return {Promise<BN>} The fee.
     */
    getFee({ address, sendAmount, custom }?: {
        custom?: string | undefined;
    }): Promise<BN>;
    getTransactionExpirationTimeout(): number;
    getSeqno(): Promise<number | undefined>;
    /**
     * Creates a transaction.
     *
     * @param {string} address The destination address
     * @param {number} amount The amount to send
     * @return {Promise<string>} Raw transaction
     */
    createTransaction({ address, amount, memo }: string): Promise<string>;
    setPrivateKey(privateKey: any, mnemonic: any): Promise<Object>;
    getInfo(props: any): Promise<{
        balance: any;
    }>;
    state: boolean | undefined;
    validateAddress(address: any): Promise<boolean>;
    sendTransaction(tx: any): Promise<{
        txid: any;
    }>;
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
     * @TODO Not implemented yet
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
     * Maps from common token list to internal token format
     * @returns {Promise<Array>}
     */
    getTokenFromCommonList(token: any, source: any): Promise<any[]>;
    /**
     * Creates a token.
     *
     * @param {object} args - The arguments.
     * @return {TONToken}
     */
    createToken(args: object): TONToken;
    /**
     * Gets token balance
     *
     * @param {string} mint - Token contract address.
     * @returns {Promise<string|null>}
     */
    getTokenInfo({ mint }: string): Promise<string | null>;
    /**
     * Creates a token transaction.
     *
     * @param {object} params - The parameters for creating the token transaction.
     * @param {string} params.mint - The address of the mint.
     * @param {string} params.address - The address to send the tokens to.
     * @param {number} params.amount - The amount of tokens to transfer.
     * @returns {Promise<string>} - Raw transaction - base64 representation (boc).
     * @throws {ExternalError} - Throws an ExternalError if there was an error creating the token transaction.
     */
    createTokenTransaction({ mint, address, amount }: {
        mint: string;
        address: string;
        amount: number;
    }): Promise<string>;
    checkTransaction(txInfo: any): Promise<void>;
    /**
     * Gets token transaction list
     *
     * @param {string} contract - Contract address.
     * @returns {Promise<Transaction[]>}
     */
    getTokenTransactions({ jettonWalletAddress }: string): Promise<Transaction[]>;
    /**
     * Gets the jetton wallet address for the specified jetton mint address.
     *
     * @async
     * @param {string} jettonMintAddress - The address of the jetton mint.
     * @returns {Promise<string>} - The jetton wallet address.
     */
    getJettonWalletAddress(jettonMintAddress: string): Promise<string>;
    #private;
}
import { TONToken } from '../../tokens/index.js';
