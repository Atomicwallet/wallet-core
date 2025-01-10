import axios from 'axios';
import { ETHNftToken } from 'src/coins/nfts';
import {
  ERC1155_TOKEN_STANDARD,
  ERC721_TOKEN_STANDARD,
  erc1155StandardTest,
  erc721StandardTest,
  UNRECOGNIZED_TOKEN_STANDARD,
} from 'src/coins/nfts/ETHNftToken';
import { getTransformedTokenUri } from 'src/coins/nfts/utils';
import { MORALIS_API_KEY, MORALIS_NATIVE_API } from 'src/env';
import { ExternalError, InternalError } from 'src/errors';
import { TxTypes } from 'src/explorers/enum';
import Explorer from 'src/explorers/explorer';
import { GET_TRANSACTIONS_TYPE, EXTERNAL_ERROR, INTERNAL_ERROR } from 'src/utils/const';
import { getStringWithEnsuredEndChar } from 'src/utils/convert';

const convertPairs = [
  [erc721StandardTest, ERC721_TOKEN_STANDARD],
  [erc1155StandardTest, ERC1155_TOKEN_STANDARD],
];

const AXIOS_GET_METHOD = 'get';
const MAX_LIMIT_TOKEN_TRANSACTIONS_REQUEST = 100;
const MAX_LIMIT_NFT_TRANSACTIONS_REQUEST = 100;
const NFT_FAKE_VALUE = 'NFT';

/**
 * Class MoralisExplorer.
 *
 */
class MoralisExplorer extends Explorer {
  constructor({ wallet, config }) {
    super({ wallet, config });

    this.chain = config.chain || 'eth';
  }

  getAllowedTickers() {
    return ['ETH', 'BSC', 'MATIC', 'AVAX', 'FTM'];
  }

  async getInfo(address, isSpamNftsEnabled) {
    try {
      const response = await this.request(
        this.getInfoUrl(address),
        this.getInfoMethod(),
        this.getInfoParams(address, this.chain, isSpamNftsEnabled),
      );

      return this.modifyInfoResponse(response);
    } catch (error) {
      throw new ExternalError({ type: EXTERNAL_ERROR, error, instance: this });
    }
  }

  getInfoUrl(address) {
    return `/${address}/nft`;
  }

  /**
   * Gets is ApiKey required sign
   *
   * @param (string) baseUrl
   * @returns {boolean}
   */
  getIsApiKeyRequired(baseUrl) {
    return getStringWithEnsuredEndChar(baseUrl, '/') === MORALIS_NATIVE_API;
  }

  getInitParams() {
    const parentParams = super.getInitParams();

    const headers = {
      accept: 'application/json',
    };

    if (this.getIsApiKeyRequired(parentParams?.baseURL)) {
      headers['X-API-Key'] = MORALIS_API_KEY;
    }

    return {
      ...parentParams,
      headers,
    };
  }

  getInfoParams(address, chain, isSpamNftsEnabled) {
    return {
      chain,
      format: 'decimal',
      exclude_spam: !isSpamNftsEnabled,
    };
  }

  /**
   * @typedef {Object} FetchRawListResponse
   * @param {string} contractAddress - NFT contract address.
   * @param {string} tokenId - NFT token id.
   * @param {string} tokenStandard - NFT standard.
   * @param {string} name - NFT name.
   * @param {string} description - NFT description.
   * @param {string} imageUrl - Url to NFT image.
   */

  /**
   *
   * @async
   * @param {Object} response
   * returns {Promise<FetchRawListResponse[]>}
   * @throws {ExternalError}
   * @throws {InternalError}
   */
  async modifyInfoResponse(response) {
    // @TODO Use next for pagination
    // const { total, page, page_size, cursor, result: nfts } = response
    const { result: nftRawList } = response;

    const metadataPromises = [];

    const nftList = nftRawList.map((rawNft, index) => {
      const {
        token_address: contractAddress,
        token_id: tokenId,
        token_uri: tokenUri,
        contract_type: tokenStandard,
        metadata,
      } = rawNft;

      if (!metadata) {
        // In some cases, the metadata is missing, so we can get it using the token_uri
        const transformedTokenUri = getTransformedTokenUri({
          tokenId,
          tokenUri,
        });

        metadataPromises.push(
          Promise.all([
            index,
            axios.get(transformedTokenUri).catch((error) => {
              // @TODO New error type
              throw new Error(JSON.stringify({ index, error }));
            }),
          ]),
        );
        return { contractAddress, tokenId, tokenStandard };
      }

      try {
        const { name, description, image: imageUrl } = JSON.parse(metadata);

        return {
          contractAddress,
          tokenId,
          tokenStandard,
          name,
          description,
          imageUrl,
        };
      } catch (error) {
        console.warn(error);
        throw new InternalError({
          type: INTERNAL_ERROR,
          error,
          instance: this,
        });
      }
    });

    try {
      const resultList = await Promise.allSettled(metadataPromises);

      resultList.forEach((result) => {
        if (result.status === 'fulfilled') {
          const {
            value: [index, { data: fetchedMetadata }],
          } = result;
          const { name, description, image: imageUrl } = fetchedMetadata;

          nftList[index] = { ...nftList[index], name, description, imageUrl };
        } else {
          const {
            reason: { message },
          } = result;

          try {
            const { index, message: errorMessage } = JSON.parse(message);

            console.warn(`Failed to get NFT metadata for tokenUri=${nftList[index]}`, errorMessage);
          } catch (error) {
            console.warn(error);
          }
          // Do nothing
        }
      });
    } catch (error) {
      console.warn(error);
      throw new ExternalError({ type: EXTERNAL_ERROR, error, instance: this });
    }

    return nftList;
  }

  /**
   * Fix token standard to specification values
   * Returns the value UNRECOGNIZED_TOKEN_STANDARD if it doesn't match the predefined values.
   *
   * @param {string} rawTokenStandard
   * @returns {string|Symbol}
   */
  fixTokenStandard(rawTokenStandard) {
    for (const [condition, value] of convertPairs) {
      if (condition.test(rawTokenStandard)) {
        return value;
      }
    }

    return UNRECOGNIZED_TOKEN_STANDARD;
  }

  /**
   * Fetch Ethereum NFT list
   *
   * @async
   * @param {Object<Coin>} coin
   * @param {boolean} isSpamNftsEnabled
   * @returns {Promise<ETHNftToken[]>}
   * @throws {ExternalError} - Throws error receiving NFT list
   */
  async fetchNftList(coin, isSpamNftsEnabled) {
    const { address: coinAddress } = coin;

    const rawList = await this.getInfo(coinAddress, isSpamNftsEnabled);

    return rawList.map(
      ({ contractAddress, tokenId, tokenStandard, name, description, imageUrl }) =>
        new ETHNftToken(
          contractAddress,
          tokenId,
          coin.id,
          this.fixTokenStandard(tokenStandard),
          name,
          description,
          imageUrl,
        ),
    );
  }

  /**
   * @typedef RawTokenTransactions
   * @type {object}
   * @property {string} contract - Token contract.
   * @property {string} alias
   * @property {string} explorer
   * @property {string} txid
   * @property {boolean} direction
   * @property {string} otherSideAddress
   * @property {string} value
   * @property {Date} datetime
   * @property {string} memo
   * @property {number} confirmations
   */

  /**
   * @typedef RawTokenTransactionsResponse
   * @type {object}
   * @property {number} total - Total transactions.
   * @property {number} page - Counted from zero.
   * @property {number} pageSize - Transactions on page.
   * @property {string|null} cursor - Every request will return a cursor that can be used to get the next result until
   * there are no more results to return.
   * @property {RawTokenTransactions[]} rawTokenTransactions
   */

  /**
   * Get specific smart-contract token transactions for a wallet
   *
   * @param {string} address - Wallet address.
   * @param {number} [limit=this.defaultTxLimit] - Page limit.
   * @param {string|null} [cursor=null] - Cursor.
   * @return {Promise<RawTokenTransactionsResponse>}
   */
  async getRawTokenTransactions({ address, limit = this.defaultTxLimit, cursor = null }) {
    try {
      const response = await this.request(
        this.getTokenTransactionsUrl(address),
        AXIOS_GET_METHOD,
        this.getTokenTransactionsParams(limit, cursor),
        GET_TRANSACTIONS_TYPE,
        this.getTransactionsOptions(),
      );

      return this.modifyRawTokenTransactionsResponse(response, address);
    } catch (error) {
      console.warn(error);
      return [];
    }
  }

  /**
   * Gets token transactions url
   *
   * @param {string} address  - Wallet address.
   * @returns {string}
   */
  getTokenTransactionsUrl(address) {
    return `/${address}/erc20/transfers`;
  }

  /**
   * Gets token transactions params
   *
   * @param {number} pageLimit - Page limit.
   * @param {string} [cursor] - Every request will return a cursor that can be used to get the next result until
   * there are no more results to return.
   * @return {{chain: string, limit: number, cursor: string}}
   */
  getTokenTransactionsParams(pageLimit, cursor) {
    const limit = pageLimit > MAX_LIMIT_TOKEN_TRANSACTIONS_REQUEST ? MAX_LIMIT_TOKEN_TRANSACTIONS_REQUEST : pageLimit;

    return {
      chain: this.chain,
      limit,
      cursor,
    };
  }

  /**
   * Modifies response to get raw token transactions
   *
   * @param {object} response
   * @param {string} selfAddress - Wallet address.
   * @returns {RawTokenTransactionsResponse}
   */
  modifyRawTokenTransactionsResponse(response, selfAddress) {
    const { total, page, page_size: pageSize, cursor, result: txs } = response ?? { result: [] };

    const rawTokenTransactions = txs.reduce((rawTxs, tx, index) => {
      try {
        const direction = this.getTokenTxDirection(selfAddress, tx);

        rawTxs.push({
          // Calculate some values in the coin because these not known here
          contract: tx.address,
          alias: this.wallet.alias,
          explorer: this.constructor.name,
          txid: tx.transaction_hash,
          direction,
          otherSideAddress: direction ? tx.from_address : tx.to_address,
          value: tx.value,
          datetime: new Date(tx.block_timestamp),
          memo: '',
          confirmations: 1,
          ticker: tx.token_symbol,
          name: tx.token_name,
        });

        return rawTxs;
      } catch (error) {
        console.warn('[FTM] tx parse failed');
        console.error(error);

        return rawTxs;
      }
    }, []);

    return { total, page, pageSize, cursor, rawTokenTransactions };
  }

  /**
   * Gets the token transaction direction.
   *
   * @param {string} selfAddress - Wallet address.
   * @param {object} tx - The transaction response.
   * @return {boolean} - True if we accept transaction.
   */
  getTokenTxDirection(selfAddress, tx) {
    return tx.to_address.toLowerCase() === selfAddress.toLowerCase();
  }

  /**
   * Returns user token list data
   * @param {string} address
   * @returns {object[]}
   */
  async getUserTokenList(address) {
    const results = await this.request(
      this.getUserTokenListUrl(address),
      AXIOS_GET_METHOD,
      this.getInfoParams(address, this.chain),
      '',
      this.getTransactionsOptions(),
    );

    return this.modifyUserTokenList(results);
  }

  /**
   * Modifies user's token list
   *
   * @param results
   * @returns {object[]}
   */
  modifyUserTokenList(results = []) {
    return results.map((token) => ({
      // @TODO One of this is redundant - contract or contractAddress but it's used - refactor that
      contract: token.token_address,
      contractAddress: token.token_address,
      decimals: 0,
      ...token,
    }));
  }

  /**
   * Gets token transactions url
   *
   * @param {string} address  - Wallet address.
   * @returns {string}
   */
  getUserTokenListUrl(address) {
    return `/${address}/erc20`;
  }

  /**
   * @typedef NftTransaction
   * @type {object}
   * @property {string} ticker
   * @property {string} name - Wallet name.
   * @property {string} alias
   * @property {string} walletid - Wallet id.
   * @property {string} explorer - Explorer name.
   * @property {string} contract - NFT token contract.
   * @property {'ERC-721'|'ERC-1155'} contractType
   * @property {number} tokenId
   * @property {string} txid - Transaction hash.
   * @property {boolean} direction
   * @property {string} otherSideAddress
   * @property {Date} datetime
   * @property {string} memo
   * @property {1} confirmations
   * @property {string} txType
   * @property {true} isNft
   * @property {'NFT'} amount - Fake NFT amount.
   */

  /**
   * @typedef NftTransactionsResponse
   * @type {object}
   * @property {number} total - Total transactions.
   * @property {number} page - Counted from zero.
   * @property {number} pageSize - Transactions on page.
   * @property {string|null} cursor - Every request will return a cursor that can be used to get the next result until
   * there are no more results to return.
   * @property {NftTransaction[]} rawTokenTransactions
   */

  /**
   * Get nft transactions for a wallet
   *
   * @param {string} address - Wallet address.
   * @param {number} [limit=this.defaultTxLimit] - Page limit.
   * @param {string|null} [cursor=null] - Cursor.
   * @return {Promise<NftTransactionsResponse>}
   */
  async getNftTransactions({ address, limit = this.defaultTxLimit, cursor = null }) {
    try {
      const response = await this.request(
        this.getNftTransactionsUrl(address),
        AXIOS_GET_METHOD,
        this.getNftTransactionsParams(limit, cursor),
        GET_TRANSACTIONS_TYPE,
        this.getTransactionsOptions(),
      );

      return this.modifyNftTransactionsResponse(response, address);
    } catch (error) {
      console.warn(error);
      return [];
    }
  }

  /**
   * Gets nft transactions url
   *
   * @param {string} address  - Wallet address.
   * @returns {string}
   */
  getNftTransactionsUrl(address) {
    return `/${address}/nft/transfers`;
  }

  /**
   * Gets nft transactions params
   *
   * @param {number} pageLimit - Page limit.
   * @param {string} [cursor] - Every request will return a cursor that can be used to get the next result until
   * there are no more results to return.
   * @return {{chain: string, limit: number, format: 'decimal', direction: 'both', cursor: string}}
   */
  getNftTransactionsParams(pageLimit, cursor) {
    const limit = pageLimit > MAX_LIMIT_NFT_TRANSACTIONS_REQUEST ? MAX_LIMIT_NFT_TRANSACTIONS_REQUEST : pageLimit;

    return {
      chain: this.chain,
      limit,
      format: 'decimal',
      direction: 'both',
      cursor,
    };
  }

  /**
   * Modifies response to get raw token transactions
   *
   * @param {object} response
   * @param {string} selfAddress - Wallet address.
   * @returns {NftTransactionsResponse}
   */
  modifyNftTransactionsResponse(response, selfAddress) {
    const { total, page, page_size: pageSize, cursor, result: txs } = response ?? { result: [] };

    const nftTransactions = txs.reduce((rawTxs, tx, index) => {
      try {
        const direction = this.getTokenTxDirection(selfAddress, tx);

        rawTxs.push({
          ticker: this.wallet.ticker,
          name: this.wallet.name,
          alias: this.wallet.alias,
          walletid: this.wallet.id,
          explorer: this.constructor.name,
          contract: tx.token_address,
          contractType: tx.contract_type,
          tokenId: tx.token_id,
          txid: tx.transaction_hash,
          direction,
          otherSideAddress: direction ? tx.from_address : tx.to_address,
          datetime: new Date(tx.block_timestamp),
          memo: '',
          confirmations: 1,
          txType: TxTypes.TRANSFERNFT,
          isNft: true,
          amount: NFT_FAKE_VALUE,
        });

        return rawTxs;
      } catch (error) {
        console.warn('[FTM] tx parse failed');
        console.error(error);

        return rawTxs;
      }
    }, []);

    return { total, page, pageSize, cursor, nftTransactions };
  }
}
export default MoralisExplorer;
