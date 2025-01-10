import { Coin } from '../../abstract';
import BlockbookV2Explorer from '../../explorers/collection/BlockbookV2Explorer';
import { LazyLoadedLib } from '../../utils';
import { BitcoinLikeFeeMixin, BitcoreMixin } from '../mixins';

const NAME = 'Dash';
const TICKER = 'DASH';
const DERIVATION = "m/44'/5'/0'";
const DECIMAL = 8;
const UNSPENDABLE_BALANCE = '0';

/**
 * Class
 *
 * @class DASHCoin
 */
class DASHCoin extends BitcoreMixin(BitcoinLikeFeeMixin(Coin)) {
  /**
   * constructs the object.
   *
   * @param  {<type>} alias the alias
   * @param  {<type>} feeData the fee data
   * @param  {array}  explorers the explorers
   * @param  {<type>} txWebUrl the transmit web url
   */
  constructor({ alias, notify, feeData, explorers, txWebUrl, socket, id }) {
    const networkName = 'dashlivenet';

    const addNetwork = (bitcoreLib) => {
      bitcoreLib.Networks.add({
        name: networkName,
        alias: networkName,
        pubkeyhash: 0x4c,
        privatekey: 0xcc,
        scripthash: 0x10,
        xpubkey: 0x488b21e, // 'xpub' (Bitcoin Default)
        xprivkey: 0x488ade4, // 'xprv' (Bitcoin Default)
        xpubkey256bit: 0x0eecefc5, // 'dpmp' (dashpay mainnet public)
        xprivkey256bit: 0x0eecf02e, // 'dpms' (dashpay mainnet secret)
        networkMagic: 0xbf0c6bbd,
        port: 9999,
        dnsSeeds: [
          'dnsseed.darkcoin.io',
          'dnsseed.dashdot.io',
          'dnsseed.masternode.io',
          'dnsseed.dashpay.io',
        ],
      });
    };

    const bitcore = new LazyLoadedLib(() =>
      import('bitcore-lib').then(({ default: bitcoreLib }) => {
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
    this.networkName = networkName;
  }
}

export default DASHCoin;
