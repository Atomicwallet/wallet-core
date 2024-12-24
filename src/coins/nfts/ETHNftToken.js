import { NftToken } from './index'

const ETH_BLOCKCHAIN = 'Ethereum'
const BSC_BLOCKCHAIN = 'BNB Smart Chain'
const POLYGON_BLOCKCHAIN = 'Polygon'
const AVALANCHE_BLOCKCHAIN = 'Avalanche'
const FANTOM_BLOCKCHAIN = 'Fantom'
const ARBITRUM_BLOCKCHAIN = 'Arbitrum'

const blockchain = (ticker) => {
  switch (ticker) {
    case 'ETH':
      return ETH_BLOCKCHAIN
    case 'BSC':
      return BSC_BLOCKCHAIN
    case 'MATIC':
      return POLYGON_BLOCKCHAIN
    case 'AVAX':
      return AVALANCHE_BLOCKCHAIN
    case 'FTM':
      return FANTOM_BLOCKCHAIN
    case 'ARB':
      return ARBITRUM_BLOCKCHAIN
    default:
      return undefined
  }
}

export const ERC721_TOKEN_STANDARD = 'ERC-721'
export const ERC1155_TOKEN_STANDARD = 'ERC-1155'
export const UNRECOGNIZED_TOKEN_STANDARD = Symbol('UNRECOGNIZED_TOKEN_STANDARD')

export const erc721StandardTest = /^ERC.?721$/i
export const erc1155StandardTest = /^ERC.?1155$/i

/**
 * Class representing Ethereum NFT
 */
class ETHNftToken extends NftToken {
  /**
   * Create Ethereum NFT
   * @param {string} contractAddress - NFT contract address.
   * @param {string} tokenId - NFT id.
   * @param {string} coinId - Coin id.
   * @param {string} tokenStandard - The token standard. For example `ERC-721` or 'ERC-1155'.
   * @param {string} name - NFT name.
   * @param {string} [description=undefined] - NFT description. Optional.
   * @param {string} imageUrl - URL to NFT image.
   */
  constructor (contractAddress, tokenId, coinId, tokenStandard, name, description = undefined, imageUrl) {
    super(contractAddress, tokenId, coinId, blockchain(coinId), tokenStandard, name, description, imageUrl)
  }
}

export default ETHNftToken
