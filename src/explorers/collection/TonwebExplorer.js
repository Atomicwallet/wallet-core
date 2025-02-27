import { TONWEB_API_KEY, TONWEB_FALLBACK_INDEX_URL, TONWEB_FALLBACK_V2_URL } from 'src/env';
import { ExplorerRequestError } from 'src/errors';
import Explorer from 'src/explorers/explorer';
import Transaction from 'src/explorers/Transaction';
import { getTokenId } from 'src/utils';
import { GET_BALANCE_TYPE, GET_TRANSACTIONS_TYPE, ONE_MINUTE } from 'src/utils';
import { toCurrency } from 'src/utils/convert';
import TonWeb from 'tonweb';

const IN_TRANSFER_COIN = 'IN_TRANSFER_COIN';
const OUT_TRANSFER_COIN = 'OUT_TRANSFER_COIN';
const IN_TRANSFER_TOKEN = 'IN_TRANSFER_TOKEN';
const OUT_TRANSFER_TOKEN = 'OUT_TRANSFER_TOKEN';

/**
 * Tries to retrieve the opcode (operation code) from the given message
 * and returns true if no valid code exists.
 * @param {string} msg - The message value in base64 format.
 * @returns {boolean}
 */
function isNoValidOpInMsg(msg) {
  try {
    const msgBody = TonWeb.utils.base64ToBytes(msg);
    const cell = TonWeb.boc.Cell.oneFromBoc(msgBody);
    const slice = cell.beginParse();

    slice.loadUint(32);

    return false;
  } catch (error) {
    return true;
  }
}

/**
 * Decodes the body message of a token.
 *
 * @param {string} value - The base64-encoded value of the token body message.
 * @returns {{
 *  op: number,
 *  queryId?: number
 *  amount?: string,
 *  destination?: string,
 *  source?: string,
 * }} The decoded token body message.
 */
export function decodeTokenBodyMsg(value) {
  const msgBody = TonWeb.utils.base64ToBytes(value);
  const cell = TonWeb.boc.Cell.oneFromBoc(msgBody);
  const slice = cell.beginParse();

  let op;

  try {
    op = slice.loadUint(32);
  } catch (error) {
    return { op: null };
  }

  const queryId = slice.loadUint(64);

  let amount;
  let destination;
  let source;

  try {
    amount = slice.loadCoins()?.toString();
    destination = slice.loadAddress()?.toString(true, true, true);
    source = slice.loadAddress()?.toString(true, true, true);
  } catch (error) {
    return { op, queryId };
  }

  return { op, queryId, amount, destination, source };
}

export default class TonwebExplorer extends Explorer {
  _walletAddress = null;

  /**
   * @typedef OwnJettonsWalletsAddressesToTokenUniqueFieldObj
   * @type {{ [ownJettonsWalletsAddress: string]: string}|null}
   */

  /** @type {OwnJettonsWalletsAddressesToTokenUniqueFieldObj} */
  static ownJettonsWalletsAddressesToTokenUniqueFieldObj = null;

  /**
   * @type {Object.<string, {isMatch: DetectFunction, parse: ParseFunction}>}
   */
  TX_COINS_INSTRUCTIONS_PARSERS = {
    [IN_TRANSFER_COIN]: {
      isMatch: this._getIsInCoinTx,
      parse: this._parseInCoinTx,
    },
    [OUT_TRANSFER_COIN]: {
      isMatch: this._getIsOutCoinTx,
      parse: this._parseOutCoinTx,
    },
  };

  /**
   * @type {Object.<string, {isMatch: DetectFunction, parse: ParseFunction}>}
   */
  TX_TOKENS_INSTRUCTIONS_PARSERS = {
    [IN_TRANSFER_TOKEN]: {
      isMatch: this._getIsInTokenTx,
      parse: this._parseInTokenTx,
    },
    [OUT_TRANSFER_TOKEN]: {
      isMatch: this._getIsOutTokenTx,
      parse: this._parseOutTokenTx,
    },
  };

  constructor({ wallet, config }) {
    super(...arguments);

    this.provider = new TonWeb.HttpProvider(this.config?.baseUrl || TONWEB_FALLBACK_V2_URL, {
      apiKey: TONWEB_API_KEY,
    });
  }

  getAllowedTickers() {
    return ['TON'];
  }

  async getJettonWalletAddress(ownerAddressStr, jettonMinterAddress) {
    const hotWalletAddress = new TonWeb.utils.Address(ownerAddressStr);

    const jettonMinter = new TonWeb.token.jetton.JettonMinter(this.provider, {
      address: jettonMinterAddress,
    });
    const jettonWalletAddress = await jettonMinter.getJettonWalletAddress(hotWalletAddress);

    return jettonWalletAddress.toString(true, true, true);
  }

  async _getOwnJettonsWalletsAddressesToTokenUniqueFieldObj() {
    if (TonwebExplorer.ownJettonsWalletsAddressesToTokenUniqueFieldObj) {
      return TonwebExplorer.ownJettonsWalletsAddressesToTokenUniqueFieldObj;
    }

    const tokensList = Object.entries(this.wallet.getTokens());

    const jettonsWalletsAddresses = await Promise.all(
      tokensList.map((token) => this.getJettonWalletAddress(this.wallet.address, token[1].mint)),
    );

    TonwebExplorer.ownJettonsWalletsAddressesToTokenUniqueFieldObj = jettonsWalletsAddresses.reduce(
      (obj, jettonWalletAddress, index) => {
        obj[jettonWalletAddress] = tokensList[index][0];
        return obj;
      },
      {},
    );

    return TonwebExplorer.ownJettonsWalletsAddressesToTokenUniqueFieldObj;
  }

  /**
   * @typedef DetectFunction
   * @type {function}
   * @param {*} tx
   * @param {string} [selfAddress]
   * @returns {boolean}
   */

  /** @type {DetectFunction} */
  _getIsInCoinTx(tx) {
    const { in_msg: { op = '' } = {} } = tx || {};

    return op === null;
  }

  /** @type {DetectFunction} */
  _getIsOutCoinTx(tx, selfAddress) {
    const { in_msg: { source = '', destination = '' } = {}, out_msgs: outMsgs } = tx || {};

    return source === '' && destination === selfAddress && isNoValidOpInMsg(outMsgs[0]?.body);
  }

  /** @type {DetectFunction} */
  _getIsInTokenTx(tx) {
    const { in_msg: inMsg = {} } = tx || {};

    const op = inMsg.op.toString(16);

    /* op === '178d4519' means internal_transfer */
    return op === '178d4519' && !!inMsg.source && !!inMsg.value;
  }

  /** @type {DetectFunction} */
  _getIsOutTokenTx(tx, selfAddress) {
    const { in_msg: inMsg = {}, out_msgs: outMessages = [] } = tx || {};

    const op = inMsg.op.toString(16);

    /**
     * op === 'f8a7ea5' means transfer
     * Error conditions:
     * outMessages.length = 0 - means 'No out messages produced'
     * outMessages[0].destination !== selfAddress - means 'Error in jetton transfer - bounced message'
     */
    return (
      op === 'f8a7ea5' &&
      inMsg.source === selfAddress &&
      outMessages.length > 0 &&
      outMessages[0].destination !== selfAddress
    );
  }

  /**
   * @typedef ParsedResult
   * @type {object}
   * @property {string} source
   * @property {string} destination
   * @property {boolean} isToken
   * @property {number} [decimal]
   * @property {string} [symbol]
   * @property {string} [name]
   * @property {string} [mint]
   */

  /**
   * @typedef ParsePayloadObj
   * @type {object}
   * @property {string} [selfAddress]
   * @property {*} [tokens]
   */

  /**
   * @typedef ParseFunction
   * @type {function}
   * @param {*} tx
   * @param {ParsePayloadObj} [payload]
   * @returns {ParsedResult}
   */

  /** @type {ParseFunction} */
  _parseInCoinTx(tx) {
    const { in_msg: inMsg } = tx || {};
    const source = inMsg.source;
    const destination = inMsg.destination;
    const amount = inMsg.value;

    return { source, destination, amount };
  }

  /** @type {ParseFunction} */
  _parseOutCoinTx(tx, { selfAddress }) {
    const { out_msgs: outMsgs } = tx || {};
    const source = selfAddress;
    const destination = outMsgs[0].destination;
    const amount = outMsgs[0].value;

    return { source, destination, amount };
  }

  static _getTokenByJettonWalletAddress(jettonWalletAddress, tokens) {
    const tokenUniqueField =
      TonwebExplorer.ownJettonsWalletsAddressesToTokenUniqueFieldObj[jettonWalletAddress] ?? null;

    return tokens[tokenUniqueField] ?? {};
  }

  /** @type {ParseFunction} */
  static _parseTokenTx(tx, { selfAddress, tokens }, shouldCheckDestination = false) {
    const { in_msg: inMsg = {} } = tx || {};
    const { destination: jettonWalletAddress, body: inBody } = inMsg;
    const decodedMsg = decodeTokenBodyMsg(inBody);

    // Check if properties are defined and not falsy
    const isMsgInvalid = shouldCheckDestination
      ? !(decodedMsg.source && decodedMsg.destination && decodedMsg.amount && jettonWalletAddress)
      : !(decodedMsg.source && decodedMsg.amount && jettonWalletAddress);

    if (isMsgInvalid) {
      return {};
    }

    const {
      ticker: symbol,
      name,
      decimal,
      mint,
    } = TonwebExplorer._getTokenByJettonWalletAddress(jettonWalletAddress, tokens);

    return {
      source: decodedMsg.source,
      destination: shouldCheckDestination ? decodedMsg.destination : selfAddress,
      isToken: true,
      amount: decodedMsg.amount,
      decimal,
      symbol,
      name,
      mint,
    };
  }

  /** @type {ParseFunction} */
  _parseInTokenTx(tx, payload) {
    return TonwebExplorer._parseTokenTx(tx, payload, false);
  }

  /** @type {ParseFunction} */
  _parseOutTokenTx(tx, payload) {
    return TonwebExplorer._parseTokenTx(tx, payload, true);
  }

  _getWalletAddress(address) {
    if (!this._walletAddress) {
      this._walletAddress = new TonWeb.utils.Address(address);
    }

    return this._walletAddress;
  }

  async getBalance(address) {
    try {
      const response = await this.provider.getBalance(address);

      return response;
    } catch (error) {
      throw new ExplorerRequestError({
        type: GET_BALANCE_TYPE,
        error,
        instance: this,
      });
    }
  }

  async getState(address) {
    return this.provider.getAddressInfo(address);
  }

  async sendTransaction(boc) {
    return this.provider.send('sendBocReturnHash', { boc });
  }

  _getCoinTxInstruction(tx) {
    const defaultInstruction = {
      destination: '',
      source: '',
      isToken: false,
      amount: '0',
    };

    return Object.entries(this.TX_COINS_INSTRUCTIONS_PARSERS).reduce((instruction, [, { isMatch, parse }]) => {
      const parsed = isMatch(tx, this.wallet.address) ? parse(tx, { selfAddress: this.wallet.address }) : {};

      return { ...instruction, ...parsed };
    }, defaultInstruction);
  }

  _getTokenTxInstruction(tx) {
    const defaultInstruction = {
      destination: '',
      source: '',
      isToken: false,
      amount: '0',
      decimal: 0,
      symbol: '',
      mint: '',
    };

    const tokens = this.wallet.getTokens();
    const selfAddress = this.wallet.address;

    return Object.entries(this.TX_TOKENS_INSTRUCTIONS_PARSERS).reduce((instruction, [, { isMatch, parse }]) => {
      const parsed = isMatch(tx, selfAddress) ? parse(tx, { selfAddress, tokens }) : {};

      return { ...instruction, ...parsed };
    }, defaultInstruction);
  }

  async modifyTransactionsResponse(txs) {
    const selfAddress = this.wallet.address;

    return txs.reduce((list, tx, index) => {
      try {
        const { source, destination, isToken, amount: txAmount } = this._getCoinTxInstruction(tx);

        const isValidBaseProperties = source && destination && txAmount;

        if (!isValidBaseProperties) {
          return list;
        }

        const amount = `${toCurrency(txAmount, this.wallet.decimal)}`;
        const walletid = this.wallet.id;
        const name = this.wallet.name;

        list.push(
          new Transaction({
            ticker: this.wallet.ticker,
            name,
            alias: this.wallet.alias,
            explorer: this.constructor.name,
            txid: this.getTxHash(tx),
            direction: destination === selfAddress,
            otherSideAddress: destination === selfAddress ? source : destination,
            amount,
            datetime: this.getTxDateTime(tx),
            memo: this.getTxMemo(tx),
            confirmations: this.getTxConfirmations(tx),
            fee: this.getTxFee(tx),
            feeTicker: this.getTxFeeTicker(),
            isToken,
            walletid,
          }),
        );

        return list;
      } catch (error) {
        console.warn(`[${this.wallet.id}] tx parse failed`);
        console.error(error);

        return list;
      }
    }, []);
  }

  async modifyTokensTransactionsResponse(txs) {
    const selfAddress = this.wallet.address;

    await this._getOwnJettonsWalletsAddressesToTokenUniqueFieldObj();

    return txs.reduce((list, tx, index) => {
      try {
        const {
          source,
          destination,
          isToken,
          amount: txAmount,
          decimal,
          symbol,
          name: tokenName,
          mint,
        } = this._getTokenTxInstruction(tx);

        const isValidBaseProperties = source && destination && txAmount;
        const isValidToken = decimal && symbol && tokenName && mint;

        if (!isValidBaseProperties || (isToken && !isValidToken)) {
          return list;
        }

        let amount;
        let walletid;
        let name;

        if (isToken) {
          amount = `${toCurrency(txAmount, parseInt(decimal, 10))}`;
          walletid = getTokenId({
            contract: mint.toLowerCase(),
            parent: this.wallet.id,
            ticker: symbol,
          });
          name = tokenName;
        } else {
          amount = `${toCurrency(txAmount, this.wallet.decimal)}`;
          walletid = this.wallet.id;
          name = this.wallet.name;
        }

        list.push(
          new Transaction({
            ticker: symbol || this.wallet.ticker,
            name,
            alias: this.wallet.alias,
            explorer: this.constructor.name,
            txid: this.getTxHash(tx),
            direction: destination === selfAddress,
            otherSideAddress: destination === selfAddress ? source : destination,
            amount,
            datetime: this.getTxDateTime(tx),
            memo: this.getTxMemo(tx),
            confirmations: this.getTxConfirmations(tx),
            fee: this.getTxFee(tx),
            feeTicker: this.getTxFeeTicker(),
            isToken,
            symbol,
            walletid,
          }),
        );

        return list;
      } catch (error) {
        console.warn(`[${this.wallet.id}] tx parse failed`);
        console.error(error);

        return list;
      }
    }, []);
  }

  getTransactionsUrl() {
    return `${this.config?.indexApiUrl || TONWEB_FALLBACK_INDEX_URL}/getTransactionsByAddress`;
  }

  getTransactionsParams(address, offset = 0, limit = this.defaultTxLimit) {
    return {
      address,
      limit,
      offset,
      include_msg_body: true,
    };
  }

  getTransactionsOptions() {
    return {
      headers: { 'X-API-Key': TONWEB_API_KEY },
    };
  }

  getTxDataMsg(tx) {
    return tx.out_msgs[0] || tx.in_msg;
  }

  getTxFee(tx) {
    return this.wallet.toCurrencyUnit(tx.fee);
  }

  getTxConfirmations() {
    return 1;
  }

  getTxDateTime(tx) {
    return new Date(tx.utime * 1000);
  }

  getTxHash(tx) {
    return tx.hash;
  }

  getTxFeeTicker() {
    return this.wallet.ticker;
  }

  getTxMemo(tx) {
    return this.getTxDataMsg(tx).comment;
  }

  /**
   * Gets token balance
   * @param {string} address
   * @param {string} mint
   * @returns {Promise<string|null>}
   */
  async getTokenBalance({ address, mint }) {
    try {
      const jettonMinter = new TonWeb.token.jetton.JettonMinter(this.provider, {
        address: mint,
      });
      const jettonWalletAddress = await jettonMinter.getJettonWalletAddress(this._getWalletAddress(address));

      const jettonWallet = new TonWeb.token.jetton.JettonWallet(this.provider, {
        address: jettonWalletAddress,
      });
      const jettonData = await jettonWallet.getData();

      if (jettonData.jettonMinterAddress.toString(false) !== new TonWeb.utils.Address(mint).toString(false)) {
        throw new Error('jetton minter address from jetton wallet doesnt match config');
      }

      return jettonData?.balance?.toString();
    } catch (error) {
      console.warn(error);
      return null;
    }
  }

  /**
   * Get a transactions list for a wallet
   *
   * @return {Promise<Object[]>}
   */
  async getTokenTransactions({ jettonWalletAddress }) {
    if (
      this.defaultRequestTimeout &&
      Date.now() - this.defaultRequestTimeout * ONE_MINUTE < this.lastGetTxsRequestTime
    ) {
      return [];
    }

    if (
      this.defaultRequestTimeout &&
      Date.now() - this.defaultRequestTimeout * ONE_MINUTE > this.lastGetTxsRequestTime
    ) {
      this.lastGetTxsRequestTime = Date.now();
    }

    const response = await this.request(
      this.getTransactionsUrl(),
      this.getTransactionsMethod(),
      this.getTransactionsParams(jettonWalletAddress),
      GET_TRANSACTIONS_TYPE,
      this.getTransactionsOptions(),
    );

    return this.modifyTokensTransactionsResponse(response, this.wallet.address);
  }
}
