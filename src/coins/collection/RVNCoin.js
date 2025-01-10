import { Coin } from 'src/abstract';
import BlockbookV2Explorer from 'src/explorers/collection/BlockbookV2Explorer';
import { LazyLoadedLib } from 'src/utils';

import { BitcoinLikeFeeMixin, BitcoreMixin } from '../mixins';

const NAME = 'Ravencoin';
const TICKER = 'RVN';
const DERIVATION = "m/44'/175'/0'/0/0";
const DECIMAL = 8;
const UNSPENDABLE_BALANCE = '0';

/**
 * Class
 *
 * @class RVNCoin
 */
class RVNCoin extends BitcoreMixin(BitcoinLikeFeeMixin(Coin)) {
  /**
   * constructs the object.
   *
   * @param  {<type>} alias the alias
   * @param  {<type>} feeData the fee data
   * @param  {array}  explorers the explorers
   * @param  {<type>} txWebUrl the transmit web url
   */
  constructor({ alias, notify, feeData, explorers, txWebUrl, socket, id }) {
    const networkName = 'ravencoin-livenet';

    const addNetwork = (bitcoreLib) => {
      bitcoreLib.Networks.add({
        name: networkName,
        alias: networkName,
        pubkeyhash: 0x3c,
        privatekey: 0x80,
        scripthash: 0x7a,
        xpubkey: 0x0488b21e,
        xprivkey: 0x0488ade4,
      });
    };

    const bitcore = new LazyLoadedLib(() =>
      import('bitcore-lib').then((bitcoreLib) => {
        addNetwork(bitcoreLib);
        return bitcoreLib;
      }),
    );

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
      dependencies: { bitcore },
    };

    super(config);

    this.derivation = DERIVATION;

    this.setExplorersModules([BlockbookV2Explorer]);

    this.loadExplorers(config);

    this.feePerByte = feeData.feePerByte;
    this.coefficient = feeData.coefficient;

    this.transactions = [];
    this.networkName = networkName;
  }

  async createTransaction({ address, amount, memo, userFee }) {
    const bitcoreLib = await this.loadLib('bitcore');

    const coins = await this.getCoins(
      {
        address,
        value: Number(amount),
        feePerByte: Number(this.feePerByte),
      },
      bitcoreLib,
    );

    if (userFee && coins.fee > userFee) {
      throw new Error('userFee is more then utxo fee');
    }

    return this.createTransactionSync(coins);
  }
}

export default RVNCoin;
