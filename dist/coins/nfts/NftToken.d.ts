/**
 * Class representing NFTs
 */
export default class NftToken {
    static ipfsGateway: any;
    contractAddress: string | null;
    tokenId: string;
    coinId: string;
    blockchain: string | undefined;
    tokenStandard: string;
    name: string;
    description: string | undefined;
    imageUrl: string;
    expiredAt?: number | string;
    /**
     * Create a NFT
     */
    constructor(contractAddress: string | null, tokenId: string, coinId: string, blockchain: string | undefined, tokenStandard: string, name: string, description: string | undefined, imageUrl: string, expiredAt?: number | string);
    /**
     * @deprecated
     */
    get address(): string | null;
    get id(): string;
    /**
     * @deprecated
     */
    get standard(): string;
    /**
     * @deprecated
     */
    get image(): string;
    /**
     * Returns url to image location. Ipfs links is get replaced with ipfs http links.
     */
    getImageUrl(): string;
    /**
     * Returns Buffer of file contents and content-type
     */
    fetchImageBlob(): Promise<{
        base64: any;
        buffer: Buffer<ArrayBuffer>;
        contentType: any;
    }>;
    /**
     * Sets NftToken.ipfsGateway from config
     */
    static updateIpfsGateway(): Promise<void>;
}
