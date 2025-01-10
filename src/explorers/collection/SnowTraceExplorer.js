import lodash from 'lodash';

import { TxTypes } from '../enum/index.js';
import Explorer from '../Explorer';
// import logger from '../Logger'
import { erc721Abi } from './ETHNftExplorer.js';

const GAS_PRICE_INTERVAL = 1000;
const GAS_PRICES_URL = 'https://gavax.blockscan.com/gasapi.ashx';
const ERC_721_SAFE_TRANSFER_FROM_METHOD_NAME = 'safeTransferFrom';
const NFT_FAKE_VALUE = 'NFT';

class SnowTraceExplorer extends Explorer {
  getAllowedTickers() {
    return ['AVAX'];
  }

  async getTransactions(...args) {
    try {
      return super.getTransactions(...args);
    } catch (error) {
      // logger.error({ instance: this, error: `${this.wallet.ticker}: failed to load transactions` })

      return [];
    }
  }

  getTransactionsUrl() {
    return '';
  }

  getTransactionsParams(address) {
    return {
      module: 'account',
      action: 'txlist',
      address: address.toLowerCase(),
    };
  }

  /**
   * Gets is nft sign
   *
   * @param {object} tx
   * @returns {boolean}
   */
  getIsNftTx(tx) {
    return (tx.functionName ?? '').includes(ERC_721_SAFE_TRANSFER_FROM_METHOD_NAME);
  }

  modifyTransactionsResponse(response, address) {
    const filteredBySuccess = response.result.filter((rawTx) => rawTx.isError !== '1');

    return super.modifyTransactionsResponse(filteredBySuccess, address);
  }

  getTxHash(tx) {
    return tx.hash;
  }

  /**
   * Gets the transaction direction.
   *
   * @param {object} tx - The transaction response.
   * @return {boolean} - True if we accept transaction.
   */
  getTxDirection(selfAddress, tx) {
    return selfAddress.toLowerCase() === tx.to;
  }

  /**
   * Gets other side address
   *
   * @param {string} selfAddress
   * @param {object} tx - The transaction response.
   * @returns {string}
   */
  getTxOtherSideAddress(selfAddress, tx) {
    const isOutTx = !this.getTxDirection(selfAddress, tx);

    if (this.getIsNftTx(tx) && isOutTx) {
      const {
        params: { to },
      } = this.decodeInput(tx.input) ?? { params: {} };

      return to ? to.toLowerCase() : tx.to;
    }

    return isOutTx ? tx.to : tx.from;
  }

  getTxValue(selfAddress, tx) {
    return this.getIsNftTx(tx) ? NFT_FAKE_VALUE : this.wallet.toCurrencyUnit(tx.value);
  }

  getTxDateTime(tx) {
    return new Date(Number(tx.timeStamp) * 1000);
  }

  getTxMemo(tx) {
    return tx.memo;
  }

  getTxNonce(tx) {
    return tx.nonce;
  }

  getTxFee(tx) {
    return this.wallet.toCurrencyUnit(new this.wallet.BN(tx.gasUsed).mul(new this.wallet.BN(tx.gasPrice)));
  }

  getTxFeeTicker() {
    return this.wallet.ticker;
  }

  /**
   * Returns defined tx type const
   *
   * @param {object} tx
   * @returns {string}
   */
  getTxType(tx) {
    return this.getIsNftTx(tx) ? TxTypes.TRANSFERNFT : TxTypes.TRANSFER;
  }

  getTransactionsModifiedResponse(tx, selfAddress) {
    return {
      ticker: this.wallet.ticker,
      name: this.wallet.name,
      walletid: this.wallet.id,
      txid: this.getTxHash(tx),
      direction: this.getTxDirection(selfAddress, tx),
      otherSideAddress: this.getTxOtherSideAddress(selfAddress, tx),
      amount: this.getTxValue(selfAddress, tx),
      datetime: this.getTxDateTime(tx),
      memo: this.getTxMemo(tx),
      confirmations: this.getTxConfirmations(tx),
      nonce: this.getTxNonce(tx),
      alias: this.wallet.alias,
      fee: this.getTxFee(tx),
      feeTicker: this.getTxFeeTicker(),
      txType: this.getTxType(tx),
      isNft: this.getIsNftTx(tx),
    };
  }

  async _getGasPrice() {
    try {
      const response = await this.request(GAS_PRICES_URL, 'get', {
        method: 'gasoracle',
        apikey: 'key',
      });

      return {
        fastest: response.result.FastGasPrice,
        fast: response.result.ProposeGasPrice,
        safeLow: response.result.SafeGasPrice,
      };
    } catch (error) {
      // logger.error({ instance: this, error: `${this.wallet.ticker}: failed to get gas prices` })

      return {};
    }
  }

  getGasPrice = lodash.throttle(this._getGasPrice, GAS_PRICE_INTERVAL);

  /**
   * @typedef TransactionDecodedInput
   * @type {object}
   * @property {string} method
   * @property {object} params
   * @property {string} params.from
   * @property {string} params.to
   * @property {string} params.tokenId
   */

  /**
   * Decodes transaction input
   *
   * @param {string} input
   * @return {TransactionDecodedInput | null}
   */
  decodeInput(input) {
    try {
      if (this.wallet.coreLibrary.utils.isHex(input)) {
        try {
          return this.wallet.coreLibrary.utils.hexToString(input);
        } catch (error) {
          // do nothing
        }

        const prefixLen = 4;
        const dataBuf = Buffer.from(input.replace(/^0x/, ''), 'hex');
        const inputMethod = `0x${dataBuf.slice(0, prefixLen).toString('hex')}`;
        const inputsBuf = dataBuf.slice(prefixLen);
        const result = { method: null, params: {} };

        // We use erc721 here, but for the first three parameters it will be the same as erc1155
        erc721Abi.forEach((object) => {
          try {
            const abiMethod = this.wallet.coreLibrary.eth.abi.encodeFunctionSignature(object);
            const abiTypes = object.inputs ? object.inputs.map((x) => x.type) : [];
            const attributes = object.inputs ? object.inputs.map((x) => x.name) : [];

            if (inputMethod === abiMethod) {
              const inputs = this.wallet.coreLibrary.eth.abi.decodeParameters(
                abiTypes,
                `0x${inputsBuf.toString('hex')}`,
              );

              result.method = object.name;

              for (const index in inputs) {
                if (typeof inputs[index] !== 'undefined') {
                  result.params[attributes[index]] = inputs[index];
                }
              }
            }
          } catch (error) {
            return null;
          }
          return null;
        });

        return result;
      }
    } catch (error) {
      // Do nothing
    }
    return null;
  }
}

export default SnowTraceExplorer;
