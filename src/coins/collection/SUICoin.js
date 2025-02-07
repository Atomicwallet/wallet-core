import { Coin } from 'src/abstract';
import SuiExplorer from 'src/explorers/collection/SuiExplorer';
import { LazyLoadedLib } from 'src/utils';

import { HasProviders } from '../mixins';

const suiLib = new LazyLoadedLib(() => import('@mysten/sui.js'));

const NAME = 'Sui';

const DERIVATION = "m/44'/784'/0'/0'/0'";
const DECIMAL = 9;
const STUB_FEE = 86988; // fallback fee for 0 balance

export default class SUICoin extends HasProviders(Coin) {
  #privateKey;

  constructor(walletsFeeConfig, db, configManager) {
    const config = {
      ...walletsFeeConfig,
      name: NAME,
      decimal: DECIMAL,
    };

    super(config, db, configManager);

    this.derivation = DERIVATION;

    this.setExplorersModules([SuiExplorer]);

    this.loadExplorers(config);
  }

  async loadWallet(seed, mnemonic) {
    const { Ed25519Keypair } = await suiLib.get();

    this.keypair = Ed25519Keypair.deriveKeypair(mnemonic);

    this.address = this.keypair.getPublicKey().toSuiAddress();
    this.#privateKey = this.keypair.export().privateKey;

    return { id: this.id, privateKey: this.#privateKey, address: this.address };
  }

  async setPrivateKey(privateKey, phrase) {
    const { fromExportedKeypair } = await suiLib.get();

    this.keypair = fromExportedKeypair({
      schema: 'ED25519',
      privateKey,
    });

    this.address = this.keypair.getPublicKey().toSuiAddress();
    this.#privateKey = privateKey;
  }

  async getBalance() {
    return this.getProvider('balance').getBalance(this.address);
  }

  getTransactions(options) {
    return this.getProvider('history').getTransactions({ ...options });
  }

  async validateAddress(address) {
    const { isValidSuiAddress } = await suiLib.get();

    return isValidSuiAddress(address);
  }

  async getFee({ amount = 1, address, isSendAll = false } = {}) {
    try {
      const tx = await this.createTransaction({
        address: address || this.address,
        amount,
        isSendAll,
      });

      return this.getProvider('fee').calculateFee(tx);
    } catch (error) {
      console.warn('[SUI] getFee: could not estimate fee:', error);

      return STUB_FEE;
    }
  }

  async createTransaction({ address, amount, isSendAll = false }) {
    const { TransactionBlock } = await suiLib.get();

    const tx = new TransactionBlock();

    if (isSendAll) {
      tx.transferObjects([tx.gas], tx.pure(address));
    } else {
      const [coin] = tx.splitCoins(tx.gas, [tx.pure(amount)]);

      tx.transferObjects([coin], tx.pure(address));
    }

    return this.getProvider('signer').sign(this.keypair, tx);
  }

  async sendTransaction(tx) {
    const result = await this.getProvider('send').send(tx);

    return { txid: result.digest };
  }
}
