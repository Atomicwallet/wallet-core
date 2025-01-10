import { NftToken } from 'src/coins/nfts/index';

const BLOCKCHAIN = 'Solana';
const DEFAULT_TOKEN_STANDARD = 'SPL';

/**
 * Class representing Solana NFT
 */
export default class SOLNftToken extends NftToken {
  /**
   * Create Solana NFT
   */
  constructor(tokenId: string, ticker: string, name: string, description: string, imageUrl: string) {
    super(null, tokenId, ticker, BLOCKCHAIN, DEFAULT_TOKEN_STANDARD, name, description, imageUrl);
  }
}
