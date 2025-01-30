export const erc1155Abi: {
    inputs: {
        internalType: string;
        name: string;
        type: string;
    }[];
    name: string;
    outputs: never[];
    stateMutability: string;
    type: string;
}[];
export const erc721Abi: {
    constant: boolean;
    inputs: {
        internalType: string;
        name: string;
        type: string;
    }[];
    name: string;
    outputs: never[];
    payable: boolean;
    stateMutability: string;
    type: string;
}[];
export default ETHNftExplorer;
/**
 * Class ETHNftExplorer.
 *
 */
declare class ETHNftExplorer extends Explorer {
    constructor({ wallet, config }: {
        wallet: any;
        config: any;
    });
    baseUrl: string;
    web3: Web3;
    ticker: any;
    /**
     * Gets gas price from node
     *
     * @returns {Promise<string>}
     */
    getGasPrice(): Promise<string>;
    /**
     * Gets gas limit from node
     *
     * @async
     * @param {string} from - Wallet address.
     * @param {string} to - Destination wallet or contract address.
     * @param {number|null} [nonce] - Nonce.
     * @param {string} data - Encoded token ABI data.
     * @returns {Promise<number>}
     */
    estimateGas(from: string, to: string, nonce?: number | null, data: string): Promise<number>;
    sendTransaction(rawtx: any): Promise<any>;
    /**
     *
     * @param {Object<Coin>} coin
     * @param {string} toAddress - Destination wallet address.
     * @param {string} contractAddress - NFT contract address.
     * @param {string} tokenId - Token id.
     * @param {ERC721_TOKEN_STANDARD | ERC1155_TOKEN_STANDARD | string} tokenStandard - Token standard.
     * @returns {Promise<string>}
     * @throws {ExternalError}
     */
    getNftContractData(coin: Object<Coin>, toAddress: string, contractAddress: string, tokenId: string, tokenStandard: "ERC-721" | "ERC-1155" | string): Promise<string>;
    /**
     * Send NFT to other wallet
     *
     * @async
     * @param {Object<Coin>} coin
     * @param {string} toAddress - Destination wallet address.
     * @param {string} contractAddress - NFT contract address.
     * @param {string} tokenId - Token id.
     * @param {ERC721_TOKEN_STANDARD | ERC1155_TOKEN_STANDARD | string} tokenStandard - Token standard.
     * @param {Object} [options] - Custom user options.
     * @param {string} [options.userGasPrice] - Custom gas price.
     * @param {string} [options.userGasLimit] - Custom gas limit.
     * @returns {Promise<{tx: string}>} - Transaction hash.
     * @throws {ExternalError}
     * @throws {InternalError}
     */
    sendNft(coin: Object<Coin>, toAddress: string, contractAddress: string, tokenId: string, tokenStandard: "ERC-721" | "ERC-1155" | string, options?: {
        userGasPrice?: string | undefined;
        userGasLimit?: string | undefined;
    }): Promise<{
        tx: string;
    }>;
}
import Explorer from '../../explorers/explorer.js';
import Web3 from 'web3';
