// import history from '../History';

import { WalletError } from 'src/errors';

import { Coin } from '../../abstract';
import RippleExplorer from '../../explorers/collection/RippleExplorer';
import { LazyLoadedLib } from '../../utils';
import { SEND_TRANSACTION_TYPE } from '../../utils/const';

const racodecLazyLoaded = new LazyLoadedLib(() => import('ripple-address-codec'));
const KeypairsLazyLoaded = new LazyLoadedLib(() => import('ripple-keypairs'));
const RippleApiLazyLoaded = new LazyLoadedLib(() => import('ripple-lib'));
const BitcoinJSLazyLoaded = new LazyLoadedLib(() => import('bitcoinjs-lib'));

const NAME = 'Ripple';
const TICKER = 'XRP';
const DERIVATION = "m/44'/144'/0'/0/0";
const DECIMAL = 6;
const UNSPENDABLE_BALANCE = '10000000';
const RECONNECTING_TIMEOUT = 6000;

/**
 * Class
 *
 * @class XRPCoin
 */
class XRPCoin extends Coin {
  #privateKey;
  rippleApi;

  /**
   * constructs the object.
   *
   * @param  {<type>} alias the alias
   * @param  {<type>} feeData the fee data
   * @param  {array}  explorers the explorers
   * @param  {<type>} txWebUrl the transmit web url
   */
  constructor({ alias, notify, feeData, explorers, txWebUrl, socket, id }) {
    const config = {
      id,
      alias,
      notify,
      name: NAME,
      ticker: TICKER,
      decimal: DECIMAL,
      unspendableBalance: UNSPENDABLE_BALANCE,
      explorers,
      txWebUrl,
      socket,
    };

    super(config);

    this.derivation = DERIVATION;

    this.setExplorersModules([RippleExplorer]);

    this.loadExplorers(config);

    this.fee = feeData.fee;
    this.fields.paymentId = true;
    this.isSubscribedToNewTxs = false;
  }

  async getRippleApi() {
    if (this.rippleApi) {
      return this.rippleApi;
    }
    const { RippleAPI } = await RippleApiLazyLoaded.get();

    this.rippleApi = new RippleAPI({
      server: this.explorer.config.baseUrl.replace('https', 'wss').replace(/:\d+/, ''),
    });
    return this.rippleApi;
  }

  /**
   * Loads a wallet.
   *
   * @param {BitcoreMnemonic} mnemonic The private key object.
   * @return {Promise<Object>} The private key.
   */
  async loadWallet(seed) {
    const [{ default: Keypairs }, BitcoinJS] = await Promise.all([KeypairsLazyLoaded.get(), BitcoinJSLazyLoaded.get()]);

    const root = BitcoinJS.bip32.fromSeed(seed); // fromBase58
    const node = root.derivePath(this.derivation);

    const secret = Keypairs.generateSeed({ entropy: node.chainCode });
    const keypair = Keypairs.deriveKeypair(secret);

    if (!secret) {
      throw new Error("Ripple can't get a secret!!!");
    }

    this.#privateKey = secret;
    this.address = Keypairs.deriveAddress(keypair.publicKey);

    return {
      id: this.id,
      privateKey: this.#privateKey,
      address: this.address,
    };
  }

  /**
   * The address getter
   *
   * @return {String} { description_of_the_return_value }
   */
  async getAddress() {
    if (this.#privateKey) {
      const { default: Keypairs } = await KeypairsLazyLoaded.get();
      const keypair = Keypairs.deriveKeypair(this.#privateKey);

      return Keypairs.deriveAddress(keypair.publicKey);
    }
    return new Error('Ripple secret (private key) is empty!!!');
  }

  /**
   * Validates wallet address
   *
   * @param {String} address The address
   * @return {Boolean}
   */
  async validateAddress(address) {
    const { default: racodec } = await racodecLazyLoaded.get();

    try {
      const res = racodec.decodeAccountID(address);

      return Array.isArray(res);
    } catch (error) {
      return false;
    }
  }

  async sendTransaction(rawtx) {
    const rippleApi = await this.getRippleApi();
    const submit = await rippleApi.submit(rawtx);

    const successedCode = ['tesSUCCESS', 'terQUEUED', 'telINSUF_FEE_P'];

    if (submit && successedCode.includes(submit.engine_result)) {
      return { txid: submit.tx_json.hash };
    }
    const statusTx = await this.explorer.checkStatusTransaction(submit?.tx_json.hash);

    if (statusTx === 'success') {
      return { txid: submit.tx_json.hash };
    }

    throw new WalletError({
      type: SEND_TRANSACTION_TYPE,
      error: new Error(submit && submit.engine_result),
      instance: this,
    });
  }

  /**
   * Creates a transaction.
   *
   * @param {String} address The destination address
   * @param {Number} amount The amount to send
   * @param {String} paymentId The payment id (only int!)
   * @return {Promise<String>} Raw transaction
   */
  async createTransaction({ address, amount, memo = undefined }) {
    const payment = {
      source: {
        address: this.address,
        maxAmount: {
          value: '0.01',
          currency: 'XRP',
        },
      },
      destination: {
        address,
        amount: {
          value: this.toCurrencyUnit(amount),
          currency: 'XRP',
        },
      },
    };

    if (memo) {
      payment.destination.tag = parseInt(memo, 10);
    }

    const rippleApi = await this.getRippleApi();
    const { txJSON } = await rippleApi.preparePayment(this.address, payment);
    const currentLedger = await this.explorer.getCurrentLedger();

    const expirationLedgerCount = 5;
    const tx = JSON.parse(txJSON);
    const txSign = {
      ...tx,
      LastLedgerSequence: currentLedger + expirationLedgerCount,
    };

    const signedTx = rippleApi.sign(JSON.stringify(txSign), this.#privateKey);

    return signedTx.signedTransaction;
  }

  /**
   * Creates a transaction.
   *
   * @param {String} address The destination address
   * @param {Number} amount The amount to send
   * @param {String} memo The payment id (only int!)
   * @return {Promise<String>} Raw transaction
   */
  async createClaimFlareTransaction(MessageKey) {
    if (!MessageKey) {
      throw new Error('no message key');
    }
    const { sequence } = await this.explorer.getInfo(this.address);
    const {
      validated_ledger: { seq: lastLedgerSequence },
    } = await this.explorer.getServerInfo();
    // TODO amount parameter does not particioate in fee calculation
    const fee = await this.getFee();
    const expirationLedgerCount = 5;

    const accountSet = {
      TransactionType: 'AccountSet',
      Account: this.address,
      Fee: fee.toString(),
      Sequence: sequence,
      LastLedgerSequence: lastLedgerSequence + expirationLedgerCount,
      MessageKey,
    };

    const rippleApi = await this.getRippleApi();
    const signedTx = rippleApi.sign(JSON.stringify(accountSet), this.#privateKey);

    return signedTx.signedTransaction;
  }

  /**
   * @param {Number} amount In satoshis
   * @param isSendAll
   * @return {Promise<BN>}
   */
  async getFee() {
    return new this.BN(this.fee);
  }

  async connectSocket() {
    const rippleApi = await this.getRippleApi();

    rippleApi.connect();
    this.runSocketHealthcheck();
  }

  runSocketHealthcheck() {
    setInterval(async () => {
      const rippleApi = await this.getRippleApi();

      if (!rippleApi.isConnected()) {
        this.isSubscribedToNewTxs = false;
        rippleApi.connect();

        return;
      }

      await this.subscribeToNewTxs();
    }, RECONNECTING_TIMEOUT);
  }

  async subscribeToNewTxs() {
    const rippleApi = await this.getRippleApi();

    if (rippleApi.isConnected() && !this.isSubscribedToNewTxs) {
      this.isSubscribedToNewTxs = true;

      rippleApi.connection.on('transaction', async ({ transaction }) => {
        try {
          const statusTx = await this.explorer.checkStatusTransaction(transaction.hash);

          if (statusTx !== 'success') {
            return;
          }
          const confirmedTx = await this.explorer.getTransaction(this.address, transaction.hash);

          // await history.filterAndUpdateTransactions([confirmedTx]);

          this.balance = await this.getBalance();

          if (confirmedTx.direction) {
            this.eventEmitter.emit('socket::newtx', {
              id: this.id,
              ticker: this.ticker,
              amount: confirmedTx.amount,
              txid: confirmedTx.txid,
            });
          } else {
            this.eventEmitter.emit('socket::newtx::outgoing', {
              id: this.id,
              ticker: this.ticker,
            });
          }
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error(error);
        }
      });

      rippleApi.request('subscribe', {
        accounts: [this.address],
      });
    }
  }

  setPrivateKey(privateKey) {
    this.#privateKey = privateKey;
  }
}

export default XRPCoin;
