import { Coin } from 'src/abstract';
import DoraExplorer from 'src/explorers/collection/DoraExplorer';
import NeoNodeExplorer from 'src/explorers/collection/NeoNodeExplorer';
import { NEOToken } from 'src/tokens';
import { LazyLoadedLib } from 'src/utils';

import { HasProviders, HasTokensMixin, Neo3Mixin, NeoMixin } from '../mixins';

const GAS_NAME = 'GAS';
const GAS_TICKER = 'GAS';
const GAS_DECIMAL = 8;

const NAME = 'NEO';
const TICKER = 'NEO';
const DERIVATION = "m/44'/888'/0'/0";
const DECIMAL = 0;
const UNSPENDABLE_BALANCE = '0';

/**
 * class for NEO coin
 *
 * @class NEOCoin
 */
class NEO3Coin extends Neo3Mixin(NeoMixin(HasProviders(HasTokensMixin(Coin)))) {
  #feeTokenWallet;

  constructor({ alias, notify, feeData, explorers, txWebUrl, socket, id }, db, configManager) {
    const config = {
      id,
      alias,
      notify,
      name: NAME,
      ticker: TICKER,
      decimal: DECIMAL,
      unspendableBalance: UNSPENDABLE_BALANCE,
      txWebUrl,
      explorers,
      socket,
      dependencies: { coreLib: new LazyLoadedLib(() => import('neo3')) },
    };

    super(config, db, configManager);

    this.derivation = DERIVATION;

    this.setExplorersModules([DoraExplorer, NeoNodeExplorer]);

    this.loadExplorers(config);

    this.#initFeeTokenWallet();

    this.balances = null;
  }

  get feeWallet() {
    return this.#feeTokenWallet;
  }

  get feeTicker() {
    return 'GAS';
  }

  async isAvailableForFee(userFee) {
    const fee = !userFee || userFee.isZero() ? await this.getFee() : userFee;

    return new this.BN(this.#feeTokenWallet.balance).gte(fee);
  }

  #initFeeTokenWallet() {
    this.#feeTokenWallet = this.createToken({
      name: GAS_NAME,
      ticker: GAS_TICKER,
      decimal: GAS_DECIMAL,
      visibility: true,
      confirmed: true,
      source: 'list',
      parent: this,
    });

    this.tokens[this.#feeTokenWallet.id] = this.#feeTokenWallet;
  }

  async loadTokensList(wallets) {
    wallets.addWallet(this.#feeTokenWallet);
    this.bus?.$emit('update::coin-list');
  }

  createToken(args) {
    return new NEOToken({
      parent: this,
      ...args,
    });
  }

  getTokenList() {
    return [
      {
        id: this.#feeTokenWallet.id,
        name: this.#feeTokenWallet.name,
        ticker: this.#feeTokenWallet.ticker,
        decimal: this.#feeTokenWallet.decimal,
        visibility: this.#feeTokenWallet.visibility,
      },
    ];
  }

  getTokenTransactions(args) {
    return super.getTransactions(args);
  }
}

export default NEO3Coin;
