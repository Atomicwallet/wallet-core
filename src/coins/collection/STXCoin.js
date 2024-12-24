import { Coin } from '../../abstract';
import StacksExplorer from '../../explorers/collection/StacksExplorer';
import StacksHiroExplorer from '../../explorers/collection/StacksHiroExplorer';
import { LazyLoadedLib } from '../../utils';
import { HasProviders } from '../mixins';

const NAME = 'Stacks';
const DECIMAL = 6;
const UNSPENDABLE_BALANCE = '0';

/**
 * @class STXCoin
 */
export default class STXCoin extends HasProviders(Coin) {
  #privateKey;

  /**
   * Constructs the object.
   *
   * @param {string} alias the alias
   * @param {array} feeData the fee data
   * @param {Explorer[]}  explorers the explorers
   * @param {string} txWebUrl the transmit web url
   */
  constructor({ alias, notify, feeData, explorers, txWebUrl, socket, id }) {
    const config = {
      id,
      alias,
      notify,
      name: NAME,
      ticker: 'STX',
      decimal: DECIMAL,
      unspendableBalance: UNSPENDABLE_BALANCE,
      explorers,
      txWebUrl,
      socket,
      dependencies: {
        walletSdk: new LazyLoadedLib(() => import('@stacks/wallet-sdk')),
        transactionsSdk: new LazyLoadedLib(
          () => import('@stacks/transactions'),
        ),
        c32check: new LazyLoadedLib(() => import('c32check')),
      },
    };

    super(config);

    this.setExplorersModules([StacksExplorer, StacksHiroExplorer]);

    this.loadExplorers(config);

    this.feeData = feeData;
    this.fee = feeData.fee;
    this.transactions = [];
  }

  /**
   * @param {Buffer} seed Seed buffer from BitcoreMnemonic
   * @param {string} phrase The mnemonic string
   * @return {Promise<Coin>} The private key.
   */
  async loadWallet(seed, phrase) {
    const { generateWallet, generateNewAccount, getStxAddress } =
      await this.loadLib('walletSdk');
    const { TransactionVersion } = await this.loadLib('transactionsSdk');

    const wallet = await generateWallet({
      secretKey: phrase,
      password: '',
    });

    const newAccount = generateNewAccount(wallet); // adds a new account to an existing wallet object, immutable, NOT in-place
    const account = newAccount.accounts[0];

    this.address = getStxAddress({
      account,
      transactionVersion: TransactionVersion.Mainnet,
    });
    this.#privateKey = account.stxPrivateKey;

    return { id: this.id, privateKey: this.#privateKey, address: this.address };
  }

  /**
   * Validates wallet address
   *
   * @param {string} address The address
   * @return {Boolean}
   */
  async validateAddress(address) {
    try {
      const { c32addressDecode } = await this.loadLib('c32check');
      const prefix = address.substr(0, 2);

      return (
        (prefix === 'SM' || prefix === 'SP') &&
        Boolean(c32addressDecode(address)) &&
        this.address !== address
      ); // SN and ST for testnet
    } catch (error) {
      return false;
    }
  }

  async getFee({ address, amount, memo } = {}) {
    const tx = await this.createTransaction({
      address: address || this.address,
      amount: amount || 1,
      memo: memo || '',
    });

    return tx.auth.spendingCondition.fee;
  }

  /**
   * Creates a transaction.
   *
   * @param {string} address The destination address
   * @param {Number} amount The amount to send
   * @return {Promise<StacksTransaction>} Raw transaction
   */
  async createTransaction({ address, amount, memo }) {
    const { AnchorMode, makeSTXTokenTransfer } =
      await this.loadLib('transactionsSdk');
    const txOptions = {
      recipient: address,
      amount: BigInt(amount),
      senderKey: this.#privateKey,
      network: this.getProvider('network').getNetwork(), // for mainnet, use 'mainnet'
      memo,
      nonce: await this.getProvider('nonce').getPossibleNextNonce(this.address), // set a nonce manually if you don't want builder to fetch from a Stacks node
      // fee: 200n, // set a tx fee if you don't want the builder to estimate
      anchorMode: AnchorMode.Any,
    };

    if (this.feeData?.fee) {
      txOptions.fee = this.feeData.fee;
    }

    return makeSTXTokenTransfer(txOptions);
  }

  async sendTransaction(tx) {
    const { broadcastTransaction } = await this.loadLib('transactionsSdk');
    // broadcasting transaction to the specified network
    const broadcastResponse = await broadcastTransaction(tx);

    if (broadcastResponse.error) {
      throw new Error(broadcastResponse.reason);
    }

    return { txid: `0x${broadcastResponse.txid}` };
  }

  async getInfo() {
    const { balance } = await this.getProvider('info').getInfo(this.address);

    this.balance = balance;

    return { balance };
  }

  setPrivateKey(privateKey) {
    this.#privateKey = privateKey;
  }
}
