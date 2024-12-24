import { NftToken } from './index'

const BLOCKCHAIN = 'Solana'
const DEFAULT_TOKEN_STANDARD = 'SPL'

/**
 * Class representing Solana NFT
 */
class SOLNftToken extends NftToken {
  /**
   * Create Solana NFT
   * @param {string} tokenId - The id value. Means Solana NFT mint.
   * @param {string} ticker - NFT ticker.
   * @param {string} name - NFT name.
   * @param {string} [description] - NFT description. Optional.
   * @param {string} imageUrl - URL to NFT image.
   */
  constructor (tokenId, ticker, name, description, imageUrl) {
    super(null, tokenId, ticker, BLOCKCHAIN, DEFAULT_TOKEN_STANDARD, name, description, imageUrl)
  }
}

export default SOLNftToken
