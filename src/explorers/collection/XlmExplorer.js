import { ExplorerRequestError } from 'src/errors';
import { Server, Networks, Operation, Memo, Keypair, Asset, TransactionBuilder } from 'stellar-sdk';

import { GET_BALANCE_TYPE, GET_TRANSACTIONS_TYPE, SEND_TRANSACTION_TYPE } from '../../utils/const';
import Explorer from '../Explorer';
// import logger from '../Logger'

const TX_SEND_TIMEOUT = 30;

const isNotFoundError = (error) => error.response.status === 404;

/**
 * Class for explorer.
 *
 * @abstract
 * @class {Explorer}
 */
class XlmExplorer extends Explorer {
  constructor() {
    super(...arguments);

    this.server = new Server(this.config.baseUrl);

    this.defaultTxLimit = 200; // 200 is max
    this.fee = arguments[3];
  }

  getAllowedTickers() {
    return ['XLM'];
  }

  async getTransaction(selfAddress, txId) {
    let transaction;

    try {
      const ledgers = await this.server.ledgers().limit(1).order('desc').call();

      const currentLedgerVersion = ledgers.records[0].sequence;

      transaction = await this.server.transactions().transaction(txId).call();
      const {
        records: [operation],
      } = await transaction.operations();

      if (operation) {
        if (operation.type === 'create_account') {
          return super.modifyTransactionResponse(
            this.parseCreateAccountOperation(currentLedgerVersion, transaction, operation, selfAddress),
            selfAddress,
          );
        }

        if (operation.type === 'payment') {
          return super.modifyTransactionResponse(
            this.parsePaymentOperation(currentLedgerVersion, transaction, operation, selfAddress),
            selfAddress,
          );
        }
      }
    } catch (error) {
      // logger.error({ instance: this, error })
    }

    return transaction;
  }

  getTransactionsUrl(address) {
    return 'account_tx';
  }

  getTransactionsParams(address) {
    return { account: address, limit: 999 };
  }

  getTransactionUrl(txId) {
    return '';
  }

  getTransactionParams(txId) {
    return {};
  }

  /**
   * Gets the transaction datetime.
   *
   * @param {Object} tx The transaction response
   * @return {Date} The transaction datetime.
   */
  getTxDateTime(tx) {
    return new Date(Number(`${tx.timestamp}`));
  }

  /**
   * Gets the trasaction amount.
   *
   * @param {Object} tx The trasaction
   * @return {string} The trasaction amount.
   */
  getTxValue(selfAddress, tx) {
    return tx.amount;
  }

  /**
   * Gets the trasaction direction.
   *
   * @param {Object} tx The trasaction
   * @return {Boolean} The trasaction direction.
   */
  getTxDirection(selfAddress, tx) {
    return tx.addressTo.toLowerCase() === selfAddress.toLowerCase();
  }

  /**
   * Gets the trasaction recipient.
   *
   * @param {Object} tx The transaction response.
   * @return {(Boolean|String)} The transaction recipient.
   */
  getTxOtherSideAddress(selfAddress, tx) {
    return this.getTxDirection(selfAddress, tx) ? tx.addressFrom : tx.addressTo;
  }

  getInfoUrl(address) {
    return '';
  }

  /**
   * Gets the information about a wallet.
   *
   * @return {Promise<Object>} The information data.
   */
  async getInfo(address) {
    try {
      const balance = await this.getBalance(address);

      return { balance };
    } catch (error) {
      if (isNotFoundError(error)) {
        return { balance: 0 };
      }

      throw new ExplorerRequestError({
        type: GET_BALANCE_TYPE,
        error,
        instance: this,
      });
    }
  }

  getTxMemo(tx) {
    return tx.memo;
  }

  /**
   * Gets the transaction confirmations.
   *
   * @param {Object} tx The transaction object.
   * @return {Number} The transaction confirmations.
   */
  getTxConfirmations(tx) {
    return Number(tx.confirmations);
  }

  /**
   * Sends a transaction.
   *
   * @param {Object} txObject The tx object
   * @return {Promise<Object>} The transaction data
   */
  async sendTransaction(txObject, senderAddress, privateKey, fee) {
    let isNew = false;
    let srcAccount;
    const sendValue = this.wallet.toCurrencyUnit(txObject.amount);

    try {
      srcAccount = await this.server.loadAccount(senderAddress);
    } catch (error) {
      throw new ExplorerRequestError({
        type: SEND_TRANSACTION_TYPE,
        error,
        instance: this,
      });
    }

    const txBuilder = new TransactionBuilder(srcAccount, {
      fee,
      networkPassphrase: Networks.PUBLIC,
    });

    try {
      await this.server.loadAccount(txObject.address);
    } catch (error) {
      if (this.wallet.ticker === 'XLM' && isNotFoundError(error)) {
        isNew = true;
      }
    }

    if (isNew) {
      txBuilder.addOperation(
        Operation.createAccount({
          destination: txObject.address,
          startingBalance: sendValue,
        }),
      );
    } else {
      txBuilder.addOperation(
        Operation.payment({
          destination: txObject.address,
          asset: Asset.native(),
          amount: sendValue,
        }),
      );
    }

    if (txObject.paymentId) {
      txBuilder.addMemo(Memo.text(String(txObject.paymentId)));
    }

    txBuilder.setTimeout(TX_SEND_TIMEOUT);

    const tx = txBuilder.build();

    tx.sign(Keypair.fromSecret(privateKey));

    const response = await this.server.submitTransaction(tx);

    return { txid: response.hash };
  }

  /**
   * Gets a balance from a wallet info.
   *
   * @return {Promise<String>}
   */
  async getBalance(address) {
    const account = await this.loadAccount(address);

    let totalBalance = '0';

    account.balances.forEach((balance) => {
      if (balance.asset_type === 'native') {
        totalBalance = balance.balance;
      }
    });

    return this.wallet.toMinimalUnit(totalBalance);
  }

  parseCreateAccountOperation(currentLedgerVersion, tx, operation, selfAddress) {
    return {
      addressFrom: operation.source_account,
      addressTo: operation.account,
      isIncoming: !(operation.source_account === selfAddress),
      confirmations: currentLedgerVersion - tx.ledger_attr,
      blockhash: tx.ledger_attr,
      timestamp: new Date(tx.created_at).getTime(),
      amount: String(operation.starting_balance).replace(/[.]?0+$/, ''),
      txid: tx.id,
      fee: tx.fee_charged,
      memo: tx.memo,
    };
  }

  parsePaymentOperation(currentLedgerVersion, tx, operation, selfAddress) {
    return {
      addressFrom: operation.from,
      addressTo: operation.to,
      isIncoming: !(operation.source_account === selfAddress),
      confirmations: currentLedgerVersion - tx.ledger_attr,
      blockhash: tx.ledger_attr,
      timestamp: new Date(tx.created_at).getTime(),
      amount: String(operation.amount).replace(/[.]?0+$/, ''),
      txid: tx.id,
      fee: tx.fee_charged,
      memo: tx.memo,
    };
  }

  /**
   * get last transaction list
   * limit - 999
   * minLedgerVersion get from server
   * @return {Promise<void>}
   */
  async getTransactions({ address, offset = 0, limit = this.defaultTxLimit }) {
    try {
      const [ledgers, transactions, operations] = await Promise.all([
        this.server.ledgers().limit(1).order('desc').call(),
        this.server.transactions().forAccount(address).limit(limit).order('desc').call(),
        this.server.operations().forAccount(address).order('desc').limit(limit).call(),
      ]);

      const currentLedgerVersion = ledgers.records[0].sequence;

      const list = [];

      for (let idx = 0; idx < transactions.records.length; idx += 1) {
        const tx = transactions.records[idx];
        const txOperations = operations.records.filter((op) => op.transaction_hash === tx.id);

        for (let oCounter = 0; oCounter < txOperations.length; oCounter += 1) {
          const operation = txOperations[oCounter];

          if (operation.type === 'create_account') {
            list.push(this.parseCreateAccountOperation(currentLedgerVersion, tx, operation, address));
          } else if (operation.type === 'payment') {
            list.push(this.parsePaymentOperation(currentLedgerVersion, tx, operation, address));
          }
        }
      }

      return super.modifyTransactionsResponse(list, address);
    } catch (error) {
      if (isNotFoundError(error)) {
        return [];
      }

      throw new ExplorerRequestError({
        type: GET_TRANSACTIONS_TYPE,
        error,
        instance: this,
      });
    }
  }

  /**
   * Loads account from server.
   *
   * @return {Promise<any>}
   */
  loadAccount(address) {
    return new Promise((resolve, reject) => {
      this.server
        .loadAccount(address)
        .then((result) => resolve(result))
        .catch((error) => reject(error));
    });
  }

  /**
   * Gets trasnaction fee
   *
   * @return {Promise<BN>}
   */
  async getFee() {
    return new this.wallet.BN(this.fee);
  }

  /**
   * Return last ledger version
   *
   * @return {Promise<number>}
   */
  async getCurrentLedger() {
    const response = await this.request('ledger_current');

    return response.ledger_current_index;
  }

  getTxFee(tx) {
    return this.wallet.toCurrencyUnit((tx && tx.fee) || 0);
  }
}

export default XlmExplorer;
