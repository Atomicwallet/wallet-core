import { NftToken } from '../../coins/nfts/index.js';
const BLOCKCHAIN = 'Solana';
const DEFAULT_TOKEN_STANDARD = 'SPL';
/**
 * Class representing Solana NFT
 */
export default class SOLNftToken extends NftToken {
    /**
     * Create Solana NFT
     */
    constructor(tokenId, ticker, name, description, imageUrl) {
        super(null, tokenId, ticker, BLOCKCHAIN, DEFAULT_TOKEN_STANDARD, name, description, imageUrl);
    }
}
//# sourceMappingURL=SOLNftToken.js.map