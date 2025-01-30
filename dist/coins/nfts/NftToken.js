import axios from 'axios';
import { DEFAULT_IPFS_GATEWAY } from '../../env.js';
const IPFS_PROTOCOL = /(^ipfs:\/\/ipfs\/|^ipfs:\/\/)/;
const HTTP_OK = 200;
/**
 * Class representing NFTs
 */
export default class NftToken {
    static { this.ipfsGateway = DEFAULT_IPFS_GATEWAY; }
    /**
     * Create a NFT
     */
    constructor(contractAddress, tokenId, coinId, blockchain, tokenStandard, name, description = undefined, imageUrl, expiredAt) {
        this.contractAddress = contractAddress;
        this.tokenId = tokenId;
        this.coinId = coinId;
        this.blockchain = blockchain;
        this.tokenStandard = tokenStandard;
        this.name = name;
        this.description = description;
        this.imageUrl = imageUrl;
        this.expiredAt = expiredAt;
    }
    /**
     * @deprecated
     */
    get address() {
        return this.contractAddress;
    }
    get id() {
        return `${this.coinId}-${this.contractAddress}-${this.tokenId}`;
    }
    /**
     * @deprecated
     */
    get standard() {
        return this.tokenStandard;
    }
    /**
     * @deprecated
     */
    get image() {
        return this.imageUrl;
    }
    /**
     * Returns url to image location. Ipfs links is get replaced with ipfs http links.
     */
    getImageUrl() {
        return this.imageUrl?.replace(IPFS_PROTOCOL, NftToken.ipfsGateway);
    }
    /**
     * Returns Buffer of file contents and content-type
     */
    async fetchImageBlob() {
        if (!this.imageUrl) {
            throw new Error('NftToken: fetchImageBlob: No imageUrl');
        }
        const response = await axios(this.getImageUrl(), {
            responseType: 'arraybuffer',
        });
        if (response.status !== HTTP_OK) {
            throw new Error(`NftToken: fetchImageBlob: Could not fetch image blob: Server returned ${response.status}`);
        }
        return {
            base64: response.data,
            buffer: Buffer.from(response.data, 'base64'),
            contentType: response.headers['content-type'],
        };
    }
    /**
     * Sets NftToken.ipfsGateway from config
     */
    static async updateIpfsGateway() {
        // @TODO implement fetch ipfs settings
    }
}
//# sourceMappingURL=NftToken.js.map