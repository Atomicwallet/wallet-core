// import configManager from '../ConfigManager'
import { ExplorerRequestError } from 'src/errors';
import TOKENS_CACHE from 'src/resources/eth/tokens.json';
import { getTokenId } from 'src/utils';
import { GET_BALANCE_TYPE, GET_TRANSACTIONS_TYPE, UNDEFINED_OPERATION_ERROR } from 'src/utils/const';

// import logger from '../Logger'
import Explorer from '../Explorer';
import Transaction from '../Transaction';

const GET_USER_TOKENS_TYPE = 'GetUserTokens';

class BlockscoutExplorer extends Explorer {
  getAllowedTickers() {
    return ['ETH', 'ETC', 'FLR'];
  }

  async request(url, method = 'get', params = {}, type = UNDEFINED_OPERATION_ERROR) {
    const response = await super.request(url, method, params, type);

    if (response.status === '0') {
      if ([GET_USER_TOKENS_TYPE, GET_TRANSACTIONS_TYPE].includes(type)) {
        return [];
      }
      throw new ExplorerRequestError({
        type,
        error: response.message,
        url: `${this.config.baseUrl}${url}`,
        instance: this,
      });
    }

    if (response.result) {
      return response.result;
    }
    return response;
  }

  getInfoUrl(address) {
    return this.getApiPrefix();
  }

  getTokenInfoParams(address) {
    return {
      module: 'account',
      action: 'tokenlist',
      address,
    };
  }

  getInfoParams(address) {
    return {
      module: 'account',
      action: 'balance',
      address,
    };
  }

  async getInfo(address) {
    const balanceResponse = await this.request(
      this.getInfoUrl(address),
      this.getInfoMethod(),
      this.getInfoParams(address),
      GET_BALANCE_TYPE,
    );

    return this.modifyInfoResponse({
      balance: balanceResponse,
    });
  }

  async getTokensInfo(tokens, address) {
    const tokensResponse = await this.request(
      this.getInfoUrl(address),
      this.getInfoMethod(),
      this.getTokenInfoParams(address),
      GET_BALANCE_TYPE,
    );

    return this.modifyInfoResponse({
      tokens: tokensResponse,
    });
  }

  modifyInfoResponse(response) {
    // if (Array.isArray(response.tokens)) {
    //   response.tokens.forEach(({ contractAddress, balance }) => {
    //     if (this.wallet.tokens[contractAddress.toLowerCase()]) {
    //       this.wallet.tokens[contractAddress.toLowerCase()].balance = new this.wallet.BN(balance)
    //     }
    //   })
    // }

    return {
      balance: response.balance,
      tokensBalances: response.tokens || [],
      transactions: [],
    };
  }

  getTransactionsUrl(address) {
    return this.getApiPrefix();
  }

  getTransactionsParams(address, offset, limit) {
    return {
      module: 'account',
      action: 'txlist',
      address,
    };
  }

  getTransferParams(address, offset, limit) {
    return {
      module: 'account',
      action: 'tokentx',
      address,
    };
  }

  async getTransactions({ address, offset = 0, limit = this.defaultTxLimit }) {
    try {
      const transactions = await this.request(
        this.getTransactionsUrl(address),
        this.getTransactionsMethod(),
        this.getTransactionsParams(address, offset, limit),
        GET_TRANSACTIONS_TYPE,
      ).catch(() => []);

      const transfers = ['ETH', 'FLR'].includes(this.wallet.ticker)
        ? await this.request(
            this.getTransactionsUrl(address),
            this.getTransactionsMethod(),
            this.getTransferParams(address, offset, limit),
            GET_TRANSACTIONS_TYPE,
          ).catch(() => [])
        : [];

      const tokenTransfers = this.modifyTokenTransactionsResponse(transfers?.reverse() ?? [], address);
      const txs = this.modifyTransactionsResponse(
        transactions.filter(({ input }) => input === '0x').reverse(),
        address,
      );

      return txs.concat(tokenTransfers);
    } catch (error) {
      console.error(error);

      return [];
    }
  }

  modifyTokenTransactionsResponse(response, selfAddress) {
    return response.map((transfer) => {
      return new Transaction({
        walletid: getTokenId({
          ticker: transfer.tokenSymbol,
          parent: this.wallet.ticker,
          contract: transfer.contractAddress,
        }),
        ticker: transfer.tokenSymbol,
        name: transfer.tokenName,
        txid: this.getTxHash(transfer),
        fee: this.getTxFee(transfer),
        feeTicker: this.wallet.parent,
        direction: this.getTxDirection(selfAddress, transfer),
        otherSideAddress: this.getTxOtherSideAddress(selfAddress, transfer),
        amount: this.getTxValue(selfAddress, transfer),
        datetime: this.getTxDateTime(transfer),
        memo: this.getTxMemo(transfer),
        nonce: this.getTxNonce(transfer),
        confirmations: this.getTxConfirmations(transfer),
        alias: this.wallet.alias,
      });
    });
  }

  getTxNonce(tx) {
    return tx.nonce;
  }

  getTxHash(tx) {
    return tx.hash;
  }

  getTxDateTime(tx) {
    return new Date(Number(`${tx.timeStamp}000`));
  }

  getTxDirection(selfAddress, tx) {
    return selfAddress.toLowerCase() !== tx.from.toLowerCase();
  }

  getTxOtherSideAddress(selfAddress, tx) {
    return selfAddress.toLowerCase() === tx.from.toLowerCase() ? tx.to : tx.from;
  }

  getTxValue(selfAddress, tx) {
    if (tx.contractAddress === '') {
      return this.wallet.toCurrencyUnit(tx.value);
    }

    // @TODO should be inside coin
    // const token = this.wallet.tokens[tx.contractAddress.toLowerCase()]
    //
    //   if (token) {
    //     return token.toCurrencyUnit(tx.value)
    // }

    return this.wallet.toCurrencyUnit(tx.value);
  }

  getTxConfirmations(tx) {
    return Number(tx.confirmations);
  }

  /**
   * Returns user token list url
   * @returns {String}
   */
  getUserTokenListUrl(address) {
    return this.getApiPrefix();
  }

  modifyTokenListResponse(response) {
    return response.data;
  }

  /**
   * Returns all token list data
   * @returns {Array}
   */
  async getTokenList() {
    let tokens;

    // try {
    //   tokens = await configManager.get('ethereum-tokens')
    // } catch (error) {
    //   // logger.error({ instance: this, error })
    // }

    return tokens || TOKENS_CACHE;
  }

  async getBannedTokensList() {
    let banned;

    // try {
    //   banned = await configManager.get('ethereum-tokens-banned')
    // } catch (error) {
    //   // logger.error({ instance: this, error })
    // }

    return JSON.stringify(banned) || [];
  }

  /**
   * Returns user token list data
   * @param {String} address
   * @returns {Array}
   */
  async getUserTokenList(address) {
    if (!address) {
      return [];
    }

    try {
      const response = await this.request(
        this.getUserTokenListUrl(),
        this.getInfoMethod(),
        this.getTokenInfoParams(address),
        GET_USER_TOKENS_TYPE,
      );

      return response || [];
    } catch (error) {
      return [];
    }
  }

  getTxFee(tx) {
    const gasUsed = new this.wallet.BN(tx.gasUsed);
    const gasPrice = new this.wallet.BN(tx.gasPrice);
    const feeCoefficient = new this.wallet.BN(this.wallet.feeCoefficient || 1);
    const fee = feeCoefficient.mul(gasUsed.mul(gasPrice)).toString();

    return this.wallet.toCurrencyUnit(fee);
  }
}

export default BlockscoutExplorer;
