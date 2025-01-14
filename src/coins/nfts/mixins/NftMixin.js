import { ExternalError, InternalError } from 'src/errors';
import { EXTERNAL_ERROR, INTERNAL_ERROR } from 'src/utils/const';

const NftMixin = (superclass) =>
  class extends superclass {
    /**
     * Constructs the object
     *
     * Checks getProvider method for existence and throws if not.
     */
    constructor() {
      super(...arguments);

      if (typeof super.getProvider !== 'function') {
        throw new InternalError({ type: INTERNAL_ERROR, instance: this });
      }
    }

    /**
     * Get the NFT info url
     *
     * @param {string | null} contractAddress - NFT contract address.
     * @param {string} tokenId - Token id.
     * @returns {string} - NFT info url.
     */
    getNftInfoUrl(contractAddress, tokenId) {
      return this.getProvider('nft-mint-url').makeNftInfoUrl(contractAddress, tokenId);
    }

    /**
     * Get NFT list
     *
     * @async
     * @param {boolean} isSpamNftsEnabled
     * @returns {Promise<Object<NftToken>[]>}
     * @throws {ExternalError} - Throws error receiving NFT list
     */
    async getNftList(isSpamNftsEnabled) {
      return this.getProvider('nft-get').fetchNftList(this, isSpamNftsEnabled);
    }

    /**
     * Transfer NFT to other address
     *
     * @async
     * @param {string | null} contractAddress - NFT contract address.
     * @param {string} tokenId - Token id.
     * @param {string} toAddress - Recipient address.
     * @param {Object} [options={}] - Some custom options.
     * @returns {Promise<{tx: string}>} - Transaction hash.
     * @throws {ExternalError} - NFT transfer error.
     * @throws {InternalError} - NFT token removing from local storage error.
     */
    async transferNft(contractAddress, tokenId, toAddress, options = {}) {
      const tokenStandard = {};

      // TODO implement token standard config

      let transferResponse;

      try {
        transferResponse = await this.getProvider('nft-send').sendNft(
          this,
          toAddress,
          contractAddress,
          tokenId,
          tokenStandard,
          options,
        );
      } catch (error) {
        console.warn(error);
        throw new ExternalError({
          type: EXTERNAL_ERROR,
          error,
          instance: this,
        });
      }

      // TODO implement history data storage

      return transferResponse;
    }
  };

export default NftMixin;
