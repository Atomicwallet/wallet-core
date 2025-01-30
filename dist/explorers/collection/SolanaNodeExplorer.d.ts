export default SolanaNodeExplorer;
/**
 * Solana JSON-RCP explorer
 *
 */
declare class SolanaNodeExplorer extends Explorer {
    constructor({ wallet, config }: {
        wallet: any;
        config: any;
    });
    connection: Connection;
    socket: {} | undefined;
    setSocketClient(endpoint: any): void;
    getInfo(address: any): Promise<{
        balance: string;
    }>;
    modifyInfoResponse(response: any): {
        balance: string;
    };
    getCurrentSigs(pubkey: any, commitment?: string): Promise<(string | undefined)[]>;
    getLatestBlock(): Promise<Readonly<{
        blockhash: import("@solana/web3.js").Blockhash;
        lastValidBlockHeight: number;
    }>>;
    modifyLatestBlockResponse(response: any): any;
    sendTransaction({ rawtx, signer }: {
        rawtx: any;
        signer: any;
    }): Promise<{
        txid: string;
    }>;
    sendRawTransaction(rawtx: any): Promise<{
        txid: string;
    }>;
    /**
     * Gets fee for send a transaction
     *
     * @returns {Promise<string>}
     * @throws {ExternalError}
     */
    getFee(): Promise<string>;
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
    getTxInstruction(tx: any): {
        destination: string;
        source: string;
        lamports: number;
    };
    getTxHash(tx: any): any;
    getTxDirection(selfAddress: any, tx: any): boolean;
    getTxOtherSideAddress(selfAddress: any, tx: any): string;
    getTxValue(address: any, tx: any): string;
    getTxDateTime(tx: any): Date;
    getTxMemo(tx: any): string;
    getTransactions({ address }: {
        address: any;
    }): Promise<import("../Transaction.js").default[]>;
    getSpecifiedTransactions(sigs: any, selfAddress: any): Promise<import("../Transaction.js").default[]>;
    modifyTransactionResponse(txs: any, selfAddress: any): any;
    /**
     * Fetch minimal amount for rent stake
     * @param length
     * @returns {Promise<number>}
     */
    getMinRent(length?: number): Promise<number>;
    connectSocket(address: any): Promise<void>;
    processTxsChangeEvent(event: any, pubkey: any): Promise<void>;
    processBalanceChangeEvent(event: any, pubkey: any): void;
    getTxFee(tx: any): any;
    getTxConfirmations(): number;
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
    getUserTokenList(): Promise<any[]>;
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
import { SOLNftToken } from '../../coins/nfts/index.js';
