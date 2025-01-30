import { ERC721_TOKEN_STANDARD, ERC1155_TOKEN_STANDARD } from '../../coins/nfts/ETHNftToken.js';
import { ExternalError, InternalError } from '../../errors/index.js';
import Explorer from '../../explorers/explorer.js';
import { EXTERNAL_ERROR, INTERNAL_ERROR } from '../../utils/const/index.js';
import { getStringWithEnsuredEndChar } from '../../utils/convert.js';
import Web3 from 'web3';
const TRANSACTION_RECEIPT = 'transactionHash';
const HEX_ZERO = '0x0';
// @TODO Move to constants
export const erc1155Abi = [
    {
        inputs: [
            {
                internalType: 'address',
                name: '_from',
                type: 'address',
            },
            {
                internalType: 'address',
                name: '_to',
                type: 'address',
            },
            {
                internalType: 'uint256',
                name: '_id',
                type: 'uint256',
            },
            {
                internalType: 'uint256',
                name: '_amount',
                type: 'uint256',
            },
            {
                internalType: 'bytes',
                name: '_data',
                type: 'bytes',
            },
        ],
        name: 'safeTransferFrom',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
];
export const erc721Abi = [
    {
        constant: false,
        inputs: [
            {
                internalType: 'address',
                name: 'from',
                type: 'address',
            },
            {
                internalType: 'address',
                name: 'to',
                type: 'address',
            },
            {
                internalType: 'uint256',
                name: 'tokenId',
                type: 'uint256',
            },
        ],
        name: 'safeTransferFrom',
        outputs: [],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
    },
];
/**
 * Class ETHNftExplorer.
 *
 */
class ETHNftExplorer extends Explorer {
    constructor({ wallet, config }) {
        super({ wallet, config });
        this.baseUrl = getStringWithEnsuredEndChar(config.baseUrl, '/');
        this.web3 = new Web3(config.baseUrl);
        this.ticker = wallet.ticker;
    }
    getAllowedTickers() {
        return ['ETH', 'BSC', 'MATIC', 'AVAX', 'FTM'];
    }
    /**
     * Make NFT info url
     *
     * @param {string} contractAddress - Contract address.
     * @param {string} [tokenId] - Token id.
     * @returns {string} - NFT info url.
     */
    makeNftInfoUrl(contractAddress, tokenId) {
        return `${this.baseUrl}${contractAddress}?a=${tokenId}`;
    }
    /**
     * Gets gas price from node
     *
     * @returns {Promise<string>}
     */
    async getGasPrice() {
        return this.web3.eth.getGasPrice();
    }
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
    estimateGas(from, to, nonce = null, data) {
        const transactionConfig = {
            from,
            to,
            data,
        };
        if (nonce) {
            // @TODO Nonce is not part of the gas estimation call params.
            transactionConfig.nonce = nonce + 1;
        }
        return this.web3.eth.estimateGas(transactionConfig);
    }
    sendTransaction(rawtx) {
        return new Promise((resolve, reject) => {
            this.wallet.coreLibrary.eth
                .sendSignedTransaction(rawtx)
                .on(TRANSACTION_RECEIPT, (hash) => {
                resolve({
                    tx: hash,
                });
            })
                .catch((error) => reject(error));
        });
    }
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
    async getNftContractData(coin, toAddress, contractAddress, tokenId, tokenStandard) {
        if (![ERC721_TOKEN_STANDARD, ERC1155_TOKEN_STANDARD].includes(tokenStandard)) {
            throw new InternalError({
                type: INTERNAL_ERROR,
                error: 'Unrecognized nft token standard',
                instance: this,
            });
        }
        const { address: fromAddress } = coin;
        /**
         * @typedef GetSafeTransferDataFunction
         * @type {function}
         * @param {string} from - From address.
         * @param {string} to - To address.
         * @param {string} contract - Contract address.
         * @param {string} id - Token id.
         * @returns {string}
         */
        /** @type {Object.<string, GetSafeTransferDataFunction>} */
        const ethTokenStandardSafeTransferFrom = {
            [ERC1155_TOKEN_STANDARD]: (from, to, contract, id) => {
                const tokenContract = new this.web3.eth.Contract(erc1155Abi, contract);
                return tokenContract.methods.safeTransferFrom(from, to, id, 1, HEX_ZERO).encodeABI();
            },
            [ERC721_TOKEN_STANDARD]: (from, to, contract, id) => {
                const tokenContract = new this.web3.eth.Contract(erc721Abi, contract);
                return tokenContract.methods.safeTransferFrom(from, to, id).encodeABI();
            },
        };
        return ethTokenStandardSafeTransferFrom[tokenStandard](fromAddress, toAddress, contractAddress, tokenId);
    }
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
    async sendNft(coin, toAddress, contractAddress, tokenId, tokenStandard, options) {
        try {
            const data = await this.getNftContractData(coin, toAddress, contractAddress, tokenId, tokenStandard);
            const signedRawTransaction = await coin.createNftTransaction({
                toAddress,
                contractAddress,
                data,
                userOptions: options,
            });
            return await this.sendTransaction(signedRawTransaction);
        }
        catch (error) {
            console.warn(error);
            throw new ExternalError({ type: EXTERNAL_ERROR, error, instance: this });
        }
    }
}
export default ETHNftExplorer;
//# sourceMappingURL=ETHNftExplorer.js.map