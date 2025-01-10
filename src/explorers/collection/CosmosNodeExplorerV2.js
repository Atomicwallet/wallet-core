import { pick, uniqBy } from 'lodash';

import { ExplorerRequestError } from '../../errors/index.js';
import { SEND_TRANSACTION_TYPE } from '../../utils/const';
import Explorer from '../Explorer';
import { CosmosNodeTransactionTypeMixin } from '../mixins/index.js';

const DEFAULT_TX_LIMIT = 50;

class CosmosNodeExplorerV2 extends CosmosNodeTransactionTypeMixin(Explorer) {
  /**
   * Constructs the object.
   *
   */
  constructor() {
    super(...arguments);

    this.defaultTxLimit = DEFAULT_TX_LIMIT;
    this.canPaginate = false;
    this.lastKnownHeight = 0;
  }

  getInitParams() {
    if (!this.config.baseUrl) {
      throw new Error(
        `${this.wallet.ticker} ${this.constructor.name}: explorer config have no baseUrl`,
      );
    }
    return {
      baseURL: this.config.baseUrl,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: 0,
      },
    };
  }

  getAllowedTickers() {
    return ['ATOM', 'BAND', 'OSMO', 'KAVA', 'FET'];
  }

  async request() {
    const response = await super.request(...arguments);

    if (
      response &&
      response.height &&
      this.lastKnownHeight < Number(response.height)
    ) {
      this.lastKnownHeight = response.height;
    }

    if (response && response.result) {
      return response.result;
    }

    return response;
  }

  async getAuth(address) {
    const resp = await this.request(`cosmos/auth/v1beta1/accounts/${address}`);

    return resp.account.base_account || resp.account; // INJ uses account.base_account format, other chains just resp.account
  }

  getLatestBlockUrl() {
    return 'cosmos/base/tendermint/v1beta1/blocks/latest';
  }

  getSendTransactionUrl() {
    return 'cosmos/tx/v1beta1/txs';
  }

  getSendTransactionParams(rawtx) {
    return {
      tx_bytes: Buffer.from(rawtx).toString('base64'),
      mode: 'BROADCAST_MODE_SYNC',
    };
  }

  modifySendTransactionResponse(response) {
    if (response.tx_response.code) {
      throw new ExplorerRequestError({
        type: SEND_TRANSACTION_TYPE,
        error: new Error(JSON.stringify(response)),
        instance: this,
      });
    }

    return {
      txid: response.tx_response?.txhash,
    };
  }

  async sendDelegationTransaction(address, rawtx) {
    const response = await this.request(
      `staking/delegators/${address}/delegations`,
      'post',
      rawtx,
    );

    if (response.value && response.value.account_number === '0') {
      throw new ExplorerRequestError({
        type: SEND_TRANSACTION_TYPE,
        error: new Error(response),
        instance: this,
      });
    }

    return response.value;
  }

  async getTransaction(selfAddress, txid) {
    const tx = await this.request(`txs/${txid}`);

    return this.modifyTransactionResponse(tx, selfAddress);
  }

  async getTransactions({ address, limit, denom }) {
    const sent = await this.request(
      `/cosmos/tx/v1beta1/txs?events=message.sender=%27${address}%27&query=message.sender=%27${address}%27`,
    );

    const recieved = await this.request(
      `/cosmos/tx/v1beta1/txs?events=transfer.recipient=%27${address}%27&query=transfer.recipient=%27${address}%27`,
    );

    const txMap = new Map();

    sent.tx_responses.forEach((tx) => {
      txMap.set(tx.txhash, { ...tx, direction: false });
    });

    recieved.tx_responses.forEach((tx) => {
      txMap.set(tx.txhash, { ...tx, direction: true });
    });

    const txResponses = [];

    for (const [, tx] of txMap.entries()) {
      txResponses.push(tx);
    }

    txResponses.sort((a, b) => Number(a.height) < Number(b.height));
    const txMessages = txResponses
      .flatMap((tx) => [
        ...tx.tx.body.messages.map((msg) => {
          let fee;
          const feeData = tx.tx?.auth_info?.fee?.amount;

          if (feeData && Array.isArray(tx.tx.auth_info.fee.amount)) {
            fee = tx.tx.auth_info.fee.amount.reduce(
              (accumulator, item) => accumulator + parseInt(item.amount, 6),
              0,
            );
          } else {
            fee = tx.tx?.auth_info?.fee?.amount;
          }

          return {
            ...msg,
            ...pick(
              tx,
              'from_address',
              'to_address',
              'amount',
              'txhash',
              'height',
              'gas_used',
              'gas_wanted',
              'direction',
              'logs',
              'timestamp',
            ),
            memo: tx.tx.body.memo,
            messages: tx.tx.body.messages,
            fee,
          };
        }),
      ])
      .filter(
        (tx) => this.getTransactionNativeType(tx) !== 'MsgBeginRedelegate',
      );

    const filterMessages = ({ '@type': originalType, txhash }) =>
      `${txhash}/${originalType}`;

    return this.modifyTransactionsResponse(
      uniqBy(txMessages, filterMessages),
      address,
    );
  }

  getTxValue(selfAddress, tx) {
    const value = Array.isArray(tx.amount)
      ? tx.amount[0].amount
      : tx.amount?.amount || tx.withdraw_amount || this.getAmountFromLogs(tx);

    return this.wallet.toCurrencyUnit(value);
  }

  getAmountFromLogs(tx) {
    return (tx.logs || [])
      .reduce((allEvents, { events }) => allEvents.concat(events || []), [])
      .filter(({ type: eventType }) => eventType === 'transfer')
      .reduce(
        (allAttributes, { attributes }) => allAttributes.concat(attributes),
        [],
      )
      .filter(({ key }) => key === 'amount')
      .reduce(
        (sum, { value }) =>
          sum + parseInt((value || '0').replace(/\D/gi, ''), 10),
        0,
      );
  }

  getTxDirection(selfAddress, tx) {
    return tx.direction;
  }

  getTxOtherSideAddress(selfAddress, tx) {
    if (this.getTxDirection(selfAddress, tx)) {
      return tx.from_address || tx.validator_address;
    }

    return tx.to_address;
  }

  getTxDateTime(tx) {
    return new Date(tx.timestamp);
  }

  getTxConfirmations(tx) {
    return this.lastKnownHeight - Number(tx.height);
  }

  getTxHash(tx) {
    return tx.txhash;
  }

  getTxMemo(tx) {
    return tx.memo;
  }

  getTxType(tx) {
    return this.getTransactionType(tx);
  }

  async getTotalBalance(address) {
    try {
      const { balances } = await this.request(
        `cosmos/bank/v1beta1/balances/${address}`,
      );

      return balances;
    } catch (error) {
      console.warn(error);
    }

    return [];
  }

  async getRewardsBalance(address) {
    try {
      const { total } = await this.request(
        `cosmos/distribution/v1beta1/delegators/${address}/rewards`,
      );

      return total;
    } catch (error) {
      console.warn(error);
    }

    return '0';
  }

  async getStakedDelegations(address) {
    try {
      const { delegation_responses: delegations } = await this.request(
        `cosmos/staking/v1beta1/delegations/${address}`,
      );

      return delegations;
    } catch (error) {
      console.warn(error);
    }

    return [];
  }

  async getUnbondingDelegations(address) {
    try {
      const { unbonding_responses: delegations } = await this.request(
        `cosmos/staking/v1beta1/delegators/${address}/unbonding_delegations`,
      );

      return delegations;
    } catch (error) {
      console.warn(error);
    }

    return [];
  }

  modifyLatestBlockResponse(response) {
    if (!response) {
      throw new Error('[CosmosNodeExplorer] wrong latest block response');
    }
    const blockMetaPropName = Object.hasOwnProperty.call(response, 'block')
      ? 'block'
      : 'block_meta';

    this.chainId = response[blockMetaPropName].header.chain_id;
    this.lastKnownHeight =
      Number(response[blockMetaPropName].header.height) || 0;

    return response;
  }

  async getChainId() {
    await this.getLatestBlock();

    return this.chainId;
  }

  async getSignerData(address) {
    const { sequence = '0', account_number: accountNumber } =
      await this.getAuth(address);

    const chainId = this.chainId || (await this.getChainId());

    return {
      sequence,
      accountNumber,
      chainId,
    };
  }

  async getValidators(address) {
    const { validators } = await this.request(
      `cosmos/distribution/v1beta1/delegators/${address}/validators`,
    );

    return validators;
  }

  getTxFee(tx) {
    return this.wallet.toCurrencyUnit(tx.fee || this.wallet.feeDefault || 0);
  }

  /**
   * Gets gas estimation
   * @param rawtx
   * @returns {Promise<string>} - Number in string
   */
  async getGasEstimation(rawtx) {
    const {
      gas_info: { gas_used: gasUsed },
    } = await super.request(
      'cosmos/tx/v1beta1/simulate',
      'post',
      this.getSendTransactionParams(rawtx),
    );

    return gasUsed;
  }
}

export default CosmosNodeExplorerV2;
