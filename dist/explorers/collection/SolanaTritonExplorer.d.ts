export default SolanaTritonExplorer;
export type DetectFunction = Function;
export type ParseFunction = Function;
/**
 * Solana Triton JSON-RCP explorer
 *
 * Official Solana JSON RPC API Reference:
 * https://docs.solana.com/developing/clients/jsonrpc-api#json-rpc-api-reference
 *
 */
declare class SolanaTritonExplorer extends Explorer {
    /**
     * Creates SolanaTritonExplorer
     * @param {Object} param
     * @param {Coin} param.wallet - Initialised Coin instance.
     * @param {{baseUrl: string}} param.config - Explorer config.
     */
    constructor({ wallet, config }: {
        wallet: Coin;
        config: {
            baseUrl: string;
        };
    });
    connection: Connection;
    /**
     * Sets socket client.
     *
     * @param {string} endpoint
     * @memberof Explorer
     */
    setSocketClient(endpoint: string): void;
    /**
     * Gets balance from blockchain
     *
     * @param {string} address
     * @returns {Promise<{balance: string}>} - The account balance
     * @throws {ExternalError}
     */
    getInfo(address: string): Promise<{
        balance: string;
    }>;
    /**
     * Gets a latest block
     *
     * @async
     * @returns {Promise<{blockhash: Blockhash, feeCalculator: FeeCalculator}>}
     */
    getLatestBlock(): Promise<{
        blockhash: Blockhash;
        feeCalculator: FeeCalculator;
    }>;
    /**
     * Sends a transaction
     *
     * @param {string} rawtx - Unsigned raw transaction.
     * @param {Object} signer - The signer private key.
     * @returns {Promise<{txid: string}>} - The transaction id.
     * @throws {ExternalError}
     */
    sendTransaction({ rawtx, signer }: string): Promise<{
        txid: string;
    }>;
    /**
     * Sends a raw transaction
     *
     * @param {string} rawtx - Signed raw transaction.
     * @returns {Promise<{txid: string}>} - The transaction id.
     * @throws {ExternalError}
     */
    sendRawTransaction(rawtx: string): Promise<{
        txid: string;
    }>;
    /**
     * Gets fee for send a transaction
     *
     * @returns {Promise<string>}
     * @throws {ExternalError}
     */
    getFee(): Promise<string>;
    getCurrentSigs(pubkey: any, commitment?: string): Promise<(string | undefined)[]>;
    getAccountInfo(pubKey: any): Promise<import("@solana/web3.js").RpcResponseAndContext<import("@solana/web3.js").AccountInfo<Buffer<ArrayBufferLike> | import("@solana/web3.js").ParsedAccountData> | null>>;
    getEpochInfo(): Promise<import("@solana/web3.js").EpochInfo>;
    getStakeProgramInfo(address: any): Promise<{
        pubkey: PublicKey;
        account: import("@solana/web3.js").AccountInfo<Buffer | import("@solana/web3.js").ParsedAccountData>;
    }[]>;
    /**
     * Fetch stake account info from the most recent block
     * which has reached 1 confirmation by the connected node (NOT THE WHOLE CLUSTER)
     * use commitment `confirmed` for 1 CLUSTER confirmation
     * or commitment `finalize` for whole cluster confirmation
     * @param address
     * @returns {Promise<{account: *, pubkey: *}>}
     */
    getStakeAccountInfo(address: any): Promise<{
        account: any;
        pubkey: any;
    }>;
    modifyStakeAccountInfo(response: any, address: any): {
        account: any;
        pubkey: PublicKey;
    };
    getStakingBalance(props: any): Promise<{
        staking: ({
            accountAddress: any;
            staked: any;
            validator: any;
            isDeactivated: boolean;
            isAvailableForWithdraw: boolean;
        } | undefined)[];
        staked: any;
        total: BN;
    }>;
    /**
     * Fetch minimal amount for rent stake
     * @param length
     * @returns {Promise<number>}
     */
    getMinRent(length?: number): Promise<number>;
    connectSocket(address: any): Promise<void>;
    processTxsChangeEvent(event: any, pubkey: any): Promise<void>;
    processBalanceChangeEvent(event: any, pubkey: any): void;
    getTxConfirmations(): number;
    /**
     * Fetch limited set of Tx signatures for the specified public key
     *
     * @param {PublicKey} pubKey - '@solana/web3.js' PublicKey
     * @param {number} limit - Search until this transaction signature is reached, if found before limit.
     * @returns {Promise<string[]>}
     */
    fetchTxSignaturesForChunk(pubKey: PublicKey, limit?: number): Promise<string[]>;
    /**
     * @typedef ParsedInstruction
     * @type {object}
     * @property {string} source - Source address.
     * @property {string} destination - Destination address.
     * @property {boolean} isNft - Is NFT sign.
     * @property {boolean} isToken - Is NFT sign.
     * @property {string} amount - Amount.
     * @property {number} [decimal] - Decimals.
     * @property {string} [symbol] - Symbol.
     * @property {string} [mint] - Mint.
     */
    /**
     * Get cleaned tx instruction
     *
     * @param {ParsedConfirmedTransaction} tx
     * @param {object}[] tokensFromDb
     * @returns {ParsedInstruction}
     */
    getTxInstruction(tx: ParsedConfirmedTransaction, tokensFromDb: any): {
        /**
         * - Source address.
         */
        source: string;
        /**
         * - Destination address.
         */
        destination: string;
        /**
         * - Is NFT sign.
         */
        isNft: boolean;
        /**
         * - Is NFT sign.
         */
        isToken: boolean;
        /**
         * - Amount.
         */
        amount: string;
        /**
         * - Decimals.
         */
        decimal?: number | undefined;
        /**
         * - Symbol.
         */
        symbol?: string | undefined;
        /**
         * - Mint.
         */
        mint?: string | undefined;
    };
    getTxHash(tx: any): any;
    getTxDateTime(tx: any): Date;
    getTxMemo(tx: any): any;
    getTxFee(tx: any): any;
    /**
     * Fetch Txs for the specified signatures
     *
     * @param {string[]} signatures - Tx signatures array.
     * @returns {Promise<ParsedConfirmedTransaction[]>}
     */
    fetchTxsForChunk(signatures: string[]): Promise<ParsedConfirmedTransaction[]>;
    /**
     * Fetch transactions for the specified address
     *
     * @param {Object} param
     * @param {string} param.address - Coin address.
     * @param {number} [param.limit] - Search until this transaction signature is reached, if found before limit.
     * @param {number} [param.pageNum=0] - Page number.
     * @returns {Promise<Transaction[]>}
     */
    getTransactions({ address, limit, pageNum }: {
        address: string;
        limit?: number | undefined;
        pageNum?: number | undefined;
    }): Promise<Transaction[]>;
    /**
     * Create transactions from parsed transactions and address
     * @param {ParsedConfirmedTransaction[]} txs - Parsed confirmed transactions.
     * @param {string} selfAddress - Coin Address.
     * @returns {Transaction[]}
     */
    modifyTransactionsResponse(txs: ParsedConfirmedTransaction[], selfAddress: string): Transaction[];
    /**
     * @typedef {Object} FetchRawListResponse
     * @param {string} id - NFT id.
     * @param {string} name - NFT name.
     * @param {string} description - NFT description.
     * @param {string} image - Url to NFT image.
     */
    /**
     * Fetch raw NFT list owned by {address}
     * @async
     * @param {string} address - Owner address
     * @returns {Promise<{FetchRawListResponse}[]>} - NFTs fetched metadata list.
     * @throws {ExternalError} - Throws error receiving NFT list
     */
    fetchRawList(address: string): Promise<{
        FetchRawListResponse: any;
    }[]>;
    /**
     * Gets Solana NFT list
     *
     * @async
     * @param {Object<Coin>} coin
     * @returns {Promise<SOLNftToken[]>}
     * @throws {ExternalError} - Throws error receiving NFT list
     */
    fetchNftList(coin: Object<Coin>): Promise<SOLNftToken[]>;
    /**
     * Send Solana NFT to other wallet
     *
     * @async
     * @param {Object<Coin>} coin
     * @param {string} toAddress - destination wallet address.
     * @param {string | null} contractAddress - Not used in Solana.
     * @param {string} tokenId - Token id - Solana NFT mint used as id.
     * @param {string} [tokenStandard] - Token standard - not used in Solana.
     * @param {Object} [options] - Not used here.
     * @returns {Promise<{tx: string}>} - Transaction hash.
     * @throws {ExternalError} - Throws transfer NFT error.
     */
    sendNft(coin: Object<Coin>, toAddress: string, contractAddress: string | null, tokenId: string, tokenStandard?: string, options?: Object): Promise<{
        tx: string;
    }>;
    /**
     * Makes the NFT info url
     *
     * @param {string | null} contractAddress - Contract address (Not used here).
     * @param {string} tokenId - Token id.
     * @returns {string} - NFT info url.
     */
    makeNftInfoUrl(contractAddress: string | null, tokenId: string): string;
    /** @typedef TokenType
     * @type {object}
     * @property {}
     */
    getUserTokenList(): Promise<any[]>;
    /**
     * Send Solana token to other wallet
     *
     * @async
     * @function sendTokenTransaction
     * @param {string} coin - The coin to be sent.
     * @param {string} mint - The mint address from which the coin will be sent.
     * @param {string} toAddress - The destination address where the coin will be sent.
     * @param {number} amount - The amount of coin to be sent.
     * @param {number} decimals - The decimals of the used coin.
     * @return {Promise<{ txid: string }>} - A Promise that resolves to the transaction ID.
     */
    sendTokenTransaction(coin: string, mint: string, toAddress: string, amount: number, decimals: number): Promise<{
        txid: string;
    }>;
    /**
     * Gets token balance
     * @param {string} mint
     * @returns {Promise<string|null>}
     */
    getTokenBalance({ mint }: string): Promise<string | null>;
    #private;
}
import Explorer from '../../explorers/explorer.js';
import { Connection } from '@solana/web3.js';
import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import Transaction from '../../explorers/Transaction.js';
import { SOLNftToken } from '../../coins/nfts/index.js';
