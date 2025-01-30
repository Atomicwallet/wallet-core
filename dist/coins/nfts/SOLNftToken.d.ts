import { NftToken } from '../../coins/nfts/index.js';
/**
 * Class representing Solana NFT
 */
export default class SOLNftToken extends NftToken {
    /**
     * Create Solana NFT
     */
    constructor(tokenId: string, ticker: string, name: string, description: string, imageUrl: string);
}
