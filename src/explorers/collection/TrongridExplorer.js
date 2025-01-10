import { getTokenId } from 'src/utils';
import TronWeb from 'tronweb';

import Explorer from '../Explorer';
import Transaction from '../Transaction';
// import logger from '../Logger'

const DYNAMIC_PARAMETERS = ['getDynamicEnergyThreshold', 'getDynamicEnergyIncreaseFactor', 'getDynamicEnergyMaxFactor'];

/**
 * Max tx limit specified by Trongrid
 * @type {number}
 */
const TX_LIMIT = 200;

/**
 * Class for tronscan explorer.
 *
 */
class TrongridExplorer extends Explorer {
  constructor(...args) {
    super(...args);
    this.defaultTxLimit = TX_LIMIT;
  }

  addressHex(address) {
    return TronWeb.address.toHex(address);
  }

  getAllowedTickers() {
    return ['TRX'];
  }

  getApiPrefix() {
    return 'v1/';
  }

  /**
   * Gets the information url.
   *
   * @param address
   * @return {string} The information url.
   */
  getInfoUrl(address) {
    /**
     * Address must be converted to Hex
     */

    return `${this.getApiPrefix()}accounts/${this.addressHex(address)}`;
  }

  /**
   * Get transaction list params
   *
   * @return {Object}
   */
  getTransactionsParams(address, offset = 0, limit = this.defaultTxLimit) {
    return { address, limit };
  }

  /**
   * Modify information response
   *
   * @return {Object} { description_of_the_return_value }
   */
  modifyInfoResponse(response) {
    return {
      unfrozenV2: response.data[0]?.unfrozenV2,
      votes: response.data[0]?.votes,
      balance: response.data[0]?.balance,
    };
  }

  /**
   * Gets the transaction url.
   *
   * @param  {<type>} txId The transmit identifier
   * @return {<type>} The transaction url.
   */
  getTransactionUrl(txId) {
    return `transaction-info?hash=${txId}`;
  }

  /**
   * Gets the transactions url.
   *
   * @return {<type>} The transactions url.
   */
  getTransactionsUrl(address) {
    return `${this.getApiPrefix()}accounts/${this.addressHex(address)}/transactions/trc20`;
  }

  getContractInfoUrl() {
    return 'wallet/getcontractinfo';
  }

  getContractInfoMethod() {
    return 'POST';
  }

  getContractInfoParams(contract) {
    return {
      value: contract,
      visible: true,
    };
  }

  getChainParametersUrl() {
    return 'wallet/getchainparameters';
  }

  getAccountResourceUrl() {
    return 'wallet/getaccountresource';
  }

  getAccountResourceMethod() {
    return 'post';
  }

  getAccountResourceParams(address) {
    return { address, visible: true };
  }

  getContractInfo(contract) {
    return this.request(this.getContractInfoUrl(), this.getContractInfoMethod(), this.getContractInfoParams(contract));
  }

  getChainParameters() {
    return this.request(this.getChainParametersUrl(), this.getInfoMethod());
  }

  getAccountResource(address) {
    return this.request(
      this.getAccountResourceUrl(),
      this.getAccountResourceMethod(),
      this.getAccountResourceParams(address),
    );
  }

  getEstimatedEnergyUrl() {
    return 'wallet/triggerconstantcontract';
  }

  getEstimatedEnergyMethod() {
    return 'POST';
  }

  /**
   * @param {string} args.owner_address trx address
   * @param {string} args.function_selector smart-contract function with params
   * @param {string} args.parameter hex representation on smart-contract function call
   * @param {boolean} args.visible
   * @return {args}
   */
  getEstimatedEnergyParameters(args) {
    return args;
  }

  async getDynamicEnergyParameters() {
    const { chainParameter = [] } = await this.request(this.getChainParametersUrl(), this.getInfoMethod());

    return this.modifyDynamicEnergyParametersResponse(chainParameter);
  }

  /**
   * returns only dynamic energy parameters
   *
   * @param response
   * @return {object}
   */
  modifyDynamicEnergyParametersResponse(response) {
    return response.reduce((acc, { key, value = undefined }) => {
      if (DYNAMIC_PARAMETERS.includes(key)) {
        acc[key] = value;
      }

      return acc;
    }, {});
  }

  modifyEstimagedEnergyResponse(response) {
    const failed = response?.transaction?.ret[0]?.ret === 'FAILED';

    if (failed) {
      // logger.error({ instance: this, error: new Error('[TrongridExplorer]:
      // Failed to call estimate energy, node rejects tx with REVERT opcode, probably invalid tx was passed') })

      return undefined;
    }

    return response?.energy_used;
  }

  /**
   * Request for smart-contract call emulation
   *
   * @param args
   * @return {Promise<*>}
   */
  async getEstimatedEnergy(args) {
    const response = await this.request(
      this.getEstimatedEnergyUrl(),
      this.getEstimatedEnergyMethod(),
      this.getEstimatedEnergyParameters(args),
      'TRX_ESTIMATE_ENERGY_REQUEST',
      { timeout: 10000 },
    );

    return this.modifyEstimagedEnergyResponse(response);
  }

  /**
   * Modify transactions response
   *
   * @return {<type>} { description_of_the_return_value }
   */
  modifyTransactionsResponse(response, address, asset = this.wallet.ticker) {
    const trc20transfers = response.data
      .filter((tx) => tx?.token_info?.symbol)
      .map((tx) => {
        return new Transaction({
          ticker: this.getTxAsset(tx),
          name: tx.token_info.name,
          txid: this.getTxHash(tx),
          walletid: getTokenId({
            contract: tx.token_info.address,
            parent: this.wallet.parent,
            ticker: this.getTxAsset(tx),
          }),
          fee: this.wallet.getTRC20Fee(tx),
          feeTicker: this.wallet.parent,
          direction: this.getTxDirection(address, tx),
          otherSideAddress: this.getTxOtherSideAddress(address, tx),
          amount: this.getTxValue(address, tx, tx.token_info.decimals),
          datetime: this.getTxDateTime(tx),
          memo: this.getTxMemo(tx),
          confirmations: this.getTxConfirmations(tx),
          alias: this.wallet.alias,
        });
      });

    return { trc20transfers };
  }

  /**
   * Gets a balance from a wallet info.
   *
   * @return {Promise<String>} The balance.
   */
  async getBalance() {
    const info = await this.getInfo();

    return this.wallet.toCurrencyUnit(info.balance);
  }

  /**
   * Get asset ticker from tx
   * @param tx
   * @return {string|*}
   */
  getTxAsset(tx) {
    const symbol = tx.token_info.symbol;

    if (symbol === 'USDT') {
      return 'TRX-USDT';
    }

    if (symbol === 'USDC') {
      return 'TRX-USDC';
    }

    return symbol;
  }

  /**
   * Gets the transmit hash.
   *
   * @param  {<type>} tx The transmit
   * @return {<type>} The transmit hash.
   */
  getTxHash(tx) {
    return tx.transaction_id;
  }

  /**
   * Gets the transmit direction.
   *
   * @param  {<type>} tx The transmit
   * @return {<type>} The transmit direction.
   */
  getTxDirection(selfAddress, tx) {
    return tx.to === selfAddress;
  }

  /**
   * Gets the transmit recipient.
   *
   * @param  {<type>} tx The transmit
   * @return {<type>} The transmit recipient.
   */
  getTxOtherSideAddress(selfAddress, tx) {
    return this.getTxDirection(selfAddress, tx) ? tx.from : tx.to;
  }

  /**
   * Gets the transmit value.
   *
   * @param  {<type>} tx The transmit
   * @return {<type>} The transmit value.
   */
  getTxValue(selfAddress, tx, decimal = this.wallet.decimal) {
    return this.wallet.toCurrencyUnit(tx.value, decimal);
  }

  /**
   * Gets the transmit date time.
   *
   * @param  {<type>} tx The transmit
   * @return {Date} The transmit date time.
   */
  getTxDateTime(tx) {
    return new Date(Number(tx.block_timestamp));
  }

  /**
   * Gets the transmit confirmations.
   *
   * @param  {<type>} tx The transmit
   * @return {<type>} The transmit confirmations.
   */
  getTxConfirmations(tx) {
    return 1;
  }
}

export default TrongridExplorer;
