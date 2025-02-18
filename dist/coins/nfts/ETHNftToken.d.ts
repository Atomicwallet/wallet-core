import { NftToken } from '../../coins/nfts/index.js';
export declare const ERC721_TOKEN_STANDARD = "ERC-721";
export declare const ERC1155_TOKEN_STANDARD = "ERC-1155";
export declare const UNRECOGNIZED_TOKEN_STANDARD: unique symbol;
export declare const erc721StandardTest: RegExp;
export declare const erc1155StandardTest: RegExp;
/**
 * Class representing Ethereum NFT
 */
declare class ETHNftToken extends NftToken {
    /**
     * Create Ethereum NFT
     */
    constructor(contractAddress: string, tokenId: string, coinId: string, tokenStandard: string, name: string, description: undefined, imageUrl: string);
}
export default ETHNftToken;
