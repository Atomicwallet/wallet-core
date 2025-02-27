import { Coin } from 'src/abstract';
import BlockbookV2Explorer from 'src/explorers/collection/BlockbookV2Explorer';
import DcrDataExplorer from 'src/explorers/collection/DcrDataExplorer';
import InsightExplorer from 'src/explorers/collection/InsightExplorer';
import { LazyLoadedLib } from 'src/utils';
import { LIB_NAME_INDEX } from 'src/utils';

import { BitcoinLikeFeeMixin, BitcoreMixin } from '../mixins';

const NAME = 'Decred';
const TICKER = 'DCR';
const DERIVATION = "m/42'/999'/0'/0/0";
const DECIMAL = 8;
const UNSPENDABLE_BALANCE = '0';
const { BITCORE } = LIB_NAME_INDEX;

/**
 * Class for decred.
 *
 * @class DCRCoin
 */
class DCRCoin extends BitcoreMixin(BitcoinLikeFeeMixin(Coin)) {
  #privateKey;

  /**
   * constructs the object.
   *
   * @param {string} alias the alias
   * @param {string} fee the fee data
   * @param {string} feePerByte
   * @param {int} coefficient
   * @param {array}  explorers the explorers
   * @param {string} txWebUrl the transmit web url
   */
  constructor({ alias, notify, feeData, explorers, txWebUrl, socket, id }, db, configManager) {
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
      dependencies: {
        [BITCORE]: new LazyLoadedLib(() => import('decred-bitcore-lib')),
      },
    };

    super(config, db, configManager);

    this.derivation = DERIVATION;

    this.setExplorersModules([BlockbookV2Explorer, InsightExplorer, DcrDataExplorer]);

    this.loadExplorers(config);

    this.feePerByte = feeData.feePerByte;
    this.coefficient = feeData.coefficient;
  }

  async getNetwork() {
    const bitcoreLib = await this.loadLib(BITCORE);

    return bitcoreLib.Networks.dcrdlivenet;
  }

  getDeriveFunctionName() {
    return 'derive';
  }

  /**
   * Creates a transaction.
   *
   * @param {String} address The destination address
   * @param {Number} amount The amount to send
   * @return {Promise<String>} Raw transaction
   */
  async createTransaction({ address, amount }) {
    const utxos = (await this.getUnspentOutputs(this.address, this.getScriptPubKey())).map((out) => ({
      amount: this.toCurrencyUnit(out.value),
      ...out,
    }));

    const balanceBN = this.explorer.calculateBalance(utxos);
    const amountBN = new this.BN(String(amount));
    const fee = await this.getFee(amount);
    const amountToSend = balanceBN.lt(amountBN.add(fee)) ? balanceBN.sub(fee) : amountBN;
    const unspend = balanceBN.sub(amountBN).sub(fee);

    const bitcoreLib = await this.loadLib(BITCORE);

    const tx = new bitcoreLib.Transaction()
      .from(utxos)
      .to(address, Number(amountToSend.toString()))
      .fee(Number(fee.toString()))
      .change(this.address);

    if (unspend.gt(new this.BN(0))) {
      tx.to(utxos[0].address, Number(unspend.toString()));
    }

    tx.sign(this.#privateKey.toString());

    return tx.serialize();
  }

  setPrivateKey(privateKey) {
    super.setPrivateKey(privateKey);
    this.#privateKey = privateKey;
  }
}

export default DCRCoin;
