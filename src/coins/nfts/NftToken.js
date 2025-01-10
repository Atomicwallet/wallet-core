import axios from 'axios';

// import configManager from '../ConfigManager'
// import { ConfigKey } from '../ConfigManager/ConfigManager.const'
import { DEFAULT_IPFS_GATEWAY } from '../../env';

const IPFS_PROTOCOL = /(^ipfs:\/\/ipfs\/|^ipfs:\/\/)/;
const HTTP_OK = 200;

/**
 * Class representing NFTs
 */
class NftToken {
  static ipfsGateway = DEFAULT_IPFS_GATEWAY;

  /**
   * Create a NFT
   *
   * @param {string | null} contractAddress - NFT contract address.
   * @param {string} tokenId - NFT id.
   * @param {string} coinId - Coin id.
   * @param {string} blockchain - NFT blockchain. For example `Ethereum` for NFTs in Ethereum blockchain.
   * @param {string} tokenStandard - The token standard. For example `ERC-721` for NFTs in Ethereum blockchain.
   * @param {string} name - NFT name.
   * @param {string} [description] - NFT description. Optional.
   * @param {string} imageUrl - URL to NFT image.
   */
  constructor(
    contractAddress,
    tokenId,
    coinId,
    blockchain,
    tokenStandard,
    name,
    description = undefined,
    imageUrl,
  ) {
    /** @type string | null */
    this.contractAddress = contractAddress;
    /** @type string */
    this.tokenId = tokenId;
    /** @type string */
    this.coinId = coinId;
    /** @type string */
    this.blockchain = blockchain;
    /** @type string */
    this.tokenStandard = tokenStandard;
    /** @type string */
    this.name = name;
    /** @type string | undefined */
    this.description = description;
    /** @type string */
    this.imageUrl = imageUrl;
  }

  /**
   * @deprecated
   * @returns {string}
   */
  get address() {
    return this.contractAddress;
  }

  /**
   * @returns {string}
   */
  get id() {
    return `${this.coinId}-${this.contractAddress}-${this.tokenId}`;
  }

  /**
   * @deprecated
   * @returns {string}
   */
  get standard() {
    return this.tokenStandard;
  }

  /**
   * @deprecated
   * @returns {string}
   */
  get image() {
    return this.imageUrl;
  }

  /**
   * Returns url to image location. Ipfs links is get replaced with ipfs http links.
   * @returns {string}
   */
  getImageUrl() {
    return this.imageUrl?.replace(IPFS_PROTOCOL, NftToken.ipfsGateway);
  }

  /**
   * Returns Buffer of file contents and content-type
   * @returns {Promise<{ buffer: Buffer, contentType: string }>}
   */
  async fetchImageBlob() {
    if (!this.imageUrl) {
      throw new Error('NftToken: fetchImageBlob: No imageUrl');
    }

    const response = await axios(this.getImageUrl(), {
      responseType: 'arraybuffer',
    });

    if (response.status !== HTTP_OK) {
      throw new Error(
        `NftToken: fetchImageBlob: Could not fetch image blob: Server returned ${response.status}`,
      );
    }

    return {
      base64: response.data,
      buffer: Buffer.from(response.data, 'base64'),
      contentType: response.headers['content-type'],
    };
  }

  /**
   * Sets NftToken.ipfsGateway from config
   *
   * @returns {Promise<void>}
   */
  static async updateIpfsGateway() {
    // const { ipfsGateway } = await configManager.get(ConfigKey.IpfsGateway).catch() ?? {}
    //
    // if (ipfsGateway) {
    //   NftToken.ipfsGateway = ipfsGateway
    // }
  }
}

export default NftToken;
